const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, '사용자 정보가 필요합니다'],
        index: true
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: [true, '서비스 정보가 필요합니다']
    },
    serviceName: {
        type: String,
        required: [true, '서비스명이 필요합니다']
    },
    serviceDescription: {
        type: String
    },
    platform: {
        type: String,
        required: [true, '플랫폼 정보가 필요합니다'],
        enum: [
            'instagram', 'youtube', 'tiktok', 'facebook', 
            'twitter', 'linkedin', 'twitch', 'all'
        ]
    },
    category: {
        type: String,
        required: [true, '카테고리 정보가 필요합니다'],
        enum: [
            'followers', 'likes', 'views', 'comments', 'shares',
            'subscribers', 'engagement', 'promotion', 'analytics'
        ]
    },
    targetUrl: {
        type: String,
        required: [true, '대상 URL이 필요합니다'],
        trim: true,
        validate: {
            validator: function(v) {
                return /^https?:\/\/.+/.test(v);
            },
            message: '올바른 URL 형식을 입력해주세요'
        }
    },
    quantity: {
        type: Number,
        required: [true, '수량이 필요합니다'],
        min: [1, '수량은 1 이상이어야 합니다']
    },
    unitPrice: {
        type: Number,
        required: [true, '단가가 필요합니다'],
        min: [0, '단가는 0 이상이어야 합니다']
    },
    totalPrice: {
        type: Number,
        required: [true, '총 가격이 필요합니다'],
        min: [0, '총 가격은 0 이상이어야 합니다']
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: [0, '할인 금액은 0 이상이어야 합니다']
    },
    finalPrice: {
        type: Number,
        required: [true, '최종 가격이 필요합니다'],
        min: [0, '최종 가격은 0 이상이어야 합니다']
    },
    currency: {
        type: String,
        default: 'KRW',
        enum: ['KRW', 'USD', 'EUR', 'JPY']
    },
    status: {
        type: String,
        enum: [
            'pending',      // 대기중
            'confirmed',    // 확인됨
            'processing',   // 처리중
            'in_progress',  // 진행중
            'completed',    // 완료됨
            'partial',      // 부분완료
            'cancelled',    // 취소됨
            'refunded',     // 환불됨
            'failed'        // 실패
        ],
        default: 'pending',
        index: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'partial_refund'],
        default: 'pending',
        index: true
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    progress: {
        current: {
            type: Number,
            default: 0,
            min: [0, '현재 진행량은 0 이상이어야 합니다']
        },
        target: {
            type: Number,
            required: true,
            min: [1, '목표량은 1 이상이어야 합니다']
        },
        percentage: {
            type: Number,
            default: 0,
            min: [0, '진행률은 0 이상이어야 합니다'],
            max: [100, '진행률은 100 이하여야 합니다']
        }
    },
    deliveryInfo: {
        estimatedStart: Date,
        estimatedCompletion: Date,
        actualStart: Date,
        actualCompletion: Date,
        deliverySpeed: {
            type: String,
            enum: ['slow', 'medium', 'fast'],
            default: 'medium'
        }
    },
    customerInfo: {
        name: {
            type: String,
            required: [true, '고객명이 필요합니다']
        },
        email: {
            type: String,
            required: [true, '고객 이메일이 필요합니다']
        },
        phone: String,
        notes: String
    },
    orderNotes: {
        customer: String,
        admin: String,
        internal: String
    },
    qualitySettings: {
        dropProtection: {
            type: Boolean,
            default: false
        },
        refillGuarantee: {
            enabled: {
                type: Boolean,
                default: false
            },
            days: {
                type: Number,
                default: 0
            },
            validUntil: Date
        }
    },
    tracking: {
        apiOrderId: String,
        externalOrderId: String,
        providerStatus: String,
        lastChecked: Date,
        checkCount: {
            type: Number,
            default: 0
        }
    },
    metrics: {
        viewsBefore: Number,
        viewsAfter: Number,
        followersBefore: Number,
        followersAfter: Number,
        likesBefore: Number,
        likesAfter: Number,
        commentsBefore: Number,
        commentsAfter: Number,
        sharesBefore: Number,
        sharesAfter: Number
    },
    refund: {
        requested: {
            type: Boolean,
            default: false
        },
        requestedAt: Date,
        reason: String,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'processed'],
            default: 'pending'
        },
        amount: Number,
        processedAt: Date,
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    tags: [String],
    history: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String,
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual fields
orderSchema.virtual('isCompleted').get(function() {
    return this.status === 'completed';
});

orderSchema.virtual('isCancelled').get(function() {
    return this.status === 'cancelled';
});

orderSchema.virtual('isPaid').get(function() {
    return this.paymentStatus === 'paid';
});

orderSchema.virtual('progressPercentage').get(function() {
    if (this.progress.target === 0) return 0;
    return Math.min(100, Math.round((this.progress.current / this.progress.target) * 100));
});

orderSchema.virtual('remainingQuantity').get(function() {
    return Math.max(0, this.progress.target - this.progress.current);
});

