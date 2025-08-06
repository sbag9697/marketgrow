const express = require('express');
const { auth, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const User = require('../models/User');
const Service = require('../models/Service');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { getStats } = require('../config/database');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(requireAdmin);

// Get dashboard statistics
router.get('/dashboard', asyncHandler(async (req, res) => {
    const [userStats, serviceStats, orderStats, paymentStats, dbStats] = await Promise.all([
        User.getUserStats(),
        Service.getServiceStats(),
        Order.getOrderStats(),
        Payment.getPaymentStats(),
        getStats()
    ]);

    const dashboardData = {
        users: userStats,
        services: serviceStats,
        orders: orderStats,
        payments: paymentStats,
        database: dbStats,
        timestamp: new Date()
    };

    res.json({
        success: true,
        data: dashboardData
    });
}));

// Get system health
router.get('/health', asyncHandler(async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV,
        database: await getStats()
    };

    res.json({
        success: true,
        data: health
    });
}));

module.exports = router;