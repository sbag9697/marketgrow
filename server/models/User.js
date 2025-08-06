const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, '이름을 입력해주세요'],
        trim: true,
        maxLength: [50, '이름은 50자 이하로 입력해주세요']
    },
    email: {
        type: String,
        required: [true, '이메일을 입력해주세요'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            '올바른 이메일 형식을 입력해주세요'
        ]
    },
    password: {
        type: String,
        required: [true, '비밀번호를 입력해주세요'],
        minLength: [6, '비밀번호는 최소 6자 이상이어야 합니다'],
        select: false // 기본적으로 조회 시 제외
    },
    phone: {
        type: String,
        trim: true,
        match: [/^01[0-9]-\d{4}-\d{4}$/, '올바른 휴대폰 번호 형식을 입력해주세요 (010-0000-0000)']
    },
    phoneVerified: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'manager'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending'],
        default: 'active'
    },
    membershipLevel: {
        type: String,
        enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
        default: 'Bronze'
    },
    points: {
        type: Number,
        default: 0,
        min: [0, '포인트는 0 이상이어야 합니다']
    },
    totalSpent: {
        type: Number,
        default: 0,
        min: [0, '총 사용금액은 0 이상이어야 합니다']
    },
    orderCount: {
        type: Number,
        default: 0,
        min: [0, '주문 수는 0 이상이어야 합니다']
    },
    referralCode: {
        type: String,
        unique: true,
        sparse: true
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    notificationSettings: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        smsNotifications: {
            type: Boolean,
            default: false
        },
        orderUpdates: {
            type: Boolean,
            default: true
        },
        paymentNotifications: {
            type: Boolean,
            default: true
        },
        marketingNotifications: {
            type: Boolean,
            default: false
        },
        smsPaymentSuccess: {
            type: Boolean,
            default: true
        },
        smsOrderComplete: {
            type: Boolean,
            default: true
        },
        smsUrgentNotifications: {
            type: Boolean,
            default: true
        }
    },
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'light'
        },
        language: {
            type: String,
            enum: ['ko', 'en'],
            default: 'ko'
        },
        timezone: {
            type: String,
            default: 'Asia/Seoul'
        }
    },
    loginHistory: [{
        ip: String,
        userAgent: String,
        location: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        success: {
            type: Boolean,
            default: true
        }
    }],
    lastLogin: {
        type: Date,
        default: null
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        select: false
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    },
    twoFactorSecret: {
        type: String,
        select: false
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    apiKey: {
        type: String,
        select: false
    },
    suspended: {
        reason: String,
        until: Date,
        by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual fields
userSchema.virtual('fullName').get(function() {
    return this.name;
});

userSchema.virtual('isActive').get(function() {
    return this.status === 'active';
});

userSchema.virtual('referralCount', {
    ref: 'User',
    localField: '_id',
    foreignField: 'referredBy',
    count: true
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 });
userSchema.index({ referralCode: 1 }, { unique: true, sparse: true });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActivity: -1 });
userSchema.index({ status: 1, role: 1 });

// Pre-save middleware
userSchema.pre('save', async function(next) {
    // 비밀번호가 수정되지 않았으면 다음으로
    if (!this.isModified('password')) return next();
    
    try {
        // 비밀번호 해싱
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.pre('save', function(next) {
    // 신규 사용자인 경우 추천 코드 생성
    if (this.isNew && !this.referralCode) {
        this.referralCode = this.generateReferralCode();
    }
    
    // 마지막 활동 시간 업데이트
    this.lastActivity = new Date();
    
    next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('비밀번호 확인 중 오류가 발생했습니다');
    }
};

userSchema.methods.generateAuthToken = function() {
    const payload = {
        id: this._id,
        email: this.email,
        role: this.role
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

userSchema.methods.generateRefreshToken = function() {
    const payload = {
        id: this._id,
        type: 'refresh'
    };
    
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });
};

userSchema.methods.generateReferralCode = function() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

userSchema.methods.updateMembershipLevel = function() {
    const totalSpent = this.totalSpent;
    
    if (totalSpent >= 10000000) { // 1천만원 이상
        this.membershipLevel = 'Diamond';
    } else if (totalSpent >= 5000000) { // 500만원 이상
        this.membershipLevel = 'Platinum';
    } else if (totalSpent >= 2000000) { // 200만원 이상
        this.membershipLevel = 'Gold';
    } else if (totalSpent >= 500000) { // 50만원 이상
        this.membershipLevel = 'Silver';
    } else {
        this.membershipLevel = 'Bronze';
    }
};

userSchema.methods.addPoints = function(points, reason = '') {
    this.points += points;
    // 포인트 히스토리는 별도 컬렉션에서 관리
    return this.points;
};

userSchema.methods.deductPoints = function(points) {
    if (this.points < points) {
        throw new Error('포인트가 부족합니다');
    }
    this.points -= points;
    return this.points;
};

userSchema.methods.recordLogin = function(ip, userAgent, location = '', success = true) {
    this.loginHistory.unshift({
        ip,
        userAgent,
        location,
        success,
        timestamp: new Date()
    });
    
    // 최근 20개만 유지
    if (this.loginHistory.length > 20) {
        this.loginHistory = this.loginHistory.slice(0, 20);
    }
    
    if (success) {
        this.lastLogin = new Date();
    }
    
    this.lastActivity = new Date();
};

userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    
    // 민감한 정보 제거
    delete userObject.password;
    delete userObject.passwordResetToken;
    delete userObject.passwordResetExpires;
    delete userObject.emailVerificationToken;
    delete userObject.twoFactorSecret;
    delete userObject.apiKey;
    
    return userObject;
};

// Static methods
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByReferralCode = function(code) {
    return this.findOne({ referralCode: code.toUpperCase() });
};

userSchema.statics.getActiveUsers = function() {
    return this.find({ status: 'active' });
};

userSchema.statics.getUserStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                activeUsers: {
                    $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                },
                newUsersThisMonth: {
                    $sum: {
                        $cond: [
                            { $gte: ['$createdAt', new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                            1,
                            0
                        ]
                    }
                },
                totalRevenue: { $sum: '$totalSpent' },
                averageOrderValue: { $avg: '$totalSpent' }
            }
        }
    ]);
    
    return stats[0] || {};
};

module.exports = mongoose.model('User', userSchema);