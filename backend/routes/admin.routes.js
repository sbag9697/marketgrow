const express = require('express');
const { body } = require('express-validator');
const {
    getDashboardStats,
    getUsers,
    updateUser,
    getAllOrders,
    getAllPayments,
    getServicesForAdmin,
    upsertService,
    deleteService,
    getSystemLogs
} = require('../controllers/admin.controller');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth, adminAuth);

// Dashboard
router.get('/dashboard', getDashboardStats);

// User management
router.get('/users', getUsers);
router.put('/users/:id', [
    body('name')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('이름은 2-50자 사이여야 합니다.'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('유효한 이메일 주소를 입력해주세요.'),
    body('phone')
        .optional()
        .matches(/^[0-9]{10,11}$/)
        .withMessage('유효한 전화번호를 입력해주세요.'),
    body('role')
        .optional()
        .isIn(['user', 'admin', 'manager'])
        .withMessage('유효한 역할을 선택해주세요.'),
    body('membershipLevel')
        .optional()
        .isIn(['bronze', 'silver', 'gold', 'platinum', 'diamond'])
        .withMessage('유효한 멤버십 레벨을 선택해주세요.'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('활성 상태는 true 또는 false여야 합니다.')
], updateUser);

// Order management
router.get('/orders', getAllOrders);

// Payment management
router.get('/payments', getAllPayments);

// Service management
router.get('/services', getServicesForAdmin);
router.post('/services', [
    body('name')
        .isLength({ min: 1, max: 100 })
        .withMessage('서비스명은 1-100자 사이여야 합니다.'),
    body('nameEn')
        .isLength({ min: 1, max: 100 })
        .withMessage('영문 서비스명은 1-100자 사이여야 합니다.'),
    body('platform')
        .isIn(['instagram', 'youtube', 'facebook', 'tiktok', 'twitter', 'telegram', 'threads', 'website', 'twitch', 'discord', 'spotify', 'whatsapp', 'pinterest', 'reddit', 'snapchat', 'kakaotalk', 'naver'])
        .withMessage('유효한 플랫폼을 선택해주세요.'),
    body('category')
        .isIn(['followers', 'likes', 'views', 'comments', 'shares', 'saves', 'subscribers', 'watchtime', 'live', 'keyword', 'auto', 'other'])
        .withMessage('유효한 카테고리를 선택해주세요.'),
    body('description')
        .isLength({ min: 10, max: 1000 })
        .withMessage('서비스 설명은 10-1000자 사이여야 합니다.'),
    body('pricing')
        .isArray({ min: 1 })
        .withMessage('최소 1개 이상의 가격 정보가 필요합니다.'),
    body('pricing.*.quantity')
        .isInt({ min: 1 })
        .withMessage('수량은 1 이상의 정수여야 합니다.'),
    body('pricing.*.price')
        .isFloat({ min: 0 })
        .withMessage('가격은 0 이상이어야 합니다.'),
    body('minQuantity')
        .isInt({ min: 1 })
        .withMessage('최소 수량은 1 이상이어야 합니다.'),
    body('maxQuantity')
        .isInt({ min: 1 })
        .withMessage('최대 수량은 1 이상이어야 합니다.'),
    body('deliveryTime.min')
        .isInt({ min: 1 })
        .withMessage('최소 배송 시간은 1 이상이어야 합니다.'),
    body('deliveryTime.max')
        .isInt({ min: 1 })
        .withMessage('최대 배송 시간은 1 이상이어야 합니다.'),
    body('deliveryTime.unit')
        .isIn(['minutes', 'hours', 'days'])
        .withMessage('유효한 시간 단위를 선택해주세요.')
], upsertService);

router.put('/services/:id', [
    body('name')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('서비스명은 1-100자 사이여야 합니다.'),
    body('description')
        .optional()
        .isLength({ min: 10, max: 1000 })
        .withMessage('서비스 설명은 10-1000자 사이여야 합니다.'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('활성 상태는 true 또는 false여야 합니다.'),
    body('isPopular')
        .optional()
        .isBoolean()
        .withMessage('인기 서비스 여부는 true 또는 false여야 합니다.'),
    body('isPremium')
        .optional()
        .isBoolean()
        .withMessage('프리미엄 서비스 여부는 true 또는 false여야 합니다.')
], upsertService);

router.delete('/services/:id', deleteService);

// System logs
router.get('/logs', getSystemLogs);

module.exports = router;
