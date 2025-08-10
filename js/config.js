// API 설정
const API_CONFIG = {
    // 로컬 개발 시에는 localhost, 프로덕션에서는 Railway 사용
    BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:5001/api'
        : 'https://marketgrow-production.up.railway.app/api',
    TIMEOUT: 30000,
    HEADERS: {
        'Content-Type': 'application/json'
    },
    // Mock 모드 강제 활성화 (백엔드 서버 없이 테스트)
    USE_MOCK: true
};

// 토스페이먼츠 설정
const TOSS_CONFIG = {
    CLIENT_KEY: 'test_ck_Z1aOwX7K8m6vNzPPOgRPyQxzvNPG', // 테스트 키 (실제 키로 교체 필요)
    SUCCESS_URL: window.location.origin + '/payment-success.html',
    FAIL_URL: window.location.origin + '/payment-fail.html'
};

// 로컬 스토리지 키 (통일된 키 사용)
const STORAGE_KEYS = {
    AUTH_TOKEN: 'authToken',
    USER_INFO: 'userInfo',
    CART: 'cart_items'
};

// 전역 설정 export
window.API_CONFIG = API_CONFIG;
window.TOSS_CONFIG = TOSS_CONFIG;
window.STORAGE_KEYS = STORAGE_KEYS;