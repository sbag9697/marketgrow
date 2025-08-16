// DB 연결 필수 미들웨어
const requireDB = (req, res, next) => {
    if (!req.app.locals.dbReady) {
        return res.status(503).json({
            success: false,
            message: 'Database service temporarily unavailable',
            error: 'DB_NOT_READY'
        });
    }
    next();
};

// DB 연결 선택적 미들웨어 (경고만)
const checkDB = (req, res, next) => {
    if (!req.app.locals.dbReady) {
        console.warn(`DB not ready for request: ${req.method} ${req.path}`);
    }
    next();
};

module.exports = {
    requireDB,
    checkDB
};