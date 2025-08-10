// 소셜 로그인 설정
const GOOGLE_CLIENT_ID = '641017178501-b62koacmej8ess6jr9clgpae907356mn.apps.googleusercontent.com'; // Google Cloud Console에서 발급
const KAKAO_APP_KEY = 'YOUR_KAKAO_APP_KEY'; // Kakao Developers에서 발급 (아직 미설정)
const NAVER_CLIENT_ID = 'YOUR_NAVER_CLIENT_ID'; // Naver Developers에서 발급 (아직 미설정)

// Google 로그인 초기화
function initGoogleAuth() {
    // Google Sign-In 라이브러리 로드
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true
        });
    };
    document.head.appendChild(script);
}

// Google 로그인 응답 처리
async function handleGoogleResponse(response) {
    try {
        LoadingManager.show();
        
        // ID 토큰을 백엔드로 전송
        const result = await fetch(`${API_CONFIG.BASE_URL}/oauth/google`, {
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
            // 토큰 저장
            localStorage.setItem('auth_token', data.data.token);
            localStorage.setItem('user_info', JSON.stringify(data.data.user));
            
            NotificationManager.success('구글 로그인 성공!');
            
            // 대시보드로 리다이렉트
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
        } else {
            NotificationManager.error(data.message || '구글 로그인 실패');
        }
    } catch (error) {
        console.error('Google login error:', error);
        NotificationManager.error('구글 로그인 중 오류가 발생했습니다.');
    } finally {
        LoadingManager.hide();
    }
}

// Google 로그인 버튼 클릭
function loginWithGoogle() {
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.prompt();
    } else {
        NotificationManager.error('구글 로그인을 초기화하는 중입니다. 잠시 후 다시 시도해주세요.');
        initGoogleAuth();
    }
}

// Kakao 로그인 초기화
function initKakaoAuth() {
    // Kakao SDK 로드
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/v1/kakao.js';
    script.onload = () => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init(KAKAO_APP_KEY);
        }
    };
    document.head.appendChild(script);
}

// Kakao 로그인
function loginWithKakao() {
    if (!window.Kakao) {
        NotificationManager.error('카카오 로그인을 초기화하는 중입니다. 잠시 후 다시 시도해주세요.');
        initKakaoAuth();
        return;
    }

    Kakao.Auth.login({
        success: async function(authObj) {
            try {
                LoadingManager.show();
                
                // 액세스 토큰을 백엔드로 전송
                const response = await fetch(`${API_CONFIG.BASE_URL}/oauth/kakao`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        token: authObj.access_token
                    })
                });

                const data = await response.json();

                if (data.success) {
                    // 토큰 저장
                    localStorage.setItem('auth_token', data.data.token);
                    localStorage.setItem('user_info', JSON.stringify(data.data.user));
                    
                    NotificationManager.success('카카오 로그인 성공!');
                    
                    // 대시보드로 리다이렉트
                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 1000);
                } else {
                    NotificationManager.error(data.message || '카카오 로그인 실패');
                }
            } catch (error) {
                console.error('Kakao login error:', error);
                NotificationManager.error('카카오 로그인 중 오류가 발생했습니다.');
            } finally {
                LoadingManager.hide();
            }
        },
        fail: function(err) {
            console.error('Kakao login failed:', err);
            NotificationManager.error('카카오 로그인에 실패했습니다.');
        }
    });
}

// Naver 로그인 초기화
function initNaverAuth() {
    // Naver 로그인 SDK 로드
    const script = document.createElement('script');
    script.src = 'https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js';
    script.charset = 'utf-8';
    script.onload = () => {
        const naverLogin = new naver.LoginWithNaverId({
            clientId: NAVER_CLIENT_ID,
            callbackUrl: window.location.origin + '/login.html',
            isPopup: false,
            loginButton: { color: "green", type: 3, height: 48 }
        });
        naverLogin.init();
        
        // 콜백 처리
        if (window.location.hash) {
            naverLogin.getLoginStatus(async (status) => {
                if (status) {
                    const token = naverLogin.oauthParams.access_token;
                    await handleNaverLogin(token);
                }
            });
        }
    };
    document.head.appendChild(script);
}

// Naver 로그인 처리
async function handleNaverLogin(token) {
    try {
        LoadingManager.show();
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/oauth/naver`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('auth_token', data.data.token);
            localStorage.setItem('user_info', JSON.stringify(data.data.user));
            
            NotificationManager.success('네이버 로그인 성공!');
            
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
        } else {
            NotificationManager.error(data.message || '네이버 로그인 실패');
        }
    } catch (error) {
        console.error('Naver login error:', error);
        NotificationManager.error('네이버 로그인 중 오류가 발생했습니다.');
    } finally {
        LoadingManager.hide();
    }
}

// Naver 로그인 버튼 클릭
function loginWithNaver() {
    if (document.getElementById('naverIdLogin_loginButton')) {
        document.getElementById('naverIdLogin_loginButton').click();
    } else {
        NotificationManager.info('네이버 로그인을 준비 중입니다.');
        initNaverAuth();
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 소셜 로그인 SDK 초기화
    if (GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID') {
        initGoogleAuth();
    }
    if (KAKAO_APP_KEY !== 'YOUR_KAKAO_APP_KEY') {
        initKakaoAuth();
    }
    if (NAVER_CLIENT_ID !== 'YOUR_NAVER_CLIENT_ID') {
        initNaverAuth();
    }
});

// 글로벌 함수로 노출
window.loginWithGoogle = loginWithGoogle;
window.loginWithKakao = loginWithKakao;
window.loginWithNaver = loginWithNaver;