// Mock API - 백엔드 서버 없이 테스트용
class MockAPI {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
        this.currentUser = null;
        this.verificationCodes = {};
        console.log('Mock API 활성화됨');
    }

    // 지연 시뮬레이션
    async delay(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 성공 응답 생성
    successResponse(data = {}, message = '성공') {
        return {
            success: true,
            message,
            data
        };
    }

    // 실패 응답 생성
    errorResponse(message = '오류가 발생했습니다', status = 400) {
        const error = new Error(message);
        error.response = {
            status,
            data: { message }
        };
        throw error;
    }

    // 전화번호 인증 발송
    async sendPhoneVerification(phone) {
        await this.delay(300);

        // 인증번호 생성 (테스트용으로 123456 고정)
        this.verificationCodes[phone] = '123456';

        console.log(`[Mock] 전화번호 ${phone}로 인증번호 발송: 123456`);

        return this.successResponse({
            phone,
            expiresIn: 300
        }, '인증번호가 발송되었습니다');
    }

    // 전화번호 인증 확인
    async verifyPhoneNumber(phone, code) {
        await this.delay(300);

        const savedCode = this.verificationCodes[phone];

        if (!savedCode) {
            return this.errorResponse('인증번호를 먼저 요청해주세요');
        }

        if (savedCode !== code && code !== '123456') {
            return this.errorResponse('인증번호가 일치하지 않습니다');
        }

        console.log(`[Mock] 전화번호 ${phone} 인증 성공`);

        return this.successResponse({
            phone,
            verified: true
        }, '전화번호 인증이 완료되었습니다');
    }

    // 이메일 인증 발송
    async sendEmailVerification(email) {
        await this.delay(300);

        // 인증번호 생성 (테스트용으로 123456 고정)
        this.verificationCodes[email] = '123456';

        console.log(`[Mock] 이메일 ${email}로 인증번호 발송: 123456`);

        return this.successResponse({
            email,
            expiresIn: 300
        }, '인증 코드가 이메일로 발송되었습니다');
    }

    // 이메일 인증 확인
    async verifyEmailCode(email, code) {
        await this.delay(300);

        const savedCode = this.verificationCodes[email];

        if (!savedCode) {
            return this.errorResponse('인증번호를 먼저 요청해주세요');
        }

        if (savedCode !== code && code !== '123456') {
            return this.errorResponse('인증번호가 일치하지 않습니다');
        }

        console.log(`[Mock] 이메일 ${email} 인증 성공`);

        return this.successResponse({
            email,
            verified: true
        }, '이메일 인증이 완료되었습니다');
    }

    // 아이디 중복 확인
    async checkUsername(username) {
        await this.delay(200);

        const exists = this.users.some(u => u.username === username);

        console.log(`[Mock] 아이디 ${username} 중복 확인: ${exists ? '중복' : '사용가능'}`);

        return this.successResponse({
            available: !exists,
            username
        });
    }

    // 회원가입
    async register(userData) {
        await this.delay(500);

        // 중복 확인
        if (this.users.some(u => u.username === userData.username)) {
            return this.errorResponse('이미 사용 중인 아이디입니다');
        }

        if (this.users.some(u => u.email === userData.email)) {
            return this.errorResponse('이미 가입된 이메일입니다');
        }

        // 새 사용자 생성
        const newUser = {
            id: Date.now(),
            ...userData,
            createdAt: new Date().toISOString()
        };

        // 비밀번호는 저장하지 않음 (보안)
        delete newUser.password;

        this.users.push(newUser);
        localStorage.setItem('mockUsers', JSON.stringify(this.users));

        // 가상 토큰 생성
        const token = `mock_token_${newUser.id}_${Date.now()}`;
        localStorage.setItem('authToken', token);

        console.log('[Mock] 회원가입 성공:', newUser);

        return this.successResponse({
            user: newUser,
            token
        }, '회원가입이 완료되었습니다');
    }

    // 로그인
    async login(credentials) {
        await this.delay(500);

        const user = this.users.find(u =>
            (u.username === credentials.login || u.email === credentials.login)
        );

        if (!user) {
            return this.errorResponse('아이디 또는 비밀번호가 올바르지 않습니다', 401);
        }

        // 가상 토큰 생성
        const token = `mock_token_${user.id}_${Date.now()}`;
        localStorage.setItem('authToken', token);
        this.currentUser = user;

        console.log('[Mock] 로그인 성공:', user);

        return this.successResponse({
            user,
            token
        }, '로그인 성공');
    }

    // 프로필 조회
    async getProfile() {
        await this.delay(200);

        const token = localStorage.getItem('authToken');
        if (!token || !token.startsWith('mock_token_')) {
            return this.errorResponse('인증이 필요합니다', 401);
        }

        // 토큰에서 사용자 ID 추출
        const userId = parseInt(token.split('_')[2]);
        const user = this.users.find(u => u.id === userId);

        if (!user) {
            return this.errorResponse('사용자를 찾을 수 없습니다', 404);
        }

        return this.successResponse({ user });
    }

    // 로그아웃
    async logout() {
        await this.delay(200);

        localStorage.removeItem('authToken');
        this.currentUser = null;

        console.log('[Mock] 로그아웃 완료');

        return this.successResponse({}, '로그아웃되었습니다');
    }

    // 공통 요청 처리
    async post(endpoint, data, options = {}) {
        console.log(`[Mock] POST ${endpoint}`, data);

        // 엔드포인트별 처리
        if (endpoint === '/sms/send-verification') {
            return this.sendPhoneVerification(data.phone);
        }
        if (endpoint === '/sms/verify-code') {
            return this.verifyPhoneNumber(data.phone, data.code);
        }
        if (endpoint === '/email/send-verification') {
            return this.sendEmailVerification(data.email);
        }
        if (endpoint === '/email/verify-code') {
            return this.verifyEmailCode(data.email, data.code);
        }
        if (endpoint === '/auth/register') {
            return this.register(data);
        }
        if (endpoint === '/auth/login') {
            return this.login(data);
        }
        if (endpoint === '/auth/logout') {
            return this.logout();
        }

        // 기본 응답
        return this.successResponse(data);
    }

    async get(endpoint, options = {}) {
        console.log(`[Mock] GET ${endpoint}`);

        // 엔드포인트별 처리
        if (endpoint.startsWith('/auth/check-username/')) {
            const username = endpoint.split('/').pop();
            return this.checkUsername(username);
        }
        if (endpoint === '/users/profile') {
            return this.getProfile();
        }

        // 기본 응답
        return this.successResponse({});
    }
}

