const Order = require('../models/Order');
const Service = require('../models/Service');
const Payment = require('../models/Payment');
const User = require('../models/User');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const SMMPanelService = require('../services/smmPanel.service');
const smmPanel = new SMMPanelService();

// Create new order
const createOrder = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '입력 데이터를 확인해주세요.',
                errors: errors.array()
            });
        }

        const { serviceId, quantity, targetUrl, targetUsername } = req.body;

        // Get service details
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: '서비스를 찾을 수 없습니다.'
            });
        }

        if (!service.isActive) {
            return res.status(400).json({
                success: false,
                message: '현재 제공되지 않는 서비스입니다.'
            });
        }

        // Validate quantity
        if (quantity < service.minQuantity || quantity > service.maxQuantity) {
            return res.status(400).json({
                success: false,
                message: `수량은 ${service.minQuantity.toLocaleString()}개 이상 ${service.maxQuantity.toLocaleString()}개 이하여야 합니다.`
            });
        }

        // Calculate pricing
        const user = await User.findById(req.user.id);
        const unitPrice = service.calculatePrice(1, user.membershipLevel);
        const totalAmount = service.calculatePrice(quantity, user.membershipLevel);
        const originalAmount = service.pricing[0].price * (quantity / service.pricing[0].quantity);
        const discountAmount = originalAmount - totalAmount;

        // Create order
        const order = new Order({
            user: req.user.id,
            service: serviceId,
            quantity,
            targetUrl,
            targetUsername,
            unitPrice,
            totalAmount: originalAmount,
            discountAmount,
            finalAmount: totalAmount,
            progress: {
                current: 0,
                total: quantity
            }
        });

        await order.save();

        // Populate service details for response
        await order.populate('service', 'name platform category deliveryTime');

        // SMM 패널로 주문 전송 (API 키가 설정된 경우만)
        if (smmPanel.apiKey && smmPanel.enabled) {
            try {
                const smmResult = await smmPanel.createOrder({
                    service: service.smmServiceId || service.name, // SMM 서비스 ID 사용
                    link: targetUrl,
                    quantity,
                    customData: targetUsername
                });

                // SMM 주문 ID 저장
                order.providerOrderId = smmResult.smmOrderId;
                order.status = 'processing'; // 처리 중으로 상태 변경
                order.providerStatus = 'submitted';
                await order.save();

                logger.info(`SMM order created: ${smmResult.smmOrderId} for order ${order.orderNumber}`);
            } catch (smmError) {
                logger.error('SMM panel order creation failed:', smmError);
                // SMM 실패해도 주문은 유지 (수동 처리 가능)
            }
        }

        logger.info(`Order created: ${order.orderNumber} by user ${req.user.email}`);

        res.status(201).json({
            success: true,
            message: '주문이 생성되었습니다.',
            data: { order }
        });
    } catch (error) {
        logger.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: '주문 생성 중 오류가 발생했습니다.'
        });
    }
};

// Get user orders
const getUserOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;

        const query = { user: req.user.id };

        if (status && status !== 'all') {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { targetUrl: { $regex: search, $options: 'i' } }
            ];
        }

        const orders = await Order.find(query)
            .populate('service', 'name platform category')
            .populate('payment', 'status method amount')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        logger.error('Get user orders error:', error);
        res.status(500).json({
            success: false,
            message: '주문 목록 조회 중 오류가 발생했습니다.'
        });
    }
};

// Get order by ID
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('service', 'name platform category deliveryTime guaranteePeriod')
            .populate('payment', 'status method amount providerTransactionId');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: '주문을 찾을 수 없습니다.'
            });
        }

        // Check if user owns this order or is admin
        if (order.user.toString() !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '이 주문에 대한 접근 권한이 없습니다.'
            });
        }

        res.json({
            success: true,
            data: { order }
        });
    } catch (error) {
        logger.error('Get order by ID error:', error);
        res.status(500).json({
            success: false,
            message: '주문 조회 중 오류가 발생했습니다.'
        });
    }
};

// Update order progress (Admin only)
const updateOrderProgress = async (req, res) => {
    try {
        const { progress, notes } = req.body;
        const { id } = req.params;

        const order = await Order.findById(id).populate('service user');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: '주문을 찾을 수 없습니다.'
            });
        }

        if (order.status === 'cancelled' || order.status === 'refunded') {
            return res.status(400).json({
                success: false,
                message: '취소되거나 환불된 주문은 수정할 수 없습니다.'
            });
        }

        // Update progress
        if (progress !== undefined) {
            await order.updateProgress(progress);
        }

        // Add admin notes
        if (notes) {
            order.adminNotes = notes;
            await order.save();
        }

        logger.info(`Order ${order.orderNumber} progress updated to ${order.progress.current}/${order.progress.total}`);

        res.json({
            success: true,
            message: '주문 상태가 업데이트되었습니다.',
            data: { order }
        });
    } catch (error) {
        logger.error('Update order progress error:', error);
        res.status(500).json({
            success: false,
            message: '주문 상태 업데이트 중 오류가 발생했습니다.'
        });
    }
};

