const axios = require('axios');

// Railway 백엔드 URL
const API_URL = process.env.API_URL || 'https://marketgrow-production.up.railway.app/api';

// 관리자 계정 정보
const ADMIN_DATA = {
    email: 'admin@marketgrow.com',
    password: 'Admin123!@#', // 실제 운영 시 강력한 비밀번호로 변경
    username: 'admin',
    fullName: '관리자',
    phone: '010-0000-0000',
    isAdmin: true
};

async function createAdminAccount() {
    console.log('🔧 관리자 계정 생성 시작...');
    console.log('API URL:', API_URL);

    try {
        // 1. 먼저 로그인 시도 (이미 존재하는지 확인)
        console.log('기존 관리자 계정 확인 중...');
        try {
            const loginResponse = await axios.post(`${API_URL}/auth/login`, {
                email: ADMIN_DATA.email,
                password: ADMIN_DATA.password
            });

            if (loginResponse.data.success) {
                console.log('✅ 관리자 계정이 이미 존재합니다.');
                console.log('계정 정보:', {
                    email: ADMIN_DATA.email,
                    username: loginResponse.data.data.user.username,
                    role: loginResponse.data.data.user.role
                });
                return;
            }
        } catch (loginError) {
            console.log('관리자 계정이 없습니다. 새로 생성합니다...');
        }

        // 2. 관리자 계정 생성
        const signupResponse = await axios.post(`${API_URL}/auth/signup`, ADMIN_DATA);

        if (signupResponse.data.success) {
            console.log('✅ 관리자 계정 생성 성공!');
            console.log('계정 정보:', {
                email: ADMIN_DATA.email,
                password: '(보안상 표시하지 않음)',
                username: ADMIN_DATA.username
            });

            // 3. 생성된 계정으로 로그인 테스트
            const testLogin = await axios.post(`${API_URL}/auth/login`, {
                email: ADMIN_DATA.email,
                password: ADMIN_DATA.password
            });

            if (testLogin.data.success) {
                console.log('✅ 로그인 테스트 성공!');
                console.log('토큰:', `${testLogin.data.data.token.substring(0, 20)}...`);
            }
        }
    } catch (error) {
        console.error('❌ 오류 발생:', error.response?.data || error.message);

        if (error.response?.status === 409) {
            console.log('💡 계정이 이미 존재합니다. Railway 대시보드에서 ADMIN_PASSWORD 환경변수를 확인하세요.');
        }
    }
}

// 스크립트 실행
createAdminAccount().then(() => {
    console.log('\n📌 다음 단계:');
    console.log('1. 웹사이트에서 admin@marketgrow.com으로 로그인');
    console.log('2. 대시보드에서 관리자 기능 확인');
    console.log('3. Railway 대시보드에서 ADMIN_PASSWORD 변경 권장');
    process.exit(0);
}).catch(err => {
    console.error('치명적 오류:', err);
    process.exit(1);
});
