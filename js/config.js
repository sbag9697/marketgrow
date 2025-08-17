// API 설정
const API_CONFIG = {
    // API URL - Render 백엔드 직접 연결
    BASE_URL: window.location.hostname === 'localhost' || 
              window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5001/api'
        : 'https://marketgrow.onrender.com/api',  // Render 백엔드 직접 연결
    TIMEOUT: 30000,
    HEADERS: {
        'Content-Type': 'application/json'
    },
    // Mock 모드 비활성화 - Railway 백엔드 사용
    USE_MOCK: false,
    // API 재시도 설정
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
};

// KG이니시스 설정
const INICIS_CONFIG = {
    // 테스트 모드 설정
    IS_TEST_MODE: window.location.hostname === 'localhost' || window.location.hostname.includes('netlify'),
    // 테스트 MID (실제 운영시 변경 필요)
    TEST_MID: 'INIpayTest',
    PRODUCTION_MID: '', // 실제 가맹점 ID 입력 필요
    // 결제 완료 후 리다이렉트 URL
    RETURN_URL: `${window.location.origin}/payment-success.html`,
    CLOSE_URL: `${window.location.origin}/payment-fail.html`
};

// 로컬 스토리지 키 (통일된 키 사용)
const STORAGE_KEYS = {
    AUTH_TOKEN: 'authToken',
    USER_INFO: 'userInfo',
    CART: 'cart_items',
    RECENT_ORDERS: 'recent_orders',
    PREFERENCES: 'user_preferences'
};

// 환경 설정
const ENV_CONFIG = {
    // 환경 구분
    IS_PRODUCTION: window.location.hostname !== 'localhost',
    IS_DEVELOPMENT: window.location.hostname === 'localhost',
    // 디버그 모드
    DEBUG_MODE: localStorage.getItem('debug_mode') === 'true',
    // 기능 플래그
    FEATURES: {
        ENABLE_CHAT: false, // 채팅 기능 (추후 활성화)
        ENABLE_SOCIAL_LOGIN: true, // 소셜 로그인 활성화
        ENABLE_PWA: true, // PWA 기능
        ENABLE_ANALYTICS: true, // 분석 기능
        ENABLE_AB_TESTING: true // A/B 테스팅
    }
};

// 분석 설정
const ANALYTICS_CONFIG = {
    // Google Analytics 4
    GA_MEASUREMENT_ID: 'G-XXXXXXXXXX', // 실제 측정 ID로 변경 필요
    // Google Tag Manager
    GTM_ID: 'GTM-XXXXXXX', // 실제 GTM ID로 변경 필요
    // 이벤트 추적 설정
    TRACK_EVENTS: {
        PAGE_VIEW: true,
        BUTTON_CLICK: true,
        FORM_SUBMIT: true,
        SCROLL_DEPTH: true,
        TIME_ON_PAGE: true
    }
};

// 성능 모니터링 설정
const MONITORING_CONFIG = {
    // 성능 임계값
    THRESHOLDS: {
        FCP: 2000, // First Contentful Paint
        LCP: 2500, // Largest Contentful Paint
        FID: 100, // First Input Delay
        CLS: 0.1 // Cumulative Layout Shift
    },
    // 에러 보고
    ERROR_REPORTING: {
        ENABLED: true,
        SAMPLE_RATE: 0.1, // 10% 샘플링
        IGNORE_ERRORS: [
            'ResizeObserver loop limit exceeded',
            'Non-Error promise rejection captured'
        ]
    }
};

