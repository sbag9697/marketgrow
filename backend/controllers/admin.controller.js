const User = require('../models/User');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Service = require('../models/Service');
const Consultation = require('../models/Consultation');
const logger = require('../utils/logger');

// Get admin dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Get overall statistics
        const [
            totalUsers,
            totalOrders,
            totalRevenue,
            activeOrders,
            pendingConsultations,
            todayOrders,
            todayRevenue,
            monthlyOrders,
            monthlyRevenue
        ] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            Order.countDocuments(),
            Payment.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Order.countDocuments({ status: { $in: ['pending', 'processing'] } }),
            Consultation.countDocuments({ status: 'pending' }),
            Order.countDocuments({ createdAt: { $gte: startOfDay } }),
            Payment.aggregate([
                { $match: { status: 'completed', createdAt: { $gte: startOfDay } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Payment.aggregate([
                { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);

        // Get order status distribution
        const orderStatusStats = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get popular services
        const popularServices = await Service.find({ isActive: true })
            .sort({ totalOrders: -1 })
            .limit(5)
            .select('name platform totalOrders totalRevenue');

        // Get recent orders
        const recentOrders = await Order.find()
            .populate('user', 'name email')
            .populate('service', 'name platform')
            .sort({ createdAt: -1 })
            .limit(10)
            .select('orderNumber status finalAmount createdAt user service');

        // Get user growth data (last 30 days)
        const userGrowthData = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                    role: 'user'
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]);

        // Get revenue growth data (last 30 days)
        const revenueGrowthData = await Payment.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                    },
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]);

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalOrders,
                    totalRevenue: totalRevenue[0]?.total || 0,
                    activeOrders,
                    pendingConsultations
                },
                today: {
                    orders: todayOrders,
                    revenue: todayRevenue[0]?.total || 0
                },
                thisMonth: {
                    orders: monthlyOrders,
                    revenue: monthlyRevenue[0]?.total || 0
                },
                orderStatusStats,
                popularServices,
                recentOrders,
                userGrowthData,
                revenueGrowthData
            }
        });
    } catch (error) {
        logger.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: '대시보드 통계 조회 중 오류가 발생했습니다.'
        });
    }
};

// Get all users (Admin)
const getUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            role,
            membershipLevel,
            isActive,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        if (role && role !== 'all') {
            query.role = role;
        }

        if (membershipLevel && membershipLevel !== 'all') {
            query.membershipLevel = membershipLevel;
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const users = await User.find(query)
            .select('-password -emailVerificationToken -phoneVerificationCode -passwordResetToken')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        logger.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: '사용자 목록 조회 중 오류가 발생했습니다.'
        });
    }
};

// Update user (Admin)
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent updating sensitive fields
        delete updates.password;
        delete updates.emailVerificationToken;
        delete updates.phoneVerificationCode;
        delete updates.passwordResetToken;

        const user = await User.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).select('-password -emailVerificationToken -phoneVerificationCode -passwordResetToken');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        logger.info(`User ${user.email} updated by admin ${req.user.email}`);

        res.json({
            success: true,
            message: '사용자 정보가 업데이트되었습니다.',
            data: { user }
        });
    } catch (error) {
        logger.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: '사용자 정보 업데이트 중 오류가 발생했습니다.'
        });
    }
};

// Get all orders (Admin)
const getAllOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            search,
            userId,
            serviceId,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (userId) {
            query.user = userId;
        }

        if (serviceId) {
            query.service = serviceId;
        }

        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { targetUrl: { $regex: search, $options: 'i' } }
            ];
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const orders = await Order.find(query)
            .populate('user', 'name email membershipLevel')
            .populate('service', 'name platform category')
            .populate('payment', 'status method amount')
            .sort(sortOptions)
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
        logger.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: '주문 목록 조회 중 오류가 발생했습니다.'
        });
    }
};

