// 대시보드 완성 기능
// API_URL은 global-config.js에서 정의됨, 상대 경로 사용
const DASHBOARD_API_URL = '/api';

// 대시보드 초기화
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDashboardData();
    setupEventListeners();
    setupWebSocketListeners();
});

// 인증 확인
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const userInfo = localStorage.getItem('userInfo');

    if (!token || !userInfo) {
        alert('로그인이 필요합니다');
        window.location.href = '/login.html';
        return false;
    }

    // 사용자 정보 표시
    const user = JSON.parse(userInfo);
    updateUserDisplay(user);

    return true;
}

// 사용자 정보 표시 업데이트
function updateUserDisplay(user) {
    // 환영 메시지
    const welcomeUserName = document.getElementById('welcomeUserName');
    if (welcomeUserName) {
        welcomeUserName.textContent = user.name || user.username || '사용자';
    }

    // 네비게이션 사용자명
    const navUserName = document.getElementById('navUserName');
    if (navUserName) {
        navUserName.textContent = user.name || user.username || '사용자';
    }

    // 계정 정보
    const userEmail = document.getElementById('userEmail');
    if (userEmail) {
        userEmail.textContent = user.email || '-';
    }

    // 가입일
    const userJoinDate = document.getElementById('userJoinDate');
    if (userJoinDate && user.createdAt) {
        const date = new Date(user.createdAt);
        userJoinDate.textContent = date.toLocaleDateString('ko-KR');
    }

    // 추천 코드
    const userReferralCode = document.getElementById('userReferralCode');
    if (userReferralCode) {
        userReferralCode.textContent = user.referralCode || generateReferralCode(user._id);
    }
}

// 대시보드 데이터 로드
async function loadDashboardData() {
    try {
        // 병렬로 여러 API 호출
        const [stats, orders, profile] = await Promise.all([
            fetchUserStats(),
            fetchRecentOrders(),
            fetchUserProfile()
        ]);

        // 데이터 표시
        if (stats) displayStats(stats);
        if (orders) displayRecentOrders(orders);
        if (profile) updateMembershipInfo(profile);
    } catch (error) {
        console.error('대시보드 데이터 로드 오류:', error);
    }
}

// 사용자 통계 가져오기
async function fetchUserStats() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${DASHBOARD_API_URL}/users/stats`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('통계 로드 오류:', error);
        // 기본값 반환
        return {
            totalOrders: 0,
            totalSpent: 0,
            activeOrders: 0,
            completedOrders: 0,
            points: 0,
            level: 'Bronze'
        };
    }
}

// 최근 주문 가져오기
async function fetchRecentOrders() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${DASHBOARD_API_URL}/orders?limit=5`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('주문 로드 오류:', error);
        return [];
    }
}

// 사용자 프로필 가져오기
async function fetchUserProfile() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${DASHBOARD_API_URL}/users/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('프로필 로드 오류:', error);
        return null;
    }
}

// 통계 표시
function displayStats(stats) {
    // 총 주문
    const totalOrders = document.getElementById('totalOrders');
    if (totalOrders) {
        totalOrders.textContent = stats.totalOrders || 0;
    }

    // 총 사용금액
    const totalSpent = document.getElementById('totalSpent');
    if (totalSpent) {
        totalSpent.textContent = `₩${(stats.totalSpent || 0).toLocaleString()}`;
    }

    // 진행중인 주문
    const activeOrders = document.getElementById('activeOrders');
    if (activeOrders) {
        activeOrders.textContent = stats.activeOrders || 0;
    }

    // 완료된 주문
    const completedOrders = document.getElementById('completedOrders');
    if (completedOrders) {
        completedOrders.textContent = stats.completedOrders || 0;
    }

    // 포인트
    const userPoints = document.getElementById('userPoints');
    if (userPoints) {
        userPoints.textContent = (stats.points || 0).toLocaleString();
    }
}

