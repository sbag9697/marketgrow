const axios = require('axios');

// Railway 배포 URL을 여기에 입력하세요
const BACKEND_URL = process.argv[2] || 'https://YOUR-APP-NAME.up.railway.app';
const ADMIN_EMAIL = 'admin@marketgrow.com';
const ADMIN_PASSWORD = 'YihQwkFRFN8Fcbdl!@#';

async function addServices() {
    try {
        console.log('🚀 서비스 데이터 추가 시작...');
        console.log(`Backend URL: ${BACKEND_URL}`);

        // 1. 관리자 로그인
        console.log('\n1. 관리자 로그인...');
        const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        const token = loginResponse.data.token;
        console.log('✅ 로그인 성공');

        // 2. 서비스 추가 실행
        console.log('\n2. 서비스 데이터 추가 중...');
        const config = {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        // seed 엔드포인트 호출 (만약 있다면)
        try {
            const seedResponse = await axios.post(`${BACKEND_URL}/api/admin/seed-services`, {}, config);
            console.log('✅ 서비스 데이터 추가 완료:', seedResponse.data);
        } catch (error) {
            console.log('⚠️  Seed 엔드포인트가 없습니다. 수동으로 추가합니다...');
            
            // 여기에 수동으로 서비스 추가하는 코드를 넣을 수 있습니다
            console.log('로컬에서 seed-services.js를 실행하세요:');
            console.log('cd backend && node seed-services.js');
        }

        // 3. 서비스 목록 확인
        console.log('\n3. 서비스 목록 확인...');
        const servicesResponse = await axios.get(`${BACKEND_URL}/api/services`);
        console.log(`✅ 총 ${servicesResponse.data.data.services.length}개 서비스 확인됨`);

        console.log('\n🎉 배포 테스트 완료!');
        console.log('\n다음 단계:');
        console.log('1. 프론트엔드를 Netlify에 배포');
        console.log('2. CORS 설정 업데이트');
        console.log('3. 실제 서비스 테스트');

    } catch (error) {
        console.error('❌ 오류 발생:', error.response?.data || error.message);
        
        if (error.response?.status === 404) {
            console.log('\n💡 Railway에서 직접 명령 실행:');
            console.log('1. Railway 대시보드에서 "Run a command" 찾기');
            console.log('2. "npm run seed" 실행');
        }
    }
}

// 사용법 안내
if (!process.argv[2]) {
    console.log('사용법: node add-services-railway.js https://YOUR-APP-NAME.up.railway.app');
    console.log('예시: node add-services-railway.js https://marketgrow-production-abc123.up.railway.app');
    process.exit(1);
}

addServices();