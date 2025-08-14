// 실시간 주문 현황 시스템
const API_URL = 'https://marketgrow-production-c586.up.railway.app/api';

// WebSocket 연결 (실제 서버 주소)
let ws = null;
let reconnectInterval = null;
let orderChart = null;

// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeRealtime();
    initializeChart();
    loadInitialData();
    startAutoRefresh();
});

// 인증 확인
function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/login.html';
        return false;
    }
    
    // 사용자 정보 표시
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        const user = JSON.parse(userInfo);
        const navUserName = document.getElementById('navUserName');
        if (navUserName) {
            navUserName.textContent = user.name || user.username || '사용자';
        }
    }
    
    return true;
}

// 실시간 연결 초기화
function initializeRealtime() {
    connectWebSocket();
}

// WebSocket 연결
function connectWebSocket() {
    // WebSocket 서버 주소 (Railway 배포 서버)
    const wsUrl = 'wss://marketgrow-production-c586.up.railway.app';
    
    try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            console.log('실시간 연결 성공');
            clearInterval(reconnectInterval);
            
            // 인증 토큰 전송
            const token = localStorage.getItem('authToken');
            ws.send(JSON.stringify({
                type: 'auth',
                token: token
            }));
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleRealtimeUpdate(data);
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket 오류:', error);
        };
        
        ws.onclose = () => {
            console.log('실시간 연결 종료');
            // 재연결 시도
            reconnectInterval = setInterval(() => {
                connectWebSocket();
            }, 5000);
        };
    } catch (error) {
        console.error('WebSocket 연결 실패:', error);
        // Fallback: Polling 방식 사용
        usePolling();
    }
}

// Polling 방식 (WebSocket 실패 시)
function usePolling() {
    setInterval(() => {
        loadRealtimeData();
    }, 3000); // 3초마다 업데이트
}

// 실시간 업데이트 처리
function handleRealtimeUpdate(data) {
    switch(data.type) {
        case 'newOrder':
            addNewOrder(data.order);
            updateStats();
            break;
        case 'orderUpdate':
            updateOrder(data.order);
            break;
        case 'stats':
            displayStats(data.stats);
            break;
    }
}

// 초기 데이터 로드
async function loadInitialData() {
    await Promise.all([
        loadStats(),
        loadRecentOrders(),
        loadProcessingOrders(),
        loadTrendingKeywords()
    ]);
}

// 통계 로드
async function loadStats() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/orders/stats/today`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayStats(data.data);
            }
        }
    } catch (error) {
        console.error('통계 로드 오류:', error);
    }
}

// 통계 표시
function displayStats(stats) {
    document.getElementById('todayOrders').textContent = stats.todayOrders || 0;
    document.getElementById('processingOrders').textContent = stats.processingOrders || 0;
    document.getElementById('completedOrders').textContent = stats.completedOrders || 0;
    document.getElementById('todayRevenue').textContent = `₩${(stats.todayRevenue || 0).toLocaleString()}`;
}

// 최신 주문 로드
async function loadRecentOrders() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/orders/recent?limit=10`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                displayRecentOrders(data.data);
            }
        }
    } catch (error) {
        console.error('최신 주문 로드 오류:', error);
    }
}

// 최신 주문 표시
function displayRecentOrders(orders) {
    const container = document.getElementById('recentOrdersList');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <p>최근 주문이 없습니다</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => createOrderHTML(order)).join('');
}

