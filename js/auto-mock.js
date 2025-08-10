// 자동 Mock 모드 활성화 (백엔드 서버가 없을 때)
(function() {
    // 서버 연결 테스트
    async function checkServerConnection() {
        try {
            const response = await fetch('https://marketgrow-production.up.railway.app/api/health', {
                method: 'GET',
                mode: 'cors',
                signal: AbortSignal.timeout(3000) // 3초 타임아웃
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    // 페이지 로드 시 서버 확인
    window.addEventListener('DOMContentLoaded', async function() {
        const serverAvailable = await checkServerConnection();
        
        if (!serverAvailable) {
            console.log('🔧 서버 연결 실패 - Mock 모드 자동 활성화');
            localStorage.setItem('useMockServer', 'true');
            
            // 사용자에게 알림
            if (window.NotificationManager) {
                setTimeout(() => {
                    window.NotificationManager.info('테스트 모드로 실행 중입니다. 인증번호: 123456');
                }, 1000);
            }
        } else {
            console.log('✅ 서버 연결 성공');
            // 서버가 연결되면 Mock 모드 비활성화
            localStorage.removeItem('useMockServer');
        }
    });
})();