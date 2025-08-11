// API 설정
const API_CONFIG = {
    // Railway 배포 URL (배포 후 실제 URL로 변경 필요)
    // railway up 실행 후 제공되는 URL로 교체하세요
    // 예: https://marketgrow-backend-production.up.railway.app/api
    BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:5001/api'
        : window.RAILWAY_API_URL || 'https://marketgrow-backend-production.up.railway.app/api',
    TIMEOUT: 30000,
    HEADERS: {
        'Content-Type': 'application/json'
    },
    // Mock 모드 - Railway 배포 후 false로 변경
    USE_MOCK: window.location.hostname !== 'localhost' && !window.RAILWAY_API_URL
};

// 토스페이먼츠 설정
// 환경변수에서 키를 가져오거나, 설정되지 않은 경우 빈 문자열 사용
const TOSS_CONFIG = {
    CLIENT_KEY: window.TOSS_CLIENT_KEY || '', // 환경변수에서 가져옴
    SUCCESS_URL: window.location.origin + '/payment-success.html',
    FAIL_URL: window.location.origin + '/payment-fail.html',
    IS_TEST_MODE: true // 테스트 모드 플래그
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