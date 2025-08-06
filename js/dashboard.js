// 대시보드 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 인증 확인
    checkAuthentication();
    
    // 대시보드 데이터 로드
    loadDashboardData();
    
    // 사용자 메뉴 초기화
    initUserMenu();
});

// 인증 확인
async function checkAuthentication() {
    if (!api.token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await api.getProfile();
        if (!response.success) {
            throw new Error('인증 실패');
        }
        
        updateUserInfo(response.data.user);
    } catch (error) {
        console.error('인증 확인 실패:', error);
        api.clearToken();
        window.location.href = 'login.html';
    }
}

// 사용자 정보 업데이트
function updateUserInfo(user) {
    // 네비게이션의 사용자 이름
    const navUserName = document.getElementById('navUserName');
    if (navUserName) {
        navUserName.textContent = `${user.name}님`;
    }

    // 환영 메시지
    const welcomeUserName = document.getElementById('welcomeUserName');
    if (welcomeUserName) {
        welcomeUserName.textContent = user.name;
    }

    // 멤버십 레벨
    const userMembershipLevel = document.getElementById('userMembershipLevel');
    if (userMembershipLevel) {
        const levelNames = {
            bronze: 'Bronze',
            silver: 'Silver',
            gold: 'Gold',
            platinum: 'Platinum',
            diamond: 'Diamond'
        };
        userMembershipLevel.textContent = levelNames[user.membershipLevel] || 'Bronze';
        userMembershipLevel.className = user.membershipLevel;
    }

    // 포인트
    const userPoints = document.getElementById('userPoints');
    if (userPoints) {
        userPoints.textContent = user.points?.toLocaleString() || '0';
    }

    // 계정 정보
    const userEmail = document.getElementById('userEmail');
    if (userEmail) {
        userEmail.textContent = user.email;
    }

    const userJoinDate = document.getElementById('userJoinDate');
    if (userJoinDate && user.createdAt) {
        const joinDate = new Date(user.createdAt);
        userJoinDate.textContent = joinDate.toLocaleDateString('ko-KR');
    }

    const userReferralCode = document.getElementById('userReferralCode');
    if (userReferralCode) {
        userReferralCode.textContent = user.referralCode || '-';
    }
}

// 대시보드 데이터 로드
async function loadDashboardData() {
    try {
        const response = await api.getDashboard();
        
        if (response.success) {
            updateDashboardStats(response.data.statistics);
            updateRecentOrders(response.data.recentOrders);
        }
    } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error);
        showDashboardError();
    }
}

// 대시보드 통계 업데이트
function updateDashboardStats(stats) {
    // 총 주문수
    const totalOrders = document.getElementById('totalOrders');
    if (totalOrders) {
        totalOrders.textContent = stats.totalOrders?.toLocaleString() || '0';
    }

    // 총 사용금액
    const totalSpent = document.getElementById('totalSpent');
    if (totalSpent) {
        totalSpent.textContent = `₩${(stats.totalSpent || 0).toLocaleString()}`;
    }

    // 진행중인 주문
    const activeOrders = document.getElementById('activeOrders');
    if (activeOrders) {
        activeOrders.textContent = stats.activeOrders?.toLocaleString() || '0';
    }

    // 완료된 주문
    const completedOrders = document.getElementById('completedOrders');
    if (completedOrders) {
        completedOrders.textContent = stats.completedOrders?.toLocaleString() || '0';
    }
}

