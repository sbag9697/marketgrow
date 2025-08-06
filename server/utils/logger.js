const winston = require('winston');
const path = require('path');

// 로그 레벨 정의
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

// 로그 색상 정의
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white'
};

winston.addColors(colors);

// 로그 형식 정의
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// 파일용 형식 (색상 제거)
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.json(),
    winston.format.printf(
        (info) => {
            const { timestamp, level, message, ...meta } = info;
            let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
            
            if (Object.keys(meta).length > 0) {
                log += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
            }
            
            return log;
        }
    )
);

// 로그 디렉토리 생성
const logDir = 'logs';
const fs = require('fs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Transport 설정
const transports = [
    // 콘솔 출력
    new winston.transports.Console({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        format
    }),
    
    // 에러 로그 파일
    new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }),
    
    // 결합된 로그 파일
    new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
    })
];

// 개발 환경에서는 debug 로그도 파일에 저장
if (process.env.NODE_ENV === 'development') {
    transports.push(
        new winston.transports.File({
            filename: path.join(logDir, 'debug.log'),
            level: 'debug',
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 3
        })
    );
}

// 로거 생성
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    levels,
    format: fileFormat,
    transports,
    
    // 처리되지 않은 예외 처리
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logDir, 'exceptions.log')
        })
    ],
    
    // 처리되지 않은 Promise rejection 처리
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logDir, 'rejections.log')
        })
    ]
});

// HTTP 요청 로깅을 위한 스트림
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    }
};

// 로그 메서드 확장
logger.logRequest = (req, res, responseTime) => {
    const user = req.user ? `User: ${req.user.email} (${req.user._id})` : 'Anonymous';
    const message = `${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms - ${req.ip} - ${user}`;
    
    if (res.statusCode >= 400) {
        logger.warn(message);
    } else {
        logger.http(message);
    }
};

logger.logAuth = (action, user, success = true, details = {}) => {
    const message = `Auth: ${action} - ${user.email || user} - ${success ? 'SUCCESS' : 'FAILED'}`;
    const meta = {
        userId: user._id || null,
        email: user.email || user,
        action,
        success,
        ...details
    };
    
    if (success) {
        logger.info(message, meta);
    } else {
        logger.warn(message, meta);
    }
};

logger.logPayment = (action, paymentId, userId, amount, success = true, details = {}) => {
    const message = `Payment: ${action} - ${paymentId} - User: ${userId} - Amount: ${amount} - ${success ? 'SUCCESS' : 'FAILED'}`;
    const meta = {
        action,
        paymentId,
        userId,
        amount,
        success,
        ...details
    };
    
    if (success) {
        logger.info(message, meta);
    } else {
        logger.error(message, meta);
    }
};

logger.logOrder = (action, orderNumber, userId, success = true, details = {}) => {
    const message = `Order: ${action} - ${orderNumber} - User: ${userId} - ${success ? 'SUCCESS' : 'FAILED'}`;
    const meta = {
        action,
        orderNumber,
        userId,
        success,
        ...details
    };
    
    if (success) {
        logger.info(message, meta);
    } else {
        logger.warn(message, meta);
    }
};

logger.logExternal = (service, action, success = true, details = {}) => {
    const message = `External: ${service} - ${action} - ${success ? 'SUCCESS' : 'FAILED'}`;
    const meta = {
        service,
        action,
        success,
        ...details
    };
    
    if (success) {
        logger.info(message, meta);
    } else {
        logger.error(message, meta);
    }
};

logger.logSecurity = (event, userId = null, severity = 'info', details = {}) => {
    const message = `Security: ${event} - User: ${userId || 'Anonymous'}`;
    const meta = {
        event,
        userId,
        severity,
        timestamp: new Date().toISOString(),
        ...details
    };
    
    switch (severity) {
        case 'critical':
        case 'high':
            logger.error(message, meta);
            break;
        case 'medium':
            logger.warn(message, meta);
            break;
        default:
            logger.info(message, meta);
    }
};

logger.logPerformance = (operation, duration, details = {}) => {
    const message = `Performance: ${operation} - ${duration}ms`;
    const meta = {
        operation,
        duration,
        ...details
    };
    
    if (duration > 5000) { // 5초 이상
        logger.warn(message, meta);
    } else if (duration > 1000) { // 1초 이상
        logger.info(message, meta);
    } else {
        logger.debug(message, meta);
    }
};

// 개발 환경에서만 SQL 쿼리 로깅
if (process.env.NODE_ENV === 'development') {
    logger.logQuery = (query, duration, details = {}) => {
        const message = `Query: ${query} - ${duration}ms`;
        logger.debug(message, { query, duration, ...details });
    };
}

// 로그 로테이션 및 정리 함수
logger.cleanupOldLogs = () => {
    const fs = require('fs');
    const path = require('path');
    
    try {
        const logFiles = fs.readdirSync(logDir);
        const now = Date.now();
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30일
        
        logFiles.forEach(file => {
            const filePath = path.join(logDir, file);
            const stats = fs.statSync(filePath);
            
            if (now - stats.mtime.getTime() > maxAge) {
                fs.unlinkSync(filePath);
                logger.info(`Old log file deleted: ${file}`);
            }
        });
    } catch (error) {
        logger.error('Log cleanup failed:', error);
    }
};

// 매일 자정에 로그 정리 실행
if (process.env.NODE_ENV === 'production') {
    setInterval(logger.cleanupOldLogs, 24 * 60 * 60 * 1000); // 24시간마다
}

// 프로세스 종료 시 로그 버퍼 플러시
process.on('exit', () => {
    logger.info('Application is shutting down');
});

process.on('SIGINT', () => {
    logger.info('Received SIGINT, graceful shutdown');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, graceful shutdown');
    process.exit(0);
});

module.exports = logger;