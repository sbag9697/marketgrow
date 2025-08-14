const express = require('express');
const { body } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Keyword exposure packages data
const keywordPackages = {
    video: {
        youtube: [
            {
                id: 'yt_basic',
                name: '베이직 패키지',
                price: 150000,
                keywords: 5,
                duration: 7,
                features: ['키워드 5개', '7일간 노출', '기본 분석 리포트']
            },
            {
                id: 'yt_standard',
                name: '스탠다드 패키지',
                price: 250000,
                keywords: 10,
                duration: 14,
                features: ['키워드 10개', '14일간 노출', '상세 분석 리포트', '경쟁사 분석']
            },
            {
                id: 'yt_premium',
                name: '프리미엄 패키지',
                price: 400000,
                keywords: 20,
                duration: 30,
                features: ['키워드 20개', '30일간 노출', '전문 분석 리포트', '경쟁사 분석', '최적화 컨설팅']
            }
        ],
        tiktok: [
            {
                id: 'tt_basic',
                name: '베이직 패키지',
                price: 120000,
                keywords: 5,
                duration: 7,
                features: ['키워드 5개', '7일간 노출', '기본 해시태그 분석']
            },
            {
                id: 'tt_standard',
                name: '스탠다드 패키지',
                price: 200000,
                keywords: 10,
                duration: 14,
                features: ['키워드 10개', '14일간 노출', '트렌드 해시태그 추천', '성과 분석']
            },
            {
                id: 'tt_premium',
                name: '프리미엄 패키지',
                price: 350000,
                keywords: 20,
                duration: 30,
                features: ['키워드 20개', '30일간 노출', '바이럴 해시태그 전략', '인플루언서 매칭']
            }
        ],
        instagram: [
            {
                id: 'ig_basic',
                name: '베이직 패키지',
                price: 130000,
                keywords: 5,
                duration: 7,
                features: ['키워드 5개', '7일간 노출', '스토리 최적화']
            },
            {
                id: 'ig_standard',
                name: '스탠다드 패키지',
                price: 220000,
                keywords: 10,
                duration: 14,
                features: ['키워드 10개', '14일간 노출', '릴스 최적화', '해시태그 전략']
            },
            {
                id: 'ig_premium',
                name: '프리미엄 패키지',
                price: 380000,
                keywords: 20,
                duration: 30,
                features: ['키워드 20개', '30일간 노출', '완전 콘텐츠 전략', '인사이트 분석']
            }
        ],
        facebook: [
            {
                id: 'fb_basic',
                name: '베이직 패키지',
                price: 140000,
                keywords: 5,
                duration: 7,
                features: ['키워드 5개', '7일간 노출', '페이지 최적화']
            },
            {
                id: 'fb_standard',
                name: '스탠다드 패키지',
                price: 240000,
                keywords: 10,
                duration: 14,
                features: ['키워드 10개', '14일간 노출', '그룹 마케팅', '광고 최적화']
            },
            {
                id: 'fb_premium',
                name: '프리미엄 패키지',
                price: 400000,
                keywords: 20,
                duration: 30,
                features: ['키워드 20개', '30일간 노출', '완전 소셜 전략', '고급 타겟팅']
            }
        ]
    },
    live: {
        youtube: [
            {
                id: 'yt_live_basic',
                name: '베이직 라이브',
                price: 180000,
                keywords: 3,
                duration: 5,
                features: ['실시간 키워드 3개', '5일 집중 노출', '라이브 채팅 최적화']
            },
            {
                id: 'yt_live_standard',
                name: '스탠다드 라이브',
                price: 300000,
                keywords: 7,
                duration: 10,
                features: ['실시간 키워드 7개', '10일 집중 노출', '썸네일 최적화', '실시간 분석']
            },
            {
                id: 'yt_live_premium',
                name: '프리미엄 라이브',
                price: 500000,
                keywords: 15,
                duration: 20,
                features: ['실시간 키워드 15개', '20일 집중 노출', '완전 라이브 전략', '실시간 모니터링']
            }
        ],
        tiktok: [
            {
                id: 'tt_live_basic',
                name: '베이직 라이브',
                price: 150000,
                keywords: 3,
                duration: 5,
                features: ['실시간 키워드 3개', '5일 집중 노출', '라이브 해시태그']
            },
            {
                id: 'tt_live_standard',
                name: '스탠다드 라이브',
                price: 270000,
                keywords: 7,
                duration: 10,
                features: ['실시간 키워드 7개', '10일 집중 노출', '트렌드 활용', '라이브 이벤트']
            },
            {
                id: 'tt_live_premium',
                name: '프리미엄 라이브',
                price: 450000,
                keywords: 15,
                duration: 20,
                features: ['실시간 키워드 15개', '20일 집중 노출', '바이럴 라이브 전략', '실시간 반응 분석']
            }
        ],
        instagram: [
            {
                id: 'ig_live_basic',
                name: '베이직 라이브',
                price: 160000,
                keywords: 3,
                duration: 5,
                features: ['실시간 키워드 3개', '5일 집중 노출', '스토리 연동']
            },
            {
                id: 'ig_live_standard',
                name: '스탠다드 라이브',
                price: 280000,
                keywords: 7,
                duration: 10,
                features: ['실시간 키워드 7개', '10일 집중 노출', 'IGTV 최적화', '라이브 쇼핑']
            },
            {
                id: 'ig_live_premium',
                name: '프리미엄 라이브',
                price: 480000,
                keywords: 15,
                duration: 20,
                features: ['실시간 키워드 15개', '20일 집중 노출', '완전 라이브 커머스', '인플루언서 협업']
            }
        ],
        facebook: [
            {
                id: 'fb_live_basic',
                name: '베이직 라이브',
                price: 170000,
                keywords: 3,
                duration: 5,
                features: ['실시간 키워드 3개', '5일 집중 노출', '페이지 라이브']
            },
            {
                id: 'fb_live_standard',
                name: '스탠다드 라이브',
                price: 290000,
                keywords: 7,
                duration: 10,
                features: ['실시간 키워드 7개', '10일 집중 노출', '그룹 라이브', '이벤트 연동']
            },
            {
                id: 'fb_live_premium',
                name: '프리미엄 라이브',
                price: 490000,
                keywords: 15,
                duration: 20,
                features: ['실시간 키워드 15개', '20일 집중 노출', '완전 라이브 마케팅', '크로스 플랫폼']
            }
        ]
    }
};

