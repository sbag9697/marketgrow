// 관리자 패널 기능
const API_URL = 'https://marketgrow-production.up.railway.app/api';

// 관리자 인증 확인
let isAdmin = false;
let adminToken = null;

// 페이지 초기화
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    initializeAdminPanel();
});

// 관리자 인증 확인
async function checkAdminAuth() {
    adminToken = localStorage.getItem('adminToken');

    if (!adminToken) {
        window.location.href = '/admin-login.html';
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/admin/verify`, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.role === 'admin') {
                isAdmin = true;
                displayAdminInfo(data.data);
                return true;
            }
        }
    } catch (error) {
        console.error('관리자 인증 오류:', error);
    }

    localStorage.removeItem('adminToken');
    window.location.href = '/admin-login.html';
    return false;
}

// 관리자 정보 표시
function displayAdminInfo(admin) {
    const adminName = document.getElementById('adminName');
    if (adminName) {
        adminName.textContent = admin.name || 'Admin';
    }
}

// 관리자 패널 초기화
function initializeAdminPanel() {
    loadDashboardStats();
    setupMenuNavigation();
    loadInitialContent();
}

// 대시보드 통계 로드
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: {
                Authorization: `Bearer ${adminToken}`
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
    // 사용자 통계
    const totalUsers = document.getElementById('totalUsers');
    if (totalUsers) totalUsers.textContent = stats.totalUsers || 0;

    const newUsers = document.getElementById('newUsers');
    if (newUsers) newUsers.textContent = stats.newUsers || 0;

    // 주문 통계
    const totalOrders = document.getElementById('totalOrders');
    if (totalOrders) totalOrders.textContent = stats.totalOrders || 0;

    const pendingOrders = document.getElementById('pendingOrders');
    if (pendingOrders) pendingOrders.textContent = stats.pendingOrders || 0;

    // 매출 통계
    const totalRevenue = document.getElementById('totalRevenue');
    if (totalRevenue) totalRevenue.textContent = `₩${(stats.totalRevenue || 0).toLocaleString()}`;

    const monthlyRevenue = document.getElementById('monthlyRevenue');
    if (monthlyRevenue) monthlyRevenue.textContent = `₩${(stats.monthlyRevenue || 0).toLocaleString()}`;
}

// 메뉴 네비게이션 설정
function setupMenuNavigation() {
    const menuItems = document.querySelectorAll('.admin-menu-item');

    menuItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            // 활성 메뉴 변경
            menuItems.forEach(mi => mi.classList.remove('active'));
            this.classList.add('active');

            // 콘텐츠 로드
            const section = this.dataset.section;
            loadContent(section);
        });
    });
}

// 콘텐츠 로드
async function loadContent(section) {
    const contentArea = document.getElementById('adminContent');
    if (!contentArea) return;

    // 로딩 표시
    contentArea.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> 로딩중...</div>';

    switch (section) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'users':
            await loadUsersManagement();
            break;
        case 'orders':
            await loadOrdersManagement();
            break;
        case 'services':
            await loadServicesManagement();
            break;
        case 'payments':
            await loadPaymentsManagement();
            break;
        case 'settings':
            await loadSettings();
            break;
        default:
            await loadDashboard();
    }
}

// 대시보드 로드
async function loadDashboard() {
    const contentArea = document.getElementById('adminContent');

    contentArea.innerHTML = `
        <div class="admin-dashboard">
            <h2>대시보드</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-info">
                        <h3 id="totalUsers">0</h3>
                        <p>전체 사용자</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-shopping-cart"></i></div>
                    <div class="stat-info">
                        <h3 id="totalOrders">0</h3>
                        <p>전체 주문</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-won-sign"></i></div>
                    <div class="stat-info">
                        <h3 id="totalRevenue">₩0</h3>
                        <p>총 매출</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                    <div class="stat-info">
                        <h3 id="conversionRate">0%</h3>
                        <p>전환율</p>
                    </div>
                </div>
            </div>
            
            <div class="recent-activities">
                <h3>최근 활동</h3>
                <div id="recentActivities"></div>
            </div>
        </div>
    `;

    await loadDashboardStats();
    await loadRecentActivities();
}

// 사용자 관리 로드
async function loadUsersManagement() {
    const contentArea = document.getElementById('adminContent');

    contentArea.innerHTML = `
        <div class="users-management">
            <div class="section-header">
                <h2>사용자 관리</h2>
                <button class="btn btn-primary" onclick="showAddUserModal()">
                    <i class="fas fa-plus"></i> 사용자 추가
                </button>
            </div>
            
            <div class="filters">
                <input type="text" id="userSearch" placeholder="사용자 검색..." class="search-input">
                <select id="userFilter" class="filter-select">
                    <option value="all">전체</option>
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                    <option value="blocked">차단</option>
                </select>
            </div>
            
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>이름</th>
                            <th>이메일</th>
                            <th>가입일</th>
                            <th>상태</th>
                            <th>주문수</th>
                            <th>작업</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <tr>
                            <td colspan="7" class="loading-cell">
                                <i class="fas fa-spinner fa-spin"></i> 로딩중...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="pagination" id="usersPagination"></div>
        </div>
    `;

    await loadUsers();
}

// 사용자 목록 로드
async function loadUsers(page = 1, search = '', filter = 'all') {
    try {
        const params = new URLSearchParams({
            page,
            search,
            filter,
            limit: 20
        });

        const response = await fetch(`${API_URL}/admin/users?${params}`, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayUsers(data.data.users);
                displayPagination('usersPagination', data.data.pagination, (p) => loadUsers(p, search, filter));
            }
        }
    } catch (error) {
        console.error('사용자 로드 오류:', error);
    }
}

// 사용자 목록 표시
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">사용자가 없습니다.</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user._id.slice(-6)}</td>
            <td>${user.name || user.username}</td>
            <td>${user.email}</td>
            <td>${new Date(user.createdAt).toLocaleDateString('ko-KR')}</td>
            <td>
                <span class="status-badge ${user.status}">
                    ${getStatusText(user.status)}
                </span>
            </td>
            <td>${user.orderCount || 0}</td>
            <td>
                <button class="btn-icon" onclick="viewUser('${user._id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="editUser('${user._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon danger" onclick="deleteUser('${user._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// 주문 관리 로드
async function loadOrdersManagement() {
    const contentArea = document.getElementById('adminContent');

    contentArea.innerHTML = `
        <div class="orders-management">
            <div class="section-header">
                <h2>주문 관리</h2>
                <div class="header-actions">
                    <button class="btn btn-secondary" onclick="exportOrders()">
                        <i class="fas fa-download"></i> 내보내기
                    </button>
                </div>
            </div>
            
            <div class="filters">
                <input type="text" id="orderSearch" placeholder="주문 검색..." class="search-input">
                <select id="orderStatus" class="filter-select">
                    <option value="all">전체 상태</option>
                    <option value="pending">대기중</option>
                    <option value="processing">처리중</option>
                    <option value="completed">완료</option>
                    <option value="cancelled">취소</option>
                </select>
                <input type="date" id="orderDateFrom" class="date-input">
                <input type="date" id="orderDateTo" class="date-input">
            </div>
            
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>주문번호</th>
                            <th>고객</th>
                            <th>서비스</th>
                            <th>수량</th>
                            <th>금액</th>
                            <th>상태</th>
                            <th>주문일</th>
                            <th>작업</th>
                        </tr>
                    </thead>
                    <tbody id="ordersTableBody">
                        <tr>
                            <td colspan="8" class="loading-cell">
                                <i class="fas fa-spinner fa-spin"></i> 로딩중...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="pagination" id="ordersPagination"></div>
        </div>
    `;

    await loadOrders();
}

// 서비스 관리 로드
async function loadServicesManagement() {
    const contentArea = document.getElementById('adminContent');

    contentArea.innerHTML = `
        <div class="services-management">
            <div class="section-header">
                <h2>서비스 관리</h2>
                <button class="btn btn-primary" onclick="showAddServiceModal()">
                    <i class="fas fa-plus"></i> 서비스 추가
                </button>
            </div>
            
            <div class="services-grid" id="servicesGrid">
                <!-- 서비스 카드들이 여기에 로드됩니다 -->
            </div>
        </div>
    `;

    await loadServices();
}

// 최근 활동 로드
async function loadRecentActivities() {
    try {
        const response = await fetch(`${API_URL}/admin/activities`, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayActivities(data.data);
            }
        }
    } catch (error) {
        console.error('활동 로드 오류:', error);
    }
}

// 활동 표시
function displayActivities(activities) {
    const container = document.getElementById('recentActivities');
    if (!container) return;

    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.description}</p>
                <span class="activity-time">${formatTimeAgo(activity.createdAt)}</span>
            </div>
        </div>
    `).join('');
}

