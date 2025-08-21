/**
 * MarketGrow 관리자 대시보드 - 핵심 기능
 */

// API 설정
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5002/api' 
    : 'https://marketgrow-production-c586.up.railway.app/api';  // Railway 배포 서버

// 전역 변수
let adminToken = localStorage.getItem('adminToken');
let currentUser = null;

// Axios 기본 설정
if (adminToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
}

// 페이지 초기화
document.addEventListener('DOMContentLoaded', () => {
    if (adminToken) {
        checkAuth();
    } else {
        showLoginScreen();
    }

    // 이벤트 리스너 등록
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
});

// ===== 인증 관련 =====
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            login: email,
            password: password
        });

        if (response.data.success) {
            adminToken = response.data.data.token;
            currentUser = response.data.data.user;
            
            localStorage.setItem('adminToken', adminToken);
            localStorage.setItem('adminUser', JSON.stringify(currentUser));
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
            
            // 관리자 권한 확인
            if (currentUser.role !== 'admin') {
                // 일반 사용자면 role 업데이트 시도 (개발용)
                console.warn('Not an admin account. For development, manually update role in DB.');
            }
            
            showDashboard();
            loadDashboardData();
        }
    } catch (error) {
        alert(error.response?.data?.message || '로그인 실패');
    }
}

async function checkAuth() {
    try {
        const response = await axios.get(`${API_URL}/auth/profile`);
        if (response.data.success) {
            currentUser = response.data.data.user;
            showDashboard();
            loadDashboardData();
        }
    } catch (error) {
        showLoginScreen();
    }
}

function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    adminToken = null;
    currentUser = null;
    window.location.reload();
}

// ===== UI 제어 =====
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboardScreen').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'flex';
}

function showSection(sectionName) {
    // 모든 섹션 숨기기
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // 선택한 섹션 표시
    const section = document.getElementById(sectionName);
    if (section) {
        section.style.display = 'block';
        document.getElementById('sectionTitle').textContent = getSectionTitle(sectionName);
        
        // 섹션별 데이터 로드
        loadSectionData(sectionName);
    }
    
    // 네비게이션 활성화 상태 업데이트
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${sectionName}`) {
            item.classList.add('active');
        }
    });
}

function getSectionTitle(sectionName) {
    const titles = {
        'overview': '대시보드',
        'orders': '주문 관리',
        'users': '회원 관리',
        'services': '서비스 관리',
        'deposits': '예치금 관리',
        'coupons': '쿠폰 관리',
        'logs': '활동 로그',
        'settings': '설정'
    };
    return titles[sectionName] || '대시보드';
}

// ===== 데이터 로드 함수 =====
async function loadDashboardData() {
    try {
        // 통계 데이터 로드
        const stats = await loadStats();
        updateStatsUI(stats);
        
        // 최근 주문 로드
        const orders = await loadRecentOrders();
        updateRecentOrdersTable(orders);
    } catch (error) {
        console.error('Dashboard data load error:', error);
    }
}

async function loadStats() {
    try {
        const response = await axios.get(`${API_URL}/admin/dashboard`);
        if (response.data.success) {
            return response.data.data.overview || response.data.data;
        }
    } catch (error) {
        console.log('Stats API error, using defaults');
    }
    return {
        totalRevenue: 0,
        newOrders: 0,
        activeUsers: 0,
        pendingOrders: 0
    };
}

async function loadRecentOrders() {
    try {
        const response = await axios.get(`${API_URL}/orders?limit=10`);
        return response.data.data?.orders || [];
    } catch (error) {
        return [];
    }
}

async function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'orders':
            await loadOrders();
            break;
        case 'users':
            await loadUsers();
            break;
        case 'services':
            await loadServices();
            break;
        case 'deposits':
            await loadDeposits();
            break;
        case 'coupons':
            await loadCoupons();
            break;
        case 'logs':
            await loadLogs();
            break;
    }
}

// ===== 주문 관리 =====
async function loadOrders() {
    try {
        const response = await axios.get(`${API_URL}/admin/orders`);
        const orders = response.data.data?.orders || [];
        
        const tbody = document.querySelector('#ordersTable tbody');
        tbody.innerHTML = orders.length ? orders.map(order => `
            <tr>
                <td>${order.orderNumber || order._id}</td>
                <td>${order.user?.name || order.user?.email || '-'}</td>
                <td>${order.service?.name || '-'}</td>
                <td>${order.quantity || 0}</td>
                <td>${(order.finalAmount || 0).toLocaleString()}원</td>
                <td><span class="badge badge-${getStatusColor(order.status)}">${order.status}</span></td>
                <td>${order.paymentMethod || '-'}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewOrder('${order._id}')">상세</button>
                    <button class="btn btn-sm btn-success" onclick="updateOrderStatus('${order._id}', 'completed')">완료</button>
                    <button class="btn btn-sm btn-danger" onclick="updateOrderStatus('${order._id}', 'cancelled')">취소</button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="9" class="text-center">주문이 없습니다</td></tr>';
    } catch (error) {
        console.error('Orders load error:', error);
    }
}

