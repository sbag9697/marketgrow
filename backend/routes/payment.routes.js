const express = require('express');
const { body } = require('express-validator');
const {
    initializePayment,
    completePayment,
    getPaymentById,
    getUserPayments,
    requestRefund,
    getPaymentStatistics
} = require('../controllers/payment.controller');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Payment validation
const initializePaymentValidation = [
    body('orderId')
        .isMongoId()
        .withMessage('유효한 주문 ID를 입력해주세요.'),
    body('method')
        .isIn(['card', 'bank', 'kakao', 'paypal', 'toss', 'naver', 'samsung', 'point'])
        .withMessage('유효한 결제 방법을 선택해주세요.'),
    body('provider')
        .optional()
        .isIn(['iamport', 'stripe', 'toss', 'kakao', 'paypal'])
        .withMessage('유효한 결제 제공업체를 선택해주세요.')
];

const completePaymentValidation = [
    body('paymentId')
        .notEmpty()
        .withMessage('결제 ID는 필수입니다.'),
    body('status')
        .isIn(['completed', 'failed', 'cancelled'])
        .withMessage('유효한 결제 상태를 입력해주세요.'),
    body('providerTransactionId')
        .optional()
        .isString()
        .withMessage('제공업체 트랜잭션 ID는 문자열이어야 합니다.')
];

const refundRequestValidation = [
    body('amount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('환불 금액은 0 이상이어야 합니다.'),
    body('reason')
        .isLength({ min: 1, max: 500 })
        .withMessage('환불 사유는 1-500자 사이여야 합니다.')
];

// Public webhook route (for payment provider callbacks)
router.post('/webhook', completePaymentValidation, completePayment);

// Protected routes
router.use(auth);

// User routes
router.post('/initialize', initializePaymentValidation, initializePayment);
router.get('/', getUserPayments);
router.get('/statistics', getPaymentStatistics);
router.get('/:id', getPaymentById);

// Admin routes
router.post('/:id/refund', adminAuth, refundRequestValidation, requestRefund);

module.exports = router;
