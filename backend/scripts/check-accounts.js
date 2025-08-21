const axios = require('axios');

async function checkAccounts() {
    console.log('\n===== 현재 사용 가능한 계정 =====\n');
    
    const accounts = [
        { email: 'admin@marketgrow.com', password: 'admin123!@#', desc: 'Seed Admin' },
        { email: 'admin@marketgrow.com', password: 'Admin123!@#', desc: 'Seed Admin (대문자)' },
        { email: 'testadmin@marketgrow.kr', password: 'Test123!', desc: 'Test Admin' },
        { email: 'dashtest@test.com', password: 'Test123!', desc: 'Dashboard Test' },
        { email: 'user1@test.com', password: 'Test123!', desc: 'Test User 1' }
    ];
    
    for (const account of accounts) {
        try {
            const response = await axios.post('http://localhost:5002/api/auth/login', {
                login: account.email,
                password: account.password
            });
            
            if (response.data.success) {
                const user = response.data.data.user;
                console.log(`✅ ${account.desc}:`);
                console.log(`   이메일: ${account.email}`);
                console.log(`   비밀번호: ${account.password}`);
                console.log(`   역할: ${user.role}`);
                console.log(`   이름: ${user.name}`);
                console.log('');
            }
        } catch (error) {
            // 로그인 실패는 무시
        }
    }
    
    console.log('=====================================');
    console.log('\n💡 관리자 대시보드 접속:');
    console.log('   URL: http://localhost:5002/admin/');
    console.log('   위 계정 중 하나로 로그인');
    console.log('\n📌 참고: role이 "admin"인 계정만 관리자 기능 사용 가능');
}

checkAccounts();