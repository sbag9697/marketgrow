// 서비스 페이지 JavaScript

// Mock 서비스 데이터
function getMockServices() {
    return [
        {
            _id: '1',
            name: '인스타그램 팔로워 늘리기',
            platform: 'instagram',
            category: 'followers',
            description: '고품질 인스타그램 팔로워를 빠르고 안전하게 늘려드립니다',
            features: ['실제 활성 사용자', '드롭 방지 보장', '24시간 고객지원'],
            pricing: [{ quantity: 1000, price: 13500 }],
            deliveryTime: { min: 1, max: 24, unit: 'hours' },
            isPopular: true
        },
        {
            _id: '2',
            name: '인스타그램 좋아요 늘리기',
            platform: 'instagram',
            category: 'likes',
            description: '게시물의 참여도를 높여 알고리즘 노출을 극대화하세요',
            features: ['즉시 시작', '자연스러운 증가', '안전한 배송'],
            pricing: [{ quantity: 1000, price: 450 }],
            deliveryTime: { min: 1, max: 6, unit: 'hours' },
            isPopular: true
        },
        {
            _id: '3',
            name: '유튜브 구독자 늘리기',
            platform: 'youtube',
            category: 'subscribers',
            description: '실제 활성 계정으로 유튜브 구독자를 늘려드립니다',
            features: ['실제 활성 계정', '점진적 안전 증가', '높은 유지율'],
            pricing: [{ quantity: 1000, price: 10800 }],
            deliveryTime: { min: 12, max: 48, unit: 'hours' },
            isPopular: true
        },
        {
            _id: '4',
            name: '유튜브 조회수 늘리기',
            platform: 'youtube',
            category: 'views',
            description: '영상의 초기 조회수를 확보하여 알고리즘 노출을 활성화하세요',
            features: ['실제 시청자', '시청시간 최적화', '지역별 타겟팅'],
            pricing: [{ quantity: 1000, price: 7200 }],
            deliveryTime: { min: 1, max: 24, unit: 'hours' },
            isPopular: false
        },
        {
            _id: '5',
            name: '틱톡 팔로워 늘리기',
            platform: 'tiktok',
            category: 'followers',
            description: '전 세계 젊은 사용자층에게 어필하세요',
            features: ['Z세대 타겟', '활성 계정', '빠른 성장'],
            pricing: [{ quantity: 1000, price: 5400 }],
            deliveryTime: { min: 1, max: 12, unit: 'hours' },
            isPopular: true
        },
        {
            _id: '6',
            name: '틱톡 조회수 늘리기',
            platform: 'tiktok',
            category: 'views',
            description: '영상의 바이럴 가능성을 높이고 FYP 진입을 도와드립니다',
            features: ['알고리즘 최적화', '자연스러운 증가', '지역별 조정'],
            pricing: [{ quantity: 1000, price: 72 }],
            deliveryTime: { min: 1, max: 6, unit: 'hours' },
            isPopular: false
        },
        {
            _id: '7',
            name: '페이스북 페이지 좋아요',
            platform: 'facebook',
            category: 'likes',
            description: '페이스북 페이지의 신뢰도와 도달범위를 늘려드립니다',
            features: ['실제 사용자', '타겟팅 가능', '안정적 증가'],
            pricing: [{ quantity: 1000, price: 7200 }],
            deliveryTime: { min: 12, max: 48, unit: 'hours' },
            isPopular: false
        },
        {
            _id: '8',
            name: '트위터 팔로워 늘리기',
            platform: 'twitter',
            category: 'followers',
            description: '트위터 영향력을 확대하고 메시지 도달범위를 늘리세요',
            features: ['활성 계정', '관심사 타겟팅', '점진적 증가'],
            pricing: [{ quantity: 1000, price: 7200 }],
            deliveryTime: { min: 6, max: 24, unit: 'hours' },
            isPopular: false
        }
    ];
}

document.addEventListener('DOMContentLoaded', async () => {
    // 서비스 목록 로드
    await loadServices();

    // 필터 초기화
    initFilters();

    // 검색 기능 초기화
    initSearch();
});

