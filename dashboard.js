// 대시보드 관리 시스템
class DashboardManager {
    constructor() {
        this.orders = JSON.parse(localStorage.getItem('orders') || '[]');
        this.notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        this.chart = null;

        this.init();
    }

    init() {
        // 로그인 확인
        if (!this.currentUser) {
            alert('로그인이 필요합니다.');
            window.location.href = 'index.html';
            return;
        }

        // 사용자별 주문 필터링
        this.userOrders = this.orders.filter(order => order.userId === this.currentUser.id);

        // 대시보드 초기화
        this.updateUserGreeting();
        this.updateStats();
        this.loadRecentOrders();
        this.loadActiveServices();
        this.loadPlatformStats();
        this.loadNotifications();
        this.initChart();

        // 실시간 업데이트 (5초마다)
        setInterval(() => {
            this.refreshDashboard();
        }, 5000);
    }

    // 사용자 인사말 업데이트
    updateUserGreeting() {
        const greeting = document.getElementById('userGreeting');
        if (greeting) {
            const hour = new Date().getHours();
            let timeGreeting = '';

            if (hour < 12) timeGreeting = '좋은 아침입니다';
            else if (hour < 18) timeGreeting = '좋은 오후입니다';
            else timeGreeting = '좋은 저녁입니다';

            greeting.textContent = `${timeGreeting}, ${this.currentUser.username}님!`;
        }
    }

    // 통계 업데이트
    updateStats() {
        const totalOrders = this.userOrders.length;
        const activeOrders = this.userOrders.filter(order => order.status === 'processing').length;
        const completedOrders = this.userOrders.filter(order => order.status === 'completed').length;
        const totalSpent = this.userOrders.reduce((sum, order) => sum + order.totalPrice, 0);

        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('activeOrders').textContent = activeOrders;
        document.getElementById('completedOrders').textContent = completedOrders;
        document.getElementById('totalSpent').textContent = `₩${totalSpent.toLocaleString()}`;
    }

