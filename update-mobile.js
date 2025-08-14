const fs = require('fs');
const path = require('path');

// HTML 파일 목록
const htmlFiles = [
    'login.html',
    'signup.html',
    'dashboard.html',
    'services.html',
    'order.html',
    'order-method.html',
    'payment.html',
    'blog.html',
    'profile.html',
    'cart.html'
];

// 모바일 스타일 추가 함수
function addMobileStyles(content) {
    // 이미 mobile-styles.css가 있으면 추가하지 않음
    if (content.includes('mobile-styles.css')) {
        return content;
    }
    
    // styles.css 다음에 mobile-styles.css 추가
    return content.replace(
        '<link rel="stylesheet" href="styles.css">',
        '<link rel="stylesheet" href="styles.css">\n    <link rel="stylesheet" href="mobile-styles.css">'
    );
}

// 모바일 스크립트 추가 함수
function addMobileScripts(content) {
    // 이미 mobile-menu.js가 있으면 추가하지 않음
    if (content.includes('mobile-menu.js')) {
        return content;
    }
    
    // </body> 태그 앞에 스크립트 추가
    const scriptsToAdd = `    <script src="js/mobile-menu.js"></script>\n    <script src="script.js"></script>\n`;
    
    // script.js가 이미 있는지 확인
    if (content.includes('script.js')) {
        // mobile-menu.js만 추가
        return content.replace(
            '</body>',
            `    <script src="js/mobile-menu.js"></script>\n</body>`
        );
    } else {
        // 둘 다 추가
        return content.replace(
            '</body>',
            scriptsToAdd + '</body>'
        );
    }
}

// 뷰포트 메타 태그 확인 및 추가
function ensureViewportMeta(content) {
    if (!content.includes('viewport')) {
        return content.replace(
            '<head>',
            '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
        );
    }
    return content;
}

// 파일 업데이트
htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (fs.existsSync(filePath)) {
        console.log(`Updating ${file}...`);
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 업데이트 적용
        content = ensureViewportMeta(content);
        content = addMobileStyles(content);
        content = addMobileScripts(content);
        
        // 파일 저장
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ ${file} updated`);
    } else {
        console.log(`✗ ${file} not found`);
    }
});

console.log('\n모바일 최적화 업데이트 완료!');