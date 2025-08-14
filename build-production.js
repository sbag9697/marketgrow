const fs = require('fs');
const path = require('path');

console.log('🚀 MarketGrow 프로덕션 빌드 시작 (Mock 제거)...\n');

try {
    // 환경 변수에서 백엔드 URL 가져오기
    const BACKEND_URL = process.env.BACKEND_URL || 'https://marketgrow-production.up.railway.app';

    // 1. 빌드 디렉토리 생성
    const buildDir = path.join(__dirname, 'dist');
    console.log(`📁 빌드 디렉토리: ${buildDir}`);

    if (fs.existsSync(buildDir)) {
        console.log('🗑️ 기존 빌드 디렉토리 삭제 중...');
        fs.rmSync(buildDir, { recursive: true, force: true });
    }
    fs.mkdirSync(buildDir, { recursive: true });

    // 2. HTML 파일 복사 및 Mock 제거
    console.log('📄 HTML 파일 복사 및 Mock 제거 중...');
    const htmlFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.html'));
    htmlFiles.forEach(file => {
        try {
            let content = fs.readFileSync(path.join(__dirname, file), 'utf8');

            // mock-api.js 스크립트 태그 제거
            content = content.replace(/<script\s+src=["']js\/mock-api\.js["'][^>]*><\/script>/gi, '<!-- mock-api.js removed for production -->');
            content = content.replace(/<script\s+src=["'].*auto-mock\.js["'][^>]*><\/script>/gi, '<!-- auto-mock.js removed for production -->');

            // 테스트 메시지 제거
            content = content.replace(/테스트: 123456/g, '');
            content = content.replace(/테스트 인증번호: 123456/g, '');

            fs.writeFileSync(path.join(buildDir, file), content);
            console.log(`  ✓ ${file} (Mock 제거됨)`);
        } catch (err) {
            console.error(`  ✗ ${file}: ${err.message}`);
        }
    });

    // 3. JavaScript 디렉토리 복사 및 정리
    console.log('📜 JavaScript 파일 복사 및 정리 중...');
    const jsDir = path.join(__dirname, 'js');
    const jsBuildDir = path.join(buildDir, 'js');

    if (fs.existsSync(jsDir)) {
        fs.mkdirSync(jsBuildDir, { recursive: true });

        const jsFiles = fs.readdirSync(jsDir);
        jsFiles.forEach(file => {
            const srcPath = path.join(jsDir, file);
            const destPath = path.join(jsBuildDir, file);

            // mock 관련 파일 제외
            if (file === 'mock-api.js' || file === 'auto-mock.js') {
                console.log(`  ⏭️ ${file} (제외됨)`);
                return;
            }

            try {
                let content = fs.readFileSync(srcPath, 'utf8');

                // phone-auth.js 수정
                if (file === 'phone-auth.js') {
                    // Mock 모드 강제 활성화 코드 제거
                    content = content.replace(/localStorage\.setItem\(['"]useMockServer['"],\s*['"]true['"]\);?/g, '// Mock 모드 제거됨');
                    content = content.replace(/console\.log\(['"].*Mock 모드.*['"]\);?/g, '');
                }

                // auth.js 수정
                if (file === 'auth.js') {
                    // 123456 테스트 코드 제거
                    content = content.replace(/if\s*\(code\s*===\s*['"]123456['"]\)\s*{[^}]*}/gs, '// 테스트 코드 제거됨');
                    content = content.replace(/테스트 모드: 인증번호는 123456입니다/g, '');
                    content = content.replace(/테스트 코드: 123456/g, '');
                }

                // 모든 파일에서 Mock 관련 코드 제거
                content = content.replace(/localStorage\.setItem\(['"]useMockServer['"],\s*['"]true['"]\)/g, '// Mock 제거');

                fs.writeFileSync(destPath, content);
                console.log(`  ✓ ${file}`);
            } catch (err) {
                console.error(`  ✗ ${file}: ${err.message}`);
            }
        });
    }

    // 4. config.js 생성 (프로덕션 설정)
    console.log('⚙️ 프로덕션 설정 파일 생성 중...');
    const configContent = `// Production Configuration
window.API_CONFIG = {
    BASE_URL: '/api',  // Netlify proxy 사용
    IS_PRODUCTION: true,
    USE_MOCK: false
};

// Mock 모드 강제 비활성화
localStorage.removeItem('useMockServer');
localStorage.removeItem('mockMode');
localStorage.removeItem('testMode');

console.log('✅ Production mode - Mock disabled');
`;
    fs.writeFileSync(path.join(jsBuildDir, 'config.js'), configContent);

    // 5. CSS 파일 복사
    console.log('🎨 CSS 파일 복사 중...');
    const cssFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.css'));
    cssFiles.forEach(file => {
        try {
            fs.copyFileSync(path.join(__dirname, file), path.join(buildDir, file));
            console.log(`  ✓ ${file}`);
        } catch (err) {
            console.error(`  ✗ ${file}: ${err.message}`);
        }
    });

    // 6. 정적 자산 복사
    console.log('🖼️ 정적 자산 복사 중...');
    const staticDirs = ['images', 'assets', 'fonts'];
    staticDirs.forEach(dir => {
        const sourcePath = path.join(__dirname, dir);
        if (fs.existsSync(sourcePath)) {
            const destPath = path.join(buildDir, dir);
            fs.mkdirSync(destPath, { recursive: true });
            copyDirectory(sourcePath, destPath);
            console.log(`  ✓ ${dir}/`);
        }
    });

    // 7. 중요 파일 복사
    console.log('📋 중요 파일 복사 중...');
    const importantFiles = ['robots.txt', 'sitemap.xml', 'sw.js', 'script.js'];
    importantFiles.forEach(file => {
        const sourcePath = path.join(__dirname, file);
        if (fs.existsSync(sourcePath)) {
            try {
                let content = fs.readFileSync(sourcePath, 'utf8');

                // script.js에서도 Mock 관련 코드 제거
                if (file === 'script.js') {
                    content = content.replace(/localStorage\.setItem\(['"]useMockServer['"],\s*['"]true['"]\)/g, '');
                }

                fs.writeFileSync(path.join(buildDir, file), content);
                console.log(`  ✓ ${file}`);
            } catch (err) {
                console.error(`  ✗ ${file}: ${err.message}`);
            }
        }
    });

    // 8. _redirects 파일 생성
    console.log('🔄 _redirects 파일 생성 중...');
    const redirectsContent = `/api/*  ${BACKEND_URL}/api/:splat  200
/*    /index.html   200`;
    fs.writeFileSync(path.join(buildDir, '_redirects'), redirectsContent);

    // 9. _headers 파일 생성
    console.log('🔒 _headers 파일 생성 중...');
    const headersContent = `/*
  X-Frame-Options: SAMEORIGIN
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`;
    fs.writeFileSync(path.join(buildDir, '_headers'), headersContent);

    console.log('\n✅ 프로덕션 빌드 완료!');
    console.log(`📁 빌드 결과: ${buildDir}`);
    console.log('\n🔒 Mock 모드 완전 제거됨');
    console.log(`🌐 백엔드 URL: ${BACKEND_URL}`);

    process.exit(0);
} catch (error) {
    console.error('\n❌ 빌드 실패!');
    console.error('오류:', error.message);
    console.error('스택:', error.stack);
    process.exit(1);
}

// 헬퍼 함수: 디렉토리 복사
function copyDirectory(src, dest) {
    if (!fs.existsSync(src)) {
        return;
    }

    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);
    files.forEach(file => {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);

        try {
            const stat = fs.statSync(srcPath);
            if (stat.isDirectory()) {
                copyDirectory(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        } catch (err) {
            console.error(`복사 실패: ${srcPath} -> ${destPath}:`, err.message);
        }
    });
}
