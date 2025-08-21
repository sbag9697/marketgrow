const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Order = require('../models/Order');
const Service = require('../models/Service');
const Deposit = require('../models/Deposit');
const Coupon = require('../models/Coupon');
const AuditLog = require('../models/AuditLog');
const { auth, adminAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

// 관리자 로그인 (별도 인증)
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { email, password } = req.body;

        // 관리자 계정 확인
        const admin = await User.findOne({ 
            email, 
            role: { $in: ['admin', 'superadmin'] } 
        });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: '관리자 계정이 아닙니다'
            });
        }

        // 비밀번호 확인
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: '비밀번호가 일치하지 않습니다'
            });
        }

        // 관리자 전용 토큰 생성 (짧은 유효기간)
        const token = jwt.sign(
            { 
                id: admin._id, 
                email: admin.email, 
                role: admin.role,
                isAdmin: true 
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' } // 8시간 유효
        );

        // 로그인 기록
        await AuditLog.create({
            user: admin._id,
            action: 'admin_login',
            category: 'auth',
            message: `관리자 로그인: ${admin.email}`,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.json({
            success: true,
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        logger.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: '로그인 처리 중 오류가 발생했습니다'
        });
    }
});

// 관리자 세션 검증
router.get('/verify', auth, adminAuth, (req, res) => {
    res.json({
        success: true,
        admin: req.user
    });
});

// ===== 대시보드 통계 =====
router.get('/stats', auth, adminAuth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // 통계 수집
        const [
            totalRevenue,
            todayRevenue,
            newOrders,
            activeUsers,
            pendingOrders,
            totalUsers,
            totalOrders
        ] = await Promise.all([
            Order.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            Order.aggregate([
                { $match: { status: 'completed', createdAt: { $gte: today } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            Order.countDocuments({ createdAt: { $gte: today } }),
            User.countDocuments({ lastActiveAt: { $gte: yesterday } }),
            Order.countDocuments({ status: 'pending' }),
            User.countDocuments(),
            Order.countDocuments()
        ]);

        res.json({
            success: true,
            data: {
                totalRevenue: totalRevenue[0]?.total || 0,
                todayRevenue: todayRevenue[0]?.total || 0,
                newOrders,
                activeUsers,
                pendingOrders,
                totalUsers,
                totalOrders
            }
        });
    } catch (error) {
        logger.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: '통계 조회 중 오류가 발생했습니다'
        });
    }
});

// ===== 주문 관리 =====
router.get('/orders', auth, adminAuth, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            status, 
            userId,
            startDate,
            endDate 
        } = req.query;

        const query = {};
        if (status) query.status = status;
        if (userId) query.user = userId;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate('service', 'name')
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
        logger.error('Orders list error:', error);
        res.status(500).json({
            success: false,
            message: '주문 목록 조회 중 오류가 발생했습니다'
        });
    }
});

// 주문 상세
router.get('/orders/:id', auth, adminAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user')
            .populate('service');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: '주문을 찾을 수 없습니다'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        logger.error('Order detail error:', error);
        res.status(500).json({
            success: false,
            message: '주문 조회 중 오류가 발생했습니다'
        });
    }
});

