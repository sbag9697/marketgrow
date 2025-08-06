const express = require('express');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { auth, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Get user payments
router.get('/', auth, asyncHandler(async (req, res) => {
    const {
        status,
        paymentMethod,
        dateFrom,
        dateTo,
        sort = '-createdAt',
        page = 1,
        limit = 20
    } = req.query;

    // Build query
    const query = { userId: req.user._id };
    
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    
    if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Execute query
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const payments = await Payment.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('orderId', 'orderNumber serviceName targetUrl quantity')
        .select('-gatewayResponse -__v');

    const total = await Payment.countDocuments(query);

    res.json({
        success: true,
        data: {
            payments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }
    });
}));

// Get payment by ID
router.get('/:id', auth, asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id)
        .populate('orderId', 'orderNumber serviceName targetUrl quantity')
        .populate('userId', 'name email');

    if (!payment) {
        return res.status(404).json({
            success: false,
            message: '결제 정보를 찾을 수 없습니다',
            error: 'PAYMENT_NOT_FOUND'
        });
    }

    // Check ownership (user can only see their own payments, admin can see all)
    if (payment.userId._id.toString() !== req.user._id.toString() && 
        !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: '접근 권한이 없습니다',
            error: 'ACCESS_DENIED'
        });
    }

    res.json({
        success: true,
        data: { payment }
    });
}));

// Create payment
router.post('/', auth, [
    body('orderId').isMongoId().withMessage('올바른 주문 ID를 입력해주세요'),
    body('amount').isNumeric().withMessage('결제 금액을 입력해주세요'),
    body('paymentMethod').isIn([
        'card', 'bank', 'paypal', 'kakaopay', 'naverpay', 
        'tosspay', 'payco', 'samsungpay', 'applepay', 'googlepay'
    ]).withMessage('올바른 결제 방법을 선택해주세요'),
    body('gatewayProvider').isIn([
        'toss', 'inicis', 'kcp', 'nice', 'paypal', 'stripe'
    ]).withMessage('올바른 결제 게이트웨이를 선택해주세요')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: '입력 정보를 확인해주세요',
            errors: errors.array()
        });
    }

    const { orderId, amount, paymentMethod, gatewayProvider } = req.body;

    // Verify order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({
            success: false,
            message: '주문을 찾을 수 없습니다',
            error: 'ORDER_NOT_FOUND'
        });
    }

    if (order.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: '접근 권한이 없습니다',
            error: 'ACCESS_DENIED'
        });
    }

    // Check if order already has a completed payment
    const existingPayment = await Payment.findOne({
        orderId,
        status: 'completed'
    });

    if (existingPayment) {
        return res.status(400).json({
            success: false,
            message: '이미 결제가 완료된 주문입니다',
            error: 'PAYMENT_ALREADY_EXISTS'
        });
    }

    // Create payment
    const paymentData = {
        orderId,
        userId: req.user._id,
        amount,
        paymentMethod,
        gatewayProvider,
        customerInfo: {
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone
        },
        orderInfo: {
            orderNumber: order.orderNumber,
            serviceName: order.serviceName,
            quantity: order.quantity,
            targetUrl: order.targetUrl,
            description: order.serviceDescription
        },
        metadata: {
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip
        }
    };

    const payment = new Payment(paymentData);
    await payment.save();

    logger.logPayment('CREATE', payment.paymentId, req.user._id, amount, true, {
        orderId: order.orderNumber,
        paymentMethod,
        gatewayProvider
    });

    res.status(201).json({
        success: true,
        message: '결제가 생성되었습니다',
        data: { payment }
    });
}));

// Process payment (webhook or manual)
router.post('/:id/process', auth, asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
        return res.status(404).json({
            success: false,
            message: '결제 정보를 찾을 수 없습니다',
            error: 'PAYMENT_NOT_FOUND'
        });
    }

    // Check ownership or admin
    if (payment.userId.toString() !== req.user._id.toString() && 
        !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: '접근 권한이 없습니다',
            error: 'ACCESS_DENIED'
        });
    }

    if (payment.status === 'completed') {
        return res.status(400).json({
            success: false,
            message: '이미 처리된 결제입니다',
            error: 'PAYMENT_ALREADY_PROCESSED'
        });
    }

    // Mock gateway response for development
    const mockGatewayResponse = {
        transactionId: `TXN_${Date.now()}`,
        status: 'completed',
        card: payment.paymentMethod === 'card' ? {
            company: '신한카드',
            number: '**** **** **** 1234',
            cardType: 'credit',
            ownerType: 'personal',
            installmentPlanMonths: 0,
            approveNo: `${Math.random().toString().substr(2, 8)}`
        } : null,
        receipt: {
            url: `https://example.com/receipt/${payment.paymentId}`,
            number: `RCP_${Date.now()}`
        }
    };

    // Process payment
    await payment.processPayment(mockGatewayResponse);

    // Update order status
    const order = await Order.findById(payment.orderId);
    if (order) {
        order.paymentStatus = 'paid';
        order.paymentId = payment._id;
        order.status = 'confirmed';
        await order.save();
    }

    logger.logPayment('PROCESS', payment.paymentId, payment.userId, payment.amount, true, {
        transactionId: mockGatewayResponse.transactionId
    });

    res.json({
        success: true,
        message: '결제가 처리되었습니다',
        data: { payment }
    });
}));

