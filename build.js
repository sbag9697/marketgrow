const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 MarketGrow 프론트엔드 빌드 시작...\n');

// 1. 빌드 디렉토리 생성
const buildDir = path.join(__dirname, 'dist');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

// 2. 프로덕션 환경 설정
console.log('📝 프로덕션 환경 설정 생성 중...');
const productionConfig = `
// Production Configuration
const CONFIG = {
    API_BASE_URL: '${process.env.API_URL || 'https://api.marketgrow.com'}',
    APP_NAME: 'MarketGrow',
    TOSSPAYMENTS_CLIENT_KEY: '${process.env.TOSSPAYMENTS_CLIENT_KEY || ''}',
    ENVIRONMENT: 'production'
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
window.CONFIG = CONFIG;
`;

fs.writeFileSync(path.join(buildDir, 'config.js'), productionConfig);

// 3. HTML 파일 복사 및 최적화
console.log('📄 HTML 파일 처리 중...');
const htmlFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.html'));

htmlFiles.forEach(file => {
    let content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    
    // API URL 교체
    content = content.replace(/http:\/\/localhost:5001/g, '${API_URL}');
    
    // 개발용 콘솔 로그 제거
    content = content.replace(/console\.(log|debug|info)/g, '// console.$1');
    
    // 프로덕션 config.js 사용
    content = content.replace('js/config.js', 'config.js');
    
    fs.writeFileSync(path.join(buildDir, file), content);
});

// 4. 정적 파일 복사
console.log('📦 정적 파일 복사 중...');
const staticDirs = ['js', 'styles.css', 'order.css', 'auth.css', 'blog.css', 'dashboard.css', 'keywords.css', 'notification-settings.css', 'order-method.css', 'order-success.css', 'packages.css', 'payment-history.css', 'payment-result.css', 'payment.css', 'services.css'];

staticDirs.forEach(item => {
    const sourcePath = path.join(__dirname, item);
    if (fs.existsSync(sourcePath)) {
        if (fs.statSync(sourcePath).isDirectory()) {
            // 디렉토리 복사
            const destPath = path.join(buildDir, item);
            fs.mkdirSync(destPath, { recursive: true });
            copyRecursive(sourcePath, destPath);
        } else {
            // 파일 복사
            fs.copyFileSync(sourcePath, path.join(buildDir, item));
        }
    }
});

// 5. JavaScript 최소화 (선택사항)
console.log('🗜️ JavaScript 최적화 중...');
// 여기에 minification 로직 추가 가능

// 6. 빌드 정보 생성
const buildInfo = {
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    environment: 'production'
};

fs.writeFileSync(
    path.join(buildDir, 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
);

console.log('\n✅ 빌드 완료!');
console.log(`📁 빌드 결과: ${buildDir}`);
console.log('\n다음 단계:');
console.log('1. dist 폴더의 내용을 웹 서버에 업로드');
console.log('2. 백엔드 서버 배포');
console.log('3. 환경 변수 설정');

// 헬퍼 함수
function copyRecursive(src, dest) {
    const files = fs.readdirSync(src);
    files.forEach(file => {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        
        if (fs.statSync(srcPath).isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}