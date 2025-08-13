// API Configuration
// Railway에서 새 도메인을 생성한 후 여기에 입력하세요
// Settings → Networking → Generate Domain

// 기본 Railway URL (작동하지 않음)
// const API_URL = 'https://marketgrow-production.up.railway.app/api';

// Production API URL (새 Railway 도메인)
const API_URL = 'https://marketgrow-production-c586.up.railway.app/api';

// 도메인 설정
const DOMAIN = 'https://marketgrow.kr';

// 로컬 개발용
// const API_URL = 'http://localhost:5000/api';

// Mock 모드 설정
const USE_MOCK = false;

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_URL, USE_MOCK };
}