// Get keyword packages
router.get('/packages', (req, res) => {
    try {
        const { type, platform } = req.query;

        let packages = keywordPackages;

        if (type && packages[type]) {
            packages = packages[type];
        }

        if (platform && packages[platform]) {
            packages = packages[platform];
        }

        res.json({
            success: true,
            data: { packages }
        });
    } catch (error) {
        console.error('Get keyword packages error:', error);
        res.status(500).json({
            success: false,
            message: '키워드 패키지 조회 중 오류가 발생했습니다.'
        });
    }
});

// Create keyword campaign order
router.post('/order', auth, [
    body('type')
        .isIn(['video', 'live'])
        .withMessage('유효한 캠페인 타입을 선택해주세요.'),
    body('platform')
        .isIn(['youtube', 'tiktok', 'instagram', 'facebook'])
        .withMessage('유효한 플랫폼을 선택해주세요.'),
    body('packageId')
        .notEmpty()
        .withMessage('패키지를 선택해주세요.'),
    body('keywords')
        .isArray({ min: 1 })
        .withMessage('최소 1개 이상의 키워드를 입력해주세요.'),
    body('targetUrl')
        .isURL()
        .withMessage('유효한 URL을 입력해주세요.'),
    body('targetAudience')
        .optional()
        .isLength({ max: 500 })
        .withMessage('타겟 오디언스 설명은 500자 이하여야 합니다.'),
    body('additionalInfo')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('추가 정보는 1000자 이하여야 합니다.')
], async (req, res) => {
    try {
        const { type, platform, packageId, keywords, targetUrl, targetAudience, additionalInfo } = req.body;

        // Find package
        const selectedPackage = keywordPackages[type]?.[platform]?.find(pkg => pkg.id === packageId);

        if (!selectedPackage) {
            return res.status(404).json({
                success: false,
                message: '선택한 패키지를 찾을 수 없습니다.'
            });
        }

        // Validate keyword count
        if (keywords.length > selectedPackage.keywords) {
            return res.status(400).json({
                success: false,
                message: `선택한 패키지는 최대 ${selectedPackage.keywords}개의 키워드만 지원합니다.`
            });
        }

        // Create keyword campaign order
        const Order = require('../models/Order');
        const User = require('../models/User');

        const user = await User.findById(req.user.id);
        const discountRate = user.getDiscountRate();
        const originalPrice = selectedPackage.price;
        const finalPrice = Math.round(originalPrice * (1 - discountRate));

        const order = new Order({
            user: req.user.id,
            service: null, // Special handling for keyword services
            quantity: 1,
            targetUrl,
            unitPrice: originalPrice,
            totalAmount: originalPrice,
            discountAmount: originalPrice - finalPrice,
            finalAmount: finalPrice,
            metadata: {
                type: 'keyword_campaign',
                campaignType: type,
                platform,
                packageId,
                packageName: selectedPackage.name,
                keywords,
                duration: selectedPackage.duration,
                targetAudience,
                additionalInfo,
                features: selectedPackage.features
            }
        });

        await order.save();

        res.status(201).json({
            success: true,
            message: '키워드 캠페인 주문이 생성되었습니다.',
            data: {
                order,
                package: selectedPackage,
                originalPrice,
                finalPrice,
                discountRate: discountRate * 100
            }
        });
    } catch (error) {
        console.error('Create keyword order error:', error);
        res.status(500).json({
            success: false,
            message: '키워드 캠페인 주문 생성 중 오류가 발생했습니다.'
        });
    }
});

