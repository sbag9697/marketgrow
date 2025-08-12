// 관리자 대시보드 관리자
class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPeriod = '7days';
        this.chart = null;
        this.data = {
            todayRevenue: 0,
            newOrders: 0,
            activeUsers: 0,
            conversionRate: 0,
            recentOrders: []
        };
        this.init();
    }

    async init() {
        // 관리자 권한 체크
        if (!this.checkAdminAuth()) {
            alert('관리자 권한이 필요합니다.');
            window.location.href = 'admin-login.html';
            return;
        }

        // 관리자 정보 표시
        this.displayAdminInfo();

        // 대시보드 데이터 로드
        await this.loadDashboardData();
        
        // 차트 초기화
        this.initChart();
        
        // 실시간 업데이트 설정 (30초마다)
        this.startRealTimeUpdates();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
    }

    // 관리자 권한 체크
    checkAdminAuth() {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const token = localStorage.getItem('authToken');
        
        if (!token || !userInfo.email) {
            return false;
        }
        
        // 관리자 이메일 체크 (config의 관리자 목록 또는 데모 계정)
        const adminEmails = ['admin@marketgrow.com', 'manager@marketgrow.com'];
        return adminEmails.includes(userInfo.email);
    }

    // 관리자 정보 표시
    displayAdminInfo() {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const adminNameEl = document.getElementById('adminName');
        if (adminNameEl) {
            adminNameEl.textContent = userInfo.name || '관리자님';
        }
    }

    // 대시보드 데이터 로드
    async loadDashboardData() {
        try {
            // API에서 데이터 가져오기 (실제 환경)
            if (!API_CONFIG.USE_MOCK) {
                const response = await api.get(API_ENDPOINTS.ADMIN.DASHBOARD);
                if (response.success) {
                    this.data = response.data;
                    this.updateDashboard();
                    return;
                }
            }
            
            // Mock 데이터 사용 (개발/테스트)
            this.loadMockData();
            this.updateDashboard();
            
        } catch (error) {
            console.error('대시보드 데이터 로드 실패:', error);
            this.loadMockData();
            this.updateDashboard();
        }
    }

    // Mock 데이터 로드
    loadMockData() {
        // 오늘 날짜 기준 Mock 데이터 생성
        const today = new Date();
        const orders = [];
        
        // 최근 주문 데이터 생성
        for (let i = 0; i < 10; i++) {
            const orderDate = new Date(today);
            orderDate.setHours(today.getHours() - i * 2);
            
            orders.push({
                id: `ORD_${Date.now()}_${i}`,
                customer: `고객${i + 1}`,
                service: this.getRandomService(),
                amount: Math.floor(Math.random() * 500000) + 50000,
                status: this.getRandomStatus(),
                date: orderDate.toISOString()
            });
        }
        
        this.data = {
            todayRevenue: 3456789,
            newOrders: 24,
            activeUsers: 156,
            conversionRate: 3.8,
            recentOrders: orders,
            chartData: this.generateChartData()
        };
    }

    // 랜덤 서비스 선택
    getRandomService() {
        const services = [
            '인스타그램 팔로워',
            '유튜브 구독자',
            '틱톡 좋아요',
            '페이스북 페이지 좋아요',
            '트위터 팔로워'
        ];
        return services[Math.floor(Math.random() * services.length)];
    }

    // 랜덤 상태 선택
    getRandomStatus() {
        const statuses = ['completed', 'processing', 'pending', 'cancelled'];
        const weights = [0.5, 0.3, 0.15, 0.05];
        const random = Math.random();
        let sum = 0;
        
        for (let i = 0; i < statuses.length; i++) {
            sum += weights[i];
            if (random < sum) return statuses[i];
        }
        return statuses[0];
    }

    // 차트 데이터 생성
    generateChartData() {
        const days = this.currentPeriod === '7days' ? 7 : 
                     this.currentPeriod === '30days' ? 30 : 90;
        
        const labels = [];
        const data = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            labels.push(date.toLocaleDateString('ko-KR', { 
                month: 'short', 
                day: 'numeric' 
            }));
            
            // 랜덤 매출 데이터 (트렌드 있게)
            const baseRevenue = 2000000;
            const trend = (days - i) * 50000;
            const randomVariation = Math.random() * 1000000 - 500000;
            data.push(Math.max(0, baseRevenue + trend + randomVariation));
        }
        
        return { labels, data };
    }

    // 대시보드 UI 업데이트
    updateDashboard() {
        // 통계 카드 업데이트
        document.getElementById('todayRevenue').textContent = 
            `₩${this.data.todayRevenue.toLocaleString()}`;
        document.getElementById('newOrders').textContent = 
            this.data.newOrders.toLocaleString();
        document.getElementById('activeUsers').textContent = 
            this.data.activeUsers.toLocaleString();
        document.getElementById('conversionRate').textContent = 
            `${this.data.conversionRate}%`;
        
        // 주문 테이블 업데이트
        this.updateOrdersTable();
        
        // 차트 업데이트
        if (this.chart && this.data.chartData) {
            this.updateChart(this.data.chartData);
        }
    }

    // 주문 테이블 업데이트
    updateOrdersTable() {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.data.recentOrders.forEach(order => {
            const row = document.createElement('tr');
            const statusClass = this.getStatusClass(order.status);
            const statusText = this.getStatusText(order.status);
            
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${order.customer}</td>
                <td>${order.service}</td>
                <td>₩${order.amount.toLocaleString()}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${new Date(order.date).toLocaleString('ko-KR')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action" onclick="viewOrder('${order.id}')" title="상세보기">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action" onclick="editOrder('${order.id}')" title="수정">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // 상태 클래스 반환
    getStatusClass(status) {
        const classes = {
            'completed': 'completed',
            'processing': 'processing',
            'pending': 'pending',
            'cancelled': 'cancelled'
        };
        return classes[status] || 'pending';
    }

    // 상태 텍스트 반환
    getStatusText(status) {
        const texts = {
            'completed': '완료',
            'processing': '처리중',
            'pending': '대기',
            'cancelled': '취소'
        };
        return texts[status] || '대기';
    }

    // 차트 초기화
    initChart() {
        const canvas = document.getElementById('chartCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '매출',
                    data: [],
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return '매출: ₩' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₩' + (value / 1000000).toFixed(1) + 'M';
                            }
                        }
                    }
                }
            }
        });
        
        // 초기 차트 데이터 설정
        if (this.data.chartData) {
            this.updateChart(this.data.chartData);
        }
    }

    // 차트 업데이트
    updateChart(chartData) {
        if (!this.chart) return;
        
        this.chart.data.labels = chartData.labels;
        this.chart.data.datasets[0].data = chartData.data;
        this.chart.update();
    }

    // 실시간 업데이트 시작
    startRealTimeUpdates() {
        // 30초마다 데이터 갱신
        setInterval(() => {
            this.loadDashboardData();
        }, ADMIN_CONFIG.DASHBOARD.REFRESH_INTERVAL);
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 사이드바 메뉴 클릭
        document.querySelectorAll('.admin-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                this.loadSection(section);
            });
        });
    }

    // 섹션 로드
    loadSection(section) {
        // 활성 메뉴 업데이트
        document.querySelectorAll('.admin-menu a').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`.admin-menu a[href="#${section}"]`).classList.add('active');
        
        // 헤더 업데이트
        const titles = {
            'dashboard': '대시보드',
            'orders': '주문 관리',
            'users': '사용자 관리',
            'services': '서비스 관리',
            'analytics': '분석 & 통계',
            'payments': '결제 관리',
            'marketing': '마케팅 도구',
            'settings': '설정'
        };
        
        document.querySelector('.admin-header h1').textContent = titles[section] || '대시보드';
        
        // 섹션별 콘텐츠 로드
        this.currentSection = section;
        this.loadSectionContent(section);
    }

    // 섹션 콘텐츠 로드
    async loadSectionContent(section) {
        // 각 섹션에 맞는 콘텐츠 로드
        switch(section) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'orders':
                await this.loadOrdersSection();
                break;
            case 'users':
                await this.loadUsersSection();
                break;
            case 'analytics':
                await this.loadAnalyticsSection();
                break;
            // 다른 섹션들...
        }
    }

    // 주문 섹션 로드
    async loadOrdersSection() {
        console.log('주문 관리 섹션 로드');
        // 주문 관리 UI 구현
    }

    // 사용자 섹션 로드
    async loadUsersSection() {
        console.log('사용자 관리 섹션 로드');
        // 사용자 관리 UI 구현
    }

    // 분석 섹션 로드
    async loadAnalyticsSection() {
        console.log('분석 & 통계 섹션 로드');
        // 분석 UI 구현
    }
}

