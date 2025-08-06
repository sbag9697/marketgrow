require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./models/Service');

const services = [
    // Instagram Services
    {
        name: '인스타그램 팔로워 늘리기',
        nameEn: 'Instagram Followers',
        description: '고품질 인스타그램 팔로워를 빠르고 안전하게 늘려드립니다',
        platform: 'instagram',
        category: 'followers',
        tags: ['팔로워', '인스타그램', '팔로우'],
        minQuantity: 100,
        maxQuantity: 10000,
        pricing: [
            { quantity: 100, price: 3000 },
            { quantity: 500, price: 13000 },
            { quantity: 1000, price: 24000 },
            { quantity: 5000, price: 110000 },
            { quantity: 10000, price: 200000 }
        ],
        deliveryTime: { min: 1, max: 24, unit: 'hours' },
        guaranteePeriod: 30,
        isActive: true,
        features: [
            '실제 활성 사용자',
            '점진적인 증가',
            '30일 보장',
            '24시간 고객 지원'
        ]
    },
    {
        name: '인스타그램 좋아요 늘리기',
        nameEn: 'Instagram Likes',
        description: '게시물 좋아요를 자연스럽게 늘려 인기도를 높입니다',
        platform: 'instagram',
        category: 'likes',
        tags: ['좋아요', '인스타그램', '하트'],
        minQuantity: 100,
        maxQuantity: 50000,
        pricing: [
            { quantity: 100, price: 2000 },
            { quantity: 500, price: 8000 },
            { quantity: 1000, price: 15000 },
            { quantity: 5000, price: 65000 },
            { quantity: 10000, price: 120000 }
        ],
        deliveryTime: { min: 1, max: 12, unit: 'hours' },
        guaranteePeriod: 30,
        isActive: true,
        features: [
            '즉시 시작',
            '안전한 진행',
            '게시물별 주문 가능',
            '드롭 방지'
        ]
    },
    {
        name: '인스타그램 댓글 늘리기',
        nameEn: 'Instagram Comments',
        description: '맞춤형 댓글로 게시물 참여도를 높입니다',
        platform: 'instagram',
        category: 'comments',
        tags: ['댓글', '인스타그램', '참여'],
        minQuantity: 10,
        maxQuantity: 1000,
        pricing: [
            { quantity: 10, price: 5000 },
            { quantity: 50, price: 20000 },
            { quantity: 100, price: 35000 },
            { quantity: 500, price: 150000 },
            { quantity: 1000, price: 280000 }
        ],
        deliveryTime: { min: 1, max: 48, unit: 'hours' },
        guaranteePeriod: 30,
        isActive: true,
        features: [
            '한국어 댓글',
            '맞춤 댓글 가능',
            '자연스러운 분산',
            '스팸 방지'
        ]
    },
    {
        name: '인스타그램 조회수 늘리기',
        nameEn: 'Instagram Views',
        description: '릴스, 비디오 조회수를 빠르게 증가시킵니다',
        platform: 'instagram',
        category: 'views',
        tags: ['조회수', '인스타그램', '릴스', '비디오'],
        minQuantity: 1000,
        maxQuantity: 100000,
        pricing: [
            { quantity: 1000, price: 2000 },
            { quantity: 5000, price: 8000 },
            { quantity: 10000, price: 15000 },
            { quantity: 50000, price: 65000 },
            { quantity: 100000, price: 120000 }
        ],
        deliveryTime: { min: 1, max: 24, unit: 'hours' },
        guaranteePeriod: 0,
        isActive: true,
        features: [
            '즉시 시작',
            '모든 비디오 형식 지원',
            '안정적인 증가',
            '통계 개선'
        ]
    },

    // YouTube Services
    {
        name: '유튜브 구독자 늘리기',
        nameEn: 'YouTube Subscribers',
        description: '채널 구독자를 안전하게 증가시켜 드립니다',
        platform: 'youtube',
        category: 'subscribers',
        tags: ['구독자', '유튜브', '채널'],
        minQuantity: 100,
        maxQuantity: 10000,
        pricing: [
            { quantity: 100, price: 8000 },
            { quantity: 500, price: 35000 },
            { quantity: 1000, price: 65000 },
            { quantity: 5000, price: 300000 },
            { quantity: 10000, price: 550000 }
        ],
        deliveryTime: { min: 1, max: 7, unit: 'days' },
        guaranteePeriod: 60,
        isActive: true,
        features: [
            '고품질 구독자',
            '60일 보장',
            '점진적 증가',
            '채널 성장 도움'
        ]
    },
    {
        name: '유튜브 조회수 늘리기',
        nameEn: 'YouTube Views',
        description: '동영상 조회수를 자연스럽게 증가시킵니다',
        platform: 'youtube',
        category: 'views',
        tags: ['조회수', '유튜브', '동영상'],
        minQuantity: 1000,
        maxQuantity: 100000,
        pricing: [
            { quantity: 1000, price: 3000 },
            { quantity: 5000, price: 12000 },
            { quantity: 10000, price: 22000 },
            { quantity: 50000, price: 95000 },
            { quantity: 100000, price: 180000 }
        ],
        deliveryTime: { min: 1, max: 48, unit: 'hours' },
        guaranteePeriod: 30,
        isActive: true,
        features: [
            '고품질 조회수',
            '시청 지속 시간 개선',
            '알고리즘 최적화',
            '수익화 안전'
        ]
    },
    {
        name: '유튜브 좋아요 늘리기',
        nameEn: 'YouTube Likes',
        description: '동영상 좋아요를 늘려 참여도를 높입니다',
        platform: 'youtube',
        category: 'likes',
        tags: ['좋아요', '유튜브', '추천'],
        minQuantity: 100,
        maxQuantity: 10000,
        pricing: [
            { quantity: 100, price: 3000 },
            { quantity: 500, price: 12000 },
            { quantity: 1000, price: 22000 },
            { quantity: 5000, price: 95000 },
            { quantity: 10000, price: 180000 }
        ],
        deliveryTime: { min: 1, max: 24, unit: 'hours' },
        guaranteePeriod: 30,
        isActive: true,
        features: [
            '실제 사용자 좋아요',
            '빠른 배송',
            '영상 순위 상승',
            '자연스러운 증가'
        ]
    },

    // TikTok Services
    {
        name: '틱톡 팔로워 늘리기',
        nameEn: 'TikTok Followers',
        description: '틱톡 팔로워를 빠르게 증가시켜드립니다',
        platform: 'tiktok',
        category: 'followers',
        tags: ['팔로워', '틱톡', 'TikTok'],
        minQuantity: 100,
        maxQuantity: 10000,
        pricing: [
            { quantity: 100, price: 4000 },
            { quantity: 500, price: 18000 },
            { quantity: 1000, price: 32000 },
            { quantity: 5000, price: 140000 },
            { quantity: 10000, price: 260000 }
        ],
        deliveryTime: { min: 1, max: 48, unit: 'hours' },
        guaranteePeriod: 30,
        isActive: true,
        features: [
            '고품질 팔로워',
            '프로필 성장',
            '빠른 배송',
            '30일 보장'
        ]
    },
    {
        name: '틱톡 좋아요 늘리기',
        nameEn: 'TikTok Likes',
        description: '영상 좋아요를 늘려 인기도를 높입니다',
        platform: 'tiktok',
        category: 'likes',
        tags: ['좋아요', '틱톡', '하트'],
        minQuantity: 100,
        maxQuantity: 50000,
        pricing: [
            { quantity: 100, price: 2500 },
            { quantity: 500, price: 10000 },
            { quantity: 1000, price: 18000 },
            { quantity: 5000, price: 80000 },
            { quantity: 10000, price: 150000 }
        ],
        deliveryTime: { min: 1, max: 24, unit: 'hours' },
        guaranteePeriod: 30,
        isActive: true,
        features: [
            '즉시 시작',
            '알고리즘 부스트',
            '자연스러운 증가',
            '영상별 주문'
        ]
    },

    // Facebook Services
    {
        name: '페이스북 페이지 좋아요',
        nameEn: 'Facebook Page Likes',
        description: '페이스북 페이지 팬을 늘려드립니다',
        platform: 'facebook',
        category: 'likes',
        tags: ['좋아요', '페이스북', '페이지'],
        minQuantity: 100,
        maxQuantity: 10000,
        pricing: [
            { quantity: 100, price: 5000 },
            { quantity: 500, price: 22000 },
            { quantity: 1000, price: 40000 },
            { quantity: 5000, price: 180000 },
            { quantity: 10000, price: 340000 }
        ],
        deliveryTime: { min: 1, max: 7, unit: 'days' },
        guaranteePeriod: 30,
        isActive: true,
        features: [
            '실제 사용자',
            '페이지 신뢰도 상승',
            '타겟팅 가능',
            '안전한 증가'
        ]
    },

    // Twitter Services
    {
        name: '트위터 팔로워 늘리기',
        nameEn: 'Twitter Followers',
        description: '트위터 팔로워를 안전하게 늘려드립니다',
        platform: 'twitter',
        category: 'followers',
        tags: ['팔로워', '트위터', 'X'],
        minQuantity: 100,
        maxQuantity: 10000,
        pricing: [
            { quantity: 100, price: 4000 },
            { quantity: 500, price: 18000 },
            { quantity: 1000, price: 32000 },
            { quantity: 5000, price: 140000 },
            { quantity: 10000, price: 260000 }
        ],
        deliveryTime: { min: 1, max: 48, unit: 'hours' },
        guaranteePeriod: 30,
        isActive: true,
        features: [
            '고품질 팔로워',
            '프로필 개선',
            '영향력 증가',
            '안전한 방법'
        ]
    }
];

async function seedServices() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB 연결됨');

        // 기존 서비스 삭제
        await Service.deleteMany({});
        console.log('기존 서비스 삭제됨');

        // 새 서비스 추가
        const createdServices = await Service.insertMany(services);
        console.log(`${createdServices.length}개의 서비스가 추가되었습니다`);

        // 추가된 서비스 확인
        const platforms = [...new Set(services.map(s => s.platform))];
        for (const platform of platforms) {
            const count = await Service.countDocuments({ platform });
            console.log(`${platform}: ${count}개 서비스`);
        }

        process.exit(0);
    } catch (error) {
        console.error('서비스 시딩 오류:', error);
        process.exit(1);
    }
}

seedServices();