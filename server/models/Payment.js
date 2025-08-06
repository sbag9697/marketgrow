const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, '주문 정보가 필요합니다'],
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, '사용자 정보가 필요합니다'],
        index: true
    },
    amount: {
        type: Number,
        required: [true, '결제 금액이 필요합니다'],
        min: [0, '결제 금액은 0 이상이어야 합니다']
    },
    currency: {
        type: String,
        default: 'KRW',
        enum: ['KRW', 'USD', 'EUR', 'JPY']
    },
    paymentMethod: {
        type: String,
        required: [true, '결제 방법이 필요합니다'],
        enum: [
            'card',         // 신용카드/체크카드
            'bank',         // 무통장입금
            'paypal',       // PayPal
            'kakaopay',     // 카카오페이
            'naverpay',     // 네이버페이
            'tosspay',      // 토스페이
            'payco',        // 페이코
            'samsungpay',   // 삼성페이
            'applepay',     // 애플페이
            'googlepay'     // 구글페이
        ]
    },
    status: {
        type: String,
        enum: [
            'pending',      // 대기중
            'processing',   // 처리중
            'completed',    // 완료
            'failed',       // 실패
            'cancelled',    // 취소됨
            'refunded',     // 환불됨
            'partial_refund' // 부분환불
        ],
        default: 'pending',
        index: true
    },
    transactionId: {
        type: String,
        index: true
    },
    gatewayProvider: {
        type: String,
        enum: ['toss', 'inicis', 'kcp', 'nice', 'paypal', 'stripe'],
        required: [true, '결제 게이트웨이 정보가 필요합니다']
    },
    gatewayResponse: {
        type: mongoose.Schema.Types.Mixed,
        select: false // 기본적으로 조회 시 제외
    },
    cardInfo: {
        company: String,        // 카드사
        number: String,         // 마스킹된 카드번호
        type: String,           // 카드 타입 (credit/debit)
        ownerType: String,      // 개인/법인
        receiptUrl: String,     // 카드 매출전표
        installmentPlanMonths: Number, // 할부개월수
        approveNo: String       // 승인번호
    },
    bankInfo: {
        bank: String,           // 은행명
        accountNumber: String,  // 계좌번호 (마스킹)
        holderName: String      // 예금주명
    },
    virtualAccount: {
        bank: String,           // 가상계좌 은행
        accountNumber: String,  // 가상계좌 번호
        dueDate: Date,          // 입금 마감일
        expired: {
            type: Boolean,
            default: false
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
        address: {
            country: String,
            state: String,
            city: String,
            zipCode: String,
            line1: String,
            line2: String
        }
    },
    orderInfo: {
        orderNumber: String,
        serviceName: String,
        quantity: Number,
        targetUrl: String,
        description: String
    },
    fees: {
        gateway: {
            type: Number,
            default: 0
        },
        processing: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            default: 0
        }
    },
    refund: {
        totalAmount: {
            type: Number,
            default: 0
        },
        reason: String,
        requestedAt: Date,
        processedAt: Date,
        status: {
            type: String,
            enum: ['none', 'requested', 'processing', 'completed', 'failed'],
            default: 'none'
        },
        refundId: String,
        history: [{
            amount: Number,
            reason: String,
            requestedAt: Date,
            processedAt: Date,
            status: String,
            refundId: String
        }]
    },
    receiptInfo: {
        url: String,
        number: String,
        issuedAt: Date
    },
    metadata: {
        userAgent: String,
        ipAddress: String,
        sessionId: String,
        referrer: String,
        source: String,
        campaign: String
    },
    webhookEvents: [{
        eventType: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        data: mongoose.Schema.Types.Mixed,
        processed: {
            type: Boolean,
            default: false
        }
    }],
    failureInfo: {
        code: String,
        message: String,
        details: mongoose.Schema.Types.Mixed
    },
    securityInfo: {
        riskScore: {
            type: Number,
            min: 0,
            max: 100
        },
        fraudCheck: {
            type: Boolean,
            default: false
        },
        verified3DS: {
            type: Boolean,
            default: false
        }
    },
    timeline: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String,
        source: String
    }],
    completedAt: Date,
    failedAt: Date,
    cancelledAt: Date,
    refundedAt: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual fields
paymentSchema.virtual('isCompleted').get(function() {
    return this.status === 'completed';
});

paymentSchema.virtual('isFailed').get(function() {
    return this.status === 'failed';
});