// 최근 주문 목록 업데이트
function updateRecentOrders(orders) {
    const recentOrdersList = document.getElementById('recentOrdersList');
    if (!recentOrdersList) return;

    if (!orders || orders.length === 0) {
        recentOrdersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <p>아직 주문이 없습니다.</p>
                <button class="primary-btn" onclick="location.href='services.html'">
                    첫 주문하기
                </button>
            </div>
        `;
        return;
    }

    const ordersHTML = orders.map(order => {
        const statusClass = getOrderStatusClass(order.status);
        const statusText = getOrderStatusText(order.status);
        const progressPercent = order.progress ? 
            Math.round((order.progress.current / order.progress.total) * 100) : 0;

        return `
            <div class="order-item" onclick="viewOrderDetails('${order._id}')">
                <div class="order-header">
                    <div class="order-service">
                        <i class="fab fa-${order.service?.platform || 'globe'}"></i>
                        <span>${order.service?.name || '서비스'}</span>
                    </div>
                    <div class="order-status ${statusClass}">
                        ${statusText}
                    </div>
                </div>
                <div class="order-details">
                    <div class="order-info">
                        <span class="order-number">#${order.orderNumber}</span>
                        <span class="order-amount">₩${order.finalAmount?.toLocaleString()}</span>
                    </div>
                    <div class="order-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <span class="progress-text">${progressPercent}%</span>
                    </div>
                </div>
                <div class="order-date">
                    ${new Date(order.createdAt).toLocaleDateString('ko-KR')}
                </div>
            </div>
        `;
    }).join('');

    recentOrdersList.innerHTML = ordersHTML;
}

// 주문 상태 클래스 반환
function getOrderStatusClass(status) {
    const statusClasses = {
        pending: 'status-pending',
        processing: 'status-processing',
        completed: 'status-completed',
        cancelled: 'status-cancelled',
        refunded: 'status-refunded'
    };
    return statusClasses[status] || 'status-pending';
}

// 주문 상태 텍스트 반환
function getOrderStatusText(status) {
    const statusTexts = {
        pending: '대기중',
        processing: '진행중',
        completed: '완료',
        cancelled: '취소됨',
        refunded: '환불됨'
    };
    return statusTexts[status] || '알 수 없음';
}

// 대시보드 에러 표시
function showDashboardError() {
    const recentOrdersList = document.getElementById('recentOrdersList');
    if (recentOrdersList) {
        recentOrdersList.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>데이터를 불러올 수 없습니다.</p>
                <button class="retry-btn" onclick="loadDashboardData()">다시 시도</button>
            </div>
        `;
    }
}

// 사용자 메뉴 초기화
function initUserMenu() {
    // 외부 클릭 시 메뉴 닫기
    document.addEventListener('click', function(event) {
        const userMenu = document.querySelector('.user-menu');
        const userDropdown = document.getElementById('userDropdown');
        
        if (userMenu && !userMenu.contains(event.target)) {
            userDropdown?.classList.remove('show');
        }
    });
}

// 사용자 메뉴 토글
function toggleUserMenu() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.classList.toggle('show');
    }
}

// 빠른 주문
function quickOrder(platform) {
    window.location.href = `services.html?platform=${platform}`;
}

// 모든 주문 보기
function showAllOrders() {
    window.location.href = 'orders.html';
}

// 주문 상세 보기
function viewOrderDetails(orderId) {
    window.location.href = `order-detail.html?id=${orderId}`;
}

// 프로필 보기
function showProfile() {
    // 프로필 모달 표시 또는 페이지 이동
    NotificationManager.info('프로필 페이지는 준비 중입니다.');
}

// 설정 보기
function showSettings() {
    // 설정 모달 표시 또는 페이지 이동
    NotificationManager.info('설정 페이지는 준비 중입니다.');
}

// 추천 코드 복사
function copyReferralCode() {
    const referralCode = document.getElementById('userReferralCode').textContent;
    
    if (referralCode && referralCode !== '-') {
        navigator.clipboard.writeText(referralCode).then(() => {
            NotificationManager.success('추천 코드가 복사되었습니다!');
        }).catch(() => {
            // 구형 브라우저 대응
            const textArea = document.createElement('textarea');
            textArea.value = referralCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            NotificationManager.success('추천 코드가 복사되었습니다!');
        });
    }
}

// 숫자 애니메이션 효과
function animateNumbers() {
    const numbers = document.querySelectorAll('.stat-number');
    
    numbers.forEach(numberEl => {
        const finalValue = parseInt(numberEl.textContent.replace(/[^0-9]/g, ''));
        if (finalValue > 0) {
            let currentValue = 0;
            const increment = finalValue / 30; // 30 프레임에 걸쳐 애니메이션
            
            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= finalValue) {
                    currentValue = finalValue;
                    clearInterval(timer);
                }
                
                if (numberEl.textContent.includes('₩')) {
                    numberEl.textContent = `₩${Math.floor(currentValue).toLocaleString()}`;
                } else {
                    numberEl.textContent = Math.floor(currentValue).toLocaleString();
                }
            }, 50);
        }
    });
}

// 페이지 로드 완료 후 숫자 애니메이션 실행
window.addEventListener('load', () => {
    setTimeout(animateNumbers, 500);
});