// 주문 처리
router.post('/orders/:id/process', auth, adminAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: '주문을 찾을 수 없습니다'
            });
        }

        // SMM 패널로 주문 전송
        const smmService = require('../services/smm.service');
        const smmClient = new smmService();
        
        const result = await smmClient.createOrder({
            service: order.smmServiceId || order.service,
            link: order.targetUrl,
            quantity: order.quantity
        });

        if (result.success) {
            order.status = 'processing';
            order.smmOrderId = result.order;
            order.processedAt = new Date();
            await order.save();

            // 감사 로그
            await AuditLog.create({
                user: req.user.id,
                action: 'process_order',
                category: 'order',
                targetId: order._id,
                message: `주문 처리: ${order.orderNumber}`,
                ip: req.ip
            });

            res.json({
                success: true,
                message: '주문이 처리되었습니다',
                data: order
            });
        } else {
            throw new Error(result.error || '주문 처리 실패');
        }
    } catch (error) {
        logger.error('Order process error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 주문 취소
router.post('/orders/:id/cancel', auth, adminAuth, async (req, res) => {
    try {
        const { reason } = req.body;
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: '주문을 찾을 수 없습니다'
            });
        }

        order.status = 'cancelled';
        order.cancelReason = reason;
        order.cancelledAt = new Date();
        order.cancelledBy = req.user.id;
        await order.save();

        // 사용자에게 포인트/예치금 환불
        const user = await User.findById(order.user);
        if (user) {
            if (order.paymentMethod === 'deposit') {
                user.depositBalance += order.totalAmount;
            } else if (order.paymentMethod === 'points') {
                user.points += order.totalAmount;
            }
            await user.save();
        }

        // 감사 로그
        await AuditLog.create({
            user: req.user.id,
            action: 'cancel_order',
            category: 'order',
            targetId: order._id,
            message: `주문 취소: ${order.orderNumber} - ${reason}`,
            ip: req.ip
        });

        res.json({
            success: true,
            message: '주문이 취소되었습니다',
            data: order
        });
    } catch (error) {
        logger.error('Order cancel error:', error);
        res.status(500).json({
            success: false,
            message: '주문 취소 중 오류가 발생했습니다'
        });
    }
});

// 주문 환불
router.post('/orders/:id/refund', auth, adminAuth, async (req, res) => {
    try {
        const { reason, amount } = req.body;
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: '주문을 찾을 수 없습니다'
            });
        }

        const refundAmount = amount || order.totalAmount;

        order.status = 'refunded';
        order.refundReason = reason;
        order.refundAmount = refundAmount;
        order.refundedAt = new Date();
        order.refundedBy = req.user.id;
        await order.save();

        // 사용자에게 환불
        const user = await User.findById(order.user);
        if (user) {
            user.depositBalance += refundAmount;
            await user.save();
        }

        // 감사 로그
        await AuditLog.create({
            user: req.user.id,
            action: 'refund_order',
            category: 'order',
            targetId: order._id,
            message: `주문 환불: ${order.orderNumber} - ${refundAmount}원`,
            ip: req.ip
        });

        res.json({
            success: true,
            message: '환불이 처리되었습니다',
            data: order
        });
    } catch (error) {
        logger.error('Order refund error:', error);
        res.status(500).json({
            success: false,
            message: '환불 처리 중 오류가 발생했습니다'
        });
    }
});

// ===== 회원 관리 =====
router.get('/users', auth, adminAuth, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            search,
            membershipLevel,
            isActive 
        } = req.query;

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (membershipLevel) query.membershipLevel = membershipLevel;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
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
        logger.error('Users list error:', error);
        res.status(500).json({
            success: false,
            message: '회원 목록 조회 중 오류가 발생했습니다'
        });
    }
});

// 회원 상태 변경
router.patch('/users/:id/status', auth, adminAuth, async (req, res) => {
    try {
        const { isActive } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        ).select('-password');

        // 감사 로그
        await AuditLog.create({
            user: req.user.id,
            action: isActive ? 'activate_user' : 'deactivate_user',
            category: 'user',
            targetId: user._id,
            message: `회원 ${isActive ? '활성화' : '비활성화'}: ${user.email}`,
            ip: req.ip
        });

        res.json({
            success: true,
            message: `회원이 ${isActive ? '활성화' : '비활성화'}되었습니다`,
            data: user
        });
    } catch (error) {
        logger.error('User status update error:', error);
        res.status(500).json({
            success: false,
            message: '회원 상태 변경 중 오류가 발생했습니다'
        });
    }
});