// Calculate keyword package price
router.post('/calculate-price', auth, [
    body('type')
        .isIn(['video', 'live'])
        .withMessage('유효한 캠페인 타입을 선택해주세요.'),
    body('platform')
        .isIn(['youtube', 'tiktok', 'instagram', 'facebook'])
        .withMessage('유효한 플랫폼을 선택해주세요.'),
    body('packageId')
        .notEmpty()
        .withMessage('패키지를 선택해주세요.')
], async (req, res) => {
    try {
        const { type, platform, packageId } = req.body;

        // Find package
        const selectedPackage = keywordPackages[type]?.[platform]?.find(pkg => pkg.id === packageId);

        if (!selectedPackage) {
            return res.status(404).json({
                success: false,
                message: '선택한 패키지를 찾을 수 없습니다.'
            });
        }

        // Get user discount rate
        const User = require('../models/User');
        const user = await User.findById(req.user.id);
        const discountRate = user.getDiscountRate();

        const originalPrice = selectedPackage.price;
        const discount = Math.round(originalPrice * discountRate);
        const finalPrice = originalPrice - discount;

        res.json({
            success: true,
            data: {
                package: selectedPackage,
                originalPrice,
                discount,
                discountRate: discountRate * 100,
                finalPrice,
                userLevel: user.membershipLevel
            }
        });
    } catch (error) {
        console.error('Calculate keyword price error:', error);
        res.status(500).json({
            success: false,
            message: '가격 계산 중 오류가 발생했습니다.'
        });
    }
});

// Get keyword campaign orders (User)
router.get('/orders', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, type, platform, status } = req.query;

        const Order = require('../models/Order');

        const query = {
            user: req.user.id,
            'metadata.type': 'keyword_campaign'
        };

        if (type) {
            query['metadata.campaignType'] = type;
        }

        if (platform) {
            query['metadata.platform'] = platform;
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        const orders = await Order.find(query)
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
        console.error('Get keyword orders error:', error);
        res.status(500).json({
            success: false,
            message: '키워드 캠페인 주문 조회 중 오류가 발생했습니다.'
        });
    }
});

// Admin: Get all keyword campaign orders
router.get('/admin/orders', auth, adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20, type, platform, status, search } = req.query;

        const Order = require('../models/Order');

        const query = {
            'metadata.type': 'keyword_campaign'
        };

        if (type) {
            query['metadata.campaignType'] = type;
        }

        if (platform) {
            query['metadata.platform'] = platform;
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { targetUrl: { $regex: search, $options: 'i' } },
                { 'metadata.keywords': { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const orders = await Order.find(query)
            .populate('user', 'name email membershipLevel')
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
        console.error('Get admin keyword orders error:', error);
        res.status(500).json({
            success: false,
            message: '키워드 캠페인 주문 조회 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
