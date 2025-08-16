const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
    depositNumber: {
        type: String,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 10000 // 최소 1만원
    },
    bonusAmount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    depositorName: {
        type: String,
        required: true
    },
    method: {
        type: String,
        enum: ['bank_transfer', 'virtual_account', 'card', 'easy_payment'],
        default: 'virtual_account'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled', 'expired'],
        default: 'pending'
    },
    virtualAccount: {
        bank: String,
        accountNumber: String,
        accountHolder: String,
        dueDate: Date,
        orderId: String,
        paymentKey: String
    },
    bankTransfer: {
        bank: String,
        accountNumber: String,
        accountHolder: String,
        identificationCode: String,  // 입금자 식별 코드
        depositorName: String,        // 입금자명
        requestedAt: Date,
        expiresAt: Date,
        transferredAt: Date
    },
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // 입금 확인한 관리자
    orderId: String,
    cancelReason: String,
    completedAt: Date,
    cancelledAt: Date,
    expiredAt: Date,
    adminNotes: String,
    metadata: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

// 입금 번호 자동 생성
depositSchema.pre('save', async function (next) {
    if (this.isNew && !this.depositNumber) {
        const date = new Date();
        const dateStr = date.getFullYear().toString().slice(2) +
                       (date.getMonth() + 1).toString().padStart(2, '0') +
                       date.getDate().toString().padStart(2, '0');

        const count = await this.constructor.countDocuments({
            createdAt: {
                $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
            }
        });

        this.depositNumber = `DEP${dateStr}${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
});

// 인덱스
depositSchema.index({ user: 1, createdAt: -1 });
depositSchema.index({ status: 1 });
depositSchema.index({ 'virtualAccount.orderId': 1 });
depositSchema.index({ depositNumber: 1 });

module.exports = mongoose.model('Deposit', depositSchema);
