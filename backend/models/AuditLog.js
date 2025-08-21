const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    level: {
        type: String,
        enum: ['info', 'warning', 'error', 'critical', 'debug'],
        default: 'info'
    },
    category: {
        type: String,
        enum: [
            'auth',
            'order',
            'payment',
            'user',
            'admin',
            'system',
            'security',
            'api',
            'coupon',
            'deposit',
            'service'
        ],
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.Mixed, // ObjectId 또는 String
        index: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'targetModel'
    },
    targetModel: {
        type: String,
        enum: ['User', 'Order', 'Service', 'Coupon', 'Deposit', 'Payment']
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed // 추가 데이터
    },
    changes: {
        before: mongoose.Schema.Types.Mixed,
        after: mongoose.Schema.Types.Mixed
    },
    ip: {
        type: String,
        index: true
    },
    userAgent: {
        type: String
    },
    requestId: {
        type: String // 요청 추적용
    },
    sessionId: {
        type: String
    },
    errorDetails: {
        code: String,
        stack: String,
        originalError: mongoose.Schema.Types.Mixed
    },
    performance: {
        duration: Number, // 실행 시간 (ms)
        memoryUsage: Number // 메모리 사용량
    },
    security: {
        suspiciousActivity: Boolean,
        blockedReason: String,
        riskScore: Number
    }
}, {
    timestamps: false // timestamp 필드를 직접 관리
});

// 인덱스
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ category: 1, timestamp: -1 });
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ 'security.suspiciousActivity': 1 });

// TTL 인덱스 - 90일 후 자동 삭제
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// 정적 메서드: 로그 생성
auditLogSchema.statics.log = async function(data) {
    try {
        const log = new this(data);
        await log.save();
        return log;
    } catch (error) {
        console.error('Audit log creation failed:', error);
        // 로그 실패가 애플리케이션을 중단시키지 않도록
        return null;
    }
};

// 정적 메서드: 보안 이벤트 로그
auditLogSchema.statics.logSecurityEvent = async function({
    action,
    user,
    message,
    ip,
    suspicious = false,
    riskScore = 0
}) {
    return this.log({
        level: suspicious ? 'warning' : 'info',
        category: 'security',
        action,
        user,
        message,
        ip,
        security: {
            suspiciousActivity: suspicious,
            riskScore
        }
    });
};

// 정적 메서드: 에러 로그
auditLogSchema.statics.logError = async function({
    category,
    action,
    user,
    message,
    error,
    ip
}) {
    return this.log({
        level: 'error',
        category,
        action,
        user,
        message,
        ip,
        errorDetails: {
            code: error.code,
            stack: error.stack,
            originalError: error.message
        }
    });
};

// 정적 메서드: 성능 로그
auditLogSchema.statics.logPerformance = async function({
    category,
    action,
    user,
    message,
    duration,
    memoryUsage
}) {
    return this.log({
        level: 'debug',
        category,
        action,
        user,
        message,
        performance: {
            duration,
            memoryUsage
        }
    });
};

// 정적 메서드: 최근 로그 조회
auditLogSchema.statics.getRecentLogs = async function(options = {}) {
    const {
        category,
        user,
        action,
        level,
        limit = 100,
        startDate,
        endDate
    } = options;

    const query = {};
    
    if (category) query.category = category;
    if (user) query.user = user;
    if (action) query.action = action;
    if (level) query.level = level;
    
    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
    }

    return this.find(query)
        .sort({ timestamp: -1 })
        .limit(limit);
};

// 정적 메서드: 의심스러운 활동 감지
auditLogSchema.statics.detectSuspiciousActivity = async function(userId, ip) {
    const recentLogs = await this.find({
        $or: [
            { user: userId },
            { ip }
        ],
        timestamp: { $gte: new Date(Date.now() - 3600000) }, // 1시간 이내
        'security.suspiciousActivity': true
    });

    return recentLogs.length > 0;
};

// 정적 메서드: 통계 생성
auditLogSchema.statics.getStatistics = async function(startDate, endDate) {
    const pipeline = [
        {
            $match: {
                timestamp: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: {
                    category: '$category',
                    action: '$action',
                    level: '$level'
                },
                count: { $sum: 1 },
                avgDuration: { $avg: '$performance.duration' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ];

    return this.aggregate(pipeline);
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;