// ===== 쿠폰 관리 =====
router.get('/coupons', auth, adminAuth, async (req, res) => {
    try {
        const coupons = await Coupon.find()
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: coupons
        });
    } catch (error) {
        logger.error('Coupons list error:', error);
        res.status(500).json({
            success: false,
            message: '쿠폰 목록 조회 중 오류가 발생했습니다'
        });
    }
});

// 쿠폰 생성
router.post('/coupons', auth, adminAuth, [
    body('code').notEmpty().isLength({ min: 4, max: 20 }),
    body('description').notEmpty(),
    body('type').isIn(['percentage', 'fixed']),
    body('value').isNumeric(),
    body('maxUses').optional().isInt({ min: 1 }),
    body('expiresAt').optional().isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const couponData = {
            ...req.body,
            createdBy: req.user.id,
            isActive: true
        };

        const coupon = await Coupon.create(couponData);

        // 감사 로그
        await AuditLog.create({
            user: req.user.id,
            action: 'create_coupon',
            category: 'coupon',
            targetId: coupon._id,
            message: `쿠폰 생성: ${coupon.code}`,
            ip: req.ip
        });

        res.json({
            success: true,
            message: '쿠폰이 생성되었습니다',
            data: coupon
        });
    } catch (error) {
        logger.error('Coupon create error:', error);
        res.status(500).json({
            success: false,
            message: error.code === 11000 ? 
                '이미 존재하는 쿠폰 코드입니다' : 
                '쿠폰 생성 중 오류가 발생했습니다'
        });
    }
});

// ===== 로그 조회 =====
router.get('/logs', auth, adminAuth, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            category,
            level,
            startDate,
            endDate 
        } = req.query;

        const query = {};
        if (category) query.category = category;
        if (level) query.level = level;
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const logs = await AuditLog.find(query)
            .populate('user', 'name email')
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AuditLog.countDocuments(query);

        res.json({
            success: true,
            data: logs.map(log => ({
                id: log._id,
                timestamp: log.timestamp,
                level: log.level || 'info',
                category: log.category,
                user: log.user?.email || log.user,
                action: log.action,
                message: log.message,
                ip: log.ip
            }))
        });
    } catch (error) {
        logger.error('Logs list error:', error);
        res.status(500).json({
            success: false,
            message: '로그 조회 중 오류가 발생했습니다'
        });
    }
});

// ===== 설정 관리 =====
router.get('/settings', auth, adminAuth, async (req, res) => {
    try {
        // 환경변수 기반 설정 반환
        const settings = {
            siteName: process.env.SITE_NAME || 'MarketGrow',
            adminEmail: process.env.ADMIN_EMAIL,
            autoDepositConfirm: process.env.AUTO_CONFIRM_DEPOSITS === 'true',
            pointRate: parseFloat(process.env.POINT_RATE || '1'),
            minOrderAmount: parseInt(process.env.MIN_ORDER_AMOUNT || '1000'),
            maxOrderAmount: parseInt(process.env.MAX_ORDER_AMOUNT || '10000000'),
            maintenanceMode: process.env.MAINTENANCE_MODE === 'true'
        };

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        logger.error('Settings get error:', error);
        res.status(500).json({
            success: false,
            message: '설정 조회 중 오류가 발생했습니다'
        });
    }
});

router.put('/settings', auth, adminAuth, async (req, res) => {
    try {
        // 실제 프로덕션에서는 데이터베이스에 저장
        // 여기서는 로그만 기록
        logger.info('Settings update:', req.body);

        // 감사 로그
        await AuditLog.create({
            user: req.user.id,
            action: 'update_settings',
            category: 'system',
            message: '시스템 설정 변경',
            data: req.body,
            ip: req.ip
        });

        res.json({
            success: true,
            message: '설정이 저장되었습니다'
        });
    } catch (error) {
        logger.error('Settings update error:', error);
        res.status(500).json({
            success: false,
            message: '설정 저장 중 오류가 발생했습니다'
        });
    }
});

module.exports = router;