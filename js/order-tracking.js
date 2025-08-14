// 주문 추적 시스템
const API_URL = 'https://marketgrow-production-c586.up.railway.app/api';

let currentOrder = null;
let trackingInterval = null;

// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    setupTrackingForm();
    checkUrlParams();
});

// 로그인 상태 확인
function checkLoginStatus() {
    const token = localStorage.getItem('authToken');
    const userInfo = localStorage.getItem('userInfo');
    
    if (token && userInfo) {
        const user = JSON.parse(userInfo);
        document.getElementById('userMenuLoggedIn').style.display = 'block';
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('navUserName').textContent = user.name || user.username || '사용자';
    }
}

// 추적 폼 설정
function setupTrackingForm() {
    const form = document.getElementById('trackingForm');
    if (form) {
        form.addEventListener('submit', handleTrackingSubmit);
    }
}

// URL 파라미터 확인
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order');
    
    if (orderId) {
        document.getElementById('trackingInput').value = orderId;
        trackOrder(orderId);
    }
}

// 추적 폼 제출 처리
async function handleTrackingSubmit(e) {
    e.preventDefault();
    
    const input = document.getElementById('trackingInput').value.trim();
    if (!input) return;
    
    await trackOrder(input);
}

// 주문 추적
async function trackOrder(searchValue) {
    try {
        // 로딩 표시
        showLoading();
        
        // API 호출
        const token = localStorage.getItem('authToken');
        let url = `${API_URL}/orders/track?`;
        
        // 이메일인지 주문번호인지 확인
        if (searchValue.includes('@')) {
            url += `email=${encodeURIComponent(searchValue)}`;
        } else {
            url += `orderId=${encodeURIComponent(searchValue)}`;
        }
        
        const response = await fetch(url, {
            headers: token ? {
                'Authorization': `Bearer ${token}`
            } : {}
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
            currentOrder = data.data;
            displayTrackingResult(data.data);
            startAutoRefresh();
        } else {
            showNoResult();
        }
    } catch (error) {
        console.error('주문 추적 오류:', error);
        showNoResult();
    }
}

// 추적 결과 표시
function displayTrackingResult(order) {
    // 결과 섹션 표시
    document.getElementById('trackingResult').classList.add('show');
    document.getElementById('noResult').style.display = 'none';
    
    // 기본 정보 표시
    document.getElementById('orderId').textContent = order._id || order.orderId;
    document.getElementById('serviceName').textContent = order.serviceName;
    document.getElementById('quantity').textContent = `${order.quantity.toLocaleString()}개`;
    document.getElementById('orderDate').textContent = formatDate(order.createdAt);
    document.getElementById('totalPrice').textContent = `₩${order.totalPrice.toLocaleString()}`;
    document.getElementById('currentStatus').textContent = getStatusText(order.status);
    
    // 진행률 계산 및 표시
    const progress = calculateProgress(order.status);
    document.getElementById('progressFill').style.width = `${progress}%`;
    
    // 타임라인 생성
    createTimeline(order);
    
    // 예상 완료 시간
    if (order.status === 'processing' || order.status === 'in_progress') {
        showEstimatedTime(order);
    }
    
    // 배송 정보
    if (order.targetUrl) {
        showDeliveryInfo(order);
    }
    
    // 취소 버튼 표시 (대기중/처리중일 때만)
    const cancelBtn = document.getElementById('cancelBtn');
    if (order.status === 'pending' || order.status === 'processing') {
        cancelBtn.style.display = 'block';
    } else {
        cancelBtn.style.display = 'none';
    }
}

// 타임라인 생성
function createTimeline(order) {
    const timeline = document.getElementById('trackingTimeline');
    
    const statuses = [
        {
            key: 'pending',
            title: '주문 접수',
            description: '주문이 성공적으로 접수되었습니다',
            icon: 'fa-shopping-cart'
        },
        {
            key: 'payment_confirmed',
            title: '결제 확인',
            description: '결제가 정상적으로 완료되었습니다',
            icon: 'fa-credit-card'
        },
        {
            key: 'processing',
            title: '처리 시작',
            description: '서비스 처리가 시작되었습니다',
            icon: 'fa-cog'
        },
        {
            key: 'in_progress',
            title: '진행중',
            description: '서비스가 진행중입니다',
            icon: 'fa-spinner'
        },
        {
            key: 'completed',
            title: '완료',
            description: '서비스가 완료되었습니다',
            icon: 'fa-check'
        }
    ];
    
    const currentStatusIndex = statuses.findIndex(s => s.key === order.status);
    
    let html = '';
    statuses.forEach((status, index) => {
        const isCompleted = index <= currentStatusIndex;
        const isActive = index === currentStatusIndex;
        
        // 해당 상태의 실제 시간 찾기
        const statusTime = getStatusTime(order, status.key);
        
        html += `
            <div class="timeline-item">
                <div class="timeline-marker ${isCompleted ? (isActive ? 'active' : 'completed') : ''}">
                    <i class="fas ${status.icon}"></i>
                </div>
                <div class="timeline-line ${isCompleted && index < currentStatusIndex ? 'completed' : ''}"></div>
                <div class="timeline-content">
                    <div class="timeline-title">${status.title}</div>
                    <div class="timeline-description">${status.description}</div>
                    ${statusTime ? `<div class="timeline-date">${formatDate(statusTime)}</div>` : ''}
                </div>
            </div>
        `;
    });
    
    timeline.innerHTML = html;
}

// 상태별 시간 가져오기
function getStatusTime(order, status) {
    if (order.statusHistory) {
        const history = order.statusHistory.find(h => h.status === status);
        return history ? history.changedAt : null;
    }
    
    // 기본값
    if (status === 'pending') return order.createdAt;
    if (status === order.status) return order.updatedAt || new Date();
    return null;
}

// 예상 완료 시간 표시
function showEstimatedTime(order) {
    const estimatedDiv = document.getElementById('estimatedTime');
    estimatedDiv.style.display = 'flex';
    
    // 서비스별 예상 시간 (시간 단위)
    const estimatedHours = order.estimatedTime || 24;
    const startTime = new Date(order.createdAt);
    const estimatedComplete = new Date(startTime.getTime() + estimatedHours * 60 * 60 * 1000);
    
    document.getElementById('estimatedComplete').textContent = formatDate(estimatedComplete);
}

// 배송 정보 표시
function showDeliveryInfo(order) {
    const deliveryDiv = document.getElementById('deliveryInfo');
    deliveryDiv.style.display = 'block';
    
    document.getElementById('targetUrl').textContent = order.targetUrl;
    
    // 진행률 표시
    if (order.delivered && order.quantity) {
        const percentage = Math.round((order.delivered / order.quantity) * 100);
        document.getElementById('progressPercentage').textContent = 
            `${order.delivered.toLocaleString()} / ${order.quantity.toLocaleString()} (${percentage}%)`;
    } else {
        document.getElementById('progressPercentage').textContent = '0%';
    }
}

// 진행률 계산
function calculateProgress(status) {
    const progressMap = {
        'pending': 20,
        'payment_confirmed': 40,
        'processing': 60,
        'in_progress': 80,
        'completed': 100,
        'cancelled': 0,
        'failed': 0
    };
    return progressMap[status] || 0;
}

// 자동 새로고침
function startAutoRefresh() {
    // 기존 interval 정리
    if (trackingInterval) {
        clearInterval(trackingInterval);
    }
    
    // 진행중인 주문만 자동 새로고침
    if (currentOrder && ['pending', 'processing', 'in_progress'].includes(currentOrder.status)) {
        trackingInterval = setInterval(() => {
            refreshTracking();
        }, 30000); // 30초마다
    }
}

// 새로고침
async function refreshTracking() {
    if (!currentOrder) return;
    
    const input = currentOrder._id || currentOrder.orderId;
    await trackOrder(input);
}

// 주문 취소 요청
async function requestCancel() {
    if (!currentOrder) return;
    
    if (!confirm('정말 주문을 취소하시겠습니까?\n취소 후에는 복구할 수 없습니다.')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('로그인이 필요합니다.');
            window.location.href = '/login.html';
            return;
        }
        
        const response = await fetch(`${API_URL}/orders/${currentOrder._id}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('주문이 취소되었습니다.');
            await refreshTracking();
        } else {
            alert(data.message || '주문 취소에 실패했습니다.');
        }
    } catch (error) {
        console.error('주문 취소 오류:', error);
        alert('주문 취소 중 오류가 발생했습니다.');
    }
}

// 고객 지원 연락
function contactSupport() {
    if (currentOrder) {
        const orderId = currentOrder._id || currentOrder.orderId;
        const message = `주문번호: ${orderId}\n문의내용: `;
        
        // 카카오톡 오픈채팅 링크
        window.open(`https://open.kakao.com/o/gmarketgrow?text=${encodeURIComponent(message)}`, '_blank');
    } else {
        window.open('https://open.kakao.com/o/gmarketgrow', '_blank');
    }
}

// 결과 없음 표시
function showNoResult() {
    document.getElementById('trackingResult').classList.remove('show');
    document.getElementById('noResult').style.display = 'block';
}

// 로딩 표시
function showLoading() {
    // 기존 결과 숨기기
    document.getElementById('trackingResult').classList.remove('show');
    document.getElementById('noResult').style.display = 'none';
}

// 날짜 포맷
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 상태 텍스트
function getStatusText(status) {
    const statusMap = {
        'pending': '주문 접수',
        'payment_confirmed': '결제 확인',
        'processing': '처리중',
        'in_progress': '진행중',
        'completed': '완료',
        'cancelled': '취소됨',
        'failed': '실패'
    };
    return statusMap[status] || status;
}

// 사용자 메뉴 토글
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// 페이지 언로드 시 interval 정리
window.addEventListener('beforeunload', () => {
    if (trackingInterval) {
        clearInterval(trackingInterval);
    }
});

// 전역 함수 등록
window.refreshTracking = refreshTracking;
window.requestCancel = requestCancel;
window.contactSupport = contactSupport;
window.toggleUserMenu = toggleUserMenu;