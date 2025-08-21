/**
 * Balance Polling Service
 * WebSocket이 연결되지 않았을 때 대체 수단으로 사용
 */
class BalancePollingService {
    constructor() {
        this.pollingInterval = null;
        this.pollingDelay = 30000; // 30초마다 폴링
        this.isPolling = false;
        this.lastBalance = null;
        this.lastDepositId = null;
    }

    /**
     * 폴링 시작
     */
    start() {
        // WebSocket이 연결되어 있으면 폴링하지 않음
        if (window.wsClient && window.wsClient.isConnected()) {
            console.log('WebSocket connected, polling not needed');
            return;
        }

        if (this.isPolling) {
            return;
        }

        console.log('Starting balance polling service');
        this.isPolling = true;
        
        // 즉시 한 번 체크
        this.checkBalance();
        
        // 주기적으로 체크
        this.pollingInterval = setInterval(() => {
            this.checkBalance();
        }, this.pollingDelay);
    }

    /**
     * 폴링 중지
     */
    stop() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.isPolling = false;
        console.log('Balance polling stopped');
    }

    /**
     * 잔액 체크
     */
    async checkBalance() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                this.stop();
                return;
            }

            const API_URL = window.API_CONFIG ? window.API_CONFIG.BASE_URL : '/api';
            
            // 잔액 조회
            const response = await fetch(`${API_URL}/users/balance`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const currentBalance = data.balance || 0;
                
                // 잔액이 변경되었으면 업데이트
                if (this.lastBalance !== null && this.lastBalance !== currentBalance) {
                    this.handleBalanceChange(currentBalance);
                }
                
                this.lastBalance = currentBalance;
                
                // 최근 입금 내역도 확인
                await this.checkRecentDeposit();
            } else if (response.status === 401) {
                // 인증 실패 시 폴링 중지
                this.stop();
            }
        } catch (error) {
            console.error('Balance polling error:', error);
        }
    }

    /**
     * 최근 입금 내역 확인
     */
    async checkRecentDeposit() {
        try {
            const token = localStorage.getItem('authToken');
            const API_URL = window.API_CONFIG ? window.API_CONFIG.BASE_URL : '/api';
            
            // 최근 입금 내역 조회 (1개만)
            const response = await fetch(`${API_URL}/deposits?limit=1&status=completed`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data && data.data.deposits && data.data.deposits.length > 0) {
                    const latestDeposit = data.data.deposits[0];
                    
                    // 새로운 입금이 완료되었으면 알림
                    if (this.lastDepositId && this.lastDepositId !== latestDeposit._id) {
                        // 5분 이내의 입금만 알림
                        const depositTime = new Date(latestDeposit.completedAt || latestDeposit.updatedAt);
                        const timeDiff = Date.now() - depositTime.getTime();
                        
                        if (timeDiff < 5 * 60 * 1000) { // 5분
                            this.handleNewDeposit(latestDeposit);
                        }
                    }
                    
                    this.lastDepositId = latestDeposit._id;
                }
            }
        } catch (error) {
            console.error('Recent deposit check error:', error);
        }
    }

    /**
     * 잔액 변경 처리
     */
    handleBalanceChange(newBalance) {
        console.log('Balance changed:', newBalance);
        
        // 잔액 표시 업데이트
        this.updateBalanceDisplay(newBalance);
        
        // 커스텀 이벤트 발생
        window.dispatchEvent(new CustomEvent('balanceUpdated', {
            detail: {
                balance: newBalance,
                timestamp: new Date(),
                source: 'polling'
            }
        }));
    }

    /**
     * 새로운 입금 처리
     */
    handleNewDeposit(deposit) {
        console.log('New deposit detected:', deposit);
        
        // 알림 표시
        this.showDepositNotification(deposit);
        
        // 잔액 업데이트
        if (this.lastBalance !== null) {
            const newBalance = this.lastBalance + (deposit.finalAmount || deposit.amount);
            this.handleBalanceChange(newBalance);
        }
        
        // 커스텀 이벤트 발생
        window.dispatchEvent(new CustomEvent('depositComplete', {
            detail: {
                amount: deposit.amount,
                bonusAmount: deposit.bonusAmount || 0,
                finalAmount: deposit.finalAmount || deposit.amount,
                newBalance: this.lastBalance,
                source: 'polling'
            }
        }));
    }

    /**
     * 잔액 표시 업데이트
     */
    updateBalanceDisplay(balance) {
        // 모든 잔액 표시 요소 업데이트
        const balanceElements = document.querySelectorAll(
            '.balance-amount, #currentBalance, .user-balance, .deposit-balance, #userBalance'
        );
        
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
    }

    /**
     * 입금 알림 표시
     */
    showDepositNotification(deposit) {
        const notification = document.createElement('div');
        notification.className = 'polling-notification success';
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">예치금 충전 완료!</div>
                <div class="notification-message">
                    ${(deposit.finalAmount || deposit.amount).toLocaleString()}원이 충전되었습니다.
                    ${deposit.bonusAmount ? `(보너스: ${deposit.bonusAmount.toLocaleString()}원)` : ''}
                </div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
        `;

        // 스타일 추가
        if (!document.querySelector('#polling-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'polling-notification-styles';
            style.textContent = `
                .polling-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    max-width: 400px;
                    padding: 15px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    animation: slideInRight 0.3s ease;
                }
                
                .polling-notification.success {
                    border-left: 4px solid #28a745;
                }
                
                .notification-icon {
                    flex-shrink: 0;
                }
                
                .notification-icon i {
                    font-size: 24px;
                    color: #28a745;
                }
                
                .notification-content {
                    flex: 1;
                }
                
                .notification-title {
                    font-weight: 600;
                    margin-bottom: 5px;
                }
                
                .notification-message {
                    font-size: 14px;
                    color: #666;
                }
                
                .notification-close {
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #999;
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // 5초 후 자동 제거
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * 폴링 간격 변경
     */
    setPollingInterval(interval) {
        this.pollingDelay = interval;
        if (this.isPolling) {
            this.stop();
            this.start();
        }
    }
}

// 전역 폴링 서비스 인스턴스
window.balancePolling = new BalancePollingService();

// WebSocket 연결 실패 시 폴링 시작
document.addEventListener('DOMContentLoaded', () => {
    // WebSocket 연결 상태 확인
    setTimeout(() => {
        if (!window.wsClient || !window.wsClient.isConnected()) {
            console.log('WebSocket not connected, starting polling as fallback');
            window.balancePolling.start();
        }
    }, 3000);
});

// WebSocket 연결/해제 이벤트 처리
window.addEventListener('websocketConnected', () => {
    console.log('WebSocket connected, stopping polling');
    window.balancePolling.stop();
});

window.addEventListener('websocketDisconnected', () => {
    console.log('WebSocket disconnected, starting polling');
    window.balancePolling.start();
});

// 로그아웃 시 폴링 중지
window.addEventListener('userLogout', () => {
    window.balancePolling.stop();
});