// A/B 테스팅 설정
const AB_TEST_CONFIG = {
    // 테스트 활성화
    ENABLED: true,
    // 실험 설정
    EXPERIMENTS: {
        // CTA 버튼 색상 테스트
        CTA_COLOR: {
            enabled: true,
            variants: ['blue', 'green', 'orange'],
            traffic_allocation: [0.33, 0.33, 0.34]
        },
        // 가격 표시 방식 테스트
        PRICE_DISPLAY: {
            enabled: true,
            variants: ['normal', 'discount_emphasis', 'bundle_offer'],
            traffic_allocation: [0.4, 0.3, 0.3]
        },
        // 헤드라인 테스트
        HEADLINE: {
            enabled: true,
            variants: [
                '24시간 SNS 마케팅 서비스',
                'SNS 성장의 최강 파트너',
                '쉽고 빠른 SNS 마케팅 솔루션'
            ],
            traffic_allocation: [0.33, 0.33, 0.34]
        }
    }
};

// 관리자 설정
const ADMIN_CONFIG = {
    // 관리자 계정 (이메일 기반)
    ADMIN_EMAILS: [
        'admin@marketgrow.com',
        'manager@marketgrow.com'
    ],
    // 관리자 기능
    FEATURES: {
        VIEW_ALL_ORDERS: true,
        EDIT_SERVICES: true,
        MANAGE_USERS: true,
        VIEW_ANALYTICS: true,
        EXPORT_DATA: true
    },
    // 대시보드 설정
    DASHBOARD: {
        REFRESH_INTERVAL: 30000, // 30초마다 갱신
        DEFAULT_PERIOD: '7days', // 기본 기간 설정
        CHART_TYPE: 'line' // 기본 차트 타입
    }
};

// API 엔드포인트 정의
const API_ENDPOINTS = {
    // 인증
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        VERIFY_EMAIL: '/auth/verify-email',
        RESET_PASSWORD: '/auth/reset-password'
    },
    // 사용자
    USER: {
        PROFILE: '/users/profile',
        UPDATE_PROFILE: '/users/profile',
        CHANGE_PASSWORD: '/users/change-password',
        DELETE_ACCOUNT: '/users/delete'
    },
    // 서비스
    SERVICES: {
        LIST: '/services',
        DETAIL: '/services/:id',
        BY_PLATFORM: '/services/platform/:platform'
    },
    // 주문
    ORDERS: {
        CREATE: '/orders',
        LIST: '/orders',
        DETAIL: '/orders/:id',
        CANCEL: '/orders/:id/cancel',
        STATUS: '/orders/:id/status'
    },
    // 결제
    PAYMENTS: {
        INICIS_PREPARE: '/payments/inicis/prepare',
        INICIS_CONFIRM: '/payments/inicis/confirm',
        INICIS_CANCEL: '/payments/inicis/cancel',
        HISTORY: '/payments/history'
    },
    // 관리자
    ADMIN: {
        DASHBOARD: '/admin/dashboard',
        USERS: '/admin/users',
        ORDERS: '/admin/orders',
        SERVICES: '/admin/services',
        ANALYTICS: '/admin/analytics',
        SETTINGS: '/admin/settings'
    }
};

// 전역 설정 export
window.API_CONFIG = API_CONFIG;
window.INICIS_CONFIG = INICIS_CONFIG;
window.STORAGE_KEYS = STORAGE_KEYS;
window.ENV_CONFIG = ENV_CONFIG;
window.ANALYTICS_CONFIG = ANALYTICS_CONFIG;
window.MONITORING_CONFIG = MONITORING_CONFIG;
window.AB_TEST_CONFIG = AB_TEST_CONFIG;
window.ADMIN_CONFIG = ADMIN_CONFIG;
window.API_ENDPOINTS = API_ENDPOINTS;

// 설정 로그 (개발 환경에서만)
if (ENV_CONFIG.IS_DEVELOPMENT || ENV_CONFIG.DEBUG_MODE) {
    console.log('🔧 Configuration loaded:', {
        API_BASE_URL: API_CONFIG.BASE_URL,
        ENVIRONMENT: ENV_CONFIG.IS_PRODUCTION ? 'Production' : 'Development',
        FEATURES: ENV_CONFIG.FEATURES,
        AB_TESTS: AB_TEST_CONFIG.ENABLED ? 'Enabled' : 'Disabled'
    });
}
