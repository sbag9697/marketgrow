const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// Initialize payment
const initializePayment = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '입력 데이터를 확인해주세요.',
                errors: errors.array()
            });
        }

        const { orderId, method, provider = 'iamport' } = req.body;

        // Get order details
        const order = await Order.findById(orderId).populate('service user');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: '주문을 찾을 수 없습니다.'
            });
        }

        // Check if user owns this order
        if (order.user._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '이 주문에 대한 접근 권한이 없습니다.'
            });
        }

        // Check if order can be paid
        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: '결제할 수 없는 주문 상태입니다.'
            });
        }

        if (order.paymentStatus === 'completed') {
            return res.status(400).json({
                success: false,
                message: '이미 결제가 완료된 주문입니다.'
            });
        }

        // Create payment record
        const payment = new Payment({
            user: req.user.id,
            order: orderId,
            amount: order.finalAmount,
            method,
            provider,
            status: 'pending',
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip
        });

        await payment.save();

        // Update order with payment reference
        order.payment = payment._id;
        order.paymentStatus = 'pending';
        await order.save();

        // Generate payment data for frontend
        const paymentData = {
            paymentId: payment.paymentId,
            amount: payment.amount,
            currency: payment.currency,
            orderNumber: order.orderNumber,
            orderName: `${order.service.name} ${order.quantity.toLocaleString()}개`,
            customerName: order.user.name,
            customerEmail: order.user.email,
            customerPhone: order.user.phone,
            method,
            provider,
            successUrl: `${process.env.FRONTEND_URL}/payment/success`,
            failUrl: `${process.env.FRONTEND_URL}/payment/fail`,
            cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`
        };

        logger.info(`Payment initialized: ${payment.paymentId} for order ${order.orderNumber}`);

        res.status(201).json({
            success: true,
            message: '결제가 초기화되었습니다.',
            data: { payment: paymentData }
        });
    } catch (error) {
        logger.error('Initialize payment error:', error);
        res.status(500).json({
            success: false,
            message: '결제 초기화 중 오류가 발생했습니다.'
        });
    }
};

// Complete payment (webhook)
const completePayment = async (req, res) => {
    try {
        const { paymentId, status, providerTransactionId, providerData } = req.body;

        const payment = await Payment.findOne({ paymentId }).populate('order user');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: '결제 정보를 찾을 수 없습니다.'
            });
        }

        if (payment.status === 'completed') {
            return res.json({
                success: true,
                message: '이미 처리된 결제입니다.'
            });
        }

        const order = payment.order;

        if (status === 'completed') {
            // Complete payment
            await payment.complete({
                transactionId: providerTransactionId,
                ...providerData
            });

            // Update order status
            order.paymentStatus = 'completed';
            if (order.status === 'pending') {
                order.status = 'processing';
                order.startedAt = new Date();
            }
            await order.save();

            // Update user statistics
            const user = await User.findById(payment.user._id);
            user.totalSpent += payment.amount;
            user.updateMembershipLevel();
            await user.save();

            // Update service statistics
            const Service = require('../models/Service');
            const service = await Service.findById(order.service);
            if (service) {
                await service.updateStats(order);
            }

            logger.info(`Payment completed: ${payment.paymentId} - Amount: ${payment.amount}`);

            res.json({
                success: true,
                message: '결제가 완료되었습니다.',
                data: { payment, order }
            });
        } else if (status === 'failed') {
            // Fail payment
            await payment.fail(providerData?.failureReason, providerData?.failureCode);

            // Update order status
            order.paymentStatus = 'failed';
            await order.save();

            logger.info(`Payment failed: ${payment.paymentId} - Reason: ${providerData?.failureReason}`);

            res.json({
                success: false,
                message: '결제가 실패했습니다.',
                data: { payment, order }
            });
        } else if (status === 'cancelled') {
            // Cancel payment
            await payment.cancel('사용자가 취소함');

            // Update order status
            order.paymentStatus = 'failed';
            await order.save();

            logger.info(`Payment cancelled: ${payment.paymentId}`);

            res.json({
                success: true,
                message: '결제가 취소되었습니다.',
                data: { payment, order }
            });
        }
    } catch (error) {
        logger.error('Complete payment error:', error);
        res.status(500).json({
            success: false,
            message: '결제 처리 중 오류가 발생했습니다.'
        });
    }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('order', 'orderNumber status totalAmount')
            .populate('user', 'name email');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: '결제 정보를 찾을 수 없습니다.'
            });
        }

        // Check if user owns this payment or is admin
        if (payment.user._id.toString() !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '이 결제에 대한 접근 권한이 없습니다.'
            });
        }

        res.json({
            success: true,
            data: { payment }
        });
    } catch (error) {
        logger.error('Get payment by ID error:', error);
        res.status(500).json({
            success: false,
            message: '결제 조회 중 오류가 발생했습니다.'
        });
    }
};

// Get user payments
const getUserPayments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, method } = req.query;

        const query = { user: req.user.id };

        if (status && status !== 'all') {
            query.status = status;
        }

        if (method && method !== 'all') {
            query.method = method;
        }

        const payments = await Payment.find(query)
            .populate('order', 'orderNumber status service')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Payment.countDocuments(query);

        res.json({
            success: true,
            data: {
                payments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        logger.error('Get user payments error:', error);
        res.status(500).json({
            success: false,
            message: '결제 내역 조회 중 오류가 발생했습니다.'
        });
    }
};

// Request refund
const requestRefund = async (req, res) => {
    try {
        const { amount, reason } = req.body;
        const { id } = req.params;

        const payment = await Payment.findById(id).populate('order user');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: '결제 정보를 찾을 수 없습니다.'
            });
        }

        // Check if user owns this payment or is admin
        if (payment.user._id.toString() !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '이 결제에 대한 접근 권한이 없습니다.'
            });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: '완료된 결제만 환불 가능합니다.'
            });
        }

        const refundAmount = amount || payment.amount;

        if (refundAmount > payment.refundableAmount) {
            return res.status(400).json({
                success: false,
                message: '환불 가능 금액을 초과했습니다.'
            });
        }

        // Add refund request
        await payment.addRefund(refundAmount, reason);

        // Update order status
        const order = payment.order;
        if (refundAmount >= payment.amount) {
            await order.refund(refundAmount);
        }

        // TODO: Process actual refund with payment provider

        logger.info(`Refund requested: ${payment.paymentId} - Amount: ${refundAmount}`);

        res.json({
            success: true,
            message: '환불 요청이 처리되었습니다.',
            data: { payment }
        });
    } catch (error) {
        logger.error('Request refund error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '환불 요청 중 오류가 발생했습니다.'
        });
    }
};

// Get payment statistics
const getPaymentStatistics = async (req, res) => {
    try {
        const query = req.user.role === 'user' ? { user: req.user.id } : {};

        const [
            totalPayments,
            completedPayments,
            failedPayments,
            totalAmount,
            totalRefunded
        ] = await Promise.all([
            Payment.countDocuments(query),
            Payment.countDocuments({ ...query, status: 'completed' }),
            Payment.countDocuments({ ...query, status: 'failed' }),
            Payment.aggregate([
                { $match: { ...query, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Payment.aggregate([
                { $match: { ...query, status: { $in: ['refunded', 'partial_refunded'] } } },
                { $group: { _id: null, total: { $sum: '$totalRefunded' } } }
            ])
        ]);

        // Get payment methods statistics
        const methodStats = await Payment.aggregate([
            { $match: { ...query, status: 'completed' } },
            {
                $group: {
                    _id: '$method',
                    count: { $sum: 1 },
                    amount: { $sum: '$amount' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                totalPayments,
                completedPayments,
                failedPayments,
                totalAmount: totalAmount[0]?.total || 0,
                totalRefunded: totalRefunded[0]?.total || 0,
                successRate: totalPayments > 0 ? (completedPayments / totalPayments * 100).toFixed(2) : 0,
                methodStats
            }
        });
    } catch (error) {
        logger.error('Get payment statistics error:', error);
        res.status(500).json({
            success: false,
            message: '결제 통계 조회 중 오류가 발생했습니다.'
        });
    }
};

module.exports = {
    initializePayment,
    completePayment,
    getPaymentById,
    getUserPayments,
    requestRefund,
    getPaymentStatistics
};
