const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const AuditLog = require('../models/AuditLog');

// CORS 설정
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',') 
            : ['http://localhost:3000', 'http://localhost:5000'];
        
        // 프로덕션 도메인 추가
        if (process.env.NODE_ENV === 'production') {
            allowedOrigins.push(
                'https://marketgrow.kr',
                'https://www.marketgrow.kr',
                'https://marketgrow.netlify.app',
                'https://marketgrow-production.up.railway.app'
            );
        }
        
        // 개발 환경에서는 origin이 없는 경우(Postman 등) 허용
        if (!origin && process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy violation'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400 // 24시간
};

// Rate Limiting 설정
const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message,
        standardHeaders: true,
        legacyHeaders: false,
        handler: async (req, res) => {
            // 의심스러운 활동 로그
            await AuditLog.logSecurityEvent({
                action: 'rate_limit_exceeded',
                user: req.user?.id || req.ip,
                message: `Rate limit exceeded: ${req.path}`,
                ip: req.ip,
                suspicious: true,
                riskScore: 5
            });
            
            res.status(429).json({
                success: false,
                error: 'TOO_MANY_REQUESTS',
                message
            });
        }
    });
};

// 일반 API Rate Limiter
const apiLimiter = createRateLimiter(
    15 * 60 * 1000, // 15분
    100, // 최대 100 요청
    '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
);

// 인증 관련 Rate Limiter (더 엄격)
const authLimiter = createRateLimiter(
    15 * 60 * 1000, // 15분
    5, // 최대 5 요청
    '너무 많은 로그인 시도가 있었습니다. 15분 후 다시 시도해주세요.'
);

// 결제 관련 Rate Limiter
const paymentLimiter = createRateLimiter(
    60 * 60 * 1000, // 1시간
    10, // 최대 10 요청
    '결제 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
);

// 관리자 API Rate Limiter
const adminLimiter = createRateLimiter(
    5 * 60 * 1000, // 5분
    50, // 최대 50 요청
    '관리자 API 요청 한도를 초과했습니다.'
);

// XSS 및 SQL Injection 방지 미들웨어
const sanitizeInput = (req, res, next) => {
    // MongoDB 쿼리 인젝션 방지
    mongoSanitize.sanitize(req.body);
    mongoSanitize.sanitize(req.query);
    mongoSanitize.sanitize(req.params);
    
    next();
};

// 보안 헤더 설정
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.marketgrow.kr", "wss://marketgrow.kr"],
        },
    },
    crossOriginEmbedderPolicy: false,
});

// CSRF 토큰 생성 및 검증
const csrf = require('csurf');
const csrfProtection = csrf({ 
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
});

// IP 기반 보안 체크
const ipSecurityCheck = async (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    // IP 블랙리스트 체크
    const blacklistedIPs = process.env.BLACKLISTED_IPS 
        ? process.env.BLACKLISTED_IPS.split(',') 
        : [];
    
    if (blacklistedIPs.includes(ip)) {
        await AuditLog.logSecurityEvent({
            action: 'blocked_ip_access',
            user: ip,
            message: `Blocked IP attempted access: ${req.path}`,
            ip,
            suspicious: true,
            riskScore: 10
        });
        
        return res.status(403).json({
            success: false,
            error: 'FORBIDDEN',
            message: 'Access denied'
        });
    }
    
    // 의심스러운 활동 감지
    const suspicious = await AuditLog.detectSuspiciousActivity(req.user?.id, ip);
    if (suspicious) {
        req.suspiciousActivity = true;
    }
    
    next();
};

// 입력값 검증 미들웨어
const validateInput = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        
        const { validationResult } = require('express-validator');
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            // 유효성 검사 실패 로그
            await AuditLog.log({
                level: 'warning',
                category: 'security',
                action: 'validation_failed',
                user: req.user?.id || req.ip,
                message: 'Input validation failed',
                data: { errors: errors.array(), path: req.path },
                ip: req.ip
            });
            
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                errors: errors.array()
            });
        }
        
        next();
    };
};

// 파일 업로드 보안
const fileUploadSecurity = (req, res, next) => {
    if (req.files) {
        const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf'
        ];
        
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        
        for (const file of Object.values(req.files)) {
            if (!allowedMimeTypes.includes(file.mimetype)) {
                return res.status(400).json({
                    success: false,
                    error: 'INVALID_FILE_TYPE',
                    message: '허용되지 않는 파일 형식입니다'
                });
            }
            
            if (file.size > maxFileSize) {
                return res.status(400).json({
                    success: false,
                    error: 'FILE_TOO_LARGE',
                    message: '파일 크기가 10MB를 초과합니다'
                });
            }
        }
    }
    
    next();
};

// 보안 미들웨어 통합
const setupSecurity = (app) => {
    // 기본 보안 헤더
    app.use(securityHeaders);
    
    // CORS
    app.use(cors(corsOptions));
    
    // Body parser 크기 제한
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // XSS 방지
    app.use(xss());
    
    // MongoDB 쿼리 인젝션 방지
    app.use(mongoSanitize());
    
    // HTTP 파라미터 오염 방지
    app.use(hpp());
    
    // IP 보안 체크
    app.use(ipSecurityCheck);
    
    // Trust proxy 설정 (Railway 등 프록시 환경)
    app.set('trust proxy', 1);
    
    // 쿠키 파서
    const cookieParser = require('cookie-parser');
    app.use(cookieParser(process.env.COOKIE_SECRET || 'your-cookie-secret'));
    
    // Rate Limiting 적용
    app.use('/api/', apiLimiter);
    app.use('/api/auth/', authLimiter);
    app.use('/api/payments/', paymentLimiter);
    app.use('/api/admin/', adminLimiter);
};

module.exports = {
    setupSecurity,
    corsOptions,
    apiLimiter,
    authLimiter,
    paymentLimiter,
    adminLimiter,
    csrfProtection,
    sanitizeInput,
    validateInput,
    fileUploadSecurity,
    ipSecurityCheck
};