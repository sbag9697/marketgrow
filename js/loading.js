// 로딩 관리자
window.LoadingManager = window.LoadingManager || {
    show(element) {
        if (!element) return;
        
        // 원본 텍스트 저장
        element.dataset.originalText = element.innerHTML;
        
        // 버튼 비활성화
        element.disabled = true;
        
        // 로딩 아이콘 추가
        element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 처리중...';
    },
    
    hide(element) {
        if (!element || !element.dataset.originalText) return;
        
        // 원본 텍스트 복원
        element.innerHTML = element.dataset.originalText;
        
        // 버튼 활성화
        element.disabled = false;
        
        // 데이터 속성 제거
        delete element.dataset.originalText;
    },
    
    showFullScreen(message = '로딩중...') {
        // 전체 화면 로딩 오버레이
        let overlay = document.getElementById('loading-overlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999;
            `;
            
            const content = document.createElement('div');
            content.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            `;
            
            content.innerHTML = `
                <div class="spinner" style="margin-bottom: 15px;">
                    <i class="fas fa-spinner fa-spin fa-3x" style="color: #4CAF50;"></i>
                </div>
                <p style="margin: 0; font-size: 16px; color: #333;">${message}</p>
            `;
            
            overlay.appendChild(content);
            document.body.appendChild(overlay);
        } else {
            overlay.style.display = 'flex';
            overlay.querySelector('p').textContent = message;
        }
    },
    
    hideFullScreen() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
};

// LoadingManager 전역으로 노출 - 이미 위에서 window.LoadingManager로 정의됨
// window.LoadingManager = LoadingManager;