// 전역 함수들
function loadSection(section) {
    if (window.adminDashboard) {
        window.adminDashboard.loadSection(section);
    }
}

function changeChartPeriod(period) {
    // 버튼 활성화 상태 변경
    document.querySelectorAll('.chart-control').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 차트 기간 변경
    if (window.adminDashboard) {
        window.adminDashboard.currentPeriod = period;
        window.adminDashboard.data.chartData = window.adminDashboard.generateChartData();
        window.adminDashboard.updateChart(window.adminDashboard.data.chartData);
    }
}

function viewOrder(orderId) {
    console.log('주문 상세보기:', orderId);
    // 주문 상세 모달 또는 페이지 열기
}

function editOrder(orderId) {
    console.log('주문 수정:', orderId);
    // 주문 수정 모달 또는 페이지 열기
}

function exportData(type) {
    console.log('데이터 내보내기:', type);
    
    // CSV 내보내기 구현
    if (type === 'orders' && window.adminDashboard) {
        const orders = window.adminDashboard.data.recentOrders;
        let csv = '주문ID,고객,서비스,금액,상태,날짜\n';
        
        orders.forEach(order => {
            csv += `${order.id},${order.customer},${order.service},${order.amount},${order.status},${order.date}\n`;
        });
        
        // 다운로드
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    window.location.href = 'admin-login.html';
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});