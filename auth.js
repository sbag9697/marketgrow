// 사용자 인증 관리 시스템
class AuthManager {
    constructor() {
        this.apiBase = '/.netlify/functions';
        this.users = JSON.parse(localStorage.getItem('users') || '[]');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        this.token = localStorage.getItem('token');
        this.init();
    }

    async init() {
        // 토큰이 있으면 서버에서 사용자 정보 확인
        if (this.token) {
            await this.verifyToken();
        } else {
            // 데모 계정 생성 (로컬 테스트용)
            this.createDemoAccount();
        }

        // 로그인 상태 확인
        if (this.currentUser) {
            this.updateUIForLoggedInUser();
        }
    }

    // 데모 계정 생성 (테스트용)
    createDemoAccount() {
        const demoUser = this.users.find(user => user.username === 'demo');
        if (!demoUser) {
            const demo = {
                id: 1000,
                username: 'demo',
                email: 'demo@example.com',
                password: this.hashPassword('123456'),
                createdAt: new Date().toISOString(),
                orders: [],
                points: 1000
            };
            this.users.push(demo);
            this.saveUsers();
            console.log('데모 계정이 생성되었습니다: demo / 123456');
        }
    }

    // 토큰 검증
    async verifyToken() {
        try {
            const response = await fetch(`${this.apiBase}/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
                body: JSON.stringify({ action: 'verify' })
            });

            const result = await response.json();

            if (result.success) {
                this.currentUser = result.user;
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                return true;
            } else {
                // 토큰이 유효하지 않으면 제거
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            this.logout();
            return false;
        }
    }

    // 회원가입 (서버 연동)
    async register(userData) {
        const { username, email, password, confirmPassword, phone } = userData;

        // 유효성 검사
        if (!username || !email || !password) {
            throw new Error('모든 필드를 입력해주세요.');
        }

        if (password !== confirmPassword) {
            throw new Error('비밀번호가 일치하지 않습니다.');
        }

        try {
            const response = await fetch(`${this.apiBase}/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'register',
                    username,
                    email,
                    password,
                    phone
                })
            });

            const result = await response.json();

            if (result.success) {
                this.currentUser = result.user;
                this.token = result.token;

                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                localStorage.setItem('token', this.token);

                this.updateUIForLoggedInUser();
                return { success: true, user: result.user };
            } else {
                throw new Error(result.error || '회원가입에 실패했습니다.');
            }
        } catch (error) {
            // 서버 연결 실패시 로컬 저장소 사용 (fallback)
            return this.registerLocal(userData);
        }
    }

    // 로컬 회원가입 (fallback)
    registerLocal(userData) {
        const { username, email, password } = userData;

        if (password.length < 6) {
            throw new Error('비밀번호는 6자 이상이어야 합니다.');
        }

        // 중복 사용자 확인
        const existingUser = this.users.find(user =>
            user.username === username || user.email === email
        );

        if (existingUser) {
            throw new Error('이미 존재하는 사용자입니다.');
        }

        // 새 사용자 생성
        const newUser = {
            id: Date.now(),
            username,
            email,
            password: this.hashPassword(password),
            createdAt: new Date().toISOString(),
            orders: [],
            points: 0
        };

        this.users.push(newUser);
        this.saveUsers();

        return { success: true, message: '회원가입이 완료되었습니다.' };
    }

    // 로그인
    login(username, password) {
        const user = this.users.find(u =>
            (u.username === username || u.email === username) &&
            u.password === this.hashPassword(password)
        );

        if (!user) {
            throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
        }

        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.updateUIForLoggedInUser();

        return { success: true, message: '로그인되었습니다.', user };
    }

    // 로그아웃
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateUIForLoggedOutUser();
        window.location.reload();
    }

    // 간단한 해시 함수 (실제 서비스에서는 bcrypt 등 사용)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    // 사용자 목록 저장
    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    // 로그인된 사용자 UI 업데이트
    updateUIForLoggedInUser() {
        const loginBtn = document.querySelector('.login-btn');
        const signupBtn = document.querySelector('.signup-btn');

        if (loginBtn && signupBtn) {
            const userMenu = document.createElement('div');
            userMenu.className = 'user-menu';
            userMenu.innerHTML = `
                <span class="username">${this.currentUser.username}님</span>
                <div class="dropdown">
                    <button class="dropdown-btn">메뉴 ▼</button>
                    <div class="dropdown-content">
                        <a href="#" onclick="showDashboard()">대시보드</a>
                        <a href="#" onclick="showProfile()">프로필</a>
                        <a href="#" onclick="authManager.logout()">로그아웃</a>
                    </div>
                </div>
            `;

            loginBtn.parentNode.replaceChild(userMenu, loginBtn);
            signupBtn.style.display = 'none';
        }
    }

    // 로그아웃된 사용자 UI 업데이트
    updateUIForLoggedOutUser() {
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            window.location.reload();
        }
    }

    // 현재 사용자 정보 반환
    getCurrentUser() {
        return this.currentUser;
    }

    // 사용자 인증 확인
    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// 전역 인스턴스 생성
const authManager = new AuthManager();
