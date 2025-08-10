// SMMTurk API 통합 모듈 (Netlify Functions용)
class SMMTurkNetlifyAPI {
    constructor() {
        this.baseURL = 'https://api.smmturk.com';
        this.apiKey = process.env.SMMTURK_API_KEY || '';
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                }
            };

            if (data && method !== 'GET') {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'API request failed');
            }

            return result;
        } catch (error) {
            console.error('SMMTurk API Error:', error);
            throw error;
        }
    }

    // 서비스 목록 조회
    async getServices() {
        return this.makeRequest('/services');
    }

    // 주문 생성
    async createOrder(serviceId, quantity, link) {
        return this.makeRequest('/orders', 'POST', {
            service: serviceId,
            quantity,
            link
        });
    }

    // 주문 상태 확인
    async getOrderStatus(orderId) {
        return this.makeRequest(`/orders/${orderId}`);
    }

    // 잔액 조회
    async getBalance() {
        return this.makeRequest('/balance');
    }

    // 주문 목록 조회
    async getOrders(limit = 100) {
        return this.makeRequest(`/orders?limit=${limit}`);
    }
}

module.exports = { SMMTurkNetlifyAPI };