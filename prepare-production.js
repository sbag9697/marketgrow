const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 MarketGrow 프로덕션 준비 시작...\n');

// 1. 환경 변수 체크
console.log('📋 환경 변수 확인...');
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'SMM_PANEL_API_KEY',
    'TOSSPAYMENTS_SECRET_KEY',
    'TOSSPAYMENTS_CLIENT_KEY'
];

const envPath = path.join(__dirname, 'backend', '.env.production');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env.production 파일이 없습니다!');
    console.log('📝 .env.production 파일을 생성하고 필요한 값을 입력하세요.');
    process.exit(1);
}

// 2. JWT Secret 생성 제안
console.log('\n🔐 보안 설정 제안:');
console.log('JWT_SECRET 예시:', crypto.randomBytes(32).toString('hex'));
console.log('ADMIN_PASSWORD 예시:', crypto.randomBytes(16).toString('hex'));

// 3. 프론트엔드 설정 파일 생성
console.log('\n📝 프론트엔드 설정 파일 생성...');
const frontendConfig = `
// Production Configuration
window.ENV = {
    API_URL: 'https://marketgrow-backend.herokuapp.com',
    TOSSPAYMENTS_CLIENT_KEY: '${process.env.TOSSPAYMENTS_CLIENT_KEY || 'YOUR_CLIENT_KEY'}',
    IS_PRODUCTION: true
};
`;

fs.writeFileSync(path.join(__dirname, 'env.production.js'), frontendConfig);

// 4. 배포 정보 파일 생성
const deployInfo = {
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    features: [
        'SMM 패널 연동',
        '토스페이먼츠 결제',
        '90% 마진 설정',
        '자동 주문 처리'
    ],
    checklist: {
        frontend: {
            netlify: false,
            domain: false,
            ssl: false
        },
        backend: {
            heroku: false,
            mongodb: false,
            env_vars: false
        },
        testing: {
            signup: false,
            login: false,
            order: false,
            payment: false
        }
    }
};

fs.writeFileSync(
    path.join(__dirname, 'deploy-info.json'),
    JSON.stringify(deployInfo, null, 2)
);

// 5. 배포 명령어 생성
console.log('\n📌 배포 명령어:\n');

console.log('=== Backend (Heroku) ===');
console.log('cd backend');
console.log('heroku create marketgrow-backend');
console.log('heroku buildpacks:set heroku/nodejs');
console.log('# .env.production의 모든 변수를 heroku config:set으로 설정');
console.log('git add .');
console.log('git commit -m "Deploy to Heroku"');
console.log('git push heroku main\n');

console.log('=== Frontend (Netlify) ===');
console.log('# 1. GitHub에 푸시');
console.log('git add .');
console.log('git commit -m "Deploy to Netlify"');
console.log('git push origin main');
console.log('# 2. Netlify에서 GitHub 연동 후 자동 배포\n');

console.log('=== 또는 Netlify CLI 사용 ===');
console.log('npm install -g netlify-cli');
console.log('netlify init');
console.log('netlify deploy --prod\n');

// 6. 주의사항
console.log('⚠️  중요 주의사항:');
console.log('1. SMM 패널 API 키가 유효한지 확인');
console.log('2. MongoDB Atlas에서 IP 화이트리스트 설정 (0.0.0.0/0)');
console.log('3. 토스페이먼츠 프로덕션 키로 변경');
console.log('4. CORS 설정에 실제 도메인 추가');
console.log('5. 첫 배포 후 관리자 계정으로 로그인 테스트');

console.log('\n✅ 프로덕션 준비 완료!');
console.log('📁 생성된 파일:');
console.log('   - env.production.js');
console.log('   - deploy-info.json');
console.log('\n다음 단계: 위의 배포 명령어를 실행하세요.');