// Cancel payment
router.post('/:id/cancel', auth, asyncHandler(async (req, res) => {
    const { reason = '' } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
        return res.status(404).json({
            success: false,
            message: '결제 정보를 찾을 수 없습니다',
            error: 'PAYMENT_NOT_FOUND'
        });
    }

    // Check ownership
    if (payment.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: '접근 권한이 없습니다',
            error: 'ACCESS_DENIED'
        });
    }

    if (payment.status === 'completed') {
        return res.status(400).json({
            success: false,
            message: '완료된 결제는 취소할 수 없습니다',
            error: 'CANNOT_CANCEL_COMPLETED_PAYMENT'
        });
    }

    await payment.cancelPayment(reason);

    logger.logPayment('CANCEL', payment.paymentId, payment.userId, payment.amount, true, {
        reason
    });

    res.json({
        success: true,
        message: '결제가 취소되었습니다',
        data: { payment }
    });
}));

// Request refund
router.post('/:id/refund', auth, [
    body('amount').optional().isNumeric().withMessage('환불 금액을 입력해주세요'),
    body('reason').notEmpty().withMessage('환불 사유를 입력해주세요')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: '입력 정보를 확인해주세요',
            errors: errors.array()
        });
    }

    const { amount, reason } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
        return res.status(404).json({
            success: false,
            message: '결제 정보를 찾을 수 없습니다',
            error: 'PAYMENT_NOT_FOUND'
        });
    }

    // Check ownership
    if (payment.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: '접근 권한이 없습니다',
            error: 'ACCESS_DENIED'
        });
    }

    if (payment.status !== 'completed') {
        return res.status(400).json({
            success: false,
            message: '완료된 결제만 환불 요청할 수 있습니다',
            error: 'INVALID_PAYMENT_STATUS'
        });
    }

    const refundAmount = amount || payment.refundableAmount;

    if (refundAmount <= 0) {
        return res.status(400).json({
            success: false,
            message: '환불 가능한 금액이 없습니다',
            error: 'NO_REFUNDABLE_AMOUNT'
        });
    }

    await payment.requestRefund(refundAmount, reason);

    logger.logPayment('REFUND_REQUEST', payment.paymentId, payment.userId, refundAmount, true, {
        reason
    });

    res.json({
        success: true,
        message: '환불이 요청되었습니다',
        data: { payment }
    });
}));

// Get payment statistics (admin only)
router.get('/admin/stats', auth, requireAdmin, asyncHandler(async (req, res) => {
    const { dateFrom, dateTo } = req.query;
    
    let dateRange = {};
    if (dateFrom && dateTo) {
        dateRange = {
            start: new Date(dateFrom),
            end: new Date(dateTo)
        };
    }

    const [stats, methodStats, dailyRevenue] = await Promise.all([
        Payment.getPaymentStats(dateRange),
        Payment.getMethodStats(),
        Payment.getDailyRevenue(30)
    ]);

    res.json({
        success: true,
        data: {
            overview: stats,
            methods: methodStats,
            daily: dailyRevenue
        }
    });
}));

// Get all payments (admin only)
router.get('/admin/all', auth, requireAdmin, asyncHandler(async (req, res) => {
    const {
        status,
        paymentMethod,
        gatewayProvider,
        userId,
        sort = '-createdAt',
        page = 1,
        limit = 50
    } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (gatewayProvider) query.gatewayProvider = gatewayProvider;
    if (userId) query.userId = userId;

    // Execute query
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const payments = await Payment.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name email')
        .populate('orderId', 'orderNumber serviceName')
        .select('-gatewayResponse -__v');

    const total = await Payment.countDocuments(query);

    res.json({
        success: true,
        data: {
            payments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }
    });
}));

// Process refund (admin only)
router.post('/:id/admin/refund', auth, requireAdmin, asyncHandler(async (req, res) => {
    const { amount, refundId = `REF_${Date.now()}` } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
        return res.status(404).json({
            success: false,
            message: '결제 정보를 찾을 수 없습니다',
            error: 'PAYMENT_NOT_FOUND'
        });
    }

    if (payment.refund.status !== 'requested') {
        return res.status(400).json({
            success: false,
            message: '환불 요청이 없습니다',
            error: 'NO_REFUND_REQUEST'
        });
    }

    const refundAmount = amount || payment.refund.history[payment.refund.history.length - 1].amount;

    await payment.processRefund(refundAmount, refundId);

    logger.logPayment('REFUND_PROCESS', payment.paymentId, payment.userId, refundAmount, true, {
        processedBy: req.user.email,
        refundId
    });

    res.json({
        success: true,
        message: '환불이 처리되었습니다',
        data: { payment }
    });
}));

module.exports = router;