// 서비스 목록 로드
async function loadServices() {
    const servicesGrid = document.getElementById('servicesGrid');
    if (!servicesGrid) return;

    // 로딩 상태 표시
    servicesGrid.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>서비스를 불러오는 중...</p>
        </div>
    `;

    // Mock 데이터 사용 (백엔드 없이 동작)
    setTimeout(() => {
        console.log('Mock 데이터를 사용합니다.');
        const mockServices = getMockServices();
        displayServices(mockServices);
    }, 500); // 약간의 지연으로 로딩 효과
}

// 서비스 목록 표시
function displayServices(services) {
    const servicesGrid = document.getElementById('servicesGrid');

    servicesGrid.innerHTML = services.map(service => `
        <div class="service-card ${service.isPopular ? 'popular' : ''}" data-platform="${service.platform}" data-category="${service.category}">
            ${service.isPopular ? '<div class="popular-badge">인기</div>' : ''}
            <div class="service-header">
                <i class="fab fa-${service.platform}"></i>
                <h3>${service.name}</h3>
            </div>
            <div class="service-body">
                <p class="service-description">${service.description}</p>
                <div class="service-features">
                    ${service.features.map(feature => `
                        <span class="feature-tag">
                            <i class="fas fa-check"></i> ${feature}
                        </span>
                    `).join('')}
                </div>
                <div class="service-pricing">
                    <div class="price-info">
                        <span class="price-label">가격</span>
                        <span class="price-value">₩${service.pricing[0].price.toLocaleString()}</span>
                        <span class="price-unit">/ ${service.pricing[0].quantity}개</span>
                    </div>
                    <div class="delivery-info">
                        <i class="fas fa-clock"></i>
                        <span>${service.deliveryTime.min}-${service.deliveryTime.max} ${getTimeUnit(service.deliveryTime.unit)}</span>
                    </div>
                </div>
            </div>
            <div class="service-footer">
                <button class="order-btn" onclick="orderService('${service._id}')">
                    <i class="fas fa-shopping-cart"></i> 주문하기
                </button>
                <button class="detail-btn" onclick="viewServiceDetail('${service._id}')">
                    상세보기
                </button>
            </div>
        </div>
    `).join('');
}

// 필터 초기화
function initFilters() {
    // 플랫폼 필터
    const platformFilter = document.getElementById('platformFilter');
    if (platformFilter) {
        platformFilter.addEventListener('change', applyFilters);
    }

    // 카테고리 필터
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }

    // 정렬 필터
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', applyFilters);
    }
}

// 필터 적용
function applyFilters() {
    const platform = document.getElementById('platformFilter')?.value || 'all';
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const sort = document.getElementById('sortFilter')?.value || 'default';

    const cards = document.querySelectorAll('.service-card');

    cards.forEach(card => {
        const cardPlatform = card.dataset.platform;
        const cardCategory = card.dataset.category;

        const platformMatch = platform === 'all' || cardPlatform === platform;
        const categoryMatch = category === 'all' || cardCategory === category;

        if (platformMatch && categoryMatch) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });

    // 정렬 적용
    if (sort !== 'default') {
        sortServices(sort);
    }
}

// 서비스 정렬
function sortServices(sortType) {
    const grid = document.getElementById('servicesGrid');
    const cards = Array.from(grid.children);

    cards.sort((a, b) => {
        switch (sortType) {
            case 'price-low':
                return getPriceFromCard(a) - getPriceFromCard(b);
            case 'price-high':
                return getPriceFromCard(b) - getPriceFromCard(a);
            case 'popular':
                return (b.classList.contains('popular') ? 1 : 0) - (a.classList.contains('popular') ? 1 : 0);
            default:
                return 0;
        }
    });

    // 정렬된 순서로 다시 추가
    cards.forEach(card => grid.appendChild(card));
}

// 카드에서 가격 추출
function getPriceFromCard(card) {
    const priceText = card.querySelector('.price-value')?.textContent || '0';
    return parseInt(priceText.replace(/[^0-9]/g, ''));
}

// 검색 기능 초기화
function initSearch() {
    const searchInput = document.getElementById('serviceSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterServicesBySearch(searchTerm);
        });
    }
}

// 검색어로 서비스 필터링
function filterServicesBySearch(searchTerm) {
    const cards = document.querySelectorAll('.service-card');

    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const description = card.querySelector('.service-description')?.textContent.toLowerCase() || '';

        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// 서비스 주문
function orderService(serviceId) {
    window.location.href = `order.html?service=${serviceId}`;
}

// 서비스 상세보기
function viewServiceDetail(serviceId) {
    // 서비스 상세 모달 표시 또는 페이지 이동
    window.location.href = `service-detail.html?id=${serviceId}`;
}

// 시간 단위 변환
function getTimeUnit(unit) {
    const units = {
        hours: '시간',
        days: '일',
        minutes: '분'
    };
    return units[unit] || unit;
}

// 빠른 주문 버튼들
function quickOrderInstagram() {
    document.getElementById('platformFilter').value = 'instagram';
    applyFilters();
    document.getElementById('servicesGrid').scrollIntoView({ behavior: 'smooth' });
}

function quickOrderYoutube() {
    document.getElementById('platformFilter').value = 'youtube';
    applyFilters();
    document.getElementById('servicesGrid').scrollIntoView({ behavior: 'smooth' });
}

function quickOrderTiktok() {
    document.getElementById('platformFilter').value = 'tiktok';
    applyFilters();
    document.getElementById('servicesGrid').scrollIntoView({ behavior: 'smooth' });
}
