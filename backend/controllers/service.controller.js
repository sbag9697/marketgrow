const Service = require('../models/Service');
const logger = require('../utils/logger');

// Get all services
const getServices = async (req, res) => {
    try {
        const {
            platform,
            category,
            search,
            isActive = 'true',
            isPopular,
            isPremium,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};

        if (isActive === 'true') {
            query.isActive = true;
        }

        if (platform) {
            query.platform = platform.toLowerCase();
        }

        if (category) {
            query.category = category;
        }

        if (isPopular === 'true') {
            query.isPopular = true;
        }

        if (isPremium === 'true') {
            query.isPremium = true;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const services = await Service.find(query)
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Service.countDocuments(query);

        // Get popular services for homepage
        const popularServices = await Service.find({
            isActive: true,
            isPopular: true
        }).limit(8);

        res.json({
            success: true,
            data: {
                services,
                popularServices,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        logger.error('Get services error:', error);
        res.status(500).json({
            success: false,
            message: '서비스 목록 조회 중 오류가 발생했습니다.'
        });
    }
};

// Get service by ID
const getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: '서비스를 찾을 수 없습니다.'
            });
        }

        if (!service.isActive) {
            return res.status(404).json({
                success: false,
                message: '현재 제공되지 않는 서비스입니다.'
            });
        }

        res.json({
            success: true,
            data: { service }
        });
    } catch (error) {
        logger.error('Get service by ID error:', error);
        res.status(500).json({
            success: false,
            message: '서비스 조회 중 오류가 발생했습니다.'
        });
    }
};

// Get services by platform
const getServicesByPlatform = async (req, res) => {
    try {
        const { platform } = req.params;
        const { category, isPopular } = req.query;

        const query = {
            platform: platform.toLowerCase(),
            isActive: true
        };

        if (category) {
            query.category = category;
        }

        if (isPopular === 'true') {
            query.isPopular = true;
        }

        const services = await Service.find(query)
            .sort({ isPopular: -1, totalOrders: -1 });

        // Group services by category
        const servicesByCategory = services.reduce((acc, service) => {
            if (!acc[service.category]) {
                acc[service.category] = [];
            }
            acc[service.category].push(service);
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                platform,
                services,
                servicesByCategory
            }
        });
    } catch (error) {
        logger.error('Get services by platform error:', error);
        res.status(500).json({
            success: false,
            message: '플랫폼 서비스 조회 중 오류가 발생했습니다.'
        });
    }
};

// Calculate service price
const calculatePrice = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: '수량을 입력해주세요.'
            });
        }

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

        if (quantity < service.minQuantity || quantity > service.maxQuantity) {
            return res.status(400).json({
                success: false,
                message: `수량은 ${service.minQuantity.toLocaleString()}개 이상 ${service.maxQuantity.toLocaleString()}개 이하여야 합니다.`
            });
        }

        const userLevel = req.user ? req.user.membershipLevel : 'bronze';
        const price = service.calculatePrice(quantity, userLevel);

        // Calculate unit price and discounts
        const basePrice = service.pricing[0].price * (quantity / service.pricing[0].quantity);
        const discount = basePrice - price;
        const discountRate = ((basePrice - price) / basePrice) * 100;

        res.json({
            success: true,
            data: {
                serviceId,
                quantity,
                unitPrice: price / quantity,
                totalPrice: price,
                originalPrice: basePrice,
                discount,
                discountRate: Math.round(discountRate * 100) / 100,
                userLevel,
                deliveryTime: service.deliveryTime,
                guaranteePeriod: service.guaranteePeriod
            }
        });
    } catch (error) {
        logger.error('Calculate price error:', error);
        res.status(500).json({
            success: false,
            message: '가격 계산 중 오류가 발생했습니다.'
        });
    }
};

// Get platform statistics
const getPlatformStats = async (req, res) => {
    try {
        const stats = await Service.aggregate([
            {
                $match: { isActive: true }
            },
            {
                $group: {
                    _id: '$platform',
                    totalServices: { $sum: 1 },
                    popularServices: {
                        $sum: { $cond: ['$isPopular', 1, 0] }
                    },
                    totalOrders: { $sum: '$totalOrders' },
                    averageRating: { $avg: '$averageRating' }
                }
            },
            {
                $sort: { totalServices: -1 }
            }
        ]);

        res.json({
            success: true,
            data: { stats }
        });
    } catch (error) {
        logger.error('Get platform stats error:', error);
        res.status(500).json({
            success: false,
            message: '플랫폼 통계 조회 중 오류가 발생했습니다.'
        });
    }
};

module.exports = {
    getServices,
    getServiceById,
    getServicesByPlatform,
    calculatePrice,
    getPlatformStats
};