// 최근 주문 표시
function displayRecentOrders(orders) {
    const ordersList = document.getElementById('recentOrdersList');
    if (!ordersList) return;

    if (!orders || orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <p>아직 주문이 없습니다</p>
                <a href="/services.html" class="btn btn-primary">서비스 둘러보기</a>
            </div>
        `;
        return;
    }

    let html = '';
    orders.forEach(order => {
        const statusClass = getStatusClass(order.status);
        const statusText = getStatusText(order.status);
        const date = new Date(order.createdAt).toLocaleDateString('ko-KR');

        html += `
            <div class="order-item" onclick="viewOrderDetail('${order._id}')">
                <div class="order-header">
                    <span class="order-id">#${order._id.slice(-6)}</span>
                    <span class="order-date">${date}</span>
                </div>
                <div class="order-body">
                    <h4>${order.serviceName || '서비스'}</h4>
                    <p>${order.platform || ''} - ${order.quantity || 0}개</p>
                </div>
                <div class="order-footer">
                    <span class="order-status ${statusClass}">${statusText}</span>
                    <span class="order-price">₩${(order.totalPrice || 0).toLocaleString()}</span>
                </div>
            </div>
        `;
    });

    ordersList.innerHTML = html;
}

// 회원 등급 정보 업데이트
function updateMembershipInfo(profile) {
    if (!profile) return;

    // 회원 등급
    const userMembershipLevel = document.getElementById('userMembershipLevel');
    if (userMembershipLevel) {
        userMembershipLevel.textContent = profile.membershipLevel || 'Bronze';
    }

    // 예치금 잔액 표시
    const userDepositBalance = document.getElementById('userDepositBalance');
    if (userDepositBalance) {
        const balance = profile.depositBalance || profile.data?.depositBalance || 0;
        userDepositBalance.textContent = `₩${balance.toLocaleString()}`;
    }

    // 등급별 혜택 표시
    displayMembershipBenefits(profile.membershipLevel);
}

// 등급별 혜택 표시
function displayMembershipBenefits(level) {
    const benefits = {
        Bronze: {
            discount: 0,
            points: 1,
            priority: false
        },
        Silver: {
            discount: 5,
            points: 1.5,
            priority: false
        },
        Gold: {
            discount: 10,
            points: 2,
            priority: true
        },
        Platinum: {
            discount: 15,
            points: 3,
            priority: true
        }
    };

    const currentBenefits = benefits[level] || benefits.Bronze;

    // 혜택 표시 UI 업데이트 (필요시)
}

// 빠른 주문
function quickOrder(platform) {
    localStorage.setItem('selectedPlatform', platform);
    window.location.href = `/order.html?platform=${platform}`;
}

// 주문 상세 보기
function viewOrderDetail(orderId) {
    window.location.href = `/order-detail.html?id=${orderId}`;
}

// 모든 주문 보기
function showAllOrders() {
    window.location.href = '/orders.html';
}

// 프로필 표시
function showProfile() {
    // 프로필 모달 또는 페이지로 이동
    window.location.href = '/profile.html';
}

// 설정 표시
function showSettings() {
    window.location.href = '/settings.html';
}

// 추천 코드 복사
function copyReferralCode() {
    const codeElement = document.getElementById('userReferralCode');
    if (codeElement) {
        const code = codeElement.textContent;
        navigator.clipboard.writeText(code).then(() => {
            alert('추천 코드가 복사되었습니다!');
        }).catch(err => {
            console.error('복사 실패:', err);
        });
    }
}

// 사용자 메뉴 토글
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// 로그아웃
function logout() {
    if (confirm('정말 로그아웃 하시겠습니까?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        window.location.href = '/login.html';
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 새로고침 버튼
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadDashboardData();
        });
    }

    // 알림 설정
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            window.location.href = '/notification-settings.html';
        });
    }

    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu')) {
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) {
                dropdown.classList.remove('show');
            }
        }
    });
}

// 유틸리티 함수
function getStatusClass(status) {
    const statusClasses = {
        pending: 'status-pending',
        processing: 'status-processing',
        in_progress: 'status-progress',
        completed: 'status-completed',
        cancelled: 'status-cancelled'
    };
    return statusClasses[status] || 'status-pending';
}

function getStatusText(status) {
    const statusTexts = {
        pending: '대기중',
        processing: '처리중',
        in_progress: '진행중',
        completed: '완료',
        cancelled: '취소됨'
    };
    return statusTexts[status] || '대기중';
}

function generateReferralCode(userId) {
    if (!userId) return 'MG000000';
    return `MG${userId.slice(-6).toUpperCase()}`;
}

// 실시간 업데이트 (선택적)
function startRealtimeUpdates() {
    // 30초마다 데이터 새로고침
    setInterval(() => {
        fetchRecentOrders().then(orders => {
            if (orders) displayRecentOrders(orders);
        });
    }, 30000);
}

// 전역 함수 등록
window.quickOrder = quickOrder;
window.viewOrderDetail = viewOrderDetail;
window.showAllOrders = showAllOrders;
window.showProfile = showProfile;
window.showSettings = showSettings;
window.copyReferralCode = copyReferralCode;
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;

// 초기화 후 실시간 업데이트 시작
startRealtimeUpdates();

// WebSocket 리스너 설정
function setupWebSocketListeners() {
    if (window.wsClient) {
        // 잔액 업데이트 리스너
        window.wsClient.on('balanceUpdate', (data) => {
            updateBalanceDisplay(data.balance);
        });

        // 입금 완료 리스너
        window.wsClient.on('depositComplete', (data) => {
            // 통계 새로고침
            loadDashboardData();
            
            // 성공 메시지 표시
            showSuccessMessage(`예치금 ${data.finalAmount.toLocaleString()}원이 충전되었습니다!`);
        });

        // 사용자 인증
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const token = localStorage.getItem('authToken');
        if (userInfo.id && token) {
            window.wsClient.authenticate(userInfo.id, token);
        }
    }
}

// 잔액 표시 업데이트
function updateBalanceDisplay(balance) {
    // 예치금 표시 요소 찾기
    const balanceElements = document.querySelectorAll('.deposit-balance, .user-balance, #userBalance');
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

// 성공 메시지 표시
function showSuccessMessage(message) {
    // 기존 알림 제거
    const existingAlert = document.querySelector('.dashboard-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // 새 알림 생성
    const alert = document.createElement('div');
    alert.className = 'dashboard-alert success';
    alert.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="close-alert">&times;</button>
    `;

    // 스타일 추가
    const style = document.createElement('style');
    if (!document.querySelector('#dashboard-alert-styles')) {
        style.id = 'dashboard-alert-styles';
        style.textContent = `
            .dashboard-alert {
                position: fixed;
                top: 80px;
                right: 20px;
                max-width: 400px;
                padding: 15px 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideIn 0.3s ease;
            }
            
            .dashboard-alert.success {
                border-left: 4px solid #28a745;
            }
            
            .dashboard-alert i {
                color: #28a745;
                font-size: 20px;
            }
            
            .close-alert {
                margin-left: auto;
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #999;
                padding: 0;
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
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(alert);

    // 5초 후 자동 제거
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}