    // 최근 주문 로드
    loadRecentOrders() {
        const container = document.getElementById('recentOrdersList');
        if (!container) return;

        const recentOrders = this.userOrders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        if (recentOrders.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #718096;">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>아직 주문 내역이 없습니다.</p>
                    <button onclick="window.location.href='services.html'" style="margin-top: 15px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        첫 주문하기
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = recentOrders.map(order => `
            <div class="order-item" onclick="showOrderDetail('${order.id}')">
                <div class="order-info">
                    <div class="order-icon">
                        ${this.getServiceIcon(order.serviceType)}
                    </div>
                    <div class="order-details">
                        <h4>${order.serviceName}</h4>
                        <p>${order.quantity.toLocaleString()}개 · ₩${order.totalPrice.toLocaleString()}</p>
                    </div>
                </div>
                <div class="order-status">
                    <span class="status-badge ${order.status}">${this.getStatusText(order.status)}</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${order.progress}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 진행 중인 서비스 로드
    loadActiveServices() {
        const container = document.getElementById('activeServicesList');
        if (!container) return;

        const activeServices = this.userOrders.filter(order => order.status === 'processing');

        if (activeServices.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #718096;">
                    <p>진행 중인 서비스가 없습니다.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activeServices.map(service => `
            <div class="service-item">
                <div class="service-name">${service.serviceName}</div>
                <div class="service-progress">${service.progress.toFixed(1)}%</div>
            </div>
        `).join('');
    }

    // 플랫폼별 통계 로드
    loadPlatformStats() {
        const container = document.getElementById('platformStatsList');
        if (!container) return;

        const platforms = ['instagram', 'youtube', 'facebook', 'tiktok', 'twitter', 'telegram'];
        const platformStats = platforms.map(platform => {
            const platformOrders = this.userOrders.filter(order =>
                order.serviceType.includes(platform));

            return {
                name: platform,
                displayName: this.getPlatformDisplayName(platform),
                orders: platformOrders.length,
                totalSpent: platformOrders.reduce((sum, order) => sum + order.totalPrice, 0)
            };
        }).filter(stat => stat.orders > 0);

        if (platformStats.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #718096; grid-column: 1 / -1;">
                    <p>아직 플랫폼별 데이터가 없습니다.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = platformStats.map(stat => `
            <div class="platform-item">
                <div class="platform-icon ${stat.name}">
                    ${this.getPlatformIcon(stat.name)}
                </div>
                <div class="platform-stats-content">
                    <h4>${stat.displayName}</h4>
                    <p>${stat.orders}개 주문 · ₩${stat.totalSpent.toLocaleString()}</p>
                </div>
            </div>
        `).join('');
    }

    // 알림 로드
    loadNotifications() {
        const container = document.getElementById('notificationsList');
        if (!container) return;

        // 샘플 알림 생성 (실제 서비스에서는 서버에서 가져옴)
        if (this.notifications.length === 0) {
            this.generateSampleNotifications();
        }

        const recentNotifications = this.notifications
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        container.innerHTML = recentNotifications.map(notification => `
            <div class="notification-item ${notification.read ? '' : 'unread'}">
                <div class="notification-icon ${notification.type}">
                    ${this.getNotificationIcon(notification.type)}
                </div>
                <div class="notification-content">
                    <h5>${notification.title}</h5>
                    <p>${notification.message}</p>
                </div>
                <div class="notification-time">
                    ${this.formatTime(notification.createdAt)}
                </div>
            </div>
        `).join('');
    }

    // 차트 초기화
    initChart() {
        const ctx = document.getElementById('ordersChart');
        if (!ctx) return;

        const chartData = this.generateChartData();

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: '주문 수',
                    data: chartData.data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 8
                    }
                }
            }
        });
    }

    // 차트 데이터 생성
    generateChartData() {
        const months = [];
        const data = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleDateString('ko-KR', { month: 'short' });
            months.push(monthName);

            const monthOrders = this.userOrders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate.getMonth() === date.getMonth() &&
                       orderDate.getFullYear() === date.getFullYear();
            }).length;

            data.push(monthOrders);
        }

        return { labels: months, data };
    }

    // 샘플 알림 생성
    generateSampleNotifications() {
        const sampleNotifications = [
            {
                id: 'notif_1',
                title: '주문이 완료되었습니다',
                message: 'Instagram 팔로워 주문이 성공적으로 완료되었습니다.',
                type: 'success',
                read: false,
                createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10분 전
            },
            {
                id: 'notif_2',
                title: '새로운 서비스 업데이트',
                message: 'TikTok 마케팅 서비스가 새롭게 추가되었습니다.',
                type: 'info',
                read: false,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2시간 전
            },
            {
                id: 'notif_3',
                title: '진행 중인 주문 알림',
                message: 'YouTube 구독자 서비스가 50% 진행되었습니다.',
                type: 'info',
                read: true,
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1일 전
            }
        ];

        this.notifications = sampleNotifications;
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }

    // 대시보드 새로고침
    refreshDashboard() {
        this.orders = JSON.parse(localStorage.getItem('orders') || '[]');
        this.userOrders = this.orders.filter(order => order.userId === this.currentUser.id);

        this.updateStats();
        this.loadRecentOrders();
        this.loadActiveServices();
    }

    // 주문 새로고침
    refreshOrders() {
        const refreshBtn = document.querySelector('.refresh-btn i');
        if (refreshBtn) {
            refreshBtn.style.animation = 'spin 1s linear';
            setTimeout(() => {
                refreshBtn.style.animation = '';
            }, 1000);
        }

        this.refreshDashboard();
    }

    // 차트 업데이트
    updateChart() {
        if (!this.chart) return;

        const chartData = this.generateChartData();
        this.chart.data.labels = chartData.labels;
        this.chart.data.datasets[0].data = chartData.data;
        this.chart.update();
    }

    // 주문 필터링
    filterOrders() {
        const statusFilter = document.getElementById('statusFilter').value;
        const serviceFilter = document.getElementById('serviceFilter').value;

        let filteredOrders = this.userOrders;

        if (statusFilter !== 'all') {
            filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
        }

        if (serviceFilter !== 'all') {
            filteredOrders = filteredOrders.filter(order =>
                order.serviceType.includes(serviceFilter));
        }

        this.displayFilteredOrders(filteredOrders);
    }

    // 필터된 주문 표시
    displayFilteredOrders(orders) {
        const container = document.getElementById('allOrdersContent');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #718096;">
                    <p>조건에 맞는 주문이 없습니다.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="display: grid; gap: 15px;">
                ${orders.map(order => `
                    <div class="order-item" onclick="showOrderDetail('${order.id}')">
                        <div class="order-info">
                            <div class="order-icon">
                                ${this.getServiceIcon(order.serviceType)}
                            </div>
                            <div class="order-details">
                                <h4>${order.serviceName}</h4>
                                <p>${order.quantity.toLocaleString()}개 · ₩${order.totalPrice.toLocaleString()}</p>
                                <small>${new Date(order.createdAt).toLocaleDateString()}</small>
                            </div>
                        </div>
                        <div class="order-status">
                            <span class="status-badge ${order.status}">${this.getStatusText(order.status)}</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${order.progress}%"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 모든 알림 읽음 처리
    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });

        localStorage.setItem('notifications', JSON.stringify(this.notifications));
        this.loadNotifications();
    }

    // 유틸리티 함수들
    getServiceIcon(serviceType) {
        const iconMap = {
            instagram: '<i class="fab fa-instagram"></i>',
            youtube: '<i class="fab fa-youtube"></i>',
            facebook: '<i class="fab fa-facebook"></i>',
            tiktok: '<i class="fab fa-tiktok"></i>',
            twitter: '<i class="fab fa-twitter"></i>',
            telegram: '<i class="fab fa-telegram"></i>'
        };

        for (const [platform, icon] of Object.entries(iconMap)) {
            if (serviceType.includes(platform)) {
                return icon;
            }
        }

        return '<i class="fas fa-star"></i>';
    }

