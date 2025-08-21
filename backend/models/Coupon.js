const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    value: {
        type: Number,
        required: true,
        min: 0
    },
    minOrderAmount: {
        type: Number,
        default: 0
    },
    maxDiscountAmount: {
        type: Number // 퍼센트 할인 시 최대 할인 금액
    },
    maxUses: {
        type: Number,
        default: null // null = 무제한
    },
    usedCount: {
        type: Number,
        default: 0
    },
    usedBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        usedAt: Date,
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        }
    }],
    validFrom: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    },
    applicableServices: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    }],
    applicableCategories: [{
        type: String
    }],
    excludedServices: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    }],
    userRestrictions: {
        newUsersOnly: {
            type: Boolean,
            default: false
        },
        minMembershipLevel: {
            type: String,
            enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
            default: null
        },
        specificUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// 인덱스
couponSchema.index({ code: 1 });
couponSchema.index({ expiresAt: 1 });
couponSchema.index({ isActive: 1 });

// 가상 필드: 남은 사용 횟수
couponSchema.virtual('remainingUses').get(function() {
    if (!this.maxUses) return '무제한';
    return Math.max(0, this.maxUses - this.usedCount);
});

// 가상 필드: 만료 여부
couponSchema.virtual('isExpired').get(function() {
    return new Date() > this.expiresAt;
});

// 가상 필드: 사용 가능 여부
couponSchema.virtual('isAvailable').get(function() {
    return this.isActive && 
           !this.isExpired && 
           (this.maxUses === null || this.usedCount < this.maxUses);
});

// 메서드: 쿠폰 사용 가능 여부 확인
couponSchema.methods.canBeUsedBy = async function(userId, orderAmount, serviceId) {
    // 활성 상태 확인
    if (!this.isActive) {
        return { valid: false, reason: '비활성화된 쿠폰입니다' };
    }

    // 만료 확인
    if (this.isExpired) {
        return { valid: false, reason: '만료된 쿠폰입니다' };
    }

    // 사용 횟수 확인
    if (this.maxUses && this.usedCount >= this.maxUses) {
        return { valid: false, reason: '사용 횟수를 초과했습니다' };
    }

    // 최소 주문 금액 확인
    if (orderAmount < this.minOrderAmount) {
        return { 
            valid: false, 
            reason: `최소 주문 금액 ${this.minOrderAmount.toLocaleString()}원 이상에서 사용 가능합니다` 
        };
    }

    // 사용자별 중복 사용 확인
    const userUsage = this.usedBy.find(u => u.user.toString() === userId);
    if (userUsage) {
        return { valid: false, reason: '이미 사용한 쿠폰입니다' };
    }

    // 서비스 제한 확인
    if (serviceId) {
        if (this.excludedServices.length > 0 && 
            this.excludedServices.includes(serviceId)) {
            return { valid: false, reason: '해당 서비스에는 사용할 수 없는 쿠폰입니다' };
        }

        if (this.applicableServices.length > 0 && 
            !this.applicableServices.includes(serviceId)) {
            return { valid: false, reason: '해당 서비스에는 사용할 수 없는 쿠폰입니다' };
        }
    }

    // 사용자 제한 확인
    if (this.userRestrictions.specificUsers.length > 0) {
        if (!this.userRestrictions.specificUsers.includes(userId)) {
            return { valid: false, reason: '사용 권한이 없는 쿠폰입니다' };
        }
    }

    return { valid: true };
};

// 메서드: 할인 금액 계산
couponSchema.methods.calculateDiscount = function(orderAmount) {
    let discount = 0;

    if (this.type === 'percentage') {
        discount = Math.floor(orderAmount * (this.value / 100));
        
        // 최대 할인 금액 제한
        if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
            discount = this.maxDiscountAmount;
        }
    } else if (this.type === 'fixed') {
        discount = this.value;
    }

    // 할인 금액이 주문 금액을 초과하지 않도록
    return Math.min(discount, orderAmount);
};

// 메서드: 쿠폰 사용 처리
couponSchema.methods.use = async function(userId, orderId) {
    this.usedCount++;
    this.usedBy.push({
        user: userId,
        usedAt: new Date(),
        orderId: orderId
    });
    
    await this.save();
    return true;
};

// 정적 메서드: 유효한 쿠폰 찾기
couponSchema.statics.findValidCoupon = async function(code, userId, orderAmount, serviceId) {
    const coupon = await this.findOne({ 
        code: code.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        expiresAt: { $gt: new Date() }
    });

    if (!coupon) {
        return { valid: false, reason: '존재하지 않는 쿠폰 코드입니다' };
    }

    const validation = await coupon.canBeUsedBy(userId, orderAmount, serviceId);
    
    if (validation.valid) {
        return { valid: true, coupon };
    } else {
        return validation;
    }
};

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;