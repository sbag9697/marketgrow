// 실시간 알림 시스템
const API_URL = 'https://marketgrow-production.up.railway.app/api';
const WS_URL = 'wss://marketgrow-production.up.railway.app';

class NotificationSystem {
    constructor() {
        this.socket = null;
        this.notifications = [];
        this.unreadCount = 0;
        this.isConnected = false;
        this.soundEnabled = true;
        this.desktopEnabled = false;
        this.notificationQueue = [];
        this.maxNotifications = 50;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        this.init();
    }

    // 초기화
    async init() {
        // 로그인 확인
        const token = localStorage.getItem('authToken');
        if (!token) return;

        // 알림 권한 확인
        await this.checkPermission();

        // 저장된 알림 로드
        this.loadStoredNotifications();

        // WebSocket 연결
        this.connectWebSocket();

        // UI 생성
        this.createNotificationUI();

        // 이벤트 리스너 설정
        this.setupEventListeners();

        // 읽지 않은 알림 수 표시
        this.updateUnreadBadge();
    }

    // WebSocket 연결
    connectWebSocket() {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            this.socket = new WebSocket(`${WS_URL}/notifications?token=${token}`);

            this.socket.onopen = () => {
                console.log('알림 서버 연결됨');
                this.isConnected = true;
                this.reconnectAttempts = 0;

                // 연결 시 사용자 인증
                this.socket.send(JSON.stringify({
                    type: 'auth',
                    token
                }));
            };

            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleNotification(data);
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket 오류:', error);
            };

