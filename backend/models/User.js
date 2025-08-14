const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, '아이디는 필수입니다'],
        unique: true,
        trim: true,
        minlength: [4, '아이디는 최소 4자 이상이어야 합니다'],
        maxlength: [16, '아이디는 최대 16자까지 가능합니다'],
        match: [/^[a-zA-Z0-9]+$/, '아이디는 영문과 숫자만 사용 가능합니다']
    },
    email: {
        type: String,
        required: [true, '이메일은 필수입니다'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '유효한 이메일 주소를 입력해주세요']
    },
    password: {
        type: String,
        required: function () {
            return !this.socialProvider; // 소셜 로그인이 아닌 경우에만 필수
        },
        minlength: [8, '비밀번호는 최소 8자 이상이어야 합니다'],
        select: false
    },
    // 소셜 로그인 관련 필드
    socialProvider: {
        type: String,
        enum: ['google', 'kakao', 'naver', null],
        default: null
    },
    socialId: {
        type: String,
        sparse: true
    },
    profileImage: {
        type: String,
        default: null
    },
    name: {
        type: String,
        required: [true, '이름은 필수입니다'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, '전화번호는 필수입니다'],
        match: [/^[0-9]{10,11}$/, '유효한 전화번호를 입력해주세요']
    },
    businessType: {
        type: String,
        enum: ['personal', 'small', 'startup', 'agency', 'corporation', 'other'],
        default: 'personal'
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'manager'],
        default: 'user'
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    phoneVerificationCode: String,
    phoneVerificationExpire: Date,
    passwordResetToken: String,
    passwordResetExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
    referralCode: {
        type: String,
        unique: true,
        sparse: true
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    points: {
        type: Number,
        default: 0
    },
    depositBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    membershipLevel: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
        default: 'bronze'
    },
    marketingConsent: {
        type: Boolean,
        default: false
    },
    termsAcceptedAt: {
        type: Date,
        required: true
    },
    lastLoginAt: Date,
    loginCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    socialLogins: {
        kakao: String,
        google: String,
        naver: String
    },
    notifications: {
        email: {
            type: Boolean,
            default: true
        },
        sms: {
            type: Boolean,
            default: true
        },
        push: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ referralCode: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Generate referral code
userSchema.pre('save', async function (next) {
    if (!this.referralCode && this.isNew) {
        this.referralCode = this.username.toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            role: this.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

// Update membership level based on total spent
userSchema.methods.updateMembershipLevel = function () {
    if (this.totalSpent >= 10000000) {
        this.membershipLevel = 'diamond';
    } else if (this.totalSpent >= 5000000) {
        this.membershipLevel = 'platinum';
    } else if (this.totalSpent >= 2000000) {
        this.membershipLevel = 'gold';
    } else if (this.totalSpent >= 500000) {
        this.membershipLevel = 'silver';
    } else {
        this.membershipLevel = 'bronze';
    }
};

// Get discount rate based on membership level
userSchema.methods.getDiscountRate = function () {
    const discountRates = {
        bronze: 0,
        silver: 0.05,
        gold: 0.10,
        platinum: 0.15,
        diamond: 0.20
    };
    return discountRates[this.membershipLevel] || 0;
};

module.exports = mongoose.model('User', userSchema);
