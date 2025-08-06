const express = require('express');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const User = require('../models/User');

const router = express.Router();

// Get user dashboard data
router.get('/dashboard', auth, asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    // Get user with populated referral info
    const user = await User.findById(userId)
        .populate('referredBy', 'name email')
        .select('-password -__v');

    // Mock dashboard data - replace with actual queries
    const dashboardData = {
        user: {
            ...user.toObject(),
            totalOrders: user.orderCount || 0,
            totalSpent: user.totalSpent || 0,
            activeOrders: 0, // TODO: Query from Order model
            completedOrders: user.orderCount || 0
        },
        stats: {
            thisMonth: {
                orders: 0,
                spending: 0
            },
            lastMonth: {
                orders: 0,
                spending: 0
            }
        },
        recentActivity: [
            {
                type: 'order',
                message: '새 주문이 생성되었습니다',
                timestamp: new Date(),
                status: 'success'
            }
        ]
    };

    res.json({
        success: true,
        data: dashboardData
    });
}));

module.exports = router;