// 페이지네이션 표시
function displayPagination(containerId, pagination, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { current, total } = pagination;
    let html = '';

    // 이전 버튼
    if (current > 1) {
        html += `<button onclick="(${callback})(${current - 1})">이전</button>`;
    }

    // 페이지 번호
    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
        html += `<button class="${i === current ? 'active' : ''}" onclick="(${callback})(${i})">${i}</button>`;
    }

    // 다음 버튼
    if (current < total) {
        html += `<button onclick="(${callback})(${current + 1})">다음</button>`;
    }

    container.innerHTML = html;
}

// 유틸리티 함수
function getStatusText(status) {
    const statusMap = {
        active: '활성',
        inactive: '비활성',
        blocked: '차단',
        pending: '대기중',
        processing: '처리중',
        completed: '완료',
        cancelled: '취소'
    };
    return statusMap[status] || status;
}

function getActivityIcon(type) {
    const iconMap = {
        user_signup: 'user-plus',
        order_created: 'shopping-cart',
        payment_completed: 'credit-card',
        service_updated: 'edit',
        user_login: 'sign-in-alt'
    };
    return iconMap[type] || 'circle';
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return '방금 전';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}일 전`;

    return new Date(date).toLocaleDateString('ko-KR');
}

// 초기 콘텐츠 로드
function loadInitialContent() {
    const activeMenu = document.querySelector('.admin-menu-item.active');
    const section = activeMenu ? activeMenu.dataset.section : 'dashboard';
    loadContent(section);
}

// 전역 함수 등록
window.viewUser = (userId) => console.log('View user:', userId);
window.editUser = (userId) => console.log('Edit user:', userId);
window.deleteUser = (userId) => console.log('Delete user:', userId);
window.exportOrders = () => console.log('Export orders');
window.showAddUserModal = () => console.log('Show add user modal');
window.showAddServiceModal = () => console.log('Show add service modal');