// 처리중 주문 로드
async function loadProcessingOrders() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/orders/processing`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                displayProcessingOrders(data.data);
            }
        }
    } catch (error) {
        console.error('처리중 주문 로드 오류:', error);
    }
}

// 처리중 주문 표시
function displayProcessingOrders(orders) {
    const container = document.getElementById('processingOrdersList');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <p>처리중인 주문이 없습니다</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => createOrderHTML(order)).join('');
}

// 주문 HTML 생성
function createOrderHTML(order) {
    const timeAgo = getTimeAgo(order.createdAt);
    const platformIcon = getPlatformIcon(order.platform);
    const statusClass = getStatusClass(order.status);
    const statusText = getStatusText(order.status);
    
    return `
        <div class="order-item" data-order-id="${order._id}">
            <div class="order-header">
                <span class="order-id">#${order._id.slice(-6)}</span>
                <span class="order-time">${timeAgo}</span>
            </div>
            <div class="order-details">
                <div class="order-service">
                    <div class="platform-icon ${order.platform}">
                        <i class="${platformIcon}"></i>
                    </div>
                    <div>
                        <div>${order.serviceName}</div>
                        <small>${order.quantity}개</small>
                    </div>
                </div>
                <span class="order-status ${statusClass}">${statusText}</span>
            </div>
        </div>
    `;
}

// 새 주문 추가
function addNewOrder(order) {
    const container = document.getElementById('recentOrdersList');
    const orderHTML = createOrderHTML(order);
    
    // 기존 빈 상태 메시지 제거
    const noData = container.querySelector('.no-data');
    if (noData) {
        container.innerHTML = '';
    }
    
    // 새 주문을 맨 위에 추가
    container.insertAdjacentHTML('afterbegin', orderHTML);
    
    // 10개 초과 시 마지막 항목 제거
    const items = container.querySelectorAll('.order-item');
    if (items.length > 10) {
        items[items.length - 1].remove();
    }
    
    // 애니메이션 효과
    const newItem = container.querySelector('.order-item:first-child');
    newItem.style.background = '#fef3c7';
    setTimeout(() => {
        newItem.style.background = '';
    }, 2000);
}

// 주문 업데이트
function updateOrder(order) {
    const orderElement = document.querySelector(`[data-order-id="${order._id}"]`);
    if (orderElement) {
        const statusElement = orderElement.querySelector('.order-status');
        statusElement.className = `order-status ${getStatusClass(order.status)}`;
        statusElement.textContent = getStatusText(order.status);
    }
}

// 트렌딩 키워드 로드
async function loadTrendingKeywords() {
    try {
        const response = await fetch(`${API_URL}/analytics/trending-keywords`);
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                displayTrendingKeywords(data.data);
            }
        }
    } catch (error) {
        console.error('트렌딩 키워드 로드 오류:', error);
    }
}

// 트렌딩 키워드 표시
function displayTrendingKeywords(keywords) {
    const container = document.getElementById('keywordList');
    
    if (!keywords || keywords.length === 0) {
        return;
    }
    
    container.innerHTML = keywords.map(keyword => `
        <div class="keyword-tag">
            <span>${keyword.name}</span>
            <span class="keyword-count">${keyword.count}</span>
        </div>
    `).join('');
}

// 차트 초기화
function initializeChart() {
    const ctx = document.getElementById('ordersChart');
    if (!ctx) return;
    
    orderChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: generateTimeLabels(),
            datasets: [{
                label: '주문 수',
                data: generateInitialData(),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
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
            }
        }
    });
}

// 시간 라벨 생성
function generateTimeLabels() {
    const labels = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
        const time = new Date(now - i * 60 * 60 * 1000);
        labels.push(`${time.getHours()}시`);
    }
    
    return labels;
}

// 초기 차트 데이터
function generateInitialData() {
    return Array(24).fill(0).map(() => Math.floor(Math.random() * 10));
}

// 차트 업데이트
function updateChart(newData) {
    if (!orderChart) return;
    
    orderChart.data.datasets[0].data = newData;
    orderChart.update();
}

// 자동 새로고침
function startAutoRefresh() {
    setInterval(() => {
        loadStats();
        updateChart(generateInitialData()); // 실제로는 API에서 데이터 가져옴
    }, 30000); // 30초마다
}

// 실시간 데이터 로드 (Polling)
async function loadRealtimeData() {
    await Promise.all([
        loadStats(),
        loadRecentOrders(),
        loadProcessingOrders()
    ]);
}

// 유틸리티 함수
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return '방금 전';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
    return `${Math.floor(seconds / 86400)}일 전`;
}

function getPlatformIcon(platform) {
    const icons = {
        instagram: 'fab fa-instagram',
        youtube: 'fab fa-youtube',
        facebook: 'fab fa-facebook',
        tiktok: 'fab fa-tiktok',
        twitter: 'fab fa-twitter'
    };
    return icons[platform] || 'fas fa-globe';
}

function getStatusClass(status) {
    const classes = {
        pending: 'status-pending',
        processing: 'status-processing',
        completed: 'status-completed'
    };
    return classes[status] || 'status-pending';
}

function getStatusText(status) {
    const texts = {
        pending: '대기중',
        processing: '처리중',
        completed: '완료'
    };
    return texts[status] || status;
}

// 사용자 메뉴 토글
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// 전역 함수 등록
window.toggleUserMenu = toggleUserMenu;