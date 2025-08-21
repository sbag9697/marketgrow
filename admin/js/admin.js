/**
 * MarketGrow 관리자 대시보드
 */

// API 설정
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5002/api' 
    : 'https://marketgrow-production.up.railway.app/api';

// 전역 변수
let adminToken = localStorage.getItem('adminToken');
let currentSection = 'overview';
let refreshInterval = null;

// Axios 인터셉터 설정
axios.interceptors.request.use(
    config => {
        if (adminToken) {
            config.headers.Authorization = `Bearer ${adminToken}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // 인증 실패 시 로그인 화면으로
            logout();
        }
        return Promise.reject(error);
    }
);

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // URL 해시 기반 네비게이션 처리
    function handleHashChange() {
        const hash = window.location.hash.slice(1); // # 제거
        if (hash && ['orders', 'users', 'services', 'deposits', 'coupons', 'logs', 'settings', 'overview'].includes(hash)) {
            // 로그인되어 있으면 해당 섹션으로 이동
            if (adminToken) {
                showSection(hash);
                // 네비게이션 메뉴 활성화 상태 업데이트
                document.querySelectorAll('.nav-item').forEach(el => {
                    el.classList.remove('active');
                    if (el.getAttribute('href') === `#${hash}`) {
                        el.classList.add('active');
                    }
                });
            }
        }
    }

    // 해시 변경 이벤트 리스너
    window.addEventListener('hashchange', handleHashChange);

    if (adminToken) {
        verifyAdminSession();
        // 초기 해시 처리
        setTimeout(handleHashChange, 100);
    } else {
        showLoginScreen();
    }

    // 폼 이벤트 리스너
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('settingsForm').addEventListener('submit', saveSettings);
    document.getElementById('couponForm').addEventListener('submit', createCoupon);

    // 검색/필터 이벤트
    document.getElementById('orderSearch')?.addEventListener('input', filterOrders);
    document.getElementById('orderFilter')?.addEventListener('change', filterOrders);
    document.getElementById('logFilter')?.addEventListener('change', filterLogs);
});

// ===== 인증 관련 함수 =====

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    try {
        // Enhanced admin routes 사용
        const response = await axios.post(`${API_URL}/admin-enhanced/login`, {
            email,
            password
        });

        if (response.data.success) {
            adminToken = response.data.token;
            localStorage.setItem('adminToken', adminToken);
            localStorage.setItem('adminInfo', JSON.stringify(response.data.admin));
            
            showDashboard();
            showNotification('로그인 성공', 'success');
        }
    } catch (error) {
        // 기존 admin 라우트로 폴백
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                login: email,  // login 필드 사용
                password
            });
            
            if (response.data.success) {
                // 관리자 권한 확인
                const user = response.data.data?.user || response.data.user;
                const token = response.data.data?.token || response.data.token;
                
                if (user && (user.role === 'admin' || user.role === 'superadmin')) {
                    adminToken = token;
                    localStorage.setItem('adminToken', adminToken);
                    localStorage.setItem('adminInfo', JSON.stringify(user));
                    
                    showDashboard();
                    showNotification('로그인 성공', 'success');
                } else {
                    // 일반 사용자도 임시로 허용 (개발 중)
                    adminToken = token;
                    localStorage.setItem('adminToken', adminToken);
                    localStorage.setItem('adminInfo', JSON.stringify(user));
                    
                    showDashboard();
                    showNotification('로그인 성공 (개발 모드)', 'info');
                }
            }
        } catch (fallbackError) {
            showNotification(fallbackError.response?.data?.message || '로그인 실패', 'error');
        }
    }
}

async function verifyAdminSession() {
    try {
        // Enhanced admin API 시도
        let response;
        try {
            response = await axios.get(`${API_URL}/admin-enhanced/verify`);
        } catch (e) {
            // 폴백: 일반 사용자 API로 권한 확인
            response = await axios.get(`${API_URL}/users/me`);
        }
        
        if (response.data.success) {
            showDashboard();
        } else {
            showLoginScreen();
        }
    } catch (error) {
        showLoginScreen();
    }
}

function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    adminToken = null;
    
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    showLoginScreen();
}