    getPlatformIcon(platform) {
        const iconMap = {
            instagram: '<i class="fab fa-instagram"></i>',
            youtube: '<i class="fab fa-youtube"></i>',
            facebook: '<i class="fab fa-facebook"></i>',
            tiktok: '<i class="fab fa-tiktok"></i>',
            twitter: '<i class="fab fa-twitter"></i>',
            telegram: '<i class="fab fa-telegram"></i>'
        };

        return iconMap[platform] || '<i class="fas fa-star"></i>';
    }

    getPlatformDisplayName(platform) {
        const nameMap = {
            instagram: 'Instagram',
            youtube: 'YouTube',
            facebook: 'Facebook',
            tiktok: 'TikTok',
            twitter: 'Twitter',
            telegram: 'Telegram'
        };

        return nameMap[platform] || platform;
    }

    getStatusText(status) {
        const statusMap = {
            pending: '대기중',
            processing: '진행중',
            completed: '완료'
        };

        return statusMap[status] || status;
    }

    getNotificationIcon(type) {
        const iconMap = {
            success: '<i class="fas fa-check"></i>',
            info: '<i class="fas fa-info"></i>',
            warning: '<i class="fas fa-exclamation"></i>',
            error: '<i class="fas fa-times"></i>'
        };

        return iconMap[type] || '<i class="fas fa-bell"></i>';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 60) {
            return `${minutes}분 전`;
        } else if (hours < 24) {
            return `${hours}시간 전`;
        } else {
            return `${days}일 전`;
        }
    }
}

// 전역 함수들
function showOrderDetail(orderId) {
    const order = dashboardManager.userOrders.find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById('orderDetailModal');
    const content = document.getElementById('orderDetailContent');

    content.innerHTML = `
        <div class="order-detail-content">
            <div class="order-detail-header">
                <h2>${order.serviceName}</h2>
                <span class="status-badge ${order.status}">${dashboardManager.getStatusText(order.status)}</span>
            </div>
            
            <div class="order-detail-info">
                <div class="detail-field">
                    <span class="detail-label">주문번호</span>
                    <span class="detail-value">${order.id}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-label">서비스</span>
                    <span class="detail-value">${order.serviceName}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-label">수량</span>
                    <span class="detail-value">${order.quantity.toLocaleString()}개</span>
                </div>
                <div class="detail-field">
                    <span class="detail-label">금액</span>
                    <span class="detail-value">₩${order.totalPrice.toLocaleString()}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-label">대상 URL</span>
                    <span class="detail-value">${order.targetUrl}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-label">진행률</span>
                    <span class="detail-value">${order.progress.toFixed(1)}%</span>
                </div>
                <div class="detail-field">
                    <span class="detail-label">주문일시</span>
                    <span class="detail-value">${new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-label">완료 예정</span>
                    <span class="detail-value">${order.status === 'completed' ? '완료됨' : '진행중'}</span>
                </div>
            </div>
            
            <div style="margin-top: 30px;">
                <h3>진행 상황</h3>
                <div class="progress-bar" style="width: 100%; height: 8px; margin: 15px 0;">
                    <div class="progress-fill" style="width: ${order.progress}%"></div>
                </div>
                <p style="color: #718096; font-size: 0.9rem;">
                    ${order.status === 'completed'
        ? '주문이 성공적으로 완료되었습니다.'
        : order.status === 'processing'
            ? '주문이 진행 중입니다. 완료까지 조금만 기다려주세요.'
            : '주문 처리를 준비 중입니다.'}
                </p>
            </div>
        </div>
    `;

    modal.style.display = 'block';
}

function closeOrderDetail() {
    document.getElementById('orderDetailModal').style.display = 'none';
}

function showAllOrders() {
    const modal = document.getElementById('allOrdersModal');
    modal.style.display = 'block';
    dashboardManager.displayFilteredOrders(dashboardManager.userOrders);
}

function closeAllOrders() {
    document.getElementById('allOrdersModal').style.display = 'none';
}

function showSupport() {
    alert('고객지원 서비스는 준비 중입니다.\n\n문의사항이 있으시면 다음 연락처로 연락해주세요:\n이메일: support@socialmarketingpro.com\n전화: 1588-1234');
}

// 대시보드 매니저 인스턴스 생성
const dashboardManager = new DashboardManager();

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 모달 외부 클릭시 닫기
    window.onclick = function (event) {
        const orderModal = document.getElementById('orderDetailModal');
        const allOrdersModal = document.getElementById('allOrdersModal');

        if (event.target === orderModal) {
            closeOrderDetail();
        }
        if (event.target === allOrdersModal) {
            closeAllOrders();
        }
    };
});

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
