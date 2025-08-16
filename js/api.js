// API 기본 설정 (global-config.js에서 가져오기)
const API_BASE_URL = window.API_BASE || 'http://localhost:5001/api' || '/api';

// API 클래스
class API {
    constructor() {
        this.token = localStorage.getItem('authToken');
    }

    // 공통 헤더 생성
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        // Add CSRF token if available
        if (window.SecurityUtils?.CSRFToken) {
            window.SecurityUtils.CSRFToken.addToHeaders(headers);
        }

        return headers;
    }

    // 공통 fetch 래퍼
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: this.getHeaders(options.auth !== false),
            ...options
        };

        console.log('API Request:', url, config);

        try {
            const response = await fetch(url, config);

            // 응답이 JSON이 아닐 수 있음
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('서버 응답 형식 오류');
            }

            console.log('API Response:', data);

            if (!response.ok) {
                let errorMessage = data.message || '요청 처리 중 오류가 발생했습니다.';

                // 상태 코드별 구체적인 메시지
                if (response.status === 500) {
                    errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
                } else if (response.status === 401) {
                    errorMessage = data.message || '아이디 또는 비밀번호가 올바르지 않습니다.';
                } else if (response.status === 404) {
                    errorMessage = '요청한 서비스를 찾을 수 없습니다.';
                } else if (response.status === 400) {
                    errorMessage = data.message || '입력 정보를 확인해주세요.';
                }

                const error = new Error(errorMessage);
                error.response = { data, status: response.status };
                throw error;
            }

            return data;
        } catch (error) {
            console.error('API 요청 오류:', error);

            // 네트워크 오류인 경우
            if (error.message === 'Failed to fetch') {
                error.message = '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
            }

            throw error;
        }
    }

    // GET 요청
    async get(endpoint, options = {}) {
        return this.request(endpoint, { method: 'GET', ...options });
    }

    // POST 요청
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    }

    // PUT 요청
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
    }

    // DELETE 요청
    async delete(endpoint, options = {}) {
        return this.request(endpoint, { method: 'DELETE', ...options });
    }

    // 토큰 설정
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    // 토큰 제거
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // 인증 관련 API
    async login(credentials) {
        const response = await this.post('/auth/login', credentials, { auth: false });
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
        }
        return response;
    }

    async register(userData) {
        const response = await this.post('/auth/register', userData, { auth: false });
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
        }
        return response;
    }

    async logout() {
        this.clearToken();
        return { success: true };
    }

    async getProfile() {
        return this.get('/auth/profile');
    }

    async updateProfile(data) {
        return this.put('/auth/profile', data);
    }

    async changePassword(data) {
        return this.put('/auth/change-password', data);
    }

    // 대시보드 API
    async getDashboard() {
        return this.get('/dashboard');
    }

    // 서비스 관련 API
    async getServices(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/services?${queryString}` : '/services';
        return this.get(endpoint, { auth: false });
    }

    async getServiceById(id) {
        return this.get(`/services/${id}`, { auth: false });
    }

    async getServicesByPlatform(platform) {
        return this.get(`/services/platform/${platform}`, { auth: false });
    }

    async calculatePrice(serviceId, quantity) {
        return this.post(`/services/${serviceId}/calculate-price`, { quantity });
    }

    // 주문 관련 API
    async createOrder(orderData) {
        return this.post('/orders', orderData);
    }

    async getOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/orders?${queryString}` : '/orders';
        return this.get(endpoint);
    }

    async getOrderById(id) {
        return this.get(`/orders/${id}`);
    }

    async getOrder(id) {
        return this.get(`/orders/${id}`);
    }

    async cancelOrder(id, reason) {
        return this.post(`/orders/${id}/cancel`, { reason });
    }

    // 결제 관련 API
    async initializePayment(paymentData) {
        return this.post('/payments/initialize', paymentData);
    }

    async confirmKGInicisPayment(confirmData) {
        return this.post('/payments/inicis/confirm', confirmData);
    }

    async createBankTransferOrder(orderData) {
        return this.post('/payments/bank-transfer', orderData);
    }

    async getPayments(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/payments?${queryString}` : '/payments';
        return this.get(endpoint);
    }

    async getPaymentById(id) {
        return this.get(`/payments/${id}`);
    }

    async checkUserPaymentLimit() {
        return this.get('/users/payment-limit');
    }

    async applyCoupon(couponData) {
        return this.post('/coupons/apply', couponData);
    }

    async usePoints(pointData) {
        return this.post('/points/use', pointData);
    }

    // 키워드 관련 API
    async getKeywordPackages(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/keywords/packages?${queryString}` : '/keywords/packages';
        return this.get(endpoint, { auth: false });
    }

    async calculateKeywordPrice(data) {
        return this.post('/keywords/calculate-price', data);
    }

    async createKeywordOrder(orderData) {
        return this.post('/keywords/order', orderData);
    }

    // 상담 관련 API
    async createConsultation(consultationData) {
        return this.post('/consultations', consultationData, { auth: false });
    }

    // 사용자 대시보드 API
    async getDashboard() {
        return this.get('/users/dashboard');
    }

    async getReferrals() {
        return this.get('/users/referrals');
    }

    // 알림 관련 API
    async getNotificationSettings() {
        return this.get('/notifications/settings');
    }

    async updateNotificationSettings(settings) {
        return this.put('/notifications/settings', settings);
    }

    async getNotificationHistory(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/notifications/history${queryString ? `?${queryString}` : ''}`);
    }

    async clearNotificationHistory() {
        return this.delete('/notifications/history');
    }

    async sendPhoneVerification(phoneNumber) {
        return this.post('/notifications/verify-phone', { phoneNumber });
    }

    async verifyPhoneNumber(phoneNumber, verificationCode) {
        return this.post('/notifications/confirm-phone', { phoneNumber, verificationCode });
    }

    async sendTestNotification(type, recipient) {
        return this.post('/notifications/test', { type, recipient });
    }

    async trackNotificationSent(notificationData) {
        return this.post('/notifications/track', notificationData);
    }
}

// 전역 API 인스턴스
const api = new API();

// 에러 처리 유틸리티
const handleApiError = (error, fallbackMessage = '오류가 발생했습니다.') => {
    console.error('API 에러 상세:', error);

    // 에러 응답이 있는 경우
    if (error.response) {
        console.log('Error response status:', error.response.status);
        console.log('Error response data:', error.response.data);

        if (error.response.data && error.response.data.message) {
            return error.response.data.message;
        }

        // 상태 코드별 메시지
        switch (error.response.status) {
            case 401:
                api.clearToken();
                return '인증 정보가 올바르지 않습니다.';
            case 404:
                return '요청한 리소스를 찾을 수 없습니다.';
            case 500:
                return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            default:
                return error.message || fallbackMessage;
        }
    }

    // 네트워크 에러 등
    if (error.message) {
        return error.message;
    }

    return fallbackMessage;
};

// 로딩 상태 관리 유틸리티 (중복 방지)
if (!window.LoadingManager) {
    window.LoadingManager = {
        show(element) {
            if (element) {
                element.disabled = true;
                element.classList.add('loading');
                const originalText = element.textContent;
                element.dataset.originalText = originalText;
                element.textContent = '처리 중...';
            }
        },

        hide(element) {
            if (element) {
                element.disabled = false;
                element.classList.remove('loading');
                if (element.dataset.originalText) {
                    element.textContent = element.dataset.originalText;
                    delete element.dataset.originalText;
                }
            }
        }
    };
}

// 알림 표시 유틸리티 (중복 방지)
if (!window.NotificationManager) {
    window.NotificationManager = {
        show(message, type = 'info', duration = 5000) {
        // 기존 알림 제거
            const existingNotification = document.querySelector('.notification');
            if (existingNotification) {
                existingNotification.remove();
            }

            // 새 알림 생성
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

            // 스타일 적용
            notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            min-width: 300px;
            max-width: 500px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
        `;

            // 타입별 색상
            const colors = {
                success: '#28a745',
                error: '#dc3545',
                warning: '#ffc107',
                info: '#007bff'
            };
            notification.style.backgroundColor = colors[type] || colors.info;

            // 문서에 추가
            document.body.appendChild(notification);

            // 닫기 버튼 이벤트
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => {
                notification.remove();
            });

            // 자동 제거
            if (duration > 0) {
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, duration);
            }
        },

        success(message, duration) {
            this.show(message, 'success', duration);
        },

        error(message, duration) {
            this.show(message, 'error', duration);
        },

        warning(message, duration) {
            this.show(message, 'warning', duration);
        },

        info(message, duration) {
            this.show(message, 'info', duration);
        }
    };
}

// CSS 애니메이션 추가
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            margin-left: 10px;
            opacity: 0.8;
        }
        
        .notification-close:hover {
            opacity: 1;
        }
        
        .loading {
            opacity: 0.7;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
}
