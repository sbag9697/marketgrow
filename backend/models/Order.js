const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    quantity: {
        type: Number,
        required: [true, '수량은 필수입니다'],
        min: [1, '수량은 1개 이상이어야 합니다']
    },
    targetUrl: {
        type: String,
        required: [true, '대상 URL은 필수입니다']
    },
    targetUsername: {
        type: String
    },
    unitPrice: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'partial', 'completed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    progress: {
        current: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            default: 0
        },
        percentage: {
            type: Number,
            default: 0
        }
    },
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    refundedAt: Date,
    refundAmount: Number,
    notes: String,
    adminNotes: String,
    providerOrderId: String,
    providerStatus: String,
    providerResponse: mongoose.Schema.Types.Mixed,
    retryCount: {
        type: Number,
        default: 0
    },
    lastError: String,
    metadata: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

// Generate order number
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber && this.isNew) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.orderNumber = `ORD-${year}${month}${day}-${random}`;
    }
    next();
});

// Calculate progress percentage
orderSchema.pre('save', function (next) {
    if (this.progress.total > 0) {
        this.progress.percentage = Math.round((this.progress.current / this.progress.total) * 100);
    }
    next();
});

// Update order status based on progress
orderSchema.methods.updateProgress = function (current) {
    this.progress.current = current;

    if (current >= this.progress.total) {
        this.status = 'completed';
        this.completedAt = new Date();
    } else if (current > 0) {
        this.status = 'processing';
        if (!this.startedAt) {
            this.startedAt = new Date();
        }
    }

    return this.save();
};

// Cancel order
orderSchema.methods.cancel = async function (reason) {
    if (['completed', 'cancelled', 'refunded'].includes(this.status)) {
        throw new Error('이미 완료되었거나 취소된 주문입니다.');
    }

    this.status = 'cancelled';
    this.cancelledAt = new Date();
    this.cancellationReason = reason;

    return this.save();
};

// Process refund
orderSchema.methods.refund = async function (amount) {
    if (this.status !== 'completed' && this.status !== 'cancelled') {
        throw new Error('완료되거나 취소된 주문만 환불 가능합니다.');
    }

    this.status = 'refunded';
    this.paymentStatus = 'refunded';
    this.refundedAt = new Date();
    this.refundAmount = amount || this.finalAmount;

    return this.save();
};

// Virtual for elapsed time
orderSchema.virtual('elapsedTime').get(function () {
    if (!this.startedAt) return null;
    const endTime = this.completedAt || this.cancelledAt || new Date();
    return endTime - this.startedAt;
});

module.exports = mongoose.model('Order', orderSchema);
