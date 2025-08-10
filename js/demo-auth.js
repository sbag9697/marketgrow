// 데모 인증 시스템 (백엔드 오류 시 사용)
const DemoAuth = {
    // 데모 계정 데이터
    accounts: [
        {
            username: 'demo',
            email: 'demo@test.com',
            password: 'Demo1234!',
            name: '데모 사용자',
            role: 'user',
            token: 'demo_token_' + Date.now()
        },
        {
            username: 'testuser',
            email: 'test@test.com',
            password: 'Test1234!',
            name: '테스트 사용자',
            role: 'user',
            token: 'test_token_' + Date.now()
        }
    ],

    // 로그인 시도
    login(credentials) {
        const { login, password } = credentials;
        
        const account = this.accounts.find(acc => 
            (acc.username === login || acc.email === login) && 
            acc.password === password
        );

        if (account) {
            const userData = { ...account };
            delete userData.password;
            
            // 토큰과 사용자 정보 저장
            localStorage.setItem('authToken', userData.token);
            localStorage.setItem('userInfo', JSON.stringify(userData));
            localStorage.setItem('demoMode', 'true');
            
            return {
                success: true,
                data: {
                    user: userData,
                    token: userData.token
                }
            };
        }

        return {
            success: false,
            message: '아이디 또는 비밀번호가 올바르지 않습니다.'
        };
    },

    // 회원가입 (데모)
    register(userData) {
        const newAccount = {
            ...userData,
            token: 'new_token_' + Date.now(),
            role: 'user'
        };
        
        this.accounts.push(newAccount);
        
        const responseData = { ...newAccount };
        delete responseData.password;
        
        localStorage.setItem('authToken', responseData.token);
        localStorage.setItem('userInfo', JSON.stringify(responseData));
        localStorage.setItem('demoMode', 'true');
        
        return {
            success: true,
            data: {
                user: responseData,
                token: responseData.token
            }
        };
    },

    // 로그아웃
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('demoMode');
        return { success: true };
    },

    // 인증 상태 확인
    isAuthenticated() {
        return !!localStorage.getItem('authToken');
    },

    // 사용자 정보 가져오기
    getCurrentUser() {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    }
};

// 전역으로 노출
window.DemoAuth = DemoAuth;