// Get all payments (Admin)
const getAllPayments = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            method,
            provider,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (method && method !== 'all') {
            query.method = method;
        }

        if (provider && provider !== 'all') {
            query.provider = provider;
        }

        if (search) {
            query.$or = [
                { paymentId: { $regex: search, $options: 'i' } },
                { providerTransactionId: { $regex: search, $options: 'i' } }
            ];
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const payments = await Payment.find(query)
            .populate('user', 'name email')
            .populate('order', 'orderNumber status')
            .sort(sortOptions)
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
        logger.error('Get all payments error:', error);
        res.status(500).json({
            success: false,
            message: '결제 목록 조회 중 오류가 발생했습니다.'
        });
    }
};

// Manage services (Admin)
const getServicesForAdmin = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            platform,
            category,
            isActive,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};

        if (platform && platform !== 'all') {
            query.platform = platform.toLowerCase();
        }

        if (category && category !== 'all') {
            query.category = category;
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
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

        res.json({
            success: true,
            data: {
                services,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        logger.error('Get services for admin error:', error);
        res.status(500).json({
            success: false,
            message: '서비스 목록 조회 중 오류가 발생했습니다.'
        });
    }
};

// Create or update service (Admin)
const upsertService = async (req, res) => {
    try {
        const { id } = req.params;
        const serviceData = req.body;

        let service;
        if (id) {
            // Update existing service
            service = await Service.findByIdAndUpdate(
                id,
                serviceData,
                { new: true, runValidators: true }
            );

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: '서비스를 찾을 수 없습니다.'
                });
            }

            logger.info(`Service ${service.name} updated by admin ${req.user.email}`);
        } else {
            // Create new service
            service = new Service(serviceData);
            await service.save();

            logger.info(`Service ${service.name} created by admin ${req.user.email}`);
        }

        res.json({
            success: true,
            message: id ? '서비스가 업데이트되었습니다.' : '서비스가 생성되었습니다.',
            data: { service }
        });
    } catch (error) {
        logger.error('Upsert service error:', error);
        res.status(500).json({
            success: false,
            message: '서비스 처리 중 오류가 발생했습니다.'
        });
    }
};

// Delete service (Admin)
const deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: '서비스를 찾을 수 없습니다.'
            });
        }

        // Check if service has active orders
        const activeOrders = await Order.countDocuments({
            service: id,
            status: { $in: ['pending', 'processing'] }
        });

        if (activeOrders > 0) {
            return res.status(400).json({
                success: false,
                message: '진행 중인 주문이 있어 서비스를 삭제할 수 없습니다. 먼저 비활성화하세요.'
            });
        }

        await Service.findByIdAndDelete(id);

        logger.info(`Service ${service.name} deleted by admin ${req.user.email}`);

        res.json({
            success: true,
            message: '서비스가 삭제되었습니다.'
        });
    } catch (error) {
        logger.error('Delete service error:', error);
        res.status(500).json({
            success: false,
            message: '서비스 삭제 중 오류가 발생했습니다.'
        });
    }
};

// Get system logs (Admin)
const getSystemLogs = async (req, res) => {
    try {
        const { level = 'info', limit = 100 } = req.query;

        // This would typically read from log files or a logging service
        // For now, return a placeholder response
        const logs = [
            {
                timestamp: new Date(),
                level: 'info',
                message: 'Server started successfully',
                service: 'marketgrow-backend'
            }
        ];

        res.json({
            success: true,
            data: {
                logs,
                total: logs.length
            }
        });
    } catch (error) {
        logger.error('Get system logs error:', error);
        res.status(500).json({
            success: false,
            message: '시스템 로그 조회 중 오류가 발생했습니다.'
        });
    }
};

module.exports = {
    getDashboardStats,
    getUsers,
    updateUser,
    getAllOrders,
    getAllPayments,
    getServicesForAdmin,
    upsertService,
    deleteService,
    getSystemLogs
};
