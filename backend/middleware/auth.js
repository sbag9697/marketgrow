const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '접근 권한이 없습니다. 로그인이 필요합니다.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 토큰입니다.'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: '비활성화된 계정입니다.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 토큰입니다.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '토큰이 만료되었습니다. 다시 로그인해주세요.'
            });
        }

        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// Check if user is admin
const adminAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: '접근 권한이 없습니다.'
        });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({
            success: false,
            message: '관리자 권한이 필요합니다.'
        });
    }

    next();
};

// Check if user is manager or admin
const managerAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: '접근 권한이 없습니다.'
        });
    }

    if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: '매니저 권한이 필요합니다.'
        });
    }

    next();
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            
            if (user && user.isActive) {
                req.user = user;
            }
        }
        
        next();
    } catch (error) {
        // Continue without user if token is invalid
        next();
    }
};

module.exports = {
    auth,
    adminAuth,
    managerAuth,
    optionalAuth
};