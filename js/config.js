// API 설정
const API_CONFIG = {
    BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:5001/api'
        : 'https://marketgrow-production.up.railway.app/api',
    TIMEOUT: 30000,
    HEADERS: {
        'Content-Type': 'application/json'
    }
};

// 토스페이먼츠 설정
const TOSS_CONFIG = {
    CLIENT_KEY: 'test_ck_Z1aOwX7K8m6vNzPPOgRPyQxzvNPG', // 테스트 키 (실제 키로 교체 필요)
    SUCCESS_URL: window.location.origin + '/payment-success.html',
    FAIL_URL: window.location.origin + '/payment-fail.html'
};

// 로컬 스토리지 키
const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_INFO: 'user_info',
    CART: 'cart_items'
};

// 전역 설정 export
window.API_CONFIG = API_CONFIG;
window.TOSS_CONFIG = TOSS_CONFIG;
window.STORAGE_KEYS = STORAGE_KEYS;