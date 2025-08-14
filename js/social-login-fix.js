// 소셜 로그인 시스템 - 수정된 버전
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5001/api'
    : 'https://marketgrow-production-c586.up.railway.app/api';

console.log('Social Login API URL:', API_URL);

// 소셜 로그인 설정
const SOCIAL_CONFIG = {
    google: {
        clientId: '1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com',
        ready: false
    },
    kakao: {
        appKey: '95a2c17a5ec078dd1762950680e53267',
        ready: false
    },
    naver: {
        clientId: 'Cirw8aXNIq8wF518fNMZ',
        ready: true // 네이버는 팝업 방식이므로 항상 준비됨
    }
};

// Google 로그인 초기화
function initGoogleLogin() {
    console.log('Google 로그인 초기화 시작...');

    // Google SDK 로드
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
        console.log('Google SDK 로드 완료');

        // SDK 로드 후 초기화
        setTimeout(() => {
            if (typeof google !== 'undefined' && google.accounts) {
                try {
                    google.accounts.id.initialize({
                        client_id: SOCIAL_CONFIG.google.clientId,
                        callback: handleGoogleResponse,
                        auto_select: false,
                        cancel_on_tap_outside: true
                    });
                    SOCIAL_CONFIG.google.ready = true;
                    console.log('Google 로그인 준비 완료');
                } catch (error) {
                    console.error('Google 초기화 오류:', error);
                }
            }
        }, 1000);
    };
    document.head.appendChild(script);
}

// Kakao 로그인 초기화
function initKakaoLogin() {
    console.log('Kakao 로그인 초기화 시작...');

    // Kakao SDK 로드
    const script = document.createElement('script');
    script.src = 'https://developers.kakao.com/sdk/js/kakao.min.js';
    script.async = true;
    script.onload = () => {
        console.log('Kakao SDK 로드 완료');

        // SDK 로드 후 초기화
        if (typeof Kakao !== 'undefined') {
            try {
                Kakao.init(SOCIAL_CONFIG.kakao.appKey);
                SOCIAL_CONFIG.kakao.ready = true;
                console.log('Kakao 로그인 준비 완료');
            } catch (error) {
                console.error('Kakao 초기화 오류:', error);
            }
        }
    };
    document.head.appendChild(script);
}

// Google 응답 처리
async function handleGoogleResponse(response) {
    console.log('Google 로그인 응답 받음');
    console.log('Token received:', response.credential ? 'Yes' : 'No');

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
        console.log('서버 응답:', data);

        if (data.success) {
            console.log('Google 로그인 성공');
            localStorage.setItem('authToken', data.data.token);
            localStorage.setItem('userInfo', JSON.stringify(data.data.user));
            alert('Google 로그인 성공!');
            window.location.href = '/dashboard.html';
        } else {
            // 디버그 정보 포함된 에러 메시지
            let errorMsg = `Google 로그인 실패: ${data.message}`;
            if (data.debug) {
                errorMsg += `\n\n디버그 정보: ${data.debug}`;
            }
            if (data.error) {
                errorMsg += `\n\n상세 에러: ${data.error}`;
            }
            console.error('Google 로그인 실패 상세:', data);
            alert(errorMsg);
        }
    } catch (error) {
        console.error('Google 로그인 오류:', error);
        alert(`Google 로그인 중 오류가 발생했습니다.\n\n${error.message}`);
    }
}

// Google 로그인 함수
window.loginWithGoogle = function () {
    console.log('Google 로그인 시도...');

    if (!SOCIAL_CONFIG.google.ready) {
        alert('Google 로그인을 초기화 중입니다. 잠시 후 다시 시도해주세요.');
        initGoogleLogin();
        return;
    }

    if (typeof google !== 'undefined' && google.accounts) {
        try {
            google.accounts.id.prompt((notification) => {
                console.log('Google prompt 상태:', notification);
                if (notification.isNotDisplayed()) {
                    console.log('Google One Tap이 표시되지 않음');
                    // 대체 방법 시도
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
};

// Kakao 로그인 함수
window.loginWithKakaoPopup = function () {
    console.log('Kakao 로그인 시도...');

    if (!SOCIAL_CONFIG.kakao.ready) {
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
                        localStorage.setItem('userInfo', JSON.stringify(data.data.user));
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
};

// Naver 로그인 함수
window.loginWithNaverPopup = function () {
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
};

// 페이지 로드 시 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('소셜 로그인 초기화 시작...');

    // Google 초기화
    initGoogleLogin();

    // Kakao 초기화
    initKakaoLogin();

    console.log('소셜 로그인 초기화 요청 완료');
});

// 전역 객체로 등록
window.socialLogin = {
    loginWithGoogle: window.loginWithGoogle,
    loginWithKakaoPopup: window.loginWithKakaoPopup,
    loginWithNaverPopup: window.loginWithNaverPopup
};

console.log('Social Login Fix 스크립트 로드 완료');