orderSchema.virtual('daysRemaining').get(function() {
    if (!this.deliveryInfo.estimatedCompletion) return null;
    const now = new Date();
    const diffTime = this.deliveryInfo.estimatedCompletion - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

orderSchema.virtual('isOverdue').get(function() {
    if (!this.deliveryInfo.estimatedCompletion || this.isCompleted || this.isCancelled) {
        return false;
    }
    return new Date() > this.deliveryInfo.estimatedCompletion;
});

// Indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'deliveryInfo.estimatedCompletion': 1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ 'tracking.apiOrderId': 1 });

// Pre-save middleware
orderSchema.pre('save', function(next) {
    // 주문번호 자동 생성
    if (this.isNew && !this.orderNumber) {
        this.orderNumber = this.generateOrderNumber();
    }
    
    // 진행률 자동 계산
    if (this.progress.target > 0) {
        this.progress.percentage = Math.min(100, Math.round((this.progress.current / this.progress.target) * 100));
    }
    
    // 상태 변경 히스토리 추가
    if (this.isModified('status') && !this.isNew) {
        this.history.push({
            status: this.status,
            timestamp: new Date(),
            note: `상태가 ${this.status}로 변경되었습니다`
        });
    }
    
    // 완료 시간 설정
    if (this.status === 'completed' && !this.completedAt) {
        this.completedAt = new Date();
        this.deliveryInfo.actualCompletion = new Date();
    }
    
    // 취소 시간 설정
    if (this.status === 'cancelled' && !this.cancelledAt) {
        this.cancelledAt = new Date();
    }
    
    next();
});

// Instance methods
orderSchema.methods.generateOrderNumber = function() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    return `MG${year}${month}${day}${random}`;
};

orderSchema.methods.updateProgress = function(current, note = '') {
    this.progress.current = Math.min(current, this.progress.target);
    this.progress.percentage = Math.min(100, Math.round((this.progress.current / this.progress.target) * 100));
    
    // 완료 체크
    if (this.progress.current >= this.progress.target && this.status !== 'completed') {
        this.status = 'completed';
        this.completedAt = new Date();
        this.deliveryInfo.actualCompletion = new Date();
    }
    
    // 히스토리 추가
    this.history.push({
        status: this.status,
        timestamp: new Date(),
        note: note || `진행량이 ${this.progress.current}/${this.progress.target}로 업데이트되었습니다`
    });
    
    return this.save();
};

orderSchema.methods.updateStatus = function(newStatus, note = '', changedBy = null) {
    const oldStatus = this.status;
    this.status = newStatus;
    
    // 상태별 추가 처리
    switch (newStatus) {
        case 'processing':
            if (!this.deliveryInfo.actualStart) {
                this.deliveryInfo.actualStart = new Date();
            }
            break;
        case 'completed':
            this.completedAt = new Date();
            this.deliveryInfo.actualCompletion = new Date();
            this.progress.current = this.progress.target;
            this.progress.percentage = 100;
            break;
        case 'cancelled':
            this.cancelledAt = new Date();
            break;
    }
    
    // 히스토리 추가
    this.history.push({
        status: newStatus,
        timestamp: new Date(),
        note: note || `상태가 ${oldStatus}에서 ${newStatus}로 변경되었습니다`,
        changedBy
    });
    
    return this.save();
};

orderSchema.methods.requestRefund = function(reason = '', amount = null) {
    this.refund.requested = true;
    this.refund.requestedAt = new Date();
    this.refund.reason = reason;
    this.refund.amount = amount || this.finalPrice;
    this.refund.status = 'pending';
    
    // 히스토리 추가
    this.history.push({
        status: this.status,
        timestamp: new Date(),
        note: `환불이 요청되었습니다: ${reason}`
    });
    
    return this.save();
};

orderSchema.methods.processRefund = function(status, processedBy = null) {
    this.refund.status = status;
    this.refund.processedAt = new Date();
    this.refund.processedBy = processedBy;
    
    if (status === 'approved' || status === 'processed') {
        this.status = 'refunded';
        this.paymentStatus = 'refunded';
    }
    
    // 히스토리 추가
    this.history.push({
        status: this.status,
        timestamp: new Date(),
        note: `환불이 ${status} 처리되었습니다`,
        changedBy: processedBy
    });
    
    return this.save();
};

orderSchema.methods.calculateRefundAmount = function() {
    const progressRatio = this.progress.current / this.progress.target;
    const completedAmount = this.finalPrice * progressRatio;
    return Math.max(0, this.finalPrice - completedAmount);
};

orderSchema.methods.addNote = function(note, type = 'admin', addedBy = null) {
    if (type in this.orderNotes) {
        this.orderNotes[type] = note;
    }
    
    // 히스토리 추가
    this.history.push({
        status: this.status,
        timestamp: new Date(),
        note: `${type} 노트 추가: ${note}`,
        changedBy: addedBy
    });
    
    return this.save();
};

// Static methods
orderSchema.statics.findByUser = function(userId) {
    return this.find({ userId }).sort({ createdAt: -1 });
};

orderSchema.statics.findByStatus = function(status) {
    return this.find({ status }).sort({ createdAt: -1 });
};

orderSchema.statics.getOverdueOrders = function() {
    return this.find({
        status: { $nin: ['completed', 'cancelled', 'refunded'] },
        'deliveryInfo.estimatedCompletion': { $lt: new Date() }
    }).sort({ 'deliveryInfo.estimatedCompletion': 1 });
};

orderSchema.statics.getOrderStats = async function(dateRange = {}) {
    const matchStage = {};
    
    if (dateRange.start && dateRange.end) {
        matchStage.createdAt = {
            $gte: new Date(dateRange.start),
            $lte: new Date(dateRange.end)
        };
    }
    
    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                completedOrders: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                cancelledOrders: {
                    $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                },
                totalRevenue: { $sum: '$finalPrice' },
                averageOrderValue: { $avg: '$finalPrice' },
                completionRate: {
                    $avg: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                }
            }
        }
    ]);
    
    return stats[0] || {};
};

orderSchema.statics.getDailyStats = async function(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                },
                orders: { $sum: 1 },
                revenue: { $sum: '$finalPrice' },
                completed: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
    ]);
};

module.exports = mongoose.model('Order', orderSchema);