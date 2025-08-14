const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const Order = require('../models/Order');
const Service = require('../models/Service');

// 대시보드 통계 가져오기
router.get('/dashboard', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // 전체 주문 수
        const totalOrders = await Order.countDocuments({ user: userId });

        // 진행중인 주문
        const activeOrders = await Order.countDocuments({
            user: userId,
            status: { $in: ['pending', 'processing'] }
        });

        // 완료된 주문
        const completedOrders = await Order.countDocuments({
            user: userId,
            status: 'completed'
        });

        // 총 사용 금액
        const totalSpentResult = await Order.aggregate([
            { $match: { user: mongoose.Types.ObjectId(userId) } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalSpent = totalSpentResult[0]?.total || 0;

        // 최근 주문 5개
        const recentOrders = await Order.find({ user: userId })
            .populate('service', 'name platform')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                statistics: {
                    totalOrders,
                    activeOrders,
                    completedOrders,
                    totalSpent
                },
                recentOrders
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: '대시보드 데이터를 불러올 수 없습니다.'
        });
    }
});

module.exports = router;