// ===== UI 전환 함수 =====

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboardScreen').classList.remove('active');
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').classList.add('active');
    
    // 초기 데이터 로드
    loadDashboardData();
    
    // 30초마다 자동 새로고침
    refreshInterval = setInterval(() => {
        if (currentSection === 'overview') {
            loadDashboardData();
        }
    }, 30000);
}

function showSection(section) {
    console.log('showSection called with:', section);
    currentSection = section;
    
    // 모든 섹션 숨기기
    const allSections = document.querySelectorAll('.section');
    console.log('Found sections:', allSections.length);
    allSections.forEach(el => {
        el.style.display = 'none';
    });
    
    // 선택된 섹션 표시
    const sectionElement = document.getElementById(section);
    console.log('Section element:', sectionElement);
    if (sectionElement) {
        sectionElement.style.display = 'block';
        console.log(`Section ${section} displayed`);
    } else {
        console.error(`Section ${section} not found!`);
    }
    
    // 네비게이션 활성화 상태 업데이트
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('href') === `#${section}`) {
            el.classList.add('active');
        }
    });
    
    // 클릭 이벤트가 있는 경우에만 처리
    if (typeof event !== 'undefined' && event && event.target && event.target.classList) {
        event.target.classList.add('active');
    }
    
    // 섹션 제목 업데이트
    const titles = {
        overview: '대시보드',
        orders: '주문 관리',
        users: '회원 관리',
        services: '서비스 관리',
        deposits: '예치금 관리',
        coupons: '쿠폰 관리',
        logs: '활동 로그',
        settings: '설정'
    };
    const titleElement = document.getElementById('sectionTitle');
    if (titleElement) {
        titleElement.textContent = titles[section] || '대시보드';
    } else {
        console.error('sectionTitle element not found');
    }
    
    // 섹션별 데이터 로드
    console.log('Loading data for section:', section);
    loadSectionData(section);
}

// ===== 데이터 로드 함수 =====

async function loadDashboardData() {
    try {
        // 통계 데이터 로드 - 실제 API 경로 사용
        const [stats, recentOrders] = await Promise.all([
            axios.get(`${API_URL}/admin-enhanced/stats`).catch(() => 
                axios.get(`${API_URL}/admin/dashboard`)
            ),
            axios.get(`${API_URL}/admin-enhanced/orders?limit=10`).catch(() => 
                axios.get(`${API_URL}/orders?limit=10`)
            )
        ]);

        // 통계 카드 업데이트
        if (stats.data) {
            const data = stats.data.success ? stats.data.data : stats.data;
            
            // 대시보드 통계가 있는 경우
            if (data.statistics || data.stats) {
                const statsData = data.statistics || data.stats || data;
                document.getElementById('totalRevenue').textContent = 
                    `${(statsData.totalRevenue || statsData.totalSales || 0).toLocaleString()}원`;
                document.getElementById('newOrders').textContent = 
                    statsData.newOrders || statsData.todayOrders || statsData.recentOrders || 0;
                document.getElementById('activeUsers').textContent = 
                    statsData.activeUsers || statsData.totalUsers || 0;
                document.getElementById('pendingOrders').textContent = 
                    statsData.pendingOrders || statsData.processingOrders || 0;
            } else {
                // 직접 데이터가 있는 경우
                document.getElementById('totalRevenue').textContent = 
                    `${(data.totalRevenue || 0).toLocaleString()}원`;
                document.getElementById('newOrders').textContent = data.newOrders || 0;
                document.getElementById('activeUsers').textContent = data.activeUsers || 0;
                document.getElementById('pendingOrders').textContent = data.pendingOrders || 0;
            }
        }

        // 최근 주문 테이블 업데이트
        if (recentOrders.data) {
            let orders = [];
            if (recentOrders.data.success) {
                orders = recentOrders.data.data?.orders || recentOrders.data.data || [];
            } else if (Array.isArray(recentOrders.data)) {
                orders = recentOrders.data;
            } else if (recentOrders.data.orders) {
                orders = recentOrders.data.orders;
            }
            updateRecentOrdersTable(orders);
        }
    } catch (error) {
        console.error('Dashboard data load error:', error);
    }
}

