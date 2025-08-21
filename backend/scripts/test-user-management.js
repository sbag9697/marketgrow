const axios = require('axios');

async function testUserManagement() {
    try {
        console.log('\n===== 회원 관리 기능 테스트 =====\n');
        
        // 1. 테스트용 회원 생성
        console.log('1️⃣ 테스트 회원 생성...');
        
        try {
            const res = await axios.post('http://localhost:5002/api/auth/signup', {
                username: 'testmember',
                email: 'testmember@test.com',
                password: 'Test123!',
                name: '테스트회원',
                phone: '01099998888'
            });
            console.log('✅ 테스트 회원 생성 완료');
            console.log('   ID:', res.data.data.user._id);
            console.log('   이메일:', res.data.data.user.email);
        } catch (e) {
            if (e.response?.data?.message?.includes('이미')) {
                console.log('ℹ️ 테스트 회원이 이미 존재');
            }
        }
        
        // 2. 회원 목록 조회
        console.log('\n2️⃣ 회원 목록 조회 테스트...');
        
        try {
            // 먼저 로그인
            const loginRes = await axios.post('http://localhost:5002/api/auth/login', {
                login: 'newadmin@marketgrow.kr',
                password: 'Admin123!'
            });
            
            const token = loginRes.data.data.token;
            
            // 회원 목록 조회
            const usersRes = await axios.get('http://localhost:5002/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('✅ 회원 목록 조회 성공');
            console.log('   총 회원 수:', usersRes.data.data?.users?.length || 0);
            
            if (usersRes.data.data?.users?.length > 0) {
                console.log('\n   최근 가입 회원:');
                usersRes.data.data.users.slice(0, 3).forEach(user => {
                    console.log(`     - ${user.name} (${user.email}) - ${user.role}`);
                });
            }
        } catch (e) {
            console.log('❌ 회원 목록 조회 실패:', e.response?.data?.message || e.message);
        }
        
        console.log('\n========================================');
        console.log('✅ 회원 관리 기능 테스트 완료!');
        console.log('========================================\n');
        
        console.log('💡 관리자 대시보드에서 확인:');
        console.log('1. http://localhost:5002/admin/ 접속');
        console.log('2. newadmin@marketgrow.kr / Admin123! 로그인');
        console.log('3. 회원 관리 탭에서 확인');
        console.log('   - "회원 추가" 버튼으로 새 회원 생성');
        console.log('   - "수정" 버튼으로 회원 정보 수정');
        console.log('   - "활성화/비활성화" 버튼으로 상태 변경');
        
    } catch (error) {
        console.error('❌ 오류:', error.message);
    }
}

testUserManagement();