/**
 * 인증 응답 파싱 유틸리티
 * 다양한 API 응답 포맷을 통일된 형식으로 파싱
 */

// 인증 응답 파싱 (양쪽 포맷 모두 지원)
function parseAuthResponse(data) {
    const ok = data?.success ?? data?.status === 'success';
    const token = data?.token ?? data?.data?.token;
    const user = data?.user ?? data?.data?.user;
    return { ok, token, user };
}

// 토큰과 사용자 정보 저장
function saveAuthData(token, user) {
    const KEY_TOKEN = window?.STORAGE_KEYS?.AUTH_TOKEN || 'authToken';
    const KEY_USER = window?.STORAGE_KEYS?.USER_INFO || 'userInfo';
    
    if (token) {
        localStorage.setItem(KEY_TOKEN, token);
    }
    
    if (user) {
        localStorage.setItem(KEY_USER, JSON.stringify(user));
    }
    
    console.log('Auth data saved:', { KEY_TOKEN, KEY_USER, hasToken: !!token, hasUser: !!user });
}

// 로그인 성공 처리
function handleLoginSuccess(data, redirectUrl = 'dashboard.html') {
    const { ok, token, user } = parseAuthResponse(data);
    
    if (!ok || !token) {
        console.error('Login response missing token:', data);
        alert('로그인 응답에 토큰이 없습니다.');
        return false;
    }
    
    saveAuthData(token, user);
    alert('로그인 성공!');
    
    if (redirectUrl) {
        window.location.href = redirectUrl;
    }
    
    return true;
}

// getSelection 에러 방어
(function hardenSelection() {
    const origGetSel = window.getSelection;
    
    // 일부 플러그인이 잘못된 컨텍스트에서 호출할 때 방어
    window.getSelection = function() {
        try {
            return origGetSel ? origGetSel.call(window) : null;
        } catch (_) {
            return null;
        }
    };
    
    // input 상에서 잘못된 getSelection 호출을 우회
    document.addEventListener('input', (e) => {
        const el = e.target;
        if (!el || el.nodeType !== 1) return;
        
        // 안전 가드: 플러그인이 el.getSelection을 기대하면 noop 제공
        if (el instanceof HTMLInputElement && !('getSelection' in el)) {
            el.getSelection = function() { return null; };
        }
    }, { capture: true });
    
    console.log('Selection error protection enabled');
})();

// 전역에 노출
window.authUtils = {
    parseAuthResponse,
    saveAuthData,
    handleLoginSuccess
};

console.log('Auth utils loaded');