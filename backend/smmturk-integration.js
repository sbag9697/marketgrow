// SMM Turk API 통합 모듈
// SMM Turk에서 서비스를 가져오고 주문을 전달하는 시스템

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class SMMTurkIntegration {
    constructor() {
        // SMM Turk API 정보
        this.apiUrl = 'https://smmturk.org/api/v2';
        this.apiKey = process.env.SMMTURK_API_KEY || 'YOUR_API_KEY_HERE';

        // 마진 설정 (800% 마진 = 9배)
        this.marginMultiplier = 9.0;

        // 환율 (필요시 조정)
        this.exchangeRate = 1; // SMM Turk가 원화를 지원하면 1, 달러면 1300 등
    }

    // API 요청 헬퍼
    async makeRequest(action, params = {}) {
        try {
            const response = await axios.post(this.apiUrl, {
                key: this.apiKey,
                action,
                ...params
            });

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            return response.data;
        } catch (error) {
            console.error(`SMM Turk API 오류 (${action}):`, error.message);
            throw error;
        }
    }

    // 서비스 목록 가져오기
    async fetchServices() {
        try {
            console.log('SMM Turk 서비스 목록 가져오는 중...');
            const response = await this.makeRequest('services');

            if (!response || !Array.isArray(response)) {
                throw new Error('잘못된 응답 형식');
            }

            // 서비스 데이터 변환 및 마진 적용
            const services = response.map(service => ({
                // SMM Turk 원본 정보
                smmturk_id: service.service,
                smmturk_price: parseFloat(service.rate),

                // 우리 서비스 정보
                name: this.translateServiceName(service.name),
                category: this.categorizeService(service.category),

                // 800% 마진 적용한 가격 (9배)
                price: Math.ceil(parseFloat(service.rate) * this.marginMultiplier * this.exchangeRate),

                // 서비스 상세 정보
                min_quantity: parseInt(service.min),
                max_quantity: parseInt(service.max),
                description: service.description || service.name,

                // 추가 정보
                type: service.type,
                dripfeed: service.dripfeed === 1,
                refill: service.refill === 1,
                cancel: service.cancel === 1,

                // 메타 정보
                platform: this.detectPlatform(service.name),
                is_active: true,
                updated_at: new Date().toISOString()
            }));

            console.log(`${services.length}개 서비스 가져옴`);
            return services;
        } catch (error) {
            console.error('서비스 목록 가져오기 실패:', error);
            throw error;
        }
    }

    // 서비스명 번역/변환
    translateServiceName(name) {
        const translations = {
            'Instagram Followers': '인스타그램 팔로워',
            'Instagram Likes': '인스타그램 좋아요',
            'Instagram Views': '인스타그램 조회수',
            'Instagram Comments': '인스타그램 댓글',
            'YouTube Views': '유튜브 조회수',
            'YouTube Subscribers': '유튜브 구독자',
            'YouTube Likes': '유튜브 좋아요',
            'TikTok Followers': '틱톡 팔로워',
            'TikTok Likes': '틱톡 좋아요',
            'TikTok Views': '틱톡 조회수',
            'Facebook Likes': '페이스북 좋아요',
            'Facebook Followers': '페이스북 팔로워',
            'Twitter Followers': '트위터 팔로워',
            'Twitter Likes': '트위터 좋아요'
        };

        // 번역이 있으면 사용, 없으면 원본 반환
        for (const [eng, kor] of Object.entries(translations)) {
            if (name.toLowerCase().includes(eng.toLowerCase())) {
                return name.replace(new RegExp(eng, 'gi'), kor);
            }
        }

        return name;
    }

    // 서비스 카테고리 분류
    categorizeService(category) {
        const categoryMap = {
            instagram: '인스타그램',
            youtube: '유튜브',
            tiktok: '틱톡',
            facebook: '페이스북',
            twitter: '트위터',
            telegram: '텔레그램',
            spotify: '스포티파이'
        };

        const lowerCategory = category.toLowerCase();
        for (const [key, value] of Object.entries(categoryMap)) {
            if (lowerCategory.includes(key)) {
                return value;
            }
        }

        return category;
    }

    // 플랫폼 감지
    detectPlatform(name) {
        const platforms = ['instagram', 'youtube', 'tiktok', 'facebook', 'twitter', 'telegram', 'spotify'];
        const lowerName = name.toLowerCase();

        for (const platform of platforms) {
            if (lowerName.includes(platform)) {
                return platform;
            }
        }

        return 'other';
    }

    // 주문 생성 (SMM Turk로 전달)
    async createOrder(orderData) {
        try {
            console.log('SMM Turk로 주문 전달:', orderData);

            // SMM Turk API 형식으로 변환
            const smmturkOrder = {
                service: orderData.smmturk_service_id,
                link: orderData.link,
                quantity: orderData.quantity
            };

            // 추가 옵션들
            if (orderData.comments) {
                smmturkOrder.comments = orderData.comments;
            }
            if (orderData.username) {
                smmturkOrder.username = orderData.username;
            }
            if (orderData.hashtag) {
                smmturkOrder.hashtag = orderData.hashtag;
            }
            if (orderData.hashtags) {
                smmturkOrder.hashtags = orderData.hashtags;
            }

            // 주문 전송
            const response = await this.makeRequest('add', smmturkOrder);

            if (response.order) {
                console.log(`주문 성공! SMM Turk 주문 ID: ${response.order}`);
                return {
                    success: true,
                    smmturk_order_id: response.order,
                    currency: response.currency || 'KRW',
                    charge: response.charge || 0
                };
            } else {
                throw new Error('주문 생성 실패');
            }
        } catch (error) {
            console.error('주문 전달 실패:', error);
            throw error;
        }
    }

    // 주문 상태 확인
    async checkOrderStatus(orderId) {
        try {
            const response = await this.makeRequest('status', { order: orderId });

            return {
                status: this.translateStatus(response.status),
                start_count: response.start_count || 0,
                remains: response.remains || 0,
                charge: response.charge || 0,
                currency: response.currency || 'KRW'
            };
        } catch (error) {
            console.error('주문 상태 확인 실패:', error);
            throw error;
        }
    }

    // 상태 번역
    translateStatus(status) {
        const statusMap = {
            Pending: '대기중',
            'In progress': '진행중',
            Processing: '처리중',
            Completed: '완료',
            Partial: '부분완료',
            Canceled: '취소됨',
            Refunded: '환불됨'
        };

        return statusMap[status] || status;
    }

    // 잔액 확인
    async checkBalance() {
        try {
            const response = await this.makeRequest('balance');
            return {
                balance: parseFloat(response.balance || 0),
                currency: response.currency || 'USD'
            };
        } catch (error) {
            console.error('잔액 확인 실패:', error);
            throw error;
        }
    }

    // 서비스 데이터 저장
    async saveServicesToFile(services) {
        try {
            const filePath = path.join(__dirname, 'config', 'smmturk-services.json');

            // config 폴더 생성
            await fs.mkdir(path.dirname(filePath), { recursive: true });

            // 파일 저장
            await fs.writeFile(
                filePath,
                JSON.stringify(services, null, 2),
                'utf8'
            );

            console.log(`서비스 데이터 저장 완료: ${filePath}`);
            return true;
        } catch (error) {
            console.error('서비스 데이터 저장 실패:', error);
            throw error;
        }
    }

    // 서비스 데이터 로드
    async loadServicesFromFile() {
        try {
            const filePath = path.join(__dirname, 'config', 'smmturk-services.json');
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('서비스 데이터 로드 실패:', error);
            return [];
        }
    }
}

