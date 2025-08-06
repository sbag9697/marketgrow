const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Service = require('../models/Service');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Get user orders
router.get('/', auth, asyncHandler(async (req, res) => {
    const {
        status,
        sort = '-createdAt',
        page = 1,
        limit = 20
    } = req.query;

    const query = { userId: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('serviceId', 'name price platform category')
        .select('-__v');

    const total = await Order.countDocuments(query);

    res.json({
        success: true,
        data: {
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }
    });
}));

// Create order
router.post('/', auth, [
    body('serviceId').isMongoId().withMessage('올바른 서비스 ID를 입력해주세요'),
    body('targetUrl').isURL().withMessage('올바른 URL을 입력해주세요'),
    body('quantity').isInt({ min: 1 }).withMessage('수량을 입력해주세요')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: '입력 정보를 확인해주세요',
            errors: errors.array()
        });
    }

    const { serviceId, targetUrl, quantity, notes } = req.body;

    // Get service
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
        return res.status(404).json({
            success: false,
            message: '서비스를 찾을 수 없습니다',
            error: 'SERVICE_NOT_FOUND'
        });
    }

    // Validate quantity
    if (!service.isQuantityValid(quantity)) {
        return res.status(400).json({
            success: false,
            message: `수량은 ${service.minQuantity}-${service.maxQuantity} 범위여야 합니다`,
            error: 'INVALID_QUANTITY'
        });
    }

    // Calculate pricing
    const unitPrice = service.isOnSale ? service.discountedPrice : service.price;
    const totalPrice = unitPrice * quantity;
    const discountAmount = service.isOnSale ? (service.price - service.discountedPrice) * quantity : 0;
    const finalPrice = totalPrice - discountAmount;

    // Create order
    const orderData = {
        userId: req.user._id,
        serviceId: service._id,
        serviceName: service.name,
        serviceDescription: service.description,
        platform: service.platform,
        category: service.category,
        targetUrl,
        quantity,
        unitPrice,
        totalPrice,
        discountAmount,
        finalPrice,
        progress: {
            current: 0,
            target: quantity
        },
        customerInfo: {
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone,
            notes: notes || ''
        },
        deliveryInfo: {
            estimatedStart: new Date(),
            estimatedCompletion: service.getEstimatedDelivery().maxDate
        }
    };

    const order = new Order(orderData);
    await order.save();

    // Update service order count
    await service.incrementOrderCount();

    logger.logOrder('CREATE', order.orderNumber, req.user._id, true, {
        serviceName: service.name,
        quantity,
        finalPrice
    });

    res.status(201).json({
        success: true,
        message: '주문이 생성되었습니다',
        data: { order }
    });
}));

// Get order by ID
router.get('/:id', auth, asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('serviceId', 'name description platform category')
        .populate('userId', 'name email');

    if (!order) {
        return res.status(404).json({
            success: false,
            message: '주문을 찾을 수 없습니다',
            error: 'ORDER_NOT_FOUND'
        });
    }

    // Check ownership
    if (order.userId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: '접근 권한이 없습니다',
            error: 'ACCESS_DENIED'
        });
    }

    res.json({
        success: true,
        data: { order }
    });
}));

module.exports = router;