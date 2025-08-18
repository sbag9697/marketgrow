const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import database connection
const { connectDB } = require('./utils/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const oauthRoutes = require('./routes/oauth.routes');
const userRoutes = require('./routes/user.routes');
const serviceRoutes = require('./routes/service.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const keywordRoutes = require('./routes/keyword.routes');
const adminRoutes = require('./routes/admin.routes');
const consultationRoutes = require('./routes/consultation.routes');
const emailRoutes = require('./routes/email.routes');
const webhookRoutes = require('./routes/webhook.routes');
const depositRoutes = require('./routes/deposit.routes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import services
const OrderSyncService = require('./services/orderSync.service');

const app = express();

// Trust proxy for Render deployment (1 hop only for security)
app.set('trust proxy', 1);

// Initialize database connection and seed data
let dbReady = false;
const initializeApp = async () => {
    try {
        dbReady = await connectDB();
    } catch (err) {
        logger.error('Database initialization error:', err);
        dbReady = false;
    }
    
    if (dbReady) {
        // Auto-seed database on server start
        try {
            const { createAdminUser, createSampleServices } = require('./utils/seed');
            await createAdminUser();
            await createSampleServices();
            logger.info('Database initialized with seed data');
        } catch (error) {
            logger.info('Seed data already exists or failed to create:', error.message);
        }
    } else {
        logger.warn('Server running without database connection');
    }
    
    // Store DB status for route guards
    app.locals.dbReady = dbReady;
};

initializeApp();

// Security middleware - CSP 비활성화
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// CORS configuration - 프로덕션 도메인 허용
const ALLOWED_ORIGINS = [
    'https://marketgrow.kr',
    'https://www.marketgrow.kr',
    'https://marketgrow-snsmarketing.netlify.app',
    'https://marketgrow.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5500'
];

app.use(cors({
    origin: function(origin, callback) {
        // origin이 없는 요청 (Postman, 서버 직접 호출 등) 허용
        if (!origin) return callback(null, true);
        
        // 허용된 origin 확인
        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        
        // 개발 환경에서는 모든 origin 허용
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        
        console.warn(`CORS blocked for origin: ${origin}`);
        return callback(new Error(`CORS policy: ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
    maxAge: 86400 // 24 hours
}));

// OPTIONS 프리플라이트 요청 빠른 응답
app.options('*', cors());

// Rate limiting 설정 (보안 강화)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 15분당 최대 1000 요청
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: false, // 라이브러리 내부 trust proxy 비활성화
    keyGenerator: (req) => {
        // Express의 trust proxy 설정을 통해 얻은 IP 사용
        return req.ip || req.connection.remoteAddress || 'unknown';
    },
    // Render 배포 환경을 위한 설정
    skip: (req) => {
        // health check는 rate limit 제외
        return req.path === '/api/health';
    }
});

// 프로덕션 환경에서만 rate limit 적용
if (process.env.NODE_ENV === 'production') {
    app.use('/api/', limiter);
} else {
    console.log('Development mode - Rate limiting disabled');
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve frontend static files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// API routes
console.log('Registering API routes...');
app.use('/api/auth', authRoutes);
console.log('Auth routes registered');
app.use('/api/oauth', oauthRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/keywords', keywordRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api', require('./routes/dashboard.routes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// Debug endpoint to list all routes
app.get('/api/debug/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    const path = middleware.regexp.source.replace(/\\/g, '').replace(/\^/g, '').replace(/\$/g, '').replace(/\(\?\:/g, '').replace(/\)/g, '');
                    routes.push({
                        path: path + handler.route.path,
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    res.json({ routes });
});

// API 404를 JSON으로 반환
app.use('/api/*', (req, res) => {
    console.log(`API 404: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: '요청하신 API 엔드포인트를 찾을 수 없습니다.',
        path: req.originalUrl,
        method: req.method
    });
});

// 기타 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '요청하신 리소스를 찾을 수 없습니다.'
    });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`);
    console.log(`🚀 Server is running on port ${PORT}`);

    // SMM 패널 주문 동기화 (DB 연결 필수)
    const ENABLE_ORDER_SYNC = process.env.SMM_ENABLED === 'true' && 
                               dbReady &&
                               (process.env.NODE_ENV !== 'production' || process.env.FORCE_SYNC === 'true');
    
    if (ENABLE_ORDER_SYNC && process.env.SMM_API_KEY) {
        const orderSync = new OrderSyncService();
        orderSync.startAutoSync();
        console.log('📦 SMM order sync service started');
    } else {
        console.log('📦 SMM order sync service disabled (no DB, production mode, or SMM_ENABLED=false)');
    }

    // 예치금 자동 확인 스케줄러 시작
    if (dbReady && process.env.OPENBANKING_CLIENT_ID) {
        const { getInstance } = require('./services/depositScheduler');
        const depositScheduler = getInstance();
        depositScheduler.start();
        console.log('💰 Deposit auto-check scheduler started');
    } else if (dbReady) {
        console.log('💰 Deposit auto-check disabled (OpenBanking not configured)');
    }
});