paymentSchema.virtual('isRefunded').get(function() {
    return this.status === 'refunded' || this.status === 'partial_refund';
});

paymentSchema.virtual('netAmount').get(function() {
    return this.amount - this.fees.total;
});

paymentSchema.virtual('refundableAmount').get(function() {
    return this.amount - this.refund.totalAmount;
});

paymentSchema.virtual('paymentMethodName').get(function() {
    const methodNames = {
        card: '신용카드',
        bank: '무통장입금',
        paypal: 'PayPal',
        kakaopay: '카카오페이',
        naverpay: '네이버페이',
        tosspay: '토스페이',
        payco: '페이코',
        samsungpay: '삼성페이',
        applepay: '애플페이',
        googlepay: '구글페이'
    };
    return methodNames[this.paymentMethod] || this.paymentMethod;
});

// Indexes
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ gatewayProvider: 1 });
paymentSchema.index({ 'virtualAccount.dueDate': 1 });
paymentSchema.index({ paymentId: 1 }, { unique: true });
paymentSchema.index({ transactionId: 1 });

// Pre-save middleware
paymentSchema.pre('save', function(next) {
    // 결제 ID 자동 생성
    if (this.isNew && !this.paymentId) {
        this.paymentId = this.generatePaymentId();
    }
    
    // 타임라인 업데이트
    if (this.isModified('status')) {
        this.timeline.push({
            status: this.status,
            timestamp: new Date(),
            note: `결제 상태가 ${this.status}로 변경됨`,
            source: 'system'
        });
        
        // 상태별 완료 시간 설정
        switch (this.status) {
            case 'completed':
                if (!this.completedAt) this.completedAt = new Date();
                break;
            case 'failed':
                if (!this.failedAt) this.failedAt = new Date();
                break;
            case 'cancelled':
                if (!this.cancelledAt) this.cancelledAt = new Date();
                break;
            case 'refunded':
            case 'partial_refund':
                if (!this.refundedAt) this.refundedAt = new Date();
                break;
        }
    }
    
    // 수수료 자동 계산
    if (this.isModified('amount') || this.isModified('paymentMethod')) {
        this.calculateFees();
    }
    
    next();
});

// Instance methods
paymentSchema.methods.generatePaymentId = function() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 8);
    return `PAY_${timestamp}_${random}`.toUpperCase();
};

paymentSchema.methods.calculateFees = function() {
    let gatewayFee = 0;
    let processingFee = 0;
    
    // 결제 방법별 수수료 계산
    switch (this.paymentMethod) {
        case 'card':
            gatewayFee = Math.ceil(this.amount * 0.029); // 2.9%
            break;
        case 'bank':
            gatewayFee = 500; // 고정 수수료
            break;
        case 'kakaopay':
        case 'naverpay':
            gatewayFee = Math.ceil(this.amount * 0.034); // 3.4%
            break;
        case 'paypal':
            gatewayFee = Math.ceil(this.amount * 0.044) + 500; // 4.4% + 고정비
            break;
        default:
            gatewayFee = Math.ceil(this.amount * 0.03); // 기본 3%
    }
    
    // 처리 수수료 (필요시)
    processingFee = 0;
    
    this.fees.gateway = gatewayFee;
    this.fees.processing = processingFee;
    this.fees.total = gatewayFee + processingFee;
};

paymentSchema.methods.processPayment = async function(gatewayResponse) {
    this.gatewayResponse = gatewayResponse;
    this.transactionId = gatewayResponse.transactionId || gatewayResponse.tid;
    this.status = 'completed';
    this.completedAt = new Date();
    
    // 결제 방법별 추가 정보 저장
    if (this.paymentMethod === 'card' && gatewayResponse.card) {
        this.cardInfo = {
            company: gatewayResponse.card.company,
            number: gatewayResponse.card.number,
            type: gatewayResponse.card.cardType,
            ownerType: gatewayResponse.card.ownerType,
            installmentPlanMonths: gatewayResponse.card.installmentPlanMonths || 0,
            approveNo: gatewayResponse.card.approveNo
        };
    }
    
    if (this.paymentMethod === 'bank' && gatewayResponse.virtualAccount) {
        this.virtualAccount = {
            bank: gatewayResponse.virtualAccount.bank,
            accountNumber: gatewayResponse.virtualAccount.accountNumber,
            dueDate: gatewayResponse.virtualAccount.dueDate
        };
    }
    
    // 영수증 정보
    if (gatewayResponse.receipt) {
        this.receiptInfo = {
            url: gatewayResponse.receipt.url,
            number: gatewayResponse.receipt.number,
            issuedAt: new Date()
        };
    }
    
    return this.save();
};

