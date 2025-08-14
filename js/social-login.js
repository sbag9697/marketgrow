// 소셜 로그인 시스템
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5001/api'
    : 'https://marketgrow-production-c586.up.railway.app/api';

// 소셜 로그인 설정
const SOCIAL_CONFIG = {
    google: {
        clientId: '1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com', // ✅ Google 설정 완료
        redirectUri: window.location.origin + '/auth/google/callback',
        scope: 'openid profile email'
    },
    kakao: {
        appKey: '95a2c17a5ec078dd1762950680e53267', // ✅ Kakao 설정 완료
        redirectUri: window.location.origin + '/auth/kakao/callback'
    },
    naver: {
        clientId: 'Cirw8aXNIq8wF518fNMZ', // ✅ Naver 설정 완료
        redirectUri: window.location.origin + '/auth/naver/callback',
        state: generateState()
    }
};

// State 생성 (CSRF 방지)
function generateState() {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

class SocialLogin {
    constructor() {
        this.init();
    }

    // 초기화
    init() {
        this.loadSDKs();
        this.setupEventListeners();
        this.checkAuthCallback();
    }

    // SDK 로드
    loadSDKs() {
        // Google SDK
        this.loadGoogleSDK();
        
        // Kakao SDK
        this.loadKakaoSDK();
        
        // Naver SDK는 팝업 방식 사용
    }

    // Google SDK 로드
    loadGoogleSDK() {
        // 이미 로드되었는지 확인
        if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
            console.log('Google SDK 이미 로드됨');
            if (typeof google !== 'undefined' && google.accounts) {
                this.initializeGoogle();
            }
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            console.log('Google SDK 로드 완료');
            // SDK 로드 후 잠시 대기
            setTimeout(() => {
                if (SOCIAL_CONFIG.google.clientId !== 'YOUR_GOOGLE_CLIENT_ID') {
                    this.initializeGoogle();
                }
            }, 500);
        };
        script.onerror = () => {
            console.error('Google SDK 로드 실패');
        };
        document.head.appendChild(script);
    }

    // Kakao SDK 로드
    loadKakaoSDK() {
        const script = document.createElement('script');
        script.src = 'https://developers.kakao.com/sdk/js/kakao.min.js';
        script.async = true;
        script.onload = () => {
            console.log('Kakao SDK 로드됨');
            if (SOCIAL_CONFIG.kakao.appKey !== 'YOUR_KAKAO_APP_KEY') {
                Kakao.init(SOCIAL_CONFIG.kakao.appKey);
                console.log('Kakao SDK 초기화 완료');
            }
        };
        script.onerror = () => {
            console.error('Kakao SDK 로드 실패');
        };
        document.head.appendChild(script);
    }

    // Google 초기화
    initializeGoogle() {
        console.log('Google 초기화 시작...');
        try {
            // Google SDK가 로드되었는지 확인
            if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
                console.error('Google SDK가 아직 로드되지 않음');
                // 1초 후 재시도
                setTimeout(() => this.initializeGoogle(), 1000);
                return;
            }

            google.accounts.id.initialize({
                client_id: SOCIAL_CONFIG.google.clientId,
                callback: this.handleGoogleResponse.bind(this),
                auto_select: false,
                cancel_on_tap_outside: true,
                context: 'signin',
                ux_mode: 'popup'
            });
            console.log('Google 초기화 완료');
            
            // 전역 변수로 설정하여 다른 곳에서도 사용 가능하게 함
            window.googleInitialized = true;

            // Google 버튼 렌더링
            const googleBtns = document.querySelectorAll('.google-signin-btn');
            googleBtns.forEach(btn => {
                google.accounts.id.renderButton(btn, {
                    theme: 'outline',
                    size: 'large',
                    width: '100%',
                    text: 'continue_with',
                    locale: 'ko'
                });
            });
        } catch (error) {
            console.error('Google 초기화 오류:', error);
            // 오류 발생 시 1초 후 재시도
            setTimeout(() => this.initializeGoogle(), 1000);
        }
    }

    // Google 로그인
    loginWithGoogle() {
        console.log('Google 로그인 시도...');
        
        if (SOCIAL_CONFIG.google.clientId === 'YOUR_GOOGLE_CLIENT_ID') {
            alert('Google Client ID가 설정되지 않았습니다. 관리자에게 문의하세요.');
            return;
        }

        // Google SDK가 로드되었는지 확인
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
            console.log('Google SDK가 아직 로드되지 않음, 재초기화 시도...');
            this.loadGoogleSDK();
            
            // 3초 대기 후 재시도
            setTimeout(() => {
                if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                    try {
                        google.accounts.id.prompt((notification) => {
                            console.log('Google prompt notification:', notification);
                        });
                    } catch (e) {
                        console.error('Google prompt 오류:', e);
                        alert('Google 로그인 초기화 중입니다. 잠시 후 다시 시도해주세요.');
                    }
                } else {
                    alert('Google 로그인을 준비 중입니다. 페이지를 새로고침하고 다시 시도해주세요.');
                }
            }, 3000);
            return;
        }

        // Google 초기화가 완료되었는지 확인
        if (!window.googleInitialized) {
            console.log('Google 초기화 대기 중...');
            this.initializeGoogle();
            setTimeout(() => {
                if (window.googleInitialized) {
                    google.accounts.id.prompt((notification) => {
                        console.log('Google prompt notification:', notification);
                    });
                } else {
                    alert('Google 로그인을 준비 중입니다. 잠시 후 다시 시도해주세요.');
                }
            }, 2000);
            return;
        }

        try {
            google.accounts.id.prompt((notification) => {
                console.log('Google prompt notification:', notification);
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    console.log('Google One Tap이 표시되지 않음, 버튼 클릭 방식으로 전환');
                    // One Tap이 표시되지 않으면 버튼 클릭 방식으로 전환
                    alert('브라우저 설정으로 인해 Google 로그인 팝업이 차단되었습니다. 팝업 차단을 해제하거나 다른 브라우저를 사용해주세요.');
                }
            });
        } catch (error) {
            console.error('Google prompt 오류:', error);
            alert('Google 로그인 중 오류가 발생했습니다. 페이지를 새로고침하고 다시 시도해주세요.');
        }
    }

    // Google 응답 처리
    async handleGoogleResponse(response) {
        try {
            const result = await fetch(`${API_URL}/oauth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: response.credential
                })
            });

            const data = await result.json();
            
            if (data.success) {
                this.loginSuccess(data.data);
            } else {
                this.loginFailed('Google 로그인 실패: ' + data.message);
            }
        } catch (error) {
            console.error('Google 로그인 오류:', error);
            this.loginFailed('Google 로그인 중 오류가 발생했습니다.');
        }
    }

    // Kakao 로그인
    loginWithKakao() {
        if (SOCIAL_CONFIG.kakao.appKey === 'YOUR_KAKAO_APP_KEY') {
            alert('Kakao App Key가 설정되지 않았습니다. 관리자에게 문의하세요.');
            return;
        }

        Kakao.Auth.authorize({
            redirectUri: SOCIAL_CONFIG.kakao.redirectUri,
            scope: 'profile_nickname,profile_image,account_email'
        });
    }

    // Kakao 로그인 (팝업 방식)
    loginWithKakaoPopup() {
        if (SOCIAL_CONFIG.kakao.appKey === 'YOUR_KAKAO_APP_KEY') {
            alert('Kakao App Key가 설정되지 않았습니다. 관리자에게 문의하세요.');
            return;
        }

        Kakao.Auth.login({
            success: async (authObj) => {
                try {
                    // 액세스 토큰으로 사용자 정보 요청
                    Kakao.API.request({
                        url: '/v2/user/me',
                        success: async (user) => {
                            const result = await fetch(`${API_URL}/oauth/kakao`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    token: authObj.access_token
                                })
                            });

                            const data = await result.json();
                            
                            if (data.success) {
                                this.loginSuccess(data.data);
                            } else {
                                this.loginFailed('Kakao 로그인 실패: ' + data.message);
                            }
                        },
                        fail: (error) => {
                            console.error('Kakao 사용자 정보 조회 실패:', error);
                            this.loginFailed('Kakao 로그인 중 오류가 발생했습니다.');
                        }
                    });
                } catch (error) {
                    console.error('Kakao 로그인 오류:', error);
                    this.loginFailed('Kakao 로그인 중 오류가 발생했습니다.');
                }
            },
            fail: (error) => {
                console.error('Kakao 로그인 실패:', error);
                this.loginFailed('Kakao 로그인에 실패했습니다.');
            }
        });
    }

    // Naver 로그인
    loginWithNaver() {
        if (SOCIAL_CONFIG.naver.clientId === 'YOUR_NAVER_CLIENT_ID') {
            alert('Naver Client ID가 설정되지 않았습니다. 관리자에게 문의하세요.');
            return;
        }

        const state = SOCIAL_CONFIG.naver.state;
        sessionStorage.setItem('naver_state', state);

        const authUrl = `https://nid.naver.com/oauth2.0/authorize?` +
            `response_type=code&` +
            `client_id=${SOCIAL_CONFIG.naver.clientId}&` +
            `redirect_uri=${encodeURIComponent(SOCIAL_CONFIG.naver.redirectUri)}&` +
            `state=${state}`;

        window.location.href = authUrl;
    }

    // Naver 로그인 (팝업 방식)
    loginWithNaverPopup() {
        if (SOCIAL_CONFIG.naver.clientId === 'YOUR_NAVER_CLIENT_ID') {
            alert('Naver Client ID가 설정되지 않았습니다. 관리자에게 문의하세요.');
            return;
        }

        const state = SOCIAL_CONFIG.naver.state;
        sessionStorage.setItem('naver_state', state);

        const authUrl = `https://nid.naver.com/oauth2.0/authorize?` +
            `response_type=code&` +
            `client_id=${SOCIAL_CONFIG.naver.clientId}&` +
            `redirect_uri=${encodeURIComponent(SOCIAL_CONFIG.naver.redirectUri)}&` +
            `state=${state}`;

        const popup = window.open(
            authUrl,
            'naver_login',
            'width=500,height=600,toolbar=no,menubar=no'
        );

        // 팝업 상태 체크
        const checkPopup = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkPopup);
                this.checkNaverCallback();
            }
        }, 1000);
    }

    // 콜백 확인
    async checkAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Google 콜백
        if (window.location.pathname === '/auth/google/callback') {
            // Google은 위의 handleGoogleResponse에서 처리
        }
        
        // Kakao 콜백
        if (window.location.pathname === '/auth/kakao/callback') {
            const code = urlParams.get('code');
            if (code) {
                await this.handleKakaoCallback(code);
            }
        }
        
        // Naver 콜백
        if (window.location.pathname === '/auth/naver/callback') {
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            if (code && state) {
                await this.handleNaverCallback(code, state);
            }
        }
    }

    // Kakao 콜백 처리
    async handleKakaoCallback(code) {
        try {
            const result = await fetch(`${API_URL}/auth/kakao/callback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code })
            });

            const data = await result.json();
            
            if (data.success) {
                this.loginSuccess(data.data);
            } else {
                this.loginFailed('Kakao 인증 실패: ' + data.message);
            }
        } catch (error) {
            console.error('Kakao 콜백 처리 오류:', error);
            this.loginFailed('Kakao 인증 중 오류가 발생했습니다.');
        }
    }

    // Naver 콜백 처리
    async handleNaverCallback(code, state) {
        // State 검증
        const savedState = sessionStorage.getItem('naver_state');
        if (state !== savedState) {
            this.loginFailed('보안 검증 실패');
            return;
        }

        try {
            const result = await fetch(`${API_URL}/auth/naver/callback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code, state })
            });

            const data = await result.json();
            
            if (data.success) {
                this.loginSuccess(data.data);
            } else {
                this.loginFailed('Naver 인증 실패: ' + data.message);
            }
        } catch (error) {
            console.error('Naver 콜백 처리 오류:', error);
            this.loginFailed('Naver 인증 중 오류가 발생했습니다.');
        }
    }

    // Naver 콜백 체크 (팝업용)
    checkNaverCallback() {
        const authData = sessionStorage.getItem('naver_auth_data');
        if (authData) {
            const data = JSON.parse(authData);
            sessionStorage.removeItem('naver_auth_data');
            this.loginSuccess(data);
        }
    }

    // 로그인 성공 처리
    loginSuccess(data) {
        // 토큰 저장
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userInfo', JSON.stringify(data.user));
        
        // 소셜 로그인 정보 저장
        localStorage.setItem('socialProvider', data.provider);
        
        // 환영 메시지
        this.showNotification(`${data.user.name}님, 환영합니다!`, 'success');
        
        // 리다이렉트
        const redirect = sessionStorage.getItem('loginRedirect') || '/dashboard.html';
        setTimeout(() => {
            window.location.href = redirect;
        }, 1000);
    }

    // 로그인 실패 처리
    loginFailed(message) {
        this.showNotification(message, 'error');
    }

    // 알림 표시
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `social-notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // Google 로그인 버튼
        document.addEventListener('click', (e) => {
            if (e.target.closest('.social-login-google')) {
                e.preventDefault();
                this.loginWithGoogle();
            }
        });
        
        // Kakao 로그인 버튼
        document.addEventListener('click', (e) => {
            if (e.target.closest('.social-login-kakao')) {
                e.preventDefault();
                this.loginWithKakaoPopup();
            }
        });
        
        // Naver 로그인 버튼
        document.addEventListener('click', (e) => {
            if (e.target.closest('.social-login-naver')) {
                e.preventDefault();
                this.loginWithNaverPopup();
            }
        });
    }

    // 소셜 계정 연결 해제
    async unlinkSocialAccount(provider) {
        try {
            const token = localStorage.getItem('authToken');
            const result = await fetch(`${API_URL}/auth/unlink/${provider}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await result.json();
            
            if (data.success) {
                this.showNotification(`${provider} 계정 연결이 해제되었습니다.`, 'success');
                return true;
            } else {
                this.showNotification(data.message, 'error');
                return false;
            }
        } catch (error) {
            console.error('계정 연결 해제 오류:', error);
            this.showNotification('계정 연결 해제 중 오류가 발생했습니다.', 'error');
            return false;
        }
    }
}

