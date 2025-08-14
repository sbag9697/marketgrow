// 소셜 로그인 시스템 - 간소화 버전
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5001/api'
    : 'https://marketgrow-production-c586.up.railway.app/api';

console.log('Social Login API URL:', API_URL);

// 소셜 로그인 설정
const SOCIAL_CONFIG = {
    google: {
        clientId: '1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com'
    },
    kakao: {
        appKey: '95a2c17a5ec078dd1762950680e53267'
    },
    naver: {
        clientId: 'Cirw8aXNIq8wF518fNMZ'
    }
};

// 상태 관리
let googleReady = false;
let kakaoReady = false;

// 페이지 로드 시 초기화
window.addEventListener('DOMContentLoaded', () => {
    console.log('소셜 로그인 초기화 시작...');

    // Google SDK 로드
    loadGoogleSDK();

    // Kakao SDK 로드
    loadKakaoSDK();
});

// Google SDK 로드
function loadGoogleSDK() {
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
        console.log('Google SDK 이미 로드됨');
        return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
        console.log('Google SDK 로드 완료');
        setTimeout(initGoogleLogin, 1000);
    };
    document.head.appendChild(script);
}

// Kakao SDK 로드
function loadKakaoSDK() {
    if (document.querySelector('script[src*="developers.kakao.com/sdk/js/kakao"]')) {
        console.log('Kakao SDK 이미 로드됨');
        return;
    }

    const script = document.createElement('script');
    script.src = 'https://developers.kakao.com/sdk/js/kakao.min.js';
    script.async = true;
    script.onload = () => {
        console.log('Kakao SDK 로드 완료');
        initKakaoLogin();
    };
    document.head.appendChild(script);
}

// Google 초기화
function initGoogleLogin() {
    if (typeof google === 'undefined' || !google.accounts) {
        console.log('Google SDK 아직 준비 안됨, 재시도...');
        setTimeout(initGoogleLogin, 1000);
        return;
    }

    try {
        google.accounts.id.initialize({
            client_id: SOCIAL_CONFIG.google.clientId,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true
        });
        googleReady = true;
        console.log('Google 로그인 준비 완료');
    } catch (error) {
        console.error('Google 초기화 오류:', error);
        setTimeout(initGoogleLogin, 1000);
    }
}

// Kakao 초기화
function initKakaoLogin() {
    if (typeof Kakao === 'undefined') {
        console.log('Kakao SDK 아직 준비 안됨, 재시도...');
        setTimeout(initKakaoLogin, 1000);
        return;
    }

    try {
        if (!Kakao.isInitialized()) {
            Kakao.init(SOCIAL_CONFIG.kakao.appKey);
        }
        kakaoReady = true;
        console.log('Kakao 로그인 준비 완료');
    } catch (error) {
        console.error('Kakao 초기화 오류:', error);
        setTimeout(initKakaoLogin, 1000);
    }
}

// Google 응답 처리
async function handleGoogleResponse(response) {
    console.log('Google 로그인 응답 받음');

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
            console.log('Google 로그인 성공');
            localStorage.setItem('authToken', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            alert('Google 로그인 성공!');
            window.location.href = '/dashboard.html';
        } else {
            alert(`Google 로그인 실패: ${data.message}`);
        }
    } catch (error) {
        console.error('Google 로그인 오류:', error);
        alert('Google 로그인 중 오류가 발생했습니다.');
    }
}

// 소셜 로그인 클래스
class SocialLogin {
    constructor() {
        console.log('SocialLogin 인스턴스 생성');
    }

    // Google 로그인
    loginWithGoogle() {
        console.log('Google 로그인 시도...');

        if (!googleReady) {
            alert('Google 로그인을 초기화 중입니다. 잠시 후 다시 시도해주세요.');
            initGoogleLogin();
            return;
        }

        if (typeof google !== 'undefined' && google.accounts) {
            try {
                google.accounts.id.prompt((notification) => {
                    console.log('Google prompt 상태:', notification);
                    if (notification.isNotDisplayed && notification.isNotDisplayed()) {
                        // OAuth 리다이렉트 방식으로 전환
                        const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
                            `client_id=${SOCIAL_CONFIG.google.clientId}&` +
                            `redirect_uri=${encodeURIComponent(`${window.location.origin}/auth/google/callback`)}&` +
                            'response_type=token&' +
                            'scope=openid%20profile%20email';
                        window.location.href = authUrl;
                    }
                });
            } catch (error) {
                console.error('Google prompt 오류:', error);
                alert('Google 로그인 중 오류가 발생했습니다.');
            }
        } else {
            alert('Google 로그인을 준비 중입니다. 페이지를 새로고침한 후 다시 시도해주세요.');
        }
    }

    // Kakao 로그인 (팝업)
    loginWithKakaoPopup() {
        console.log('Kakao 로그인 시도...');

        if (!kakaoReady) {
            alert('Kakao 로그인을 초기화 중입니다. 잠시 후 다시 시도해주세요.');
            initKakaoLogin();
            return;
        }

        if (typeof Kakao !== 'undefined') {
            Kakao.Auth.login({
                success: async function (authObj) {
                    console.log('Kakao 로그인 성공', authObj);

                    try {
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
                            console.log('Kakao 로그인 성공');
                            localStorage.setItem('authToken', data.data.token);
                            localStorage.setItem('user', JSON.stringify(data.data.user));
                            alert('Kakao 로그인 성공!');
                            window.location.href = '/dashboard.html';
                        } else {
                            alert(`Kakao 로그인 실패: ${data.message}`);
                        }
                    } catch (error) {
                        console.error('Kakao 로그인 오류:', error);
                        alert('Kakao 로그인 중 오류가 발생했습니다.');
                    }
                },
                fail: function (err) {
                    console.error('Kakao 로그인 실패:', err);
                    alert('Kakao 로그인에 실패했습니다.');
                }
            });
        } else {
            alert('Kakao 로그인을 준비 중입니다. 페이지를 새로고침한 후 다시 시도해주세요.');
        }
    }

    // Naver 로그인 (팝업)
    loginWithNaverPopup() {
        console.log('Naver 로그인 시도...');

        const state = Math.random().toString(36).substring(7);
        sessionStorage.setItem('naver_state', state);

        const authUrl = 'https://nid.naver.com/oauth2.0/authorize?' +
            'response_type=code&' +
            `client_id=${SOCIAL_CONFIG.naver.clientId}&` +
            `redirect_uri=${encodeURIComponent(`${window.location.origin}/auth/naver/callback`)}&` +
            `state=${state}`;

        const popup = window.open(
            authUrl,
            'naverLogin',
            'width=500,height=600,toolbar=no,menubar=no'
        );

        // 팝업 상태 확인
        const checkPopup = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkPopup);
                console.log('Naver 로그인 팝업 닫힘');
            }
        }, 1000);
    }
}

// 전역 인스턴스 생성 및 등록
const socialLogin = new SocialLogin();
window.socialLogin = socialLogin;

// 전역 함수도 등록 (호환성)
window.loginWithGoogle = () => socialLogin.loginWithGoogle();
window.loginWithKakaoPopup = () => socialLogin.loginWithKakaoPopup();
window.loginWithNaverPopup = () => socialLogin.loginWithNaverPopup();

console.log('소셜 로그인 스크립트 로드 완료');