// Cancel order
const cancelOrder = async (req, res) => {
    try {
        const { reason } = req.body;
        const { id } = req.params;

        const order = await Order.findById(id).populate('payment');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: '주문을 찾을 수 없습니다.'
            });
        }

        // Check if user owns this order or is admin
        if (order.user.toString() !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '이 주문에 대한 접근 권한이 없습니다.'
            });
        }

        // Check if order can be cancelled
        if (['completed', 'cancelled', 'refunded'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: '이미 완료되었거나 취소된 주문입니다.'
            });
        }

        // For orders that have started processing, only admins can cancel
        if (order.status === 'processing' && !['admin', 'manager'].includes(req.user.role)) {
            return res.status(400).json({
                success: false,
                message: '진행 중인 주문은 고객센터를 통해 취소해주세요.'
            });
        }

        await order.cancel(reason);

        // If there's a completed payment, initiate refund
        if (order.payment && order.payment.status === 'completed') {
            // TODO: Initiate refund process
            logger.info(`Refund initiated for cancelled order: ${order.orderNumber}`);
        }

        logger.info(`Order cancelled: ${order.orderNumber} - Reason: ${reason}`);

        res.json({
            success: true,
            message: '주문이 취소되었습니다.',
            data: { order }
        });
    } catch (error) {
        logger.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '주문 취소 중 오류가 발생했습니다.'
        });
    }
};

// Request refund
const requestRefund = async (req, res) => {
    try {
        const { reason } = req.body;
        const { id } = req.params;

        const order = await Order.findById(id).populate('payment');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: '주문을 찾을 수 없습니다.'
            });
        }

        // Check if user owns this order
        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '이 주문에 대한 접근 권한이 없습니다.'
            });
        }

        if (order.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: '완료된 주문만 환불 요청이 가능합니다.'
            });
        }

        if (!order.payment || order.payment.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: '결제가 완료되지 않은 주문입니다.'
            });
        }

        // Check refund eligibility (within guarantee period)
        const now = new Date();
        const completedDate = order.completedAt;
        const guaranteePeriod = order.service?.guaranteePeriod || 30; // days
        const guaranteeExpiry = new Date(completedDate.getTime() + (guaranteePeriod * 24 * 60 * 60 * 1000));

        if (now > guaranteeExpiry) {
            return res.status(400).json({
                success: false,
                message: `보장 기간(${guaranteePeriod}일)이 만료되어 환불이 불가능합니다.`
            });
        }

        // Add refund request to order notes
        order.notes = `환불 요청: ${reason}`;
        order.adminNotes = `사용자 환불 요청 - ${new Date().toISOString()}`;
        await order.save();

        // TODO: Send notification to admin about refund request

        logger.info(`Refund requested for order: ${order.orderNumber} - Reason: ${reason}`);

        res.json({
            success: true,
            message: '환불 요청이 접수되었습니다. 검토 후 처리됩니다.',
            data: { order }
        });
    } catch (error) {
        logger.error('Request refund error:', error);
        res.status(500).json({
            success: false,
            message: '환불 요청 중 오류가 발생했습니다.'
        });
    }
};

// Get order statistics
const getOrderStatistics = async (req, res) => {
    try {
        const query = req.user.role === 'user' ? { user: req.user.id } : {};

        const [
            totalOrders,
            pendingOrders,
            processingOrders,
            completedOrders,
            cancelledOrders,
            totalRevenue
        ] = await Promise.all([
            Order.countDocuments(query),
            Order.countDocuments({ ...query, status: 'pending' }),
            Order.countDocuments({ ...query, status: 'processing' }),
            Order.countDocuments({ ...query, status: 'completed' }),
            Order.countDocuments({ ...query, status: 'cancelled' }),
            Order.aggregate([
                { $match: { ...query, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$finalAmount' } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalOrders,
                pendingOrders,
                processingOrders,
                completedOrders,
                cancelledOrders,
                totalRevenue: totalRevenue[0]?.total || 0
            }
        });
    } catch (error) {
        logger.error('Get order statistics error:', error);
        res.status(500).json({
            success: false,
            message: '주문 통계 조회 중 오류가 발생했습니다.'
        });
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderProgress,
    cancelOrder,
    requestRefund,
    getOrderStatistics
};