// 소셜 로그인 버튼 스타일
const socialLoginStyles = `
<style>
.social-login-buttons {
    margin: 20px 0;
}

.social-login-divider {
    text-align: center;
    margin: 20px 0;
    position: relative;
}

.social-login-divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: #e5e7eb;
}

.social-login-divider span {
    background: white;
    padding: 0 15px;
    position: relative;
    color: #94a3b8;
    font-size: 14px;
}

.social-login-btn {
    width: 100%;
    padding: 12px;
    margin-bottom: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    color: #1e293b;
}

.social-login-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.social-login-google {
    border-color: #4285f4;
}

.social-login-google:hover {
    background: #f8faff;
    border-color: #2563eb;
}

.social-login-google i {
    color: #4285f4;
}

.social-login-kakao {
    background: #fee500;
    border-color: #fee500;
    color: #000000;
}

.social-login-kakao:hover {
    background: #fdd835;
}

.social-login-naver {
    background: #03c75a;
    border-color: #03c75a;
    color: white;
}

.social-login-naver:hover {
    background: #02b350;
}

.social-notification {
    position: fixed;
    top: -100px;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    padding: 15px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 10000;
    transition: top 0.3s ease;
}

.social-notification.show {
    top: 20px;
}

.social-notification.success {
    border-left: 4px solid #10b981;
}

.social-notification.error {
    border-left: 4px solid #ef4444;
}

.social-notification i {
    font-size: 20px;
}

.social-notification.success i {
    color: #10b981;
}

.social-notification.error i {
    color: #ef4444;
}

/* 연결된 계정 표시 */
.connected-accounts {
    padding: 20px;
    background: #f8fafc;
    border-radius: 8px;
    margin-top: 20px;
}

.connected-accounts h4 {
    margin-bottom: 15px;
    color: #1a365d;
}

.account-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: white;
    border-radius: 6px;
    margin-bottom: 10px;
}

.account-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.account-provider {
    font-weight: 600;
    color: #1e293b;
}

.account-email {
    color: #64748b;
    font-size: 14px;
}

.unlink-btn {
    padding: 6px 12px;
    background: #fee2e2;
    color: #dc2626;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.unlink-btn:hover {
    background: #dc2626;
    color: white;
}
</style>
`;

// 스타일 삽입
document.head.insertAdjacentHTML('beforeend', socialLoginStyles);

// 전역 인스턴스 생성
const socialLogin = new SocialLogin();

// 전역 함수 등록
window.socialLogin = socialLogin;