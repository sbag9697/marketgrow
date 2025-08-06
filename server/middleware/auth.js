const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// JWT 토큰 인증 미들웨어
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: '인증 토큰이 필요합니다',
                error: 'TOKEN_REQUIRED'
            });
        }

        // 토큰 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 사용자 조회
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 토큰입니다',
                error: 'INVALID_TOKEN'
            });
        }

        // 계정 상태 확인
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: '비활성화된 계정입니다',
                error: 'ACCOUNT_INACTIVE'
            });
        }

        // 마지막 활동 시간 업데이트
        user.lastActivity = new Date();
        await user.save();

        // 요청 객체에 사용자 정보 추가
        req.user = user;
        req.token = token;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 토큰입니다',
                error: 'INVALID_TOKEN'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '토큰이 만료되었습니다',
                error: 'TOKEN_EXPIRED'
            });
        }

        logger.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: '인증 처리 중 오류가 발생했습니다',
            error: 'AUTH_ERROR'
        });
    }
};

// 관리자 권한 확인 미들웨어
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: '인증이 필요합니다',
            error: 'AUTHENTICATION_REQUIRED'
        });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({
            success: false,
            message: '관리자 권한이 필요합니다',
            error: 'ADMIN_ACCESS_REQUIRED'
        });
    }

    next();
};

// 특정 역할 권한 확인 미들웨어
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '인증이 필요합니다',
                error: 'AUTHENTICATION_REQUIRED'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '접근 권한이 없습니다',
                error: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    };
};

// 본인 또는 관리자만 접근 가능한 리소스
const requireOwnershipOrAdmin = (userIdParam = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '인증이 필요합니다',
                error: 'AUTHENTICATION_REQUIRED'
            });
        }

        const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
        const isOwner = req.user._id.toString() === resourceUserId;
        const isAdmin = ['admin', 'manager'].includes(req.user.role);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: '접근 권한이 없습니다',
                error: 'ACCESS_DENIED'
            });
        }

        next();
    };
};

// 선택적 인증 미들웨어 (토큰이 있으면 인증, 없어도 통과)
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return next(); // 토큰이 없으면 그냥 통과
        }

        // 토큰이 있으면 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (user && user.status === 'active') {
            req.user = user;
            req.token = token;
            
            // 마지막 활동 시간 업데이트
            user.lastActivity = new Date();
            await user.save();
        }

        next();
    } catch (error) {
        // 토큰이 유효하지 않아도 통과 (선택적 인증)
        next();
    }
};

// API 키 인증 미들웨어 (외부 API 호출용)
const apiKeyAuth = async (req, res, next) => {
    try {
        const apiKey = req.header('X-API-Key');

        if (!apiKey) {
            return res.status(401).json({
                success: false,
                message: 'API 키가 필요합니다',
                error: 'API_KEY_REQUIRED'
            });
        }

        // API 키로 사용자 조회
        const user = await User.findOne({ apiKey }).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 API 키입니다',
                error: 'INVALID_API_KEY'
            });
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: '비활성화된 계정입니다',
                error: 'ACCOUNT_INACTIVE'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        logger.error('API key authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'API 키 인증 중 오류가 발생했습니다',
            error: 'API_AUTH_ERROR'
        });
    }
};

// 사용자 상태 확인 미들웨어
const checkUserStatus = (allowedStatuses = ['active']) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '인증이 필요합니다',
                error: 'AUTHENTICATION_REQUIRED'
            });
        }

        if (!allowedStatuses.includes(req.user.status)) {
            let message = '계정 상태로 인해 접근할 수 없습니다';
            
            switch (req.user.status) {
                case 'inactive':
                    message = '비활성화된 계정입니다';
                    break;
                case 'suspended':
                    message = '정지된 계정입니다';
                    break;
                case 'pending':
                    message = '승인 대기 중인 계정입니다';
                    break;
            }

            return res.status(403).json({
                success: false,
                message,
                error: 'INVALID_ACCOUNT_STATUS'
            });
        }

        next();
    };
};

// 멤버십 레벨 확인 미들웨어
const requireMembershipLevel = (minLevel) => {
    const levelHierarchy = {
        'Bronze': 1,
        'Silver': 2,
        'Gold': 3,
        'Platinum': 4,
        'Diamond': 5
    };

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '인증이 필요합니다',
                error: 'AUTHENTICATION_REQUIRED'
            });
        }

        const userLevel = levelHierarchy[req.user.membershipLevel] || 0;
        const requiredLevel = levelHierarchy[minLevel] || 0;

        if (userLevel < requiredLevel) {
            return res.status(403).json({
                success: false,
                message: `${minLevel} 등급 이상의 멤버십이 필요합니다`,
                error: 'INSUFFICIENT_MEMBERSHIP_LEVEL',
                data: {
                    current: req.user.membershipLevel,
                    required: minLevel
                }
            });
        }

        next();
    };
};

// 리소스 소유권 확인 미들웨어 (동적)
const checkResourceOwnership = (Model, resourceIdParam = 'id', userField = 'userId') => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: '인증이 필요합니다',
                    error: 'AUTHENTICATION_REQUIRED'
                });
            }

            const resourceId = req.params[resourceIdParam];
            const resource = await Model.findById(resourceId);

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: '리소스를 찾을 수 없습니다',
                    error: 'RESOURCE_NOT_FOUND'
                });
            }

            const isOwner = resource[userField].toString() === req.user._id.toString();
            const isAdmin = ['admin', 'manager'].includes(req.user.role);

            if (!isOwner && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: '접근 권한이 없습니다',
                    error: 'ACCESS_DENIED'
                });
            }

            req.resource = resource;
            next();
        } catch (error) {
            logger.error('Resource ownership check error:', error);
            res.status(500).json({
                success: false,
                message: '권한 확인 중 오류가 발생했습니다',
                error: 'OWNERSHIP_CHECK_ERROR'
            });
        }
    };
};

module.exports = {
    auth,
    requireAdmin,
    requireRole,
    requireOwnershipOrAdmin,
    optionalAuth,
    apiKeyAuth,
    checkUserStatus,
    requireMembershipLevel,
    checkResourceOwnership
};