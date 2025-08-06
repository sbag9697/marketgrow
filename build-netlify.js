const fs = require('fs');
const path = require('path');

console.log('🚀 MarketGrow Netlify 빌드 시작...\n');

// 환경 변수에서 백엔드 URL 가져오기
const BACKEND_URL = process.env.BACKEND_URL || 'https://marketgrow-backend.herokuapp.com';
const TOSSPAYMENTS_CLIENT_KEY = process.env.TOSSPAYMENTS_CLIENT_KEY || '';

// 1. 빌드 디렉토리 생성
const buildDir = path.join(__dirname, 'dist');
if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true });
}
fs.mkdirSync(buildDir, { recursive: true });

// 2. 프로덕션 환경 설정
console.log('📝 프로덕션 환경 설정 생성 중...');
const productionConfig = `
// Production Configuration for Netlify
const CONFIG = {
    API_BASE_URL: '${BACKEND_URL}/api',
    APP_NAME: 'MarketGrow',
    TOSSPAYMENTS_CLIENT_KEY: '${TOSSPAYMENTS_CLIENT_KEY}',
    ENVIRONMENT: 'production'
};

// API 헬퍼 (Netlify 프록시 사용)
const API_BASE_URL = '/api';

// Freeze config to prevent modifications
Object.freeze(CONFIG);
window.CONFIG = CONFIG;
`;

fs.writeFileSync(path.join(buildDir, 'config.js'), productionConfig);

// 3. HTML 파일 처리
console.log('📄 HTML 파일 처리 중...');
const htmlFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.html'));

htmlFiles.forEach(file => {
    let content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    
    // API URL을 Netlify 프록시로 변경
    content = content.replace(/http:\/\/localhost:5001\/api/g, '/api');
    content = content.replace(/const API_BASE_URL = .*/g, "const API_BASE_URL = '/api';");
    
    // 개발용 콘솔 로그 제거 (옵션)
    // content = content.replace(/console\.(log|debug|info)/g, '// console.$1');
    
    // config.js 경로 수정
    content = content.replace(/"js\/config\.js(\?v=\d+)?"/g, '"config.js"');
    
    fs.writeFileSync(path.join(buildDir, file), content);
});

// 4. JavaScript 파일 처리
console.log('📜 JavaScript 파일 처리 중...');
const jsDir = path.join(__dirname, 'js');
const jsBuildDir = path.join(buildDir, 'js');
fs.mkdirSync(jsBuildDir, { recursive: true });

if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir);
    jsFiles.forEach(file => {
        if (file.endsWith('.js')) {
            let content = fs.readFileSync(path.join(jsDir, file), 'utf8');
            
            // API URL 변경
            content = content.replace(/http:\/\/localhost:5001\/api/g, '/api');
            content = content.replace(/const API_BASE_URL = .*/g, "const API_BASE_URL = '/api';");
            
            fs.writeFileSync(path.join(jsBuildDir, file), content);
        }
    });
}

// 5. CSS 파일 복사
console.log('🎨 CSS 파일 복사 중...');
const cssFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.css'));
cssFiles.forEach(file => {
    fs.copyFileSync(path.join(__dirname, file), path.join(buildDir, file));
});

// 6. 정적 자산 복사 (이미지 등)
console.log('🖼️ 정적 자산 복사 중...');
const staticDirs = ['images', 'assets', 'fonts'];
staticDirs.forEach(dir => {
    const sourcePath = path.join(__dirname, dir);
    if (fs.existsSync(sourcePath)) {
        const destPath = path.join(buildDir, dir);
        fs.mkdirSync(destPath, { recursive: true });
        copyRecursive(sourcePath, destPath);
    }
});

// 7. _redirects 파일 생성 (netlify.toml 백업용)
console.log('🔄 _redirects 파일 생성 중...');
const redirectsContent = `/api/*  ${BACKEND_URL}/api/:splat  200
/*    /index.html   200`;
fs.writeFileSync(path.join(buildDir, '_redirects'), redirectsContent);

// 8. 환경 변수 정보 파일 생성
const envInfo = {
    buildDate: new Date().toISOString(),
    backendUrl: BACKEND_URL,
    environment: 'production'
};
fs.writeFileSync(path.join(buildDir, 'build-info.json'), JSON.stringify(envInfo, null, 2));

console.log('\n✅ Netlify 빌드 완료!');
console.log(`📁 빌드 결과: ${buildDir}`);
console.log('\n환경 변수:');
console.log(`- BACKEND_URL: ${BACKEND_URL}`);
console.log(`- TOSSPAYMENTS_CLIENT_KEY: ${TOSSPAYMENTS_CLIENT_KEY ? '설정됨' : '미설정'}`);

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