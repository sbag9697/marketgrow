// 소셜 로그인 설정
const GOOGLE_CLIENT_ID = '641017178501-b62koacmej8ess6jr9clgpae907356mn.apps.googleusercontent.com'; // ✅ Google 설정 완료
const KAKAO_APP_KEY = 'YOUR_KAKAO_APP_KEY'; // ⚠️ Kakao Developers에서 JavaScript 키 발급 필요
const NAVER_CLIENT_ID = 'YOUR_NAVER_CLIENT_ID'; // ⚠️ Naver Developers에서 Client ID 발급 필요

// Google 로그인 초기화
function initGoogleAuth() {
    console.log('Initializing Google Auth with Client ID:', GOOGLE_CLIENT_ID);
    
    // 이미 스크립트가 로드되었는지 확인
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
        console.log('Google script already loaded');
        return;
    }
    
    // Google Sign-In 라이브러리 로드
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
        console.log('Google Sign-In script loaded');
        
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
                ux_mode: 'popup', // 팝업 모드 명시
                context: 'signin',
                prompt_parent_id: 'g_id_onload'
            });
            
            console.log('Google Sign-In initialized successfully');
            
            // 로그인 버튼이 있는 페이지에서만 렌더링
            if (document.querySelector('.social-btn.google')) {
                renderGoogleButton();
            }
        } else {
            console.error('Google accounts object not available after script load');
        }
    };
    script.onerror = () => {
        console.error('Failed to load Google Sign-In script');
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
            // 토큰 저장 (api.js와 동일한 키 사용)
            localStorage.setItem('authToken', data.data.token);
            localStorage.setItem('userInfo', JSON.stringify(data.data.user));
            
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
    console.log('Google login button clicked');
    
    if (typeof google !== 'undefined' && google.accounts) {
        console.log('Google accounts object found, showing prompt');
        google.accounts.id.prompt((notification) => {
            console.log('Prompt notification:', notification);
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // 팝업이 차단되었거나 스킵된 경우 다른 방법 시도
                console.log('Prompt was not displayed or skipped');
                // 대체 로그인 방법 제공
                NotificationManager.info('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
            }
        });
    } else {
        console.log('Google accounts object not found, initializing...');
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
    if (KAKAO_APP_KEY === 'YOUR_KAKAO_APP_KEY') {
        NotificationManager.error('카카오 로그인 설정이 필요합니다. 관리자에게 문의하세요.');
        console.error('Kakao App Key가 설정되지 않았습니다.');
        return;
    }
    
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
                    // 토큰 저장 (api.js와 동일한 키 사용)
                    localStorage.setItem('authToken', data.data.token);
                    localStorage.setItem('userInfo', JSON.stringify(data.data.user));
                    
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
            localStorage.setItem('authToken', data.data.token);
            localStorage.setItem('userInfo', JSON.stringify(data.data.user));
            
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
    if (NAVER_CLIENT_ID === 'YOUR_NAVER_CLIENT_ID') {
        NotificationManager.error('네이버 로그인 설정이 필요합니다. 관리자에게 문의하세요.');
        console.error('Naver Client ID가 설정되지 않았습니다.');
        return;
    }
    
    if (document.getElementById('naverIdLogin_loginButton')) {
        document.getElementById('naverIdLogin_loginButton').click();
    } else {
        NotificationManager.info('네이버 로그인을 준비 중입니다.');
        initNaverAuth();
    }
}

// Google 버튼 렌더링 함수
function renderGoogleButton() {
    const googleBtnContainer = document.querySelector('.social-btn.google');
    if (googleBtnContainer && typeof google !== 'undefined' && google.accounts) {
        // 기존 버튼 옆에 Google의 공식 버튼도 추가
        const googleButtonDiv = document.createElement('div');
        googleButtonDiv.id = 'g_id_signin';
        googleButtonDiv.style.display = 'none'; // 일단 숨김
        googleBtnContainer.parentNode.insertBefore(googleButtonDiv, googleBtnContainer.nextSibling);
        
        // Google 공식 버튼 렌더링
        google.accounts.id.renderButton(
            googleButtonDiv,
            {
                theme: 'outline',
                size: 'large',
                width: '100%',
                text: 'signin_with',
                locale: 'ko'
            }
        );
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - Initializing social auth');
    
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
    
    // 디버깅을 위한 전역 접근 설정
    window.debugGoogleAuth = () => {
        console.log('Google object:', typeof google !== 'undefined' ? google : 'undefined');
        console.log('Google accounts:', typeof google !== 'undefined' && google.accounts ? 'available' : 'not available');
        console.log('Client ID:', GOOGLE_CLIENT_ID);
    };
});

// 글로벌 함수로 노출
window.loginWithGoogle = loginWithGoogle;
window.loginWithKakao = loginWithKakao;
window.loginWithNaver = loginWithNaver;