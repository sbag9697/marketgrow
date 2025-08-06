const axios = require('axios');
const crypto = require('crypto');

class SMMPanelService {
    constructor() {
        // SMM 패널 API 설정
        this.apiUrl = process.env.SMM_PANEL_API_URL || 'https://smmturk.org/api/v2';
        this.apiKey = process.env.SMM_PANEL_API_KEY;
        
        // 서비스 ID 매핑 (MarketGrow 서비스 -> SMM 패널 서비스)
        this.serviceMapping = {
            // Instagram
            'instagram_followers': 1234,  // 실제 SMM 패널 서비스 ID로 변경 필요
            'instagram_likes': 1235,
            'instagram_comments': 1236,
            'instagram_views': 1237,
            
            // YouTube
            'youtube_subscribers': 2234,
            'youtube_views': 2235,
            'youtube_likes': 2236,
            
            // TikTok
            'tiktok_followers': 3234,
            'tiktok_likes': 3235,
            
            // Facebook
            'facebook_page_likes': 4234,
            
            // Twitter
            'twitter_followers': 5234
        };
        
        // 가격 마진 설정 (%)
        this.priceMargin = parseFloat(process.env.PRICE_MARGIN || '90');
    }

    /**
     * SMM 패널 API 호출
     */
    async apiRequest(action, params = {}) {
        try {
            const response = await axios.post(this.apiUrl, {
                key: this.apiKey,
                action: action,
                ...params
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            return response.data;
        } catch (error) {
            console.error('SMM Panel API Error:', error);
            throw error;
        }
    }

    /**
     * 서비스 목록 가져오기
     */
    async getServices() {
        try {
            const response = await this.apiRequest('services');
            return response;
        } catch (error) {
            console.error('서비스 목록 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 잔액 확인
     */
    async getBalance() {
        try {
            const response = await this.apiRequest('balance');
            return response.balance || 0;
        } catch (error) {
            console.error('잔액 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 주문 생성
     */
    async createOrder(orderData) {
        try {
            const {
                service,
                link,
                quantity,
                customData
            } = orderData;

            // MarketGrow 서비스 ID를 SMM 패널 서비스 ID로 변환
            const smmServiceId = this.getServiceMapping(service);
            if (!smmServiceId) {
                throw new Error('지원하지 않는 서비스입니다.');
            }

            // SMM 패널에 주문 생성
            const params = {
                service: smmServiceId,
                link: link,
                quantity: quantity
            };

            // 커스텀 데이터가 있는 경우 (예: 댓글)
            if (customData) {
                params.custom_data = customData;
            }

            const response = await this.apiRequest('add', params);

            return {
                success: true,
                orderId: response.order,
                smmOrderId: response.order,
                estimatedStartTime: response.start_time,
                estimatedCompletionTime: response.completion_time
            };
        } catch (error) {
            console.error('주문 생성 실패:', error);
            throw error;
        }
    }

    /**
     * 주문 상태 확인
     */
    async checkOrderStatus(orderId) {
        try {
            const response = await this.apiRequest('status', {
                order: orderId
            });

            return {
                status: this.mapOrderStatus(response.status),
                startCount: response.start_count,
                remains: response.remains,
                charge: response.charge,
                currency: response.currency
            };
        } catch (error) {
            console.error('주문 상태 확인 실패:', error);
            throw error;
        }
    }

    /**
     * 여러 주문 상태 확인
     */
    async checkMultipleOrders(orderIds) {
        try {
            const response = await this.apiRequest('status', {
                orders: orderIds.join(',')
            });

            return response;
        } catch (error) {
            console.error('다중 주문 상태 확인 실패:', error);
            throw error;
        }
    }

    /**
     * 주문 취소
     */
    async cancelOrder(orderId) {
        try {
            const response = await this.apiRequest('cancel', {
                order: orderId
            });

            return {
                success: true,
                refund: response.refund
            };
        } catch (error) {
            console.error('주문 취소 실패:', error);
            throw error;
        }
    }

    /**
     * 서비스 가격 계산 (마진 포함)
     */
    calculatePrice(originalPrice, quantity) {
        const basePrice = originalPrice * quantity / 1000; // 1000개당 가격
        const marginAmount = basePrice * (this.priceMargin / 100);
        const finalPrice = Math.ceil(basePrice + marginAmount);
        
        return {
            originalPrice: basePrice,
            margin: marginAmount,
            finalPrice: finalPrice,
            pricePerThousand: Math.ceil(finalPrice / quantity * 1000)
        };
    }

    /**
     * 서비스 매핑 가져오기
     */
    getServiceMapping(marketGrowServiceKey) {
        return this.serviceMapping[marketGrowServiceKey] || null;
    }

    /**
     * 주문 상태 매핑
     */
    mapOrderStatus(smmStatus) {
        const statusMap = {
            'Pending': 'pending',
            'In progress': 'processing',
            'Completed': 'completed',
            'Partial': 'partial',
            'Canceled': 'cancelled',
            'Processing': 'processing',
            'Fail': 'failed'
        };

        return statusMap[smmStatus] || 'unknown';
    }

    /**
     * 서비스 동기화
     */
    async syncServices() {
        try {
            const smmServices = await this.getServices();
            const syncedServices = [];

            for (const smmService of smmServices) {
                // 필요한 서비스만 필터링
                if (this.isServiceSupported(smmService)) {
                    syncedServices.push({
                        smmId: smmService.service,
                        name: smmService.name,
                        category: smmService.category,
                        rate: smmService.rate,
                        min: smmService.min,
                        max: smmService.max,
                        description: smmService.description,
                        marketGrowPrice: this.calculatePrice(smmService.rate, 1000).finalPrice
                    });
                }
            }

            return syncedServices;
        } catch (error) {
            console.error('서비스 동기화 실패:', error);
            throw error;
        }
    }

    /**
     * 지원 서비스 확인
     */
    isServiceSupported(smmService) {
        // 서비스 이름이나 카테고리로 필터링
        const supportedCategories = ['Instagram', 'YouTube', 'TikTok', 'Facebook', 'Twitter'];
        return supportedCategories.some(cat => 
            smmService.category.toLowerCase().includes(cat.toLowerCase())
        );
    }
}

module.exports = new SMMPanelService();