// 글로벌 설정 파일 - 모든 페이지에서 공통으로 사용
(function() {
    'use strict';
    
    // API 기본 URL 설정 - Render 백엔드 직접 연결
    const API_ORIGIN = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === ''
        ? 'http://localhost:5001'
        : 'https://marketgrow.onrender.com'; // 백엔드 서버 주소
    
    const API_PREFIX = '/api';
    const API_BASE_URL = `${API_ORIGIN}${API_PREFIX}`;
    
    // 안전한 API URL 빌더
    window.apiUrl = function(path) {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${API_ORIGIN}${API_PREFIX}${cleanPath}`;
    };
    
    // 전역 API 설정
    window.API_BASE = API_BASE_URL;
    window.API_URL = API_BASE_URL; // 별칭
    window.API_ORIGIN = API_ORIGIN;
    
    // API 엔드포인트 정의
    window.API_ENDPOINTS = {
        // 인증 관련
        AUTH: {
            LOGIN: `${API_BASE_URL}/auth/login`,
            REGISTER: `${API_BASE_URL}/auth/register`,
            CHECK_USERNAME: `${API_BASE_URL}/auth/check-username`,
            SEND_EMAIL_VERIFICATION: `${API_BASE_URL}/email/send-verification`,
            VERIFY_EMAIL: `${API_BASE_URL}/email/verify-code`,
            SEND_PHONE_VERIFICATION: `${API_BASE_URL}/auth/send-sms`,
            VERIFY_PHONE: `${API_BASE_URL}/auth/verify-sms`,
            FORGOT_PASSWORD: `${API_BASE_URL}/email/request-password-reset`,
            RESET_PASSWORD: `${API_BASE_URL}/email/reset-password`,
            LOGOUT: `${API_BASE_URL}/auth/logout`,
            REFRESH: `${API_BASE_URL}/auth/refresh`
        },
        // OAuth 관련
        OAUTH: {
            GOOGLE: `${API_BASE_URL}/oauth/google`,
            KAKAO: `${API_BASE_URL}/oauth/kakao`,
            NAVER: `${API_BASE_URL}/oauth/naver`,
            CALLBACK: `${API_BASE_URL}/oauth/callback`
        },
        // 사용자 관련
        USER: {
            PROFILE: `${API_BASE_URL}/users/profile`,
            UPDATE_PROFILE: `${API_BASE_URL}/users/profile`,
            ORDERS: `${API_BASE_URL}/users/orders`,
            NOTIFICATIONS: `${API_BASE_URL}/users/notifications`
        },
        // 서비스 관련
        SERVICES: {
            LIST: `${API_BASE_URL}/services`,
            DETAIL: (id) => `${API_BASE_URL}/services/${id}`,
            BY_PLATFORM: (platform) => `${API_BASE_URL}/services/platform/${platform}`,
            CATEGORIES: `${API_BASE_URL}/services/categories`
        },
        // 주문 관련
        ORDERS: {
            CREATE: `${API_BASE_URL}/orders`,
            LIST: `${API_BASE_URL}/orders`,
            DETAIL: (id) => `${API_BASE_URL}/orders/${id}`,
            UPDATE: (id) => `${API_BASE_URL}/orders/${id}`,
            CANCEL: (id) => `${API_BASE_URL}/orders/${id}/cancel`,
            STATUS: (id) => `${API_BASE_URL}/orders/${id}/status`
        },
        // 결제 관련
        PAYMENTS: {
            PREPARE: `${API_BASE_URL}/payments/prepare`,
            CONFIRM: `${API_BASE_URL}/payments/confirm`,
            CANCEL: `${API_BASE_URL}/payments/cancel`,
            HISTORY: `${API_BASE_URL}/payments/history`,
            INICIS: {
                PREPARE: `${API_BASE_URL}/payments/inicis/prepare`,
                CONFIRM: `${API_BASE_URL}/payments/inicis/confirm`
            },
            DEPOSIT: {
                CREATE: `${API_BASE_URL}/deposits`,
                CONFIRM: `${API_BASE_URL}/deposits/confirm`
            }
        },
        // 관리자 관련
        ADMIN: {
            LOGIN: `${API_BASE_URL}/admin/login`,
            DASHBOARD: `${API_BASE_URL}/admin/dashboard`,
            USERS: `${API_BASE_URL}/admin/users`,
            ORDERS: `${API_BASE_URL}/admin/orders`,
            SERVICES: `${API_BASE_URL}/admin/services`,
            DEPOSITS: `${API_BASE_URL}/admin/deposits`
        },
        // 키워드 관련
        KEYWORDS: {
            TRENDING: `${API_BASE_URL}/keywords/trending`,
            SEARCH: `${API_BASE_URL}/keywords/search`,
            RELATED: `${API_BASE_URL}/keywords/related`
        }
    };
    
    // 로컬 스토리지 키
    window.STORAGE_KEYS = {
        AUTH_TOKEN: 'authToken',
        USER_INFO: 'userInfo',
        CART: 'cart_items',
        RECENT_ORDERS: 'recent_orders',
        SELECTED_SERVICE: 'selected_service',
        ORDER_DATA: 'order_data'
    };
    
    // 공통 헤더 설정
    window.getAuthHeaders = function() {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    };
    
    // API 요청 헬퍼 함수
    window.apiRequest = async function(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...getAuthHeaders(),
                    ...options.headers
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API 요청 실패');
            }
            
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    };
    
    // 인증 상태 확인
    window.checkAuth = function() {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);
        
        if (token && userInfo) {
            try {
                return JSON.parse(userInfo);
            } catch {
                return null;
            }
        }
        return null;
    };
    
    // 로그아웃 함수
    window.logout = function() {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_INFO);
        window.location.href = '/login.html';
    };
    
    // 설정 로그
    console.log('🌐 Global Config Loaded:', {
        API_BASE: API_BASE_URL,
        Environment: window.location.hostname,
        Timestamp: new Date().toISOString()
    });
})();