// Express 라우터
const express = require('express');
const router = express.Router();
const smmturk = new SMMTurkIntegration();

// 서비스 목록 동기화
router.get('/sync-services', async (req, res) => {
    try {
        const services = await smmturk.fetchServices();
        await smmturk.saveServicesToFile(services);

        res.json({
            success: true,
            message: `${services.length}개 서비스 동기화 완료`,
            services: services.slice(0, 10) // 샘플로 10개만 반환
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 서비스 목록 조회
router.get('/services', async (req, res) => {
    try {
        const services = await smmturk.loadServicesFromFile();

        // 필터링 옵션
        const { platform, category, search } = req.query;
        let filtered = services;

        if (platform) {
            filtered = filtered.filter(s => s.platform === platform);
        }
        if (category) {
            filtered = filtered.filter(s => s.category === category);
        }
        if (search) {
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(search.toLowerCase()) ||
                s.description.toLowerCase().includes(search.toLowerCase())
            );
        }

        res.json({
            success: true,
            count: filtered.length,
            services: filtered
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 주문 생성
router.post('/create-order', async (req, res) => {
    try {
        const result = await smmturk.createOrder(req.body);

        res.json({
            success: true,
            message: '주문이 성공적으로 생성되었습니다',
            ...result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 주문 상태 확인
router.get('/order-status/:orderId', async (req, res) => {
    try {
        const status = await smmturk.checkOrderStatus(req.params.orderId);

        res.json({
            success: true,
            ...status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 잔액 확인
router.get('/balance', async (req, res) => {
    try {
        const balance = await smmturk.checkBalance();

        res.json({
            success: true,
            ...balance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = { SMMTurkIntegration, router };

// 독립 실행 (테스트용)
if (require.main === module) {
    const app = express();
    app.use(express.json());
    app.use('/api/smmturk', router);

    const PORT = process.env.PORT || 5002;
    app.listen(PORT, () => {
        console.log(`
====================================
🚀 SMM Turk 통합 서버 실행
====================================
포트: ${PORT}
API: http://localhost:${PORT}/api/smmturk

엔드포인트:
- GET  /api/smmturk/sync-services    - 서비스 동기화
- GET  /api/smmturk/services         - 서비스 목록
- POST /api/smmturk/create-order     - 주문 생성
- GET  /api/smmturk/order-status/:id - 주문 상태
- GET  /api/smmturk/balance          - 잔액 확인
====================================
        `);
    });
}
