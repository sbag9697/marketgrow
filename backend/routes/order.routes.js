const express = require('express');
const { body } = require('express-validator');
const {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderProgress,
    cancelOrder,
    requestRefund,
    getOrderStatistics
} = require('../controllers/order.controller');
const { updateOrderStatus } = require('../controllers/order.status.controller');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Order validation
const createOrderValidation = [
    body('serviceId')
        .isMongoId()
        .withMessage('유효한 서비스 ID를 입력해주세요.'),
    body('quantity')
        .isInt({ min: 1 })
        .withMessage('수량은 1 이상의 정수여야 합니다.'),
    body('targetUrl')
        .isURL()
        .withMessage('유효한 URL을 입력해주세요.'),
    body('targetUsername')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('대상 사용자명은 1-100자 사이여야 합니다.')
];

const updateProgressValidation = [
    body('progress')
        .isInt({ min: 0 })
        .withMessage('진행률은 0 이상의 정수여야 합니다.'),
    body('notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('메모는 1000자 이하여야 합니다.')
];

const cancelOrderValidation = [
    body('reason')
        .isLength({ min: 1, max: 500 })
        .withMessage('취소 사유는 1-500자 사이여야 합니다.')
];

const refundRequestValidation = [
    body('reason')
        .isLength({ min: 1, max: 500 })
        .withMessage('환불 사유는 1-500자 사이여야 합니다.')
];

// Protected routes
router.use(auth);

// User routes
router.post('/', createOrderValidation, createOrder);
router.get('/', getUserOrders);
router.get('/statistics', getOrderStatistics);
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrderValidation, cancelOrder);
router.post('/:id/refund', refundRequestValidation, requestRefund);

// Admin routes
router.put('/:id/progress', adminAuth, updateProgressValidation, updateOrderProgress);
router.put('/:id/status', auth, updateOrderStatus);

module.exports = router;
