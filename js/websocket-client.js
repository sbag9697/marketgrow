/**
 * WebSocket Client for Real-time Updates
 */
class WebSocketClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.listeners = new Map();
        this.userId = null;
        this.token = null;
    }

    /**
     * Initialize WebSocket connection
     */
    connect() {
        const wsUrl = window.API_CONFIG ? 
            window.API_CONFIG.BASE_URL.replace('http', 'ws').replace('/api', '') : 
            'ws://localhost:5000';

        try {
            // Socket.IO 클라이언트 사용
            this.socket = io(wsUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay
            });

            this.setupEventHandlers();
            
            // 로그인된 사용자 정보로 인증
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const authToken = localStorage.getItem('authToken');
            
            if (userInfo.id && authToken) {
                this.authenticate(userInfo.id, authToken);
            }
        } catch (error) {
            console.error('WebSocket connection error:', error);
        }
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // 연결 성공
        this.socket.on('connect', () => {
            console.log('WebSocket connected');
            this.connected = true;
            this.reconnectAttempts = 0;
            
            // 재연결 시 인증 재시도
            if (this.userId && this.token) {
                this.authenticate(this.userId, this.token);
            }
        });

        // 연결 끊김
        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            this.connected = false;
        });

        // 인증 응답
        this.socket.on('authenticated', (data) => {
            if (data.success) {
                console.log('WebSocket authentication successful');
                // 초기 잔액 요청
                this.requestBalance();
            } else {
                console.error('WebSocket authentication failed:', data.message);
            }
        });

        // 잔액 업데이트
        this.socket.on('balanceUpdate', (data) => {
            console.log('Balance update received:', data);
            this.handleBalanceUpdate(data);
        });

        // 입금 완료 알림
        this.socket.on('depositComplete', (data) => {
            console.log('Deposit complete:', data);
            this.handleDepositComplete(data);
        });

        // 에러 처리
        this.socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        // 재연결 시도
        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`Reconnection attempt ${attemptNumber}`);
            this.reconnectAttempts = attemptNumber;
        });

        // 재연결 실패
        this.socket.on('reconnect_failed', () => {
            console.error('Failed to reconnect to WebSocket server');
        });
    }

    /**
     * Authenticate with the server
     */
    authenticate(userId, token) {
        this.userId = userId;
        this.token = token;
        
        if (this.socket && this.connected) {
            this.socket.emit('authenticate', { userId, token });
        }
    }

    /**
     * Request current balance
     */
    requestBalance() {
        if (this.socket && this.connected) {
            this.socket.emit('requestBalance', {});
        }
    }

    /**
     * Handle balance update
     */
    handleBalanceUpdate(data) {
        const { balance, timestamp } = data;
        
        // 모든 잔액 표시 요소 업데이트
        const balanceElements = document.querySelectorAll('.balance-amount, #currentBalance, .user-balance');
        balanceElements.forEach(element => {
            element.textContent = `${balance.toLocaleString()}원`;
            
            // 애니메이션 효과
            element.classList.add('balance-updated');
            setTimeout(() => {
                element.classList.remove('balance-updated');
            }, 2000);
        });

        // localStorage 업데이트
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        userInfo.depositBalance = balance;
        localStorage.setItem('userInfo', JSON.stringify(userInfo));

        // 커스텀 이벤트 발생
        window.dispatchEvent(new CustomEvent('balanceUpdated', { 
            detail: { balance, timestamp } 
        }));

        // 등록된 리스너 실행
        this.notifyListeners('balanceUpdate', { balance, timestamp });
    }

    /**
     * Handle deposit complete notification
     */
    handleDepositComplete(data) {
        const { amount, bonusAmount, finalAmount, newBalance } = data;
        
        // 성공 알림 표시
        this.showNotification({
            type: 'success',
            title: '예치금 충전 완료!',
            message: `${finalAmount.toLocaleString()}원이 충전되었습니다.${bonusAmount > 0 ? ` (보너스: ${bonusAmount.toLocaleString()}원)` : ''}`,
            duration: 5000
        });

        // 잔액 업데이트
        this.handleBalanceUpdate({ balance: newBalance, timestamp: new Date() });

        // 커스텀 이벤트 발생
        window.dispatchEvent(new CustomEvent('depositComplete', { 
            detail: { amount, bonusAmount, finalAmount, newBalance } 
        }));

        // 등록된 리스너 실행
        this.notifyListeners('depositComplete', data);
    }

    /**
     * Show notification
     */
    showNotification({ type, title, message, duration = 3000 }) {
        // 기존 알림 제거
        const existingNotification = document.querySelector('.ws-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 새 알림 생성
        const notification = document.createElement('div');
        notification.className = `ws-notification ws-notification-${type}`;
        notification.innerHTML = `
            <div class="ws-notification-content">
                <div class="ws-notification-title">${title}</div>
                <div class="ws-notification-message">${message}</div>
            </div>
            <button class="ws-notification-close">&times;</button>
        `;

        // 스타일 추가 (인라인으로)
        const style = document.createElement('style');
        if (!document.querySelector('#ws-notification-styles')) {
            style.id = 'ws-notification-styles';
            style.textContent = `
                .ws-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    max-width: 400px;
                    padding: 15px 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000;
                    animation: slideIn 0.3s ease;
                }
                
                .ws-notification-success {
                    border-left: 4px solid #28a745;
                }
                
                .ws-notification-error {
                    border-left: 4px solid #dc3545;
                }
                
                .ws-notification-info {
                    border-left: 4px solid #17a2b8;
                }
                
                .ws-notification-content {
                    display: inline-block;
                    margin-right: 20px;
                }
                
                .ws-notification-title {
                    font-weight: 600;
                    margin-bottom: 5px;
                    color: #333;
                }
                
                .ws-notification-message {
                    color: #666;
                    font-size: 14px;
                }
                
                .ws-notification-close {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #999;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    line-height: 18px;
                }
                
                .ws-notification-close:hover {
                    color: #333;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .balance-updated {
                    animation: balancePulse 1s ease;
                }
                
                @keyframes balancePulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                        color: #28a745;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // 닫기 버튼 이벤트
        notification.querySelector('.ws-notification-close').addEventListener('click', () => {
            notification.remove();
        });

        // 자동 제거
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, duration);
        }
    }

    /**
     * Register event listener
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Notify all listeners for an event
     */
    notifyListeners(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Disconnect WebSocket
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    /**
     * Check connection status
     */
    isConnected() {
        return this.connected;
    }
}

// 전역 WebSocket 클라이언트 인스턴스
window.wsClient = new WebSocketClient();

// 페이지 로드 시 자동 연결
document.addEventListener('DOMContentLoaded', () => {
    // Socket.IO 라이브러리 로드 확인
    if (typeof io !== 'undefined') {
        window.wsClient.connect();
    } else {
        console.warn('Socket.IO library not loaded. WebSocket features disabled.');
    }
});

// 로그인/로그아웃 이벤트 처리
window.addEventListener('userLogin', (event) => {
    const { userId, token } = event.detail;
    if (window.wsClient && window.wsClient.isConnected()) {
        window.wsClient.authenticate(userId, token);
    }
});

window.addEventListener('userLogout', () => {
    if (window.wsClient) {
        window.wsClient.disconnect();
    }
});