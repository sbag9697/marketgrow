const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user dashboard data
router.get('/dashboard', auth, async (req, res) => {
    try {
        const User = require('../models/User');
        const Order = require('../models/Order');
        const Payment = require('../models/Payment');

        const user = await User.findById(req.user.id)
            .select('-password -emailVerificationToken -phoneVerificationCode -passwordResetToken');

        // Get user statistics
        const [totalOrders, totalSpent, activeOrders, completedOrders] = await Promise.all([
            Order.countDocuments({ user: req.user.id }),
            Payment.aggregate([
                { $match: { user: req.user.id, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Order.countDocuments({ user: req.user.id, status: { $in: ['pending', 'processing'] } }),
            Order.countDocuments({ user: req.user.id, status: 'completed' })
        ]);

        // Get recent orders
        const recentOrders = await Order.find({ user: req.user.id })
            .populate('service', 'name platform')
            .sort({ createdAt: -1 })
            .limit(5)
            .select('orderNumber status totalAmount createdAt progress');

        res.json({
            success: true,
            data: {
                user,
                statistics: {
                    totalOrders,
                    totalSpent: totalSpent[0]?.total || 0,
                    activeOrders,
                    completedOrders,
                    membershipLevel: user.membershipLevel,
                    points: user.points
                },
                recentOrders
            }
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: '대시보드 데이터 조회 중 오류가 발생했습니다.'
        });
    }
});

// Get user orders
router.get('/orders', auth, async (req, res) => {
    try {
        const Order = require('../models/Order');
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
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: '주문 목록 조회 중 오류가 발생했습니다.'
        });
    }
});

// Get user payments
router.get('/payments', auth, async (req, res) => {
    try {
        const Payment = require('../models/Payment');
        const { page = 1, limit = 10, status } = req.query;

        const query = { user: req.user.id };
        
        if (status && status !== 'all') {
            query.status = status;
        }

        const payments = await Payment.find(query)
            .populate('order', 'orderNumber')
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
        console.error('Get payments error:', error);
        res.status(500).json({
            success: false,
            message: '결제 내역 조회 중 오류가 발생했습니다.'
        });
    }
});

// Get user referrals
router.get('/referrals', auth, async (req, res) => {
    try {
        const User = require('../models/User');

        const referrals = await User.find({ referredBy: req.user.id })
            .select('username email createdAt totalSpent membershipLevel')
            .sort({ createdAt: -1 });

        const referralStats = {
            totalReferrals: referrals.length,
            totalEarnings: referrals.reduce((sum, ref) => sum + (ref.totalSpent * 0.05), 0), // 5% commission
            activeReferrals: referrals.filter(ref => ref.totalSpent > 0).length
        };

        res.json({
            success: true,
            data: {
                referrals,
                stats: referralStats,
                userReferralCode: req.user.referralCode
            }
        });

    } catch (error) {
        console.error('Get referrals error:', error);
        res.status(500).json({
            success: false,
            message: '추천 현황 조회 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;