// ===== 회원 관리 =====
async function loadUsers() {
    try {
        const response = await axios.get(`${API_URL}/admin/users`);
        const users = response.data.data?.users || [];
        
        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = users.length ? users.map(user => `
            <tr>
                <td>${user._id}</td>
                <td>${user.name || '-'}</td>
                <td>${user.email}</td>
                <td><span class="badge badge-${getMembershipColor(user.membershipLevel)}">${user.membershipLevel || 'bronze'}</span></td>
                <td>${(user.points || 0).toLocaleString()}</td>
                <td>${(user.depositBalance || 0).toLocaleString()}원</td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <span class="badge badge-${user.isActive ? 'success' : 'danger'}">
                        ${user.isActive ? '활성' : '비활성'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editUser('${user._id}')">수정</button>
                    <button class="btn btn-sm btn-warning" onclick="toggleUserStatus('${user._id}', ${!user.isActive})">
                        ${user.isActive ? '비활성화' : '활성화'}
                    </button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="9" class="text-center">회원이 없습니다</td></tr>';
    } catch (error) {
        console.error('Users load error:', error);
    }
}

// ===== 서비스 관리 =====
async function loadServices() {
    try {
        const response = await axios.get(`${API_URL}/admin/services`);
        const services = response.data.data?.services || [];
        
        const tbody = document.querySelector('#servicesTable tbody');
        tbody.innerHTML = services.length ? services.map(service => {
            const price = service.pricing?.[0]?.price || service.price || 0;
            return `
            <tr>
                <td>${service._id}</td>
                <td>${service.platform || '-'}</td>
                <td>${service.name}</td>
                <td>${price.toLocaleString()}원</td>
                <td>${service.minQuantity || 0}</td>
                <td>${service.maxQuantity || 0}</td>
                <td>
                    <span class="badge badge-${service.isActive ? 'success' : 'danger'}">
                        ${service.isActive ? '활성' : '비활성'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editService('${service._id}')">수정</button>
                    <button class="btn btn-sm btn-warning" onclick="toggleServiceStatus('${service._id}', ${!service.isActive})">
                        ${service.isActive ? '비활성화' : '활성화'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteService('${service._id}')">삭제</button>
                </td>
            </tr>
        `}).join('') : '<tr><td colspan="8" class="text-center">서비스가 없습니다</td></tr>';
    } catch (error) {
        console.error('Services load error:', error);
    }
}

// ===== 예치금 관리 =====
async function loadDeposits() {
    try {
        const response = await axios.get(`${API_URL}/deposits`);
        const deposits = response.data.data?.deposits || [];
        
        const tbody = document.querySelector('#depositsTable tbody');
        tbody.innerHTML = deposits.length ? deposits.map(deposit => `
            <tr>
                <td>${deposit._id}</td>
                <td>${deposit.user?.name || deposit.user?.email || '-'}</td>
                <td>${(deposit.amount || 0).toLocaleString()}원</td>
                <td>${(deposit.bonusAmount || 0).toLocaleString()}원</td>
                <td>${deposit.depositorName || '-'}</td>
                <td><span class="badge badge-${getStatusColor(deposit.status)}">${deposit.status}</span></td>
                <td>${new Date(deposit.requestedAt || deposit.createdAt).toLocaleDateString()}</td>
                <td>
                    ${deposit.status === 'pending' ? `
                        <button class="btn btn-sm btn-success" onclick="confirmDeposit('${deposit._id}')">승인</button>
                        <button class="btn btn-sm btn-danger" onclick="rejectDeposit('${deposit._id}')">거절</button>
                    ` : '-'}
                </td>
            </tr>
        `).join('') : '<tr><td colspan="8" class="text-center">예치금 요청이 없습니다</td></tr>';
    } catch (error) {
        console.error('Deposits load error:', error);
    }
}

// ===== 쿠폰 관리 =====
async function loadCoupons() {
    try {
        const response = await axios.get(`${API_URL}/coupons`);
        const coupons = response.data.data?.coupons || [];
        
        const tbody = document.querySelector('#couponsTable tbody');
        tbody.innerHTML = coupons.length ? coupons.map(coupon => `
            <tr>
                <td>${coupon.code}</td>
                <td>${coupon.description || '-'}</td>
                <td>${coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value.toLocaleString()}원`}</td>
                <td>${coupon.type}</td>
                <td>${coupon.usedCount || 0} / ${coupon.maxUses || '무제한'}</td>
                <td>${coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : '무제한'}</td>
                <td>
                    <span class="badge badge-${coupon.isActive ? 'success' : 'danger'}">
                        ${coupon.isActive ? '활성' : '비활성'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteCoupon('${coupon._id}')">삭제</button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="8" class="text-center">쿠폰이 없습니다</td></tr>';
    } catch (error) {
        console.error('Coupons load error:', error);
    }
}

// ===== 활동 로그 =====
async function loadLogs() {
    const tbody = document.querySelector('#logsTable tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">로그 기능 준비 중</td></tr>';
}

// ===== UI 업데이트 함수 =====
function updateStatsUI(stats) {
    document.getElementById('totalRevenue').textContent = `${(stats.totalRevenue || 0).toLocaleString()}원`;
    document.getElementById('newOrders').textContent = stats.newOrders || 0;
    document.getElementById('activeUsers').textContent = stats.activeUsers || 0;
    document.getElementById('pendingOrders').textContent = stats.pendingOrders || 0;
}

function updateRecentOrdersTable(orders) {
    const tbody = document.querySelector('#recentOrdersTable tbody');
    tbody.innerHTML = orders.length ? orders.map(order => `
        <tr>
            <td>${order.orderNumber || order._id}</td>
            <td>${order.user?.name || '-'}</td>
            <td>${order.service?.name || '-'}</td>
            <td>${(order.finalAmount || 0).toLocaleString()}원</td>
            <td><span class="badge badge-${getStatusColor(order.status)}">${order.status}</span></td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewOrder('${order._id}')">상세</button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="7" class="text-center">최근 주문이 없습니다</td></tr>';
}

// ===== 액션 함수 =====
async function updateOrderStatus(orderId, status) {
    if (!confirm(`주문을 ${status === 'completed' ? '완료' : '취소'} 처리하시겠습니까?`)) return;
    
    try {
        const response = await axios.put(`${API_URL}/orders/${orderId}/status`, { status });
        if (response.data.success) {
            loadOrders();
            alert('주문 상태가 업데이트되었습니다');
        } else {
            alert(response.data.message || '주문 상태 업데이트 실패');
        }
    } catch (error) {
        alert(error.response?.data?.message || '주문 상태 업데이트 실패');
    }
}

async function toggleUserStatus(userId, isActive) {
    try {
        const response = await axios.put(`${API_URL}/admin/users/${userId}`, { isActive });
        if (response.data.success) {
            loadUsers();
            alert('회원 상태가 업데이트되었습니다');
        }
    } catch (error) {
        alert(error.response?.data?.message || '회원 상태 업데이트 실패');
    }
}

async function toggleServiceStatus(serviceId, isActive) {
    try {
        const response = await axios.put(`${API_URL}/admin/services/${serviceId}`, { isActive });
        if (response.data.success) {
            loadServices();
            alert('서비스 상태가 업데이트되었습니다');
        }
    } catch (error) {
        alert(error.response?.data?.message || '서비스 상태 업데이트 실패');
    }
}

async function confirmDeposit(depositId) {
    if (!confirm('예치금을 승인하시겠습니까?')) return;
    
    try {
        await axios.put(`${API_URL}/deposits/${depositId}/confirm`);
        loadDeposits();
        alert('예치금이 승인되었습니다');
    } catch (error) {
        alert('예치금 승인 실패');
    }
}

async function rejectDeposit(depositId) {
    if (!confirm('예치금 요청을 거절하시겠습니까?')) return;
    
    try {
        await axios.put(`${API_URL}/deposits/${depositId}/reject`);
        loadDeposits();
        alert('예치금 요청이 거절되었습니다');
    } catch (error) {
        alert('예치금 거절 실패');
    }
}

async function createCoupon(e) {
    e.preventDefault();
    
    const data = {
        code: document.getElementById('couponCode').value,
        description: document.getElementById('couponDescription').value,
        type: document.getElementById('couponType').value,
        value: parseFloat(document.getElementById('couponValue').value),
        maxUses: parseInt(document.getElementById('couponMaxUses').value),
        expiresAt: document.getElementById('couponExpiry').value
    };
    
    try {
        await axios.post(`${API_URL}/coupons`, data);
        closeModal('couponModal');
        loadCoupons();
        alert('쿠폰이 생성되었습니다');
    } catch (error) {
        alert('쿠폰 생성 실패');
    }
}

// ===== 헬퍼 함수 =====
function getStatusColor(status) {
    const colors = {
        'pending': 'warning',
        'processing': 'info',
        'completed': 'success',
        'cancelled': 'danger',
        'failed': 'danger',
        'refunded': 'secondary'
    };
    return colors[status] || 'secondary';
}

function getMembershipColor(level) {
    const colors = {
        'bronze': 'warning',
        'silver': 'secondary',
        'gold': 'warning',
        'platinum': 'info',
        'diamond': 'primary'
    };
    return colors[level] || 'secondary';
}

function refreshData() {
    const currentSection = document.querySelector('.section.active')?.id || 'overview';
    loadSectionData(currentSection);
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function viewOrder(orderId) {
    alert('주문 상세 보기: ' + orderId);
}

async function editUser(userId) {
    try {
        // 먼저 사용자 정보 가져오기
        const response = await axios.get(`${API_URL}/users/${userId}`);
        const user = response.data.data?.user;
        
        if (!user) {
            alert('사용자 정보를 불러올 수 없습니다');
            return;
        }
        
        // 편집 모달 HTML 생성
        const modalHTML = `
            <div class="modal" id="editUserModal" style="display: block;">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2 class="modal-title">회원 정보 수정</h2>
                        <button class="modal-close" onclick="closeModal('editUserModal')">&times;</button>
                    </div>
                    <form id="editUserForm" onsubmit="updateUser(event, '${userId}')">
                        <div class="form-group">
                            <label>이름</label>
                            <input type="text" class="form-control" id="editUserName" value="${user.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>이메일</label>
                            <input type="email" class="form-control" id="editUserEmail" value="${user.email}" readonly>
                        </div>
                        <div class="form-group">
                            <label>전화번호</label>
                            <input type="tel" class="form-control" id="editUserPhone" value="${user.phone || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>회원 등급</label>
                            <select class="form-control" id="editUserMembership">
                                <option value="bronze" ${user.membershipLevel === 'bronze' ? 'selected' : ''}>Bronze</option>
                                <option value="silver" ${user.membershipLevel === 'silver' ? 'selected' : ''}>Silver</option>
                                <option value="gold" ${user.membershipLevel === 'gold' ? 'selected' : ''}>Gold</option>
                                <option value="platinum" ${user.membershipLevel === 'platinum' ? 'selected' : ''}>Platinum</option>
                                <option value="diamond" ${user.membershipLevel === 'diamond' ? 'selected' : ''}>Diamond</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>역할</label>
                            <select class="form-control" id="editUserRole">
                                <option value="user" ${user.role === 'user' ? 'selected' : ''}>일반 사용자</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>관리자</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>포인트</label>
                            <input type="number" class="form-control" id="editUserPoints" value="${user.points || 0}" min="0">
                        </div>
                        <div class="form-group">
                            <label>예치금</label>
                            <input type="number" class="form-control" id="editUserDeposit" value="${user.depositBalance || 0}" min="0">
                        </div>
                        <div class="form-group">
                            <label>상태</label>
                            <select class="form-control" id="editUserActive">
                                <option value="true" ${user.isActive ? 'selected' : ''}>활성</option>
                                <option value="false" ${!user.isActive ? 'selected' : ''}>비활성</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">수정 완료</button>
                    </form>
                </div>
            </div>
        `;
        
        // 모달 추가
        const existingModal = document.getElementById('editUserModal');
        if (existingModal) {
            existingModal.remove();
        }
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
    } catch (error) {
        alert('사용자 정보를 불러오는데 실패했습니다');
    }
}

async function updateUser(e, userId) {
    e.preventDefault();
    
    const data = {
        name: document.getElementById('editUserName').value,
        phone: document.getElementById('editUserPhone').value,
        membershipLevel: document.getElementById('editUserMembership').value,
        role: document.getElementById('editUserRole').value,
        points: parseInt(document.getElementById('editUserPoints').value),
        depositBalance: parseInt(document.getElementById('editUserDeposit').value),
        isActive: document.getElementById('editUserActive').value === 'true'
    };
    
    try {
        const response = await axios.put(`${API_URL}/admin/users/${userId}`, data);
        if (response.data.success) {
            alert('회원 정보가 수정되었습니다');
            closeModal('editUserModal');
            loadUsers();
        }
    } catch (error) {
        alert(error.response?.data?.message || '회원 정보 수정 실패');
    }
}

async function createService(e) {
    e.preventDefault();
    
    const data = {
        name: document.getElementById('serviceName').value,
        nameEn: document.getElementById('serviceNameEn').value,
        platform: document.getElementById('servicePlatform').value,
        category: document.getElementById('serviceCategory').value,
        description: document.getElementById('serviceDescription').value,
        pricing: [{
            quantity: 1000,
            price: parseFloat(document.getElementById('servicePrice').value)
        }],
        minQuantity: parseInt(document.getElementById('serviceMinQty').value),
        maxQuantity: parseInt(document.getElementById('serviceMaxQty').value),
        deliveryTime: { min: 1, max: 24, unit: 'hours' },
        isActive: true
    };
    
    try {
        const response = await axios.post(`${API_URL}/admin/services`, data);
        if (response.data.success) {
            alert('서비스가 추가되었습니다');
            closeModal('addServiceModal');
            loadServices();
        }
    } catch (error) {
        alert(error.response?.data?.message || '서비스 추가 실패');
    }
}

function editService(serviceId) {
    alert('서비스 수정: ' + serviceId);
}

function deleteService(serviceId) {
    if (confirm('서비스를 삭제하시겠습니까?')) {
        alert('서비스 삭제: ' + serviceId);
    }
}

function deleteCoupon(couponId) {
    if (confirm('쿠폰을 삭제하시겠습니까?')) {
        alert('쿠폰 삭제: ' + couponId);
    }
}

function showAddUserModal() {
    // 회원 추가 모달 HTML 생성
    const modalHTML = `
        <div class="modal" id="addUserModal" style="display: block;">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 class="modal-title">새 회원 추가</h2>
                    <button class="modal-close" onclick="closeModal('addUserModal')">&times;</button>
                </div>
                <form id="addUserForm" onsubmit="createUser(event)">
                    <div class="form-group">
                        <label>사용자명</label>
                        <input type="text" class="form-control" id="userUsername" required>
                    </div>
                    <div class="form-group">
                        <label>이메일</label>
                        <input type="email" class="form-control" id="userEmail" required>
                    </div>
                    <div class="form-group">
                        <label>비밀번호</label>
                        <input type="password" class="form-control" id="userPassword" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label>이름</label>
                        <input type="text" class="form-control" id="userName" required>
                    </div>
                    <div class="form-group">
                        <label>전화번호</label>
                        <input type="tel" class="form-control" id="userPhone" placeholder="01012345678" required>
                    </div>
                    <div class="form-group">
                        <label>회원 등급</label>
                        <select class="form-control" id="userMembership">
                            <option value="bronze">Bronze</option>
                            <option value="silver">Silver</option>
                            <option value="gold">Gold</option>
                            <option value="platinum">Platinum</option>
                            <option value="diamond">Diamond</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>역할</label>
                        <select class="form-control" id="userRole">
                            <option value="user">일반 사용자</option>
                            <option value="admin">관리자</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>초기 포인트</label>
                        <input type="number" class="form-control" id="userPoints" value="0" min="0">
                    </div>
                    <div class="form-group">
                        <label>초기 예치금</label>
                        <input type="number" class="form-control" id="userDeposit" value="0" min="0">
                    </div>
                    <button type="submit" class="btn btn-primary">회원 추가</button>
                </form>
            </div>
        </div>
    `;
    
    // 모달 추가
    const existingModal = document.getElementById('addUserModal');
    if (existingModal) {
        existingModal.remove();
    }
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function createUser(e) {
    e.preventDefault();
    
    const data = {
        username: document.getElementById('userUsername').value,
        email: document.getElementById('userEmail').value,
        password: document.getElementById('userPassword').value,
        name: document.getElementById('userName').value,
        phone: document.getElementById('userPhone').value,
        membershipLevel: document.getElementById('userMembership').value,
        role: document.getElementById('userRole').value,
        points: parseInt(document.getElementById('userPoints').value),
        depositBalance: parseInt(document.getElementById('userDeposit').value)
    };
    
    try {
        // 먼저 회원가입 API로 생성
        const response = await axios.post(`${API_URL}/auth/signup`, {
            username: data.username,
            email: data.email,
            password: data.password,
            name: data.name,
            phone: data.phone
        });
        
        if (response.data.success) {
            // 생성 후 추가 정보 업데이트 (관리자 권한 필요)
            const userId = response.data.data.user._id;
            
            try {
                await axios.put(`${API_URL}/admin/users/${userId}`, {
                    membershipLevel: data.membershipLevel,
                    role: data.role,
                    points: data.points,
                    depositBalance: data.depositBalance,
                    isEmailVerified: true,
                    isPhoneVerified: true
                });
            } catch (updateError) {
                console.log('추가 정보 업데이트 실패:', updateError);
            }
            
            alert('회원이 추가되었습니다');
            closeModal('addUserModal');
            loadUsers();
        }
    } catch (error) {
        alert(error.response?.data?.message || '회원 추가 실패');
    }
}

function showAddServiceModal() {
    // 서비스 추가 모달 HTML 생성
    const modalHTML = `
        <div class="modal" id="addServiceModal" style="display: block;">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 class="modal-title">새 서비스 추가</h2>
                    <button class="modal-close" onclick="closeModal('addServiceModal')">&times;</button>
                </div>
                <form id="addServiceForm" onsubmit="createService(event)">
                    <div class="form-group">
                        <label>서비스명</label>
                        <input type="text" class="form-control" id="serviceName" required>
                    </div>
                    <div class="form-group">
                        <label>영문명</label>
                        <input type="text" class="form-control" id="serviceNameEn" required>
                    </div>
                    <div class="form-group">
                        <label>플랫폼</label>
                        <select class="form-control" id="servicePlatform" required>
                            <option value="instagram">Instagram</option>
                            <option value="youtube">YouTube</option>
                            <option value="tiktok">TikTok</option>
                            <option value="facebook">Facebook</option>
                            <option value="twitter">Twitter</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>카테고리</label>
                        <select class="form-control" id="serviceCategory" required>
                            <option value="followers">팔로워</option>
                            <option value="likes">좋아요</option>
                            <option value="views">조회수</option>
                            <option value="comments">댓글</option>
                            <option value="subscribers">구독자</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>설명</label>
                        <textarea class="form-control" id="serviceDescription" rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>기본 가격 (1000개당)</label>
                        <input type="number" class="form-control" id="servicePrice" required min="1000">
                    </div>
                    <div class="form-group">
                        <label>최소 수량</label>
                        <input type="number" class="form-control" id="serviceMinQty" value="100" required>
                    </div>
                    <div class="form-group">
                        <label>최대 수량</label>
                        <input type="number" class="form-control" id="serviceMaxQty" value="10000" required>
                    </div>
                    <button type="submit" class="btn btn-primary">서비스 추가</button>
                </form>
            </div>
        </div>
    `;
    
    // 모달 추가
    const existingModal = document.getElementById('addServiceModal');
    if (existingModal) {
        existingModal.remove();
    }
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function showAddCouponModal() {
    document.getElementById('couponModal').style.display = 'block';
}

function checkAllDeposits() {
    alert('전체 예치금 확인');
}

// 전역 함수로 등록
window.showSection = showSection;
window.logout = logout;
window.refreshData = refreshData;
window.viewOrder = viewOrder;
window.updateOrderStatus = updateOrderStatus;
window.editUser = editUser;
window.toggleUserStatus = toggleUserStatus;
window.editService = editService;
window.toggleServiceStatus = toggleServiceStatus;
window.deleteService = deleteService;
window.confirmDeposit = confirmDeposit;
window.rejectDeposit = rejectDeposit;
window.showAddUserModal = showAddUserModal;
window.showAddServiceModal = showAddServiceModal;
window.createService = createService;
window.createUser = createUser;
window.updateUser = updateUser;
window.showAddCouponModal = showAddCouponModal;
window.deleteCoupon = deleteCoupon;
window.checkAllDeposits = checkAllDeposits;
window.closeModal = closeModal;