            this.socket.onclose = () => {
                console.log('알림 서버 연결 종료');
                this.isConnected = false;
                this.attemptReconnect();
            };
        } catch (error) {
            console.error('WebSocket 연결 실패:', error);
        }
    }

    // 재연결 시도
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
                this.reconnectAttempts++;
                console.log(`재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                this.connectWebSocket();
            }, 3000 * this.reconnectAttempts);
        }
    }

    // 알림 처리
    handleNotification(data) {
        switch (data.type) {
            case 'order_status':
                this.handleOrderStatusNotification(data);
                break;
            case 'payment':
                this.handlePaymentNotification(data);
                break;
            case 'promotion':
                this.handlePromotionNotification(data);
                break;
            case 'system':
                this.handleSystemNotification(data);
                break;
            case 'chat':
                this.handleChatNotification(data);
                break;
            default:
                this.addNotification(data);
        }
    }

    // 주문 상태 변경 알림 처리
    handleOrderStatusNotification(data) {
        const statusMessages = {
            pending: '주문이 접수되었습니다',
            processing: '주문 처리가 시작되었습니다',
            in_progress: '서비스가 진행중입니다',
            completed: '서비스가 완료되었습니다',
            cancelled: '주문이 취소되었습니다',
            refunded: '환불이 완료되었습니다'
        };

        const notification = {
            id: Date.now().toString(),
            type: 'order',
            title: '주문 상태 변경',
            message: statusMessages[data.status] || '주문 상태가 변경되었습니다',
            orderId: data.orderId,
            orderStatus: data.status,
            serviceName: data.serviceName,
            icon: this.getStatusIcon(data.status),
            color: this.getStatusColor(data.status),
            timestamp: new Date().toISOString(),
            read: false,
            action: {
                text: '주문 확인',
                url: `/order-tracking.html?order=${data.orderId}`
            }
        };

        this.addNotification(notification);

        // 데스크톱 알림
        if (this.desktopEnabled) {
            this.showDesktopNotification(notification);
        }

        // 사운드 재생
        if (this.soundEnabled) {
            this.playNotificationSound();
        }
    }

    // 결제 알림 처리
    handlePaymentNotification(data) {
        const notification = {
            id: Date.now().toString(),
            type: 'payment',
            title: data.success ? '결제 완료' : '결제 실패',
            message: data.message,
            icon: data.success ? 'fa-check-circle' : 'fa-times-circle',
            color: data.success ? '#10b981' : '#ef4444',
            timestamp: new Date().toISOString(),
            read: false
        };

        this.addNotification(notification);
    }

    // 프로모션 알림 처리
    handlePromotionNotification(data) {
        const notification = {
            id: Date.now().toString(),
            type: 'promotion',
            title: '특별 프로모션',
            message: data.message,
            icon: 'fa-gift',
            color: '#f59e0b',
            timestamp: new Date().toISOString(),
            read: false,
            action: {
                text: '자세히 보기',
                url: data.url
            }
        };

        this.addNotification(notification);
    }

    // 시스템 알림 처리
    handleSystemNotification(data) {
        const notification = {
            id: Date.now().toString(),
            type: 'system',
            title: '시스템 알림',
            message: data.message,
            icon: 'fa-info-circle',
            color: '#3b82f6',
            timestamp: new Date().toISOString(),
            read: false
        };

        this.addNotification(notification);
    }

    // 채팅 알림 처리
    handleChatNotification(data) {
        const notification = {
            id: Date.now().toString(),
            type: 'chat',
            title: '새 메시지',
            message: data.message,
            sender: data.sender,
            icon: 'fa-comment',
            color: '#8b5cf6',
            timestamp: new Date().toISOString(),
            read: false
        };

        this.addNotification(notification);
    }

    // 알림 추가
    addNotification(notification) {
        // 중복 체크
        if (this.notifications.find(n => n.id === notification.id)) {
            return;
        }

        // 알림 추가
        this.notifications.unshift(notification);

        // 최대 개수 유지
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications);
        }

        // 읽지 않은 알림 수 증가
        if (!notification.read) {
            this.unreadCount++;
        }

        // 로컬 스토리지 저장
        this.saveNotifications();

        // UI 업데이트
        this.updateNotificationList();
        this.updateUnreadBadge();

        // 토스트 알림 표시
        this.showToastNotification(notification);
    }

    // 데스크톱 알림 표시
    showDesktopNotification(notification) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            const desktopNotif = new Notification(notification.title, {
                body: notification.message,
                icon: '/logo.png',
                badge: '/badge.png',
                tag: notification.id,
                requireInteraction: false,
                silent: !this.soundEnabled
            });

            desktopNotif.onclick = () => {
                window.focus();
                if (notification.action && notification.action.url) {
                    window.location.href = notification.action.url;
                }
                desktopNotif.close();
            };

            // 자동 닫기
            setTimeout(() => {
                desktopNotif.close();
            }, 5000);
        }
    }

    // 토스트 알림 표시
    showToastNotification(notification) {
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <div class="toast-icon" style="color: ${notification.color}">
                <i class="fas ${notification.icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${notification.title}</div>
                <div class="toast-message">${notification.message}</div>
                ${notification.action
        ? `
                    <a href="${notification.action.url}" class="toast-action">
                        ${notification.action.text} →
                    </a>
                `
        : ''}
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(toast);

        // 애니메이션
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // 자동 제거
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 5000);
    }

    // 알림 UI 생성
    createNotificationUI() {
        // 알림 버튼
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && !document.getElementById('notificationBtn')) {
            const notificationBtn = document.createElement('li');
            notificationBtn.innerHTML = `
                <a href="#" id="notificationBtn" class="notification-btn">
                    <i class="fas fa-bell"></i>
                    <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
                </a>
            `;
            navMenu.insertBefore(notificationBtn, navMenu.lastElementChild);
        }

        // 알림 패널
        if (!document.getElementById('notificationPanel')) {
            const panel = document.createElement('div');
            panel.id = 'notificationPanel';
            panel.className = 'notification-panel';
            panel.innerHTML = `
                <div class="notification-header">
                    <h3>알림</h3>
                    <div class="notification-actions">
                        <button class="mark-all-read" onclick="notificationSystem.markAllAsRead()">
                            모두 읽음
                        </button>
                        <button class="notification-settings" onclick="notificationSystem.openSettings()">
                            <i class="fas fa-cog"></i>
                        </button>
                    </div>
                </div>
                <div class="notification-list" id="notificationList">
                    <!-- 알림 목록 -->
                </div>
                <div class="notification-footer">
                    <a href="/notifications.html">모든 알림 보기</a>
                </div>
            `;
            document.body.appendChild(panel);
        }
    }

    // 알림 목록 업데이트
    updateNotificationList() {
        const list = document.getElementById('notificationList');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = `
                <div class="no-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>새로운 알림이 없습니다</p>
                </div>
            `;
            return;
        }

        const recentNotifications = this.notifications.slice(0, 10);
        list.innerHTML = recentNotifications.map(notif => `
            <div class="notification-item ${notif.read ? 'read' : 'unread'}" 
                 data-id="${notif.id}"
                 onclick="notificationSystem.handleNotificationClick('${notif.id}')">
                <div class="notification-icon" style="color: ${notif.color}">
                    <i class="fas ${notif.icon}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">${this.getRelativeTime(notif.timestamp)}</div>
                </div>
                ${!notif.read ? '<div class="notification-dot"></div>' : ''}
            </div>
        `).join('');
    }

    // 읽지 않은 알림 배지 업데이트
    updateUnreadBadge() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // 알림 클릭 처리
    handleNotificationClick(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (!notification) return;

        // 읽음 처리
        if (!notification.read) {
            notification.read = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);
            this.saveNotifications();
            this.updateNotificationList();
            this.updateUnreadBadge();
        }

        // 액션 실행
        if (notification.action && notification.action.url) {
            window.location.href = notification.action.url;
        }
    }

    // 모두 읽음 처리
    markAllAsRead() {
        this.notifications.forEach(notif => {
            notif.read = true;
        });
        this.unreadCount = 0;
        this.saveNotifications();
        this.updateNotificationList();
        this.updateUnreadBadge();
    }

    // 알림 삭제
    deleteNotification(notificationId) {
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index >= 0) {
            if (!this.notifications[index].read) {
                this.unreadCount = Math.max(0, this.unreadCount - 1);
            }
            this.notifications.splice(index, 1);
            this.saveNotifications();
            this.updateNotificationList();
            this.updateUnreadBadge();
        }
    }

    // 알림 저장
    saveNotifications() {
        const data = {
            notifications: this.notifications,
            unreadCount: this.unreadCount,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('notifications', JSON.stringify(data));
    }

    // 저장된 알림 로드
    loadStoredNotifications() {
        const saved = localStorage.getItem('notifications');
        if (saved) {
            const data = JSON.parse(saved);
            // 24시간 이내 알림만 로드
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            this.notifications = data.notifications.filter(n =>
                new Date(n.timestamp) > dayAgo
            );
            this.unreadCount = this.notifications.filter(n => !n.read).length;
        }
    }

    // 권한 확인
    async checkPermission() {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            this.desktopEnabled = permission === 'granted';
        } else {
            this.desktopEnabled = Notification.permission === 'granted';
        }
    }

    // 알림음 재생
    playNotificationSound() {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('알림음 재생 실패'));
    }

    // 상태별 아이콘
    getStatusIcon(status) {
        const icons = {
            pending: 'fa-clock',
            processing: 'fa-cog',
            in_progress: 'fa-spinner',
            completed: 'fa-check-circle',
            cancelled: 'fa-times-circle',
            refunded: 'fa-undo'
        };
        return icons[status] || 'fa-info-circle';
    }

    // 상태별 색상
    getStatusColor(status) {
        const colors = {
            pending: '#f59e0b',
            processing: '#3b82f6',
            in_progress: '#8b5cf6',
            completed: '#10b981',
            cancelled: '#ef4444',
            refunded: '#6b7280'
        };
        return colors[status] || '#3b82f6';
    }

    // 상대 시간 계산
    getRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = Math.floor((now - time) / 1000);

        if (diff < 60) return '방금 전';
        if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;

        return time.toLocaleDateString('ko-KR');
    }

    // 설정 열기
    openSettings() {
        window.location.href = '/profile.html#notifications-tab';
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 알림 버튼 클릭
        document.addEventListener('click', (e) => {
            const notificationBtn = e.target.closest('#notificationBtn');
            if (notificationBtn) {
                e.preventDefault();
                this.toggleNotificationPanel();
            }

            // 패널 외부 클릭 시 닫기
            const panel = document.getElementById('notificationPanel');
            if (panel && panel.classList.contains('show') &&
                !panel.contains(e.target) && !notificationBtn) {
                panel.classList.remove('show');
            }
        });

        // 페이지 포커스 시 알림 새로고침
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updateNotificationList();
            }
        });
    }

    // 알림 패널 토글
    toggleNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.toggle('show');
            if (panel.classList.contains('show')) {
                this.updateNotificationList();
            }
        }
    }

    // 테스트 알림 생성 (개발용)
    testNotification(type = 'order') {
        const testData = {
            order: {
                type: 'order_status',
                orderId: `TEST_${Date.now()}`,
                status: 'completed',
                serviceName: '인스타그램 팔로워 1000개'
            },
            payment: {
                type: 'payment',
                success: true,
                message: '결제가 성공적으로 완료되었습니다'
            },
            promotion: {
                type: 'promotion',
                message: '🎉 신규 가입 50% 할인 이벤트!',
                url: '/promotions'
            }
        };

        this.handleNotification(testData[type]);
    }
}

// 알림 스타일
const notificationStyles = `
<style>
/* 알림 버튼 */
.notification-btn {
    position: relative;
    padding: 10px !important;
}

.notification-badge {
    position: absolute;
    top: 5px;
    right: 5px;
    background: #ef4444;
    color: white;
    border-radius: 10px;
    padding: 2px 6px;
    font-size: 11px;
    font-weight: bold;
    min-width: 18px;
    text-align: center;
}

/* 알림 패널 */
.notification-panel {
    position: fixed;
    top: 70px;
    right: 20px;
    width: 380px;
    max-height: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    z-index: 1000;
    display: none;
    flex-direction: column;
}

.notification-panel.show {
    display: flex;
    animation: slideDown 0.3s ease;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.notification-header {
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.notification-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #1a365d;
}

.notification-actions {
    display: flex;
    gap: 10px;
}

.notification-actions button {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 14px;
    transition: color 0.3s ease;
}

.notification-actions button:hover {
    color: #667eea;
}

.notification-list {
    flex: 1;
    overflow-y: auto;
    max-height: 350px;
}

.notification-item {
    display: flex;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 1px solid #f1f5f9;
    cursor: pointer;
    transition: background 0.3s ease;
    position: relative;
}

.notification-item:hover {
    background: #f8fafc;
}

.notification-item.unread {
    background: #f0f9ff;
}

.notification-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #f1f5f9;
    flex-shrink: 0;
}

.notification-content {
    flex: 1;
    min-width: 0;
}

.notification-title {
    font-weight: 600;
    color: #1a365d;
    margin-bottom: 4px;
}

.notification-message {
    color: #64748b;
    font-size: 14px;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.notification-time {
    color: #94a3b8;
    font-size: 12px;
    margin-top: 4px;
}

.notification-dot {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 8px;
    height: 8px;
    background: #3b82f6;
    border-radius: 50%;
}

.notification-footer {
    padding: 12px 20px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
}

.notification-footer a {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
}

.no-notifications {
    padding: 60px 20px;
    text-align: center;
    color: #94a3b8;
}

.no-notifications i {
    font-size: 48px;
    margin-bottom: 10px;
}

/* 토스트 알림 */
.notification-toast {
    position: fixed;
    top: -100px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 16px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    max-width: 350px;
    z-index: 10000;
    transition: top 0.3s ease;
}

.notification-toast.show {
    top: 20px;
}

.toast-icon {
    font-size: 20px;
}

.toast-content {
    flex: 1;
}

.toast-title {
    font-weight: 600;
    margin-bottom: 4px;
    color: #1a365d;
}

.toast-message {
    font-size: 14px;
    color: #64748b;
    line-height: 1.4;
}

.toast-action {
    color: #667eea;
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
    display: inline-block;
    margin-top: 8px;
}

.toast-close {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0;
}

/* 모바일 반응형 */
@media (max-width: 480px) {
    .notification-panel {
        width: calc(100vw - 20px);
        right: 10px;
    }
    
    .notification-toast {
        right: 10px;
        left: 10px;
        max-width: none;
    }
}
</style>
`;

// 스타일 삽입
document.head.insertAdjacentHTML('beforeend', notificationStyles);

// 전역 인스턴스 생성
const notificationSystem = new NotificationSystem();

// 전역 함수 등록
window.notificationSystem = notificationSystem;