paymentSchema.methods.failPayment = function(failureInfo) {
    this.status = 'failed';
    this.failedAt = new Date();
    this.failureInfo = {
        code: failureInfo.code,
        message: failureInfo.message,
        details: failureInfo.details
    };
    
    this.timeline.push({
        status: 'failed',
        timestamp: new Date(),
        note: `결제 실패: ${failureInfo.message}`,
        source: 'gateway'
    });
    
    return this.save();
};

paymentSchema.methods.cancelPayment = function(reason = '') {
    this.status = 'cancelled';
    this.cancelledAt = new Date();
    
    this.timeline.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: `결제 취소: ${reason}`,
        source: 'user'
    });
    
    return this.save();
};

paymentSchema.methods.requestRefund = function(amount, reason = '') {
    if (amount > this.refundableAmount) {
        throw new Error('환불 가능 금액을 초과했습니다');
    }
    
    this.refund.reason = reason;
    this.refund.requestedAt = new Date();
    this.refund.status = 'requested';
    
    this.refund.history.push({
        amount,
        reason,
        requestedAt: new Date(),
        status: 'requested'
    });
    
    this.timeline.push({
        status: this.status,
        timestamp: new Date(),
        note: `환불 요청: ${amount}원 (${reason})`,
        source: 'user'
    });
    
    return this.save();
};

paymentSchema.methods.processRefund = async function(refundAmount, refundId) {
    this.refund.totalAmount += refundAmount;
    this.refund.status = 'completed';
    this.refund.processedAt = new Date();
    
    // 부분환불 vs 전액환불 상태 설정
    if (this.refund.totalAmount >= this.amount) {
        this.status = 'refunded';
        this.refundedAt = new Date();
    } else {
        this.status = 'partial_refund';
    }
    
    // 환불 히스토리 업데이트
    const lastRefund = this.refund.history[this.refund.history.length - 1];
    if (lastRefund && lastRefund.status === 'requested') {
        lastRefund.status = 'completed';
        lastRefund.processedAt = new Date();
        lastRefund.refundId = refundId;
    }
    
    this.timeline.push({
        status: this.status,
        timestamp: new Date(),
        note: `환불 처리 완료: ${refundAmount}원`,
        source: 'gateway'
    });
    
    return this.save();
};

paymentSchema.methods.addWebhookEvent = function(eventType, data) {
    this.webhookEvents.push({
        eventType,
        data,
        timestamp: new Date(),
        processed: false
    });
    
    return this.save();
};

paymentSchema.methods.updateSecurityInfo = function(riskScore, fraudCheck = false, verified3DS = false) {
    this.securityInfo = {
        riskScore,
        fraudCheck,
        verified3DS
    };
    
    return this.save();
};

// Static methods
paymentSchema.statics.findByUser = function(userId) {
    return this.find({ userId }).sort({ createdAt: -1 });
};

paymentSchema.statics.findByStatus = function(status) {
    return this.find({ status }).sort({ createdAt: -1 });
};

paymentSchema.statics.findByDateRange = function(startDate, endDate) {
    return this.find({
        createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    }).sort({ createdAt: -1 });
};

paymentSchema.statics.getPaymentStats = async function(dateRange = {}) {
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
                totalPayments: { $sum: 1 },
                completedPayments: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                failedPayments: {
                    $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                },
                totalAmount: { $sum: '$amount' },
                completedAmount: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
                },
                totalFees: { $sum: '$fees.total' },
                averageAmount: { $avg: '$amount' },
                successRate: {
                    $avg: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                }
            }
        }
    ]);
    
    return stats[0] || {};
};

paymentSchema.statics.getMethodStats = async function() {
    return this.aggregate([
        {
            $group: {
                _id: '$paymentMethod',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                successCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                averageAmount: { $avg: '$amount' }
            }
        },
        {
            $addFields: {
                successRate: { $divide: ['$successCount', '$count'] }
            }
        },
        {
            $sort: { totalAmount: -1 }
        }
    ]);
};

paymentSchema.statics.getDailyRevenue = async function(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
                status: 'completed'
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                },
                revenue: { $sum: '$amount' },
                count: { $sum: 1 },
                fees: { $sum: '$fees.total' }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
    ]);
};

module.exports = mongoose.model('Payment', paymentSchema);