async function loadSectionData(section) {
    console.log(`loadSectionData called for: ${section}`);
    try {
        switch (section) {
            case 'overview':
                console.log('Loading overview/dashboard data...');
                await loadDashboardData();
                break;
            case 'orders':
                console.log('Loading orders...');
                await loadOrders();
                break;
            case 'users':
                console.log('Loading users...');
                await loadUsers();
                break;
            case 'services':
                console.log('Loading services...');
                await loadServices();
                break;
            case 'deposits':
                console.log('Loading deposits...');
                await loadDeposits();
                break;
            case 'coupons':
                console.log('Loading coupons...');
                await loadCoupons();
                break;
            case 'logs':
                console.log('Loading logs...');
                await loadLogs();
                break;
            case 'settings':
                console.log('Loading settings...');
                await loadSettings();
                break;
            default:
                console.log(`Unknown section: ${section}`);
        }
    } catch (error) {
        console.error(`Error loading ${section}:`, error);
        showNotification(`데이터 로드 실패: ${error.message}`, 'error');
    }
}

// ===== 주문 관리 =====

async function loadOrders() {
    console.log('loadOrders function started');
    try {
        let response;
        try {
            console.log('Trying admin-enhanced/orders endpoint...');
            response = await axios.get(`${API_URL}/admin-enhanced/orders`);
        } catch (e) {
            console.log('Failed, trying regular orders endpoint...');
            response = await axios.get(`${API_URL}/orders`);
        }
        
        console.log('Orders response:', response.data);
        
        if (response.data.success || response.data) {
            const orders = response.data.data?.orders || response.data.orders || response.data;
            console.log('Orders found:', orders);
            
            const tbody = document.querySelector('#ordersTable tbody');
            if (!tbody) {
                console.error('ordersTable tbody not found!');
                return;
            }
            
            tbody.innerHTML = '';
            
            if (!Array.isArray(orders) || orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">주문이 없습니다</td></tr>';
                return;
            }
            
            orders.forEach(order => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${order.orderNumber || order._id.slice(-8)}</td>
                    <td>${order.user?.name || order.user?.email || '-'}</td>
                    <td>${order.service?.name || '-'}</td>
                    <td>${order.quantity || 0}</td>
                    <td>${(order.totalAmount || 0).toLocaleString()}원</td>
                    <td>${getStatusBadge(order.status)}</td>
                    <td>${order.paymentMethod || '-'}</td>
                    <td>${formatDate(order.createdAt)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-icon btn-primary" onclick="viewOrderDetail('${order._id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-icon btn-warning" onclick="editOrder('${order._id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${order.status === 'pending' ? `
                                <button class="btn btn-sm btn-icon btn-success" onclick="processOrder('${order._id}')">
                                    <i class="fas fa-check"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Orders load error:', error);
    }
}

async function viewOrderDetail(orderId) {
    try {
        const response = await axios.get(`${API_URL}/admin/orders/${orderId}`);
        
        if (response.data.success) {
            const order = response.data.data;
            const content = document.getElementById('orderDetailContent');
            
            content.innerHTML = `
                <div class="order-detail">
                    <h3>주문 정보</h3>
                    <p><strong>주문번호:</strong> ${order.orderNumber || order._id}</p>
                    <p><strong>고객:</strong> ${order.user?.name} (${order.user?.email})</p>
                    <p><strong>서비스:</strong> ${order.service?.name}</p>
                    <p><strong>수량:</strong> ${order.quantity}</p>
                    <p><strong>금액:</strong> ${order.totalAmount.toLocaleString()}원</p>
                    <p><strong>상태:</strong> ${getStatusBadge(order.status)}</p>
                    <p><strong>주문일시:</strong> ${formatDate(order.createdAt)}</p>
                    
                    ${order.targetUrl ? `<p><strong>타겟 URL:</strong> ${order.targetUrl}</p>` : ''}
                    
                    <h3>처리 액션</h3>
                    <div class="action-buttons">
                        ${order.status === 'pending' ? `
                            <button class="btn btn-success" onclick="confirmOrder('${order._id}')">
                                <i class="fas fa-check"></i> 승인
                            </button>
                        ` : ''}
                        ${order.status !== 'cancelled' && order.status !== 'refunded' ? `
                            <button class="btn btn-danger" onclick="cancelOrder('${order._id}')">
                                <i class="fas fa-times"></i> 취소
                            </button>
                            <button class="btn btn-warning" onclick="refundOrder('${order._id}')">
                                <i class="fas fa-undo"></i> 환불
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
            
            showModal('orderDetailModal');
        }
    } catch (error) {
        showNotification('주문 상세 조회 실패', 'error');
    }
}

async function processOrder(orderId) {
    if (!confirm('이 주문을 처리하시겠습니까?')) return;
    
    try {
        const response = await axios.post(`${API_URL}/admin/orders/${orderId}/process`);
        
        if (response.data.success) {
            showNotification('주문이 처리되었습니다', 'success');
            loadOrders();
        }
    } catch (error) {
        showNotification('주문 처리 실패', 'error');
    }
}

async function cancelOrder(orderId) {
    const reason = prompt('취소 사유를 입력하세요:');
    if (!reason) return;
    
    try {
        const response = await axios.post(`${API_URL}/admin/orders/${orderId}/cancel`, {
            reason
        });
        
        if (response.data.success) {
            showNotification('주문이 취소되었습니다', 'success');
            loadOrders();
            closeModal('orderDetailModal');
        }
    } catch (error) {
        showNotification('주문 취소 실패', 'error');
    }
}

async function refundOrder(orderId) {
    const reason = prompt('환불 사유를 입력하세요:');
    if (!reason) return;
    
    try {
        const response = await axios.post(`${API_URL}/admin/orders/${orderId}/refund`, {
            reason
        });
        
        if (response.data.success) {
            showNotification('환불이 처리되었습니다', 'success');
            loadOrders();
            closeModal('orderDetailModal');
        }
    } catch (error) {
        showNotification('환불 처리 실패', 'error');
    }
}

// ===== 회원 관리 =====

async function loadUsers() {
    try {
        let response;
        try {
            response = await axios.get(`${API_URL}/admin-enhanced/users`);
        } catch (e) {
            response = await axios.get(`${API_URL}/admin/users`);
        }
        
        if (response.data.success) {
            const users = response.data.data.users;
            const tbody = document.querySelector('#usersTable tbody');
            tbody.innerHTML = '';
            
            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user._id.slice(-8)}</td>
                    <td>${user.name || '-'}</td>
                    <td>${user.email}</td>
                    <td>${getMembershipBadge(user.membershipLevel)}</td>
                    <td>${(user.points || 0).toLocaleString()}</td>
                    <td>${(user.depositBalance || 0).toLocaleString()}원</td>
                    <td>${formatDate(user.createdAt)}</td>
                    <td>${user.isActive ? 
                        '<span class="badge badge-success">활성</span>' : 
                        '<span class="badge badge-danger">비활성</span>'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-icon btn-primary" onclick="viewUserDetail('${user._id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-icon btn-warning" onclick="editUser('${user._id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-icon ${user.isActive ? 'btn-danger' : 'btn-success'}" 
                                    onclick="toggleUserStatus('${user._id}', ${!user.isActive})">
                                <i class="fas fa-${user.isActive ? 'ban' : 'check'}"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Users load error:', error);
    }
}

async function toggleUserStatus(userId, activate) {
    const action = activate ? '활성화' : '비활성화';
    if (!confirm(`이 사용자를 ${action}하시겠습니까?`)) return;
    
    try {
        const response = await axios.patch(`${API_URL}/admin/users/${userId}/status`, {
            isActive: activate
        });
        
        if (response.data.success) {
            showNotification(`사용자가 ${action}되었습니다`, 'success');
            loadUsers();
        }
    } catch (error) {
        showNotification(`사용자 ${action} 실패`, 'error');
    }
}

async function viewUserDetail(userId) {
    showNotification('사용자 상세 보기 기능 준비 중', 'info');
}

async function editUser(userId) {
    showNotification('사용자 편집 기능 준비 중', 'info');
}

async function editOrder(orderId) {
    showNotification('주문 편집 기능 준비 중', 'info');
}

async function confirmOrder(orderId) {
    if (!confirm('이 주문을 승인하시겠습니까?')) return;
    showNotification('주문 승인 기능 준비 중', 'info');
}

// ===== 서비스 관리 =====

async function loadServices() {
    try {
        const response = await axios.get(`${API_URL}/services`);
        
        if (response.data.success) {
            const services = response.data.data;
            const tbody = document.querySelector('#servicesTable tbody');
            tbody.innerHTML = '';
            
            services.forEach(service => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${service.serviceId}</td>
                    <td>${service.category}</td>
                    <td>${service.name}</td>
                    <td>${service.price.toLocaleString()}원</td>
                    <td>${service.min}</td>
                    <td>${service.max}</td>
                    <td>${service.isActive ? 
                        '<span class="badge badge-success">활성</span>' : 
                        '<span class="badge badge-danger">비활성</span>'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-icon btn-warning" onclick="editService('${service._id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-icon ${service.isActive ? 'btn-danger' : 'btn-success'}" 
                                    onclick="toggleServiceStatus('${service._id}', ${!service.isActive})">
                                <i class="fas fa-${service.isActive ? 'ban' : 'check'}"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Services load error:', error);
    }
}

async function editService(serviceId) {
    showNotification('서비스 편집 기능 준비 중', 'info');
}

async function toggleServiceStatus(serviceId, activate) {
    const action = activate ? '활성화' : '비활성화';
    if (!confirm(`이 서비스를 ${action}하시겠습니까?`)) return;
    
    try {
        const response = await axios.patch(`${API_URL}/admin/services/${serviceId}/status`, {
            isActive: activate
        });
        
        if (response.data.success) {
            showNotification(`서비스가 ${action}되었습니다`, 'success');
            loadServices();
        }
    } catch (error) {
        showNotification(`서비스 ${action} 실패`, 'error');
    }
}

function showAddServiceModal() {
    showModal('serviceModal');
}

function showAddUserModal() {
    showModal('userEditModal');
}

// ===== 예치금 관리 =====

async function loadDeposits() {
    try {
        let response;
        try {
            response = await axios.get(`${API_URL}/deposits/admin/pending`);
        } catch (e) {
            // 폴백: 전체 예치금 목록에서 pending만 필터
            const allDeposits = await axios.get(`${API_URL}/deposits?status=pending`);
            response = allDeposits;
        }
        
        if (response.data.success) {
            const deposits = response.data.data;
            const tbody = document.querySelector('#depositsTable tbody');
            tbody.innerHTML = '';
            
            deposits.forEach(deposit => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${deposit.id.slice(-8)}</td>
                    <td>${deposit.user.name} (${deposit.user.email})</td>
                    <td>${deposit.amount.toLocaleString()}원</td>
                    <td>${deposit.bonusAmount.toLocaleString()}원</td>
                    <td>${deposit.depositorName}</td>
                    <td><span class="badge badge-warning">대기중</span></td>
                    <td>${formatDate(deposit.requestedAt)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-success" onclick="confirmDeposit('${deposit.id}')">
                                <i class="fas fa-check"></i> 확인
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="cancelDeposit('${deposit.id}')">
                                <i class="fas fa-times"></i> 취소
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            if (deposits.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">대기 중인 입금이 없습니다</td></tr>';
            }
        }
    } catch (error) {
        console.error('Deposits load error:', error);
    }
}

async function confirmDeposit(depositId) {
    if (!confirm('이 입금을 확인하시겠습니까?')) return;
    
    try {
        const response = await axios.post(`${API_URL}/deposits/admin/${depositId}/confirm`);
        
        if (response.data.success) {
            showNotification('입금이 확인되었습니다', 'success');
            loadDeposits();
        }
    } catch (error) {
        showNotification('입금 확인 실패', 'error');
    }
}

async function cancelDeposit(depositId) {
    const reason = prompt('취소 사유를 입력하세요:');
    if (!reason) return;
    
    try {
        const response = await axios.post(`${API_URL}/deposits/admin/${depositId}/cancel`, {
            reason
        });
        
        if (response.data.success) {
            showNotification('입금 요청이 취소되었습니다', 'success');
            loadDeposits();
        }
    } catch (error) {
        showNotification('입금 취소 실패', 'error');
    }
}

async function checkAllDeposits() {
    try {
        const response = await axios.post(`${API_URL}/deposits/auto-confirm/all`);
        
        if (response.data.success) {
            showNotification(response.data.message, 'success');
            loadDeposits();
        }
    } catch (error) {
        showNotification('자동 확인 실패', 'error');
    }
}

// ===== 쿠폰 관리 =====

async function loadCoupons() {
    try {
        let response;
        try {
            response = await axios.get(`${API_URL}/admin-enhanced/coupons`);
        } catch (e) {
            // 쿠폰이 없으면 빈 배열 반환
            response = { data: { success: true, data: [] } };
        }
        
        if (response.data.success) {
            const coupons = response.data.data;
            const tbody = document.querySelector('#couponsTable tbody');
            tbody.innerHTML = '';
            
            coupons.forEach(coupon => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><code>${coupon.code}</code></td>
                    <td>${coupon.description}</td>
                    <td>${coupon.type === 'percentage' ? 
                        `${coupon.value}%` : 
                        `${coupon.value.toLocaleString()}원`}</td>
                    <td>${coupon.type === 'percentage' ? '퍼센트' : '정액'}</td>
                    <td>${coupon.usedCount}/${coupon.maxUses || '∞'}</td>
                    <td>${formatDate(coupon.expiresAt)}</td>
                    <td>${coupon.isActive ? 
                        '<span class="badge badge-success">활성</span>' : 
                        '<span class="badge badge-danger">만료</span>'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-icon btn-warning" onclick="editCoupon('${coupon._id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-icon btn-danger" onclick="deleteCoupon('${coupon._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Coupons load error:', error);
    }
}

async function createCoupon(e) {
    e.preventDefault();
    
    const data = {
        code: document.getElementById('couponCode').value,
        description: document.getElementById('couponDescription').value,
        type: document.getElementById('couponType').value,
        value: parseInt(document.getElementById('couponValue').value),
        maxUses: parseInt(document.getElementById('couponMaxUses').value),
        expiresAt: new Date(document.getElementById('couponExpiry').value)
    };
    
    try {
        const response = await axios.post(`${API_URL}/admin/coupons`, data);
        
        if (response.data.success) {
            showNotification('쿠폰이 생성되었습니다', 'success');
            closeModal('couponModal');
            loadCoupons();
            e.target.reset();
        }
    } catch (error) {
        showNotification(error.response?.data?.message || '쿠폰 생성 실패', 'error');
    }
}

function showAddCouponModal() {
    showModal('couponModal');
}

async function editCoupon(couponId) {
    showNotification('쿠폰 편집 기능 준비 중', 'info');
}

async function deleteCoupon(couponId) {
    if (!confirm('이 쿠폰을 삭제하시겠습니까?')) return;
    
    try {
        const response = await axios.delete(`${API_URL}/admin/coupons/${couponId}`);
        
        if (response.data.success) {
            showNotification('쿠폰이 삭제되었습니다', 'success');
            loadCoupons();
        }
    } catch (error) {
        showNotification('쿠폰 삭제 실패', 'error');
    }
}

// ===== 로그 조회 =====

async function loadLogs() {
    try {
        const filter = document.getElementById('logFilter').value;
        const url = filter ? 
            `${API_URL}/admin/logs?category=${filter}` : 
            `${API_URL}/admin/logs`;
            
        const response = await axios.get(url);
        
        if (response.data.success) {
            const logs = response.data.data;
            const tbody = document.querySelector('#logsTable tbody');
            tbody.innerHTML = '';
            
            logs.forEach(log => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${formatDate(log.timestamp)}</td>
                    <td>${getLogLevelBadge(log.level)}</td>
                    <td>${log.category}</td>
                    <td>${log.user || '-'}</td>
                    <td>${log.action}</td>
                    <td>${log.message}</td>
                    <td>${log.ip || '-'}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Logs load error:', error);
    }
}

function filterLogs() {
    loadLogs();
}

// ===== 설정 관리 =====

async function loadSettings() {
    try {
        const response = await axios.get(`${API_URL}/admin/settings`);
        
        if (response.data.success) {
            const settings = response.data.data;
            
            document.getElementById('siteName').value = settings.siteName || 'MarketGrow';
            document.getElementById('adminEmailSetting').value = settings.adminEmail || '';
            document.getElementById('autoDepositConfirm').value = settings.autoDepositConfirm || 'false';
            document.getElementById('pointRate').value = settings.pointRate || 1;
            document.getElementById('minOrderAmount').value = settings.minOrderAmount || 1000;
        }
    } catch (error) {
        console.error('Settings load error:', error);
    }
}

async function saveSettings(e) {
    e.preventDefault();
    
    const settings = {
        siteName: document.getElementById('siteName').value,
        adminEmail: document.getElementById('adminEmailSetting').value,
        autoDepositConfirm: document.getElementById('autoDepositConfirm').value === 'true',
        pointRate: parseFloat(document.getElementById('pointRate').value),
        minOrderAmount: parseInt(document.getElementById('minOrderAmount').value)
    };
    
    try {
        const response = await axios.put(`${API_URL}/admin/settings`, settings);
        
        if (response.data.success) {
            showNotification('설정이 저장되었습니다', 'success');
        }
    } catch (error) {
        showNotification('설정 저장 실패', 'error');
    }
}

// ===== 유틸리티 함수 =====

function updateRecentOrdersTable(orders) {
    const tbody = document.querySelector('#recentOrdersTable tbody');
    tbody.innerHTML = '';
    
    orders.forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${order.orderNumber || order._id.slice(-8)}</td>
            <td>${order.user?.name || order.user?.email || '-'}</td>
            <td>${order.service?.name || '-'}</td>
            <td>${(order.totalAmount || 0).toLocaleString()}원</td>
            <td>${getStatusBadge(order.status)}</td>
            <td>${formatDate(order.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewOrderDetail('${order._id}')">
                    상세
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getStatusBadge(status) {
    const badges = {
        pending: '<span class="badge badge-warning">대기중</span>',
        processing: '<span class="badge badge-info">처리중</span>',
        completed: '<span class="badge badge-success">완료</span>',
        failed: '<span class="badge badge-danger">실패</span>',
        cancelled: '<span class="badge badge-danger">취소</span>',
        refunded: '<span class="badge badge-warning">환불</span>'
    };
    return badges[status] || status;
}

function getMembershipBadge(level) {
    const badges = {
        bronze: '<span class="badge" style="background: #cd7f32; color: white;">Bronze</span>',
        silver: '<span class="badge" style="background: #c0c0c0; color: black;">Silver</span>',
        gold: '<span class="badge" style="background: #ffd700; color: black;">Gold</span>',
        platinum: '<span class="badge" style="background: #e5e4e2; color: black;">Platinum</span>'
    };
    return badges[level] || '<span class="badge badge-info">Basic</span>';
}

function getLogLevelBadge(level) {
    const badges = {
        info: '<span class="badge badge-info">INFO</span>',
        warning: '<span class="badge badge-warning">WARN</span>',
        error: '<span class="badge badge-danger">ERROR</span>',
        debug: '<span class="badge" style="background: #6c757d; color: white;">DEBUG</span>'
    };
    return badges[level] || level;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                          type === 'error' ? 'exclamation-circle' : 
                          'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // 스타일 추가
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#48bb78' : 
                      type === 'error' ? '#f56565' : '#4299e1'};
        color: white;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // 3초 후 제거
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function refreshData() {
    loadSectionData(currentSection);
    showNotification('데이터를 새로고침했습니다', 'success');
}

// 검색/필터 함수
function filterOrders() {
    const search = document.getElementById('orderSearch').value.toLowerCase();
    const filter = document.getElementById('orderFilter').value;
    
    const rows = document.querySelectorAll('#ordersTable tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const status = row.querySelector('.badge')?.textContent.toLowerCase();
        
        const matchesSearch = !search || text.includes(search);
        const matchesFilter = !filter || status?.includes(filter);
        
        row.style.display = matchesSearch && matchesFilter ? '' : 'none';
    });
}

// 전역 함수 등록
window.showSection = showSection;
window.logout = logout;
window.refreshData = refreshData;
window.viewOrderDetail = viewOrderDetail;
window.processOrder = processOrder;
window.cancelOrder = cancelOrder;
window.refundOrder = refundOrder;
window.confirmOrder = confirmOrder;
window.editOrder = editOrder;
window.confirmDeposit = confirmDeposit;
window.cancelDeposit = cancelDeposit;
window.checkAllDeposits = checkAllDeposits;
window.toggleUserStatus = toggleUserStatus;
window.viewUserDetail = viewUserDetail;
window.editUser = editUser;
window.showAddUserModal = showAddUserModal;
window.toggleServiceStatus = toggleServiceStatus;
window.editService = editService;
window.showAddServiceModal = showAddServiceModal;
window.showAddCouponModal = showAddCouponModal;
window.editCoupon = editCoupon;
window.deleteCoupon = deleteCoupon;
window.closeModal = closeModal;
window.showModal = showModal;
window.filterOrders = filterOrders;
window.filterLogs = filterLogs;
window.loadSectionData = loadSectionData;