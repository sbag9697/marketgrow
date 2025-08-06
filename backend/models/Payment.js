const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    amount: {
        type: Number,
        required: [true, '결제 금액은 필수입니다'],
        min: [0, '결제 금액은 0 이상이어야 합니다']
    },
    currency: {
        type: String,
        default: 'KRW',
        enum: ['KRW', 'USD']
    },
    method: {
        type: String,
        required: [true, '결제 방법은 필수입니다'],
        enum: ['card', 'bank', 'kakao', 'paypal', 'toss', 'naver', 'samsung', 'point']
    },
    provider: {
        type: String,
        required: [true, '결제 제공업체는 필수입니다'],
        enum: ['iamport', 'stripe', 'toss', 'kakao', 'paypal']
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partial_refunded'],
        default: 'pending'
    },
    providerTransactionId: String,
    providerResponse: mongoose.Schema.Types.Mixed,
    
    // Card payment details
    cardInfo: {
        number: String, // masked card number
        company: String,
        type: String // credit, debit
    },
    
    // Bank transfer details
    bankInfo: {
        bank: String,
        account: String,
        holder: String
    },
    
    // Refund information
    refunds: [{
        amount: {
            type: Number,
            required: true
        },
        reason: String,
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending'
        },
        providerRefundId: String,
        processedAt: Date,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    totalRefunded: {
        type: Number,
        default: 0
    },
    
    // Receipt information
    receiptUrl: String,
    receiptNumber: String,
    
    // Failure information
    failureReason: String,
    failureCode: String,
    
    // Processing timestamps
    processedAt: Date,
    completedAt: Date,
    failedAt: Date,
    cancelledAt: Date,
    
    // Additional metadata
    userAgent: String,
    ipAddress: String,
    metadata: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

// Indexes
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ order: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ provider: 1, providerTransactionId: 1 });

// Generate payment ID
paymentSchema.pre('save', async function(next) {
    if (!this.paymentId && this.isNew) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.paymentId = `PAY-${timestamp}-${random}`;
    }
    next();
});

// Complete payment
paymentSchema.methods.complete = function(providerData = {}) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.providerTransactionId = providerData.transactionId;
    this.providerResponse = providerData;
    
    if (providerData.receiptUrl) {
        this.receiptUrl = providerData.receiptUrl;
    }
    
    if (providerData.receiptNumber) {
        this.receiptNumber = providerData.receiptNumber;
    }
    
    return this.save();
};

// Fail payment
paymentSchema.methods.fail = function(reason, code) {
    this.status = 'failed';
    this.failedAt = new Date();
    this.failureReason = reason;
    this.failureCode = code;
    
    return this.save();
};

// Cancel payment
paymentSchema.methods.cancel = function(reason) {
    if (this.status === 'completed') {
        throw new Error('완료된 결제는 취소할 수 없습니다. 환불을 요청하세요.');
    }
    
    this.status = 'cancelled';
    this.cancelledAt = new Date();
    this.failureReason = reason;
    
    return this.save();
};

// Process refund
paymentSchema.methods.addRefund = function(amount, reason) {
    if (this.status !== 'completed') {
        throw new Error('완료된 결제만 환불 가능합니다.');
    }
    
    if (this.totalRefunded + amount > this.amount) {
        throw new Error('환불 금액이 결제 금액을 초과할 수 없습니다.');
    }
    
    this.refunds.push({
        amount,
        reason,
        status: 'pending'
    });
    
    this.totalRefunded += amount;
    
    if (this.totalRefunded >= this.amount) {
        this.status = 'refunded';
    } else {
        this.status = 'partial_refunded';
    }
    
    return this.save();
};

// Complete refund
paymentSchema.methods.completeRefund = function(refundIndex, providerRefundId) {
    if (!this.refunds[refundIndex]) {
        throw new Error('환불 요청을 찾을 수 없습니다.');
    }
    
    this.refunds[refundIndex].status = 'completed';
    this.refunds[refundIndex].processedAt = new Date();
    this.refunds[refundIndex].providerRefundId = providerRefundId;
    
    return this.save();
};

// Virtual for remaining refundable amount
paymentSchema.virtual('refundableAmount').get(function() {
    return this.amount - this.totalRefunded;
});

module.exports = mongoose.model('Payment', paymentSchema);