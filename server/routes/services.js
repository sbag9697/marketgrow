const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Service = require('../models/Service');
const { auth, optionalAuth, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Get all services (public)
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
    const {
        platform,
        category,
        type,
        featured,
        popular,
        priceMin,
        priceMax,
        search,
        sort = '-createdAt',
        page = 1,
        limit = 20
    } = req.query;

    // Build query
    const query = { isActive: true };
    
    if (platform) query.platform = platform;
    if (category) query.category = category;
    if (type) query.type = type;
    if (featured === 'true') query.isFeatured = true;
    if (popular === 'true') query.isPopular = true;
    
    if (priceMin || priceMax) {
        query.price = {};
        if (priceMin) query.price.$gte = parseInt(priceMin);
        if (priceMax) query.price.$lte = parseInt(priceMax);
    }
    
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
        ];
    }

    // Execute query
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const services = await Service.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name')
        .select('-apiSettings -__v');

    const total = await Service.countDocuments(query);

    res.json({
        success: true,
        data: {
            services,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }
    });
}));

// Get featured services
router.get('/featured', asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    
    const services = await Service.getFeatured(parseInt(limit));
    
    res.json({
        success: true,
        data: { services }
    });
}));

// Get popular services
router.get('/popular', asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    
    const services = await Service.getPopular(parseInt(limit));
    
    res.json({
        success: true,
        data: { services }
    });
}));

// Get service by ID
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id)
        .populate('createdBy', 'name')
        .select('-apiSettings -__v');

    if (!service || !service.isActive) {
        return res.status(404).json({
            success: false,
            message: '서비스를 찾을 수 없습니다',
            error: 'SERVICE_NOT_FOUND'
        });
    }

    // Update view count
    await service.updateAnalytics('views');

    res.json({
        success: true,
        data: { service }
    });
}));

// Create service (admin only)
router.post('/', auth, requireAdmin, [
    body('name').notEmpty().withMessage('서비스명을 입력해주세요'),
    body('description').notEmpty().withMessage('서비스 설명을 입력해주세요'),
    body('category').isIn([
        'followers', 'likes', 'views', 'comments', 'shares',
        'subscribers', 'engagement', 'promotion', 'analytics'
    ]).withMessage('올바른 카테고리를 선택해주세요'),
    body('platform').isIn([
        'instagram', 'youtube', 'tiktok', 'facebook', 
        'twitter', 'linkedin', 'twitch', 'all'
    ]).withMessage('올바른 플랫폼을 선택해주세요'),
    body('price').isNumeric().withMessage('가격을 입력해주세요'),
    body('minQuantity').isInt({ min: 1 }).withMessage('최소 수량을 입력해주세요'),
    body('maxQuantity').isInt({ min: 1 }).withMessage('최대 수량을 입력해주세요')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: '입력 정보를 확인해주세요',
            errors: errors.array()
        });
    }

    const serviceData = {
        ...req.body,
        createdBy: req.user._id
    };

    const service = new Service(serviceData);
    await service.save();

    logger.info(`New service created: ${service.name}`, {
        serviceId: service._id,
        createdBy: req.user.email
    });

    res.status(201).json({
        success: true,
        message: '서비스가 생성되었습니다',
        data: { service }
    });
}));

// Update service (admin only)
router.put('/:id', auth, requireAdmin, asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id);

    if (!service) {
        return res.status(404).json({
            success: false,
            message: '서비스를 찾을 수 없습니다',
            error: 'SERVICE_NOT_FOUND'
        });
    }

    const allowedUpdates = [
        'name', 'description', 'shortDescription', 'price', 'originalPrice',
        'minQuantity', 'maxQuantity', 'deliveryTime', 'features', 'requirements',
        'restrictions', 'tags', 'images', 'isActive', 'isFeatured', 'isPopular',
        'discountPercentage', 'discountValidUntil'
    ];

    allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
            service[field] = req.body[field];
        }
    });

    service.lastModifiedBy = req.user._id;
    await service.save();

    logger.info(`Service updated: ${service.name}`, {
        serviceId: service._id,
        updatedBy: req.user.email
    });

    res.json({
        success: true,
        message: '서비스가 업데이트되었습니다',
        data: { service }
    });
}));

// Delete service (admin only)
router.delete('/:id', auth, requireAdmin, asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id);

    if (!service) {
        return res.status(404).json({
            success: false,
            message: '서비스를 찾을 수 없습니다',
            error: 'SERVICE_NOT_FOUND'
        });
    }

    // Soft delete - just deactivate
    service.isActive = false;
    service.lastModifiedBy = req.user._id;
    await service.save();

    logger.info(`Service deleted: ${service.name}`, {
        serviceId: service._id,
        deletedBy: req.user.email
    });

    res.json({
        success: true,
        message: '서비스가 삭제되었습니다'
    });
}));

// Get service categories
router.get('/meta/categories', asyncHandler(async (req, res) => {
    const categories = [
        { value: 'followers', label: '팔로워', icon: 'users' },
        { value: 'likes', label: '좋아요', icon: 'heart' },
        { value: 'views', label: '조회수', icon: 'eye' },
        { value: 'comments', label: '댓글', icon: 'message-circle' },
        { value: 'shares', label: '공유', icon: 'share' },
        { value: 'subscribers', label: '구독자', icon: 'user-plus' },
        { value: 'engagement', label: '참여도', icon: 'activity' },
        { value: 'promotion', label: '홍보', icon: 'megaphone' },
        { value: 'analytics', label: '분석', icon: 'bar-chart' }
    ];

    res.json({
        success: true,
        data: { categories }
    });
}));

// Get supported platforms
router.get('/meta/platforms', asyncHandler(async (req, res) => {
    const platforms = [
        { value: 'instagram', label: '인스타그램', icon: 'instagram', color: '#E4405F' },
        { value: 'youtube', label: '유튜브', icon: 'youtube', color: '#FF0000' },
        { value: 'tiktok', label: '틱톡', icon: 'tiktok', color: '#000000' },
        { value: 'facebook', label: '페이스북', icon: 'facebook', color: '#1877F2' },
        { value: 'twitter', label: '트위터', icon: 'twitter', color: '#1DA1F2' },
        { value: 'linkedin', label: '링크드인', icon: 'linkedin', color: '#0A66C2' },
        { value: 'twitch', label: '트위치', icon: 'twitch', color: '#9146FF' },
        { value: 'all', label: '전체 플랫폼', icon: 'globe', color: '#6B7280' }
    ];

    res.json({
        success: true,
        data: { platforms }
    });
}));

// Get service statistics (admin only)
router.get('/admin/stats', auth, requireAdmin, asyncHandler(async (req, res) => {
    const stats = await Service.getServiceStats();
    
    const platformStats = await Service.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: '$platform',
                count: { $sum: 1 },
                totalOrders: { $sum: '$orderCount' },
                averagePrice: { $avg: '$price' }
            }
        },
        { $sort: { count: -1 } }
    ]);

    const categoryStats = await Service.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                totalOrders: { $sum: '$orderCount' },
                averagePrice: { $avg: '$price' }
            }
        },
        { $sort: { count: -1 } }
    ]);

    res.json({
        success: true,
        data: {
            overview: stats,
            platforms: platformStats,
            categories: categoryStats
        }
    });
}));

module.exports = router;