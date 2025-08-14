const crypto = require('crypto');

console.log('🔐 보안 키 생성기\n');

// JWT Secret 생성 (64자)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('JWT_SECRET:');
console.log(jwtSecret);
console.log('');

// 관리자 비밀번호 생성 (강력한 비밀번호)
const adminPassword = `${crypto.randomBytes(12).toString('base64').replace(/[+/=]/g, '')}!@#`;
console.log('ADMIN_PASSWORD (제안):');
console.log(adminPassword);
console.log('');

console.log('⚠️  이 값들을 안전한 곳에 저장하세요!');
console.log('배포 시 환경 변수에 설정해야 합니다.');
