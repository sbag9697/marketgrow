const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
    consultationId: {
        type: String,
        required: true,
        unique: true
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
    email: {
        type: String,
        required: [true, '이메일은 필수입니다'],
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '유효한 이메일 주소를 입력해주세요']
    },
    company: {
        type: String,
        trim: true
    },
    businessType: {
        type: String,
        enum: ['personal', 'small', 'startup', 'agency', 'corporation', 'other'],
        required: [true, '비즈니스 유형은 필수입니다']
    },
    interestedServices: [{
        type: String,
        enum: ['instagram', 'youtube', 'facebook', 'tiktok', 'twitter', 'telegram', 'threads', 'website', 'keyword', 'consulting']
    }],
    budget: {
        type: String,
        enum: ['under_100k', '100k_500k', '500k_1m', '1m_5m', '5m_10m', 'over_10m', 'discuss'],
        required: [true, '예산 범위는 필수입니다']
    },
    timeline: {
        type: String,
        enum: ['immediate', 'within_week', 'within_month', 'within_3months', 'flexible'],
        required: [true, '원하는 시작 시기는 필수입니다']
    },
    currentChannels: [{
        platform: String,
        username: String,
        followers: Number,
        engagement: String
    }],
    goals: {
        type: String,
        required: [true, '마케팅 목표는 필수입니다']
    },
    challenges: String,
    previousExperience: {
        type: String,
        enum: ['none', 'basic', 'intermediate', 'advanced']
    },
    message: {
        type: String,
        required: [true, '상담 내용은 필수입니다'],
        maxlength: [1000, '상담 내용은 1000자 이하로 입력해주세요']
    },
    status: {
        type: String,
        enum: ['pending', 'contacted', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    contactedAt: Date,
    scheduledCallAt: Date,
    completedAt: Date,

    // Follow-up information
    followUps: [{
        date: {
            type: Date,
            default: Date.now
        },
        method: {
            type: String,
            enum: ['phone', 'email', 'meeting', 'video_call']
        },
        notes: String,
        result: {
            type: String,
            enum: ['no_answer', 'scheduled', 'interested', 'not_interested', 'proposal_sent', 'closed']
        },
        nextAction: String,
        nextActionDate: Date,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],

    // Consultation outcome
    outcome: {
        type: String,
        enum: ['converted', 'not_converted', 'pending', 'follow_up_needed']
    },
    conversionValue: Number,
    conversionDate: Date,

    // Additional information
    source: {
        type: String,
        enum: ['website', 'phone', 'email', 'referral', 'social', 'advertisement'],
        default: 'website'
    },
    referralSource: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    ipAddress: String,
    userAgent: String,

    // Privacy and consent
    marketingConsent: {
        type: Boolean,
        required: true
    },
    privacyConsent: {
        type: Boolean,
        required: true
    },

    // Internal notes
    internalNotes: String,
    tags: [{
        type: String,
        lowercase: true
    }],

    metadata: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

// Indexes
consultationSchema.index({ consultationId: 1 });
consultationSchema.index({ status: 1, createdAt: -1 });
consultationSchema.index({ assignedTo: 1 });
consultationSchema.index({ phone: 1 });
consultationSchema.index({ email: 1 });
consultationSchema.index({ tags: 1 });

// Generate consultation ID
consultationSchema.pre('save', async function (next) {
    if (!this.consultationId && this.isNew) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.consultationId = `CON-${year}${month}${day}-${random}`;
    }
    next();
});

// Add follow-up
consultationSchema.methods.addFollowUp = function (followUpData, userId) {
    this.followUps.push({
        ...followUpData,
        createdBy: userId
    });

    // Update status if needed
    if (followUpData.result === 'scheduled' && this.status === 'pending') {
        this.status = 'contacted';
        this.contactedAt = new Date();
    }

    return this.save();
};

// Assign to user
consultationSchema.methods.assignTo = function (userId) {
    this.assignedTo = userId;
    if (this.status === 'pending') {
        this.status = 'contacted';
        this.contactedAt = new Date();
    }
    return this.save();
};

// Mark as completed
consultationSchema.methods.complete = function (outcome, conversionValue = null) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.outcome = outcome;

    if (outcome === 'converted') {
        this.conversionValue = conversionValue;
        this.conversionDate = new Date();
    }

    return this.save();
};

// Schedule call
consultationSchema.methods.scheduleCall = function (scheduledDate) {
    this.scheduledCallAt = scheduledDate;
    if (this.status === 'pending') {
        this.status = 'contacted';
        this.contactedAt = new Date();
    }
    return this.save();
};

// Virtual for days since created
consultationSchema.virtual('daysSinceCreated').get(function () {
    const now = new Date();
    const diffTime = Math.abs(now - this.createdAt);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for last follow-up
consultationSchema.virtual('lastFollowUp').get(function () {
    if (this.followUps.length === 0) return null;
    return this.followUps[this.followUps.length - 1];
});

module.exports = mongoose.model('Consultation', consultationSchema);