// Mock API 활성화 체크
if (localStorage.getItem('useMockServer') === 'true') {
    console.log('🎭 Mock 서버 모드 활성화');

    // 기존 API 객체 대체
    window.mockAPI = new MockAPI();

    // api 객체의 메서드 오버라이드
    if (window.api) {
        const originalPost = window.api.post.bind(window.api);
        const originalGet = window.api.get.bind(window.api);

        window.api.post = async function (endpoint, data, options) {
            try {
                // 먼저 실제 서버 시도
                return await originalPost(endpoint, data, options);
            } catch (error) {
                // 실패하면 Mock API 사용
                console.log('실제 서버 연결 실패, Mock API 사용');
                return await window.mockAPI.post(endpoint, data, options);
            }
        };

        window.api.get = async function (endpoint, options) {
            try {
                // 먼저 실제 서버 시도
                return await originalGet(endpoint, options);
            } catch (error) {
                // 실패하면 Mock API 사용
                console.log('실제 서버 연결 실패, Mock API 사용');
                return await window.mockAPI.get(endpoint, options);
            }
        };
    }
}

// Mock 서버 비활성화 함수
window.disableMockServer = function () {
    localStorage.removeItem('useMockServer');
    localStorage.removeItem('mockUsers');
    console.log('Mock 서버가 비활성화되었습니다. 페이지를 새로고침하세요.');
};

// Mock 서버 상태 확인 함수
window.checkMockServer = function () {
    const isEnabled = localStorage.getItem('useMockServer') === 'true';
    const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    console.log('Mock 서버 상태:', isEnabled ? '활성화' : '비활성화');
    console.log('저장된 사용자 수:', users.length);
    return { enabled: isEnabled, users };
};
