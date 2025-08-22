#!/usr/bin/env node

/**
 * Netlify Functions 스모크 테스트
 * 배포 후 API 엔드포인트 동작 확인
 */

const https = require('https');

// 테스트 설정
const BASE_URL = 'https://marketgrow.kr';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'test123456';

// 색상 코드
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTPS 요청 헬퍼
function httpsRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        
        req.on('error', reject);
        
        if (postData) {
            req.write(postData);
        }
        
        req.end();
    });
}

async function testEndpoint(name, options, postData = null, expectedStatus = 200) {
    console.log(`\n📌 Testing: ${name}`);
    console.log(`   URL: https://${options.hostname}${options.path}`);
    
    try {
        const response = await httpsRequest(options, postData);
        
        // 상태 코드 확인
        if (response.statusCode === expectedStatus) {
            log(`   ✅ Status: ${response.statusCode}`, 'green');
        } else {
            log(`   ❌ Status: ${response.statusCode} (expected ${expectedStatus})`, 'red');
        }
        
        // CORS 헤더 확인
        const corsOrigin = response.headers['access-control-allow-origin'];
        if (corsOrigin) {
            log(`   ✅ CORS Origin: ${corsOrigin}`, 'green');
        } else if (options.method !== 'OPTIONS') {
            log(`   ⚠️  No CORS headers`, 'yellow');
        }
        
        // 응답 파싱
        if (response.body) {
            try {
                const data = JSON.parse(response.body);
                log(`   📦 Response: ${JSON.stringify(data).substring(0, 100)}...`, 'blue');
                return data;
            } catch (e) {
                if (response.body.includes('<!DOCTYPE')) {
                    log(`   ❌ HTML response (expecting JSON)`, 'red');
                } else {
                    log(`   📦 Response: ${response.body.substring(0, 100)}...`, 'blue');
                }
            }
        }
        
    } catch (error) {
        log(`   ❌ Error: ${error.message}`, 'red');
    }
}

async function runTests() {
    console.log('🔍 Netlify Functions 스모크 테스트');
    console.log('=====================================');
    console.log(`🌐 Target: ${BASE_URL}`);
    console.log(`📅 Date: ${new Date().toISOString()}\n`);
    
    // 1. OPTIONS 프리플라이트 테스트
    await testEndpoint('OPTIONS /api/auth (Preflight)', {
        hostname: 'marketgrow.kr',
        path: '/api/auth',
        method: 'OPTIONS',
        headers: {
            'Origin': 'https://marketgrow.kr',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
    });
    
    // 2. 회원가입 테스트
    const registerData = JSON.stringify({
        action: 'register',
        email: TEST_EMAIL,
        username: 'testuser',
        password: TEST_PASSWORD,
        name: 'Test User'
    });
    
    const registerResult = await testEndpoint('POST /api/auth (Register)', {
        hostname: 'marketgrow.kr',
        path: '/api/auth',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': registerData.length,
            'Origin': 'https://marketgrow.kr'
        }
    }, registerData);
    
    // 3. 로그인 테스트
    const loginData = JSON.stringify({
        action: 'login',
        username: TEST_EMAIL,
        password: TEST_PASSWORD
    });
    
    const loginResult = await testEndpoint('POST /api/auth (Login)', {
        hostname: 'marketgrow.kr',
        path: '/api/auth',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': loginData.length,
            'Origin': 'https://marketgrow.kr'
        }
    }, loginData);
    
    // 4. 토큰 검증 테스트 (로그인이 성공한 경우)
    if (loginResult && loginResult.token) {
        const verifyData = JSON.stringify({
            action: 'verify'
        });
        
        await testEndpoint('POST /api/auth (Verify Token)', {
            hostname: 'marketgrow.kr',
            path: '/api/auth',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': verifyData.length,
                'Authorization': `Bearer ${loginResult.token}`,
                'Origin': 'https://marketgrow.kr'
            }
        }, verifyData);
    }
    
    // 5. Orders API 테스트
    await testEndpoint('OPTIONS /api/orders (Preflight)', {
        hostname: 'marketgrow.kr',
        path: '/api/orders',
        method: 'OPTIONS',
        headers: {
            'Origin': 'https://marketgrow.kr'
        }
    });
    
    // 결과 요약
    console.log('\n📊 테스트 완료!');
    console.log('=====================================');
    console.log('다음 단계:');
    console.log('1. 실패한 항목이 있다면 환경변수 확인');
    console.log('2. MongoDB 연결 상태 확인');
    console.log('3. 브라우저에서 실제 로그인 테스트');
}

// 스크립트 실행
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});