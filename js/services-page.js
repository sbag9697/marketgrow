// 서비스 목록 페이지 기능
const API_URL = 'https://marketgrow-production-c586.up.railway.app/api';

// 서비스 목록 로드
async function loadServices() {
    try {
        const response = await fetch(`${API_URL}/services`);
        const data = await response.json();
        
        if (data.success && data.data) {
            displayServices(data.data);
            setupFilters(data.data);
        } else {
            console.error('서비스 로드 실패:', data.message);
            displayStaticServices(); // 실패 시 정적 서비스 표시
        }
    } catch (error) {
        console.error('서비스 로드 오류:', error);
        displayStaticServices(); // 오류 시 정적 서비스 표시
    }
}

// 서비스 표시
function displayServices(services) {
    const container = document.getElementById('servicesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    services.forEach(service => {
        const card = createServiceCard(service);
        container.appendChild(card);
    });
}

// 서비스 카드 생성
function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.dataset.category = service.platform || 'other';
    
    // 플랫폼 아이콘 매핑
    const iconMap = {
        instagram: 'fab fa-instagram',
        youtube: 'fab fa-youtube',
        facebook: 'fab fa-facebook',
        twitter: 'fab fa-twitter',
        tiktok: 'fab fa-tiktok',
        default: 'fas fa-share-alt'
    };
    
    const icon = iconMap[service.platform] || iconMap.default;
    
    card.innerHTML = `
        <div class="service-icon">
            <i class="${icon}"></i>
        </div>
        <h3>${service.name}</h3>
        <p>${service.description}</p>
        <div class="service-features">
            ${service.features ? service.features.map(f => `<span class="feature">✓ ${f}</span>`).join('') : ''}
        </div>
        <div class="price-range">₩${service.price.toLocaleString()}/${service.unit || '1000개'}</div>
        <button class="order-btn" onclick="orderService('${service._id}')">주문하기</button>
    `;
    
    return card;
}

// 정적 서비스 표시 (백업)
function displayStaticServices() {
    console.log('정적 서비스 표시 모드');
    // 기존 HTML 서비스 카드 유지
}

// 필터 설정
function setupFilters(services) {
    const platforms = [...new Set(services.map(s => s.platform))];
    const filterContainer = document.querySelector('.filter-buttons');
    
    if (!filterContainer) return;
    
    // 전체 버튼
    const allBtn = filterContainer.querySelector('[data-filter="all"]');
    if (allBtn) {
        allBtn.addEventListener('click', () => filterServices('all'));
    }
    
    // 플랫폼별 필터
    platforms.forEach(platform => {
        const btn = filterContainer.querySelector(`[data-filter="${platform}"]`);
        if (btn) {
            btn.addEventListener('click', () => filterServices(platform));
        }
    });
}

// 서비스 필터링
function filterServices(category) {
    const cards = document.querySelectorAll('.service-card');
    const buttons = document.querySelectorAll('.filter-btn');
    
    // 버튼 활성화 상태 업데이트
    buttons.forEach(btn => {
        if (btn.dataset.filter === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 카드 표시/숨김
    cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// 서비스 주문
function orderService(serviceId) {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/login.html';
        return;
    }
    
    // 주문 페이지로 이동하면서 서비스 ID 전달
    localStorage.setItem('selectedServiceId', serviceId);
    window.location.href = '/order.html';
}

// 주문 모달 (기존 함수 호환)
function openOrderModal(serviceType) {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/login.html';
        return;
    }
    
    // 서비스 타입을 저장하고 주문 페이지로 이동
    localStorage.setItem('selectedServiceType', serviceType);
    window.location.href = '/order.html';
}

// 검색 기능
function searchServices() {
    const searchInput = document.getElementById('serviceSearch');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll('.service-card');
    
    cards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    // 서비스 로드
    loadServices();
    
    // 검색 입력 이벤트
    const searchInput = document.getElementById('serviceSearch');
    if (searchInput) {
        searchInput.addEventListener('input', searchServices);
    }
    
    // 필터 버튼 이벤트 (정적 HTML용)
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            filterServices(filter);
        });
    });
});

// 전역 함수로 노출
window.orderService = orderService;
window.openOrderModal = openOrderModal;
window.filterServices = filterServices;