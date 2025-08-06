const axios = require('axios');

const BACKEND_URL = process.argv[2] || 'https://marketgrow-backend.herokuapp.com';

console.log(`🧪 MarketGrow Backend 배포 테스트`);
console.log(`URL: ${BACKEND_URL}\n`);

async function testDeployment() {
    const tests = [
        {
            name: 'Health Check',
            endpoint: '/api/health',
            method: 'GET'
        },
        {
            name: 'Get Services',
            endpoint: '/api/services',
            method: 'GET'
        },
        {
            name: 'Admin Login',
            endpoint: '/api/auth/login',
            method: 'POST',
            data: {
                email: 'admin@marketgrow.com',
                password: 'YihQwkFRFN8Fcbdl!@#'
            }
        }
    ];

    for (const test of tests) {
        try {
            console.log(`\n📋 테스트: ${test.name}`);
            console.log(`   Endpoint: ${test.method} ${test.endpoint}`);
            
            const config = {
                method: test.method,
                url: `${BACKEND_URL}${test.endpoint}`,
                data: test.data,
                timeout: 10000
            };

            const response = await axios(config);
            
            console.log(`   ✅ 성공: ${response.status}`);
            
            if (test.name === 'Get Services') {
                console.log(`   서비스 수: ${response.data.data?.services?.length || 0}`);
            }
            
            if (test.name === 'Admin Login' && response.data.token) {
                console.log(`   토큰 발급됨: ${response.data.token.substring(0, 20)}...`);
            }
        } catch (error) {
            console.log(`   ❌ 실패: ${error.response?.status || error.message}`);
            if (error.response?.data) {
                console.log(`   메시지: ${JSON.stringify(error.response.data)}`);
            }
        }
    }

    console.log('\n\n📊 테스트 완료!');
    console.log('다음 단계:');
    console.log('1. 프론트엔드 배포 (Netlify)');
    console.log('2. CORS 설정 업데이트');
    console.log('3. 실제 서비스 테스트');
}

testDeployment().catch(console.error);