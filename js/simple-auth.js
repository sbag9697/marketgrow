// 간단한 인증 시스템 - 직접 구현
const API_URL = 'https://marketgrow-production-c586.up.railway.app/api';

// 로그인 처리
async function doLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('아이디와 비밀번호를 입력하세요');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                login: username,
                password
            })
        });

        const data = await response.json();

        if (data.success) {
            // 토큰 저장
            localStorage.setItem('authToken', data.data.token);
            localStorage.setItem('userInfo', JSON.stringify(data.data.user));

            alert('로그인 성공!');
            window.location.href = '/dashboard.html';
        } else {
            alert(`로그인 실패: ${data.message || '아이디 또는 비밀번호를 확인하세요'}`);
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        alert('서버 연결 실패. 잠시 후 다시 시도하세요.');
    }
}

// 회원가입 처리
async function doSignup(event) {
    event.preventDefault();

    const username = document.getElementById('signupUsername')?.value || '';
    const email = document.getElementById('email')?.value || '';
    const password = document.getElementById('signupPassword')?.value || '';
    const name = document.getElementById('name')?.value || '';
    const phone = document.getElementById('phone')?.value || '';

    console.log('회원가입 시도:', { username, email, name, phone });

    if (!username || !email || !password || !name || !phone) {
        const missing = [];
        if (!username) missing.push('아이디');
        if (!email) missing.push('이메일');
        if (!password) missing.push('비밀번호');
        if (!name) missing.push('이름');
        if (!phone) missing.push('전화번호');
        alert(`다음 항목을 입력하세요: ${missing.join(', ')}`);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password,
                name,
                phone
            })
        });

        const data = await response.json();
        console.log('회원가입 응답:', data);

        if (data.success) {
            alert('회원가입 성공! 로그인 페이지로 이동합니다.');

            // 자동 로그인
            if (data.data && data.data.token) {
                localStorage.setItem('authToken', data.data.token);
                localStorage.setItem('userInfo', JSON.stringify(data.data.user));
                window.location.href = '/dashboard.html';
            } else {
                window.location.href = '/login.html';
            }
        } else {
            alert(`회원가입 실패: ${data.message || '입력 정보를 확인하세요'}`);
        }
    } catch (error) {
        console.error('회원가입 오류:', error);
        alert('서버 연결 실패. 잠시 후 다시 시도하세요.');
    }
}

// 로그아웃
function doLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    window.location.href = '/login.html';
}

// 로그인 상태 확인
function checkAuth() {
    const token = localStorage.getItem('authToken');
    return token !== null;
}

// 사용자 정보 가져오기
function getUserInfo() {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
}

// 페이지 로드 시 이벤트 연결
document.addEventListener('DOMContentLoaded', () => {
    // 로그인 폼
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', doLogin);
        console.log('로그인 폼 연결됨');
    }

    // 회원가입 폼
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', doSignup);
        console.log('회원가입 폼 연결됨');
    }

    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', doLogout);
    }

    // 대시보드 페이지인 경우 로그인 확인
    if (window.location.pathname.includes('dashboard')) {
        if (!checkAuth()) {
            alert('로그인이 필요합니다');
            window.location.href = '/login.html';
        } else {
            const user = getUserInfo();
            if (user) {
                // 사용자 이름 표시
                const userNameEl = document.getElementById('userName');
                if (userNameEl) {
                    userNameEl.textContent = user.name || user.username;
                }
            }
        }
    }
});

console.log('Simple Auth 로드됨 - API URL:', API_URL);
