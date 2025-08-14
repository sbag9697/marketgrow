const fs = require('fs');
const path = require('path');

// 모든 HTML 파일 찾기
const htmlFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.html'));

console.log(`Found ${htmlFiles.length} HTML files to update`);

htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // mobile-styles.css를 mobile-fix.css로 변경
    if (content.includes('mobile-styles.css')) {
        content = content.replace(/mobile-styles\.css/g, 'mobile-fix.css');
        modified = true;
    }
    
    // mobile-menu.js를 mobile-fix.js로 변경
    if (content.includes('mobile-menu.js')) {
        content = content.replace(/mobile-menu\.js/g, 'mobile-fix.js');
        modified = true;
    }
    
    // mobile-fix.css가 없으면 추가
    if (!content.includes('mobile-fix.css') && content.includes('styles.css')) {
        content = content.replace(
            '<link rel="stylesheet" href="styles.css">',
            '<link rel="stylesheet" href="styles.css">\n    <link rel="stylesheet" href="mobile-fix.css">'
        );
        modified = true;
    }
    
    // mobile-fix.js가 없으면 추가
    if (!content.includes('mobile-fix.js') && content.includes('</body>')) {
        content = content.replace(
            '</body>',
            '    <script src="js/mobile-fix.js"></script>\n</body>'
        );
        modified = true;
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Updated ${file}`);
    } else {
        console.log(`- ${file} (no changes needed)`);
    }
});

console.log('\n✅ Mobile fix update complete!');