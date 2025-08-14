// SMM Turk 서비스 관리 모듈
// 800% 마진이 적용된 가격으로 서비스 표시 및 주문 처리 (원가의 9배)

class SMMTurkServices {
    constructor() {
        this.services = [];
        this.categories = new Set();
        this.platforms = new Set();
        this.marginRate = 9.0; // 800% 마진 (9배)
        this.init();
    }

    async init() {
        await this.loadServices();
        this.renderServices();
        this.bindEvents();
    }

    // 서비스 목록 로드
    async loadServices() {
        try {
            // 로컬 스토리지에서 캐시 확인
            const cached = localStorage.getItem('smmturk_services');
            const cacheTime = localStorage.getItem('smmturk_services_time');

            // 1시간 이내 캐시면 사용
            if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 3600000) {
                this.services = JSON.parse(cached);
                console.log('캐시된 서비스 데이터 사용');
                return;
            }

            // API에서 새로 가져오기
            const response = await fetch('/api/smmturk/services');
            const data = await response.json();

            if (data.success) {
                this.services = data.services;

                // 캐시 저장
                localStorage.setItem('smmturk_services', JSON.stringify(this.services));
                localStorage.setItem('smmturk_services_time', Date.now().toString());

                console.log(`${this.services.length}개 서비스 로드 완료`);
            }
        } catch (error) {
            console.error('서비스 로드 실패:', error);

            // 폴백: 기본 서비스 목록
            this.services = this.getDefaultServices();
        }

        // 카테고리와 플랫폼 추출
        this.extractCategories();
    }

    // 카테고리와 플랫폼 추출
    extractCategories() {
        this.services.forEach(service => {
            if (service.category) this.categories.add(service.category);
            if (service.platform) this.platforms.add(service.platform);
        });
    }

    // 기본 서비스 목록 (API 실패 시 폴백)
    getDefaultServices() {
        const baseServices = [
            {
                name: '인스타그램 팔로워 (한국)',
                category: '인스타그램',
                platform: 'instagram',
                smmturk_id: 1,
                smmturk_price: 1000,
                price: 9000, // 800% 마진 적용 (9배)
                min_quantity: 10,
                max_quantity: 10000,
                description: '고품질 한국 팔로워'
            },
            {
                name: '인스타그램 좋아요',
                category: '인스타그램',
                platform: 'instagram',
                smmturk_id: 2,
                smmturk_price: 500,
                price: 4500, // 800% 마진 적용 (9배)
                min_quantity: 10,
                max_quantity: 50000,
                description: '빠른 좋아요 증가'
            },
            {
                name: '유튜브 조회수',
                category: '유튜브',
                platform: 'youtube',
                smmturk_id: 3,
                smmturk_price: 800,
                price: 7200, // 800% 마진 적용 (9배)
                min_quantity: 100,
                max_quantity: 1000000,
                description: '고품질 조회수'
            },
            {
                name: '유튜브 구독자',
                category: '유튜브',
                platform: 'youtube',
                smmturk_id: 4,
                smmturk_price: 2000,
                price: 18000, // 800% 마진 적용 (9배)
                min_quantity: 10,
                max_quantity: 10000,
                description: '영구 구독자'
            },
            {
                name: '틱톡 팔로워',
                category: '틱톡',
                platform: 'tiktok',
                smmturk_id: 5,
                smmturk_price: 1200,
                price: 10800, // 800% 마진 적용 (9배)
                min_quantity: 10,
                max_quantity: 10000,
                description: '고품질 팔로워'
            }
        ];

        return baseServices;
    }

    // 서비스 렌더링
    renderServices() {
        const container = document.getElementById('services-container');
        if (!container) return;

        // 카테고리별로 그룹화
        const grouped = this.groupByCategory();

        let html = '';
        for (const [category, services] of Object.entries(grouped)) {
            html += `
                <div class="service-category">
                    <h3 class="category-title">
                        <i class="${this.getCategoryIcon(category)}"></i>
                        ${category}
                    </h3>
                    <div class="services-grid">
                        ${services.map(service => this.renderServiceCard(service)).join('')}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    // 서비스 카드 렌더링
    renderServiceCard(service) {
        const discountPercent = Math.round((1 - service.smmturk_price / service.price) * 100);

        return `
            <div class="service-card" data-service-id="${service.smmturk_id}">
                <div class="service-header">
                    <h4>${service.name}</h4>
                    ${service.refill ? '<span class="badge refill">리필 보장</span>' : ''}
                    ${service.cancel ? '<span class="badge cancel">취소 가능</span>' : ''}
                </div>
                
                <div class="service-body">
                    <p class="service-description">${service.description}</p>
                    
                    <div class="service-info">
                        <div class="info-item">
                            <span class="label">최소 주문:</span>
                            <span class="value">${service.min_quantity.toLocaleString()}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">최대 주문:</span>
                            <span class="value">${service.max_quantity.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div class="service-pricing">
                        <div class="price-display">
                            <span class="original-price">₩${service.smmturk_price.toLocaleString()}</span>
                            <span class="current-price">₩${service.price.toLocaleString()}</span>
                            <span class="price-unit">/ 1000개</span>
                        </div>
                        ${discountPercent > 0 ? `<span class="discount-badge">${discountPercent}% 할인</span>` : ''}
                    </div>
                </div>
                
                <div class="service-footer">
                    <button class="btn-order" onclick="smmturkServices.orderService(${service.smmturk_id})">
                        <i class="fas fa-shopping-cart"></i> 주문하기
                    </button>
                    <button class="btn-calculate" onclick="smmturkServices.calculatePrice(${service.smmturk_id})">
                        <i class="fas fa-calculator"></i> 가격 계산
                    </button>
                </div>
            </div>
        `;
    }

    // 카테고리별 그룹화
    groupByCategory() {
        const grouped = {};

        this.services.forEach(service => {
            const category = service.category || '기타';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(service);
        });

        return grouped;
    }

    // 카테고리 아이콘
    getCategoryIcon(category) {
        const icons = {
            인스타그램: 'fab fa-instagram',
            유튜브: 'fab fa-youtube',
            틱톡: 'fab fa-tiktok',
            페이스북: 'fab fa-facebook',
            트위터: 'fab fa-twitter',
            텔레그램: 'fab fa-telegram',
            스포티파이: 'fab fa-spotify'
        };

        return icons[category] || 'fas fa-globe';
    }

    // 서비스 주문
    async orderService(serviceId) {
        const service = this.services.find(s => s.smmturk_id === serviceId);
        if (!service) {
            alert('서비스를 찾을 수 없습니다.');
            return;
        }

        // 주문 모달 표시
        this.showOrderModal(service);
    }

    // 주문 모달 표시
    showOrderModal(service) {
        const modalHtml = `
            <div class="modal" id="orderModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>서비스 주문</h2>
                        <button class="modal-close" onclick="smmturkServices.closeModal()">×</button>
                    </div>
                    
                    <div class="modal-body">
                        <h3>${service.name}</h3>
                        <p>${service.description}</p>
                        
                        <form id="orderForm">
                            <div class="form-group">
                                <label for="orderLink">링크/URL *</label>
                                <input type="url" id="orderLink" placeholder="https://instagram.com/username" required>
                                <small>프로필 또는 게시물 링크를 입력하세요</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="orderQuantity">수량 *</label>
                                <input type="number" id="orderQuantity" 
                                    min="${service.min_quantity}" 
                                    max="${service.max_quantity}" 
                                    value="${service.min_quantity}"
                                    onchange="smmturkServices.updateOrderPrice(${service.smmturk_id})"
                                    required>
                                <small>최소 ${service.min_quantity.toLocaleString()} - 최대 ${service.max_quantity.toLocaleString()}</small>
                            </div>
                            
                            <div class="price-calculation">
                                <h4>주문 금액</h4>
                                <div class="price-details">
                                    <div class="price-row">
                                        <span>단가:</span>
                                        <span>₩${service.price.toLocaleString()} / 1000개</span>
                                    </div>
                                    <div class="price-row">
                                        <span>수량:</span>
                                        <span id="orderQuantityDisplay">${service.min_quantity.toLocaleString()}</span>
                                    </div>
                                    <div class="price-row total">
                                        <span>총 금액:</span>
                                        <span id="orderTotalPrice">₩${this.calculateTotal(service.price, service.min_quantity).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn-cancel" onclick="smmturkServices.closeModal()">취소</button>
                        <button class="btn-submit" onclick="smmturkServices.submitOrder(${service.smmturk_id})">
                            <i class="fas fa-check"></i> 주문하기
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 모달 추가
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // 모달 표시
        setTimeout(() => {
            document.getElementById('orderModal').classList.add('show');
        }, 10);
    }

    // 가격 업데이트
    updateOrderPrice(serviceId) {
        const service = this.services.find(s => s.smmturk_id === serviceId);
        const quantity = parseInt(document.getElementById('orderQuantity').value) || 0;

        document.getElementById('orderQuantityDisplay').textContent = quantity.toLocaleString();
        document.getElementById('orderTotalPrice').textContent =
            `₩${this.calculateTotal(service.price, quantity).toLocaleString()}`;
    }

    // 총액 계산
    calculateTotal(pricePerThousand, quantity) {
        return Math.ceil((pricePerThousand * quantity) / 1000);
    }

    // 주문 제출
    async submitOrder(serviceId) {
        const service = this.services.find(s => s.smmturk_id === serviceId);
        const link = document.getElementById('orderLink').value;
        const quantity = parseInt(document.getElementById('orderQuantity').value);

        if (!link || !quantity) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        try {
            // 로딩 표시
            this.showLoading();

            // API 호출
            const response = await fetch('/api/smmturk/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    smmturk_service_id: serviceId,
                    link,
                    quantity,
                    service_name: service.name,
                    price: this.calculateTotal(service.price, quantity)
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('주문이 성공적으로 접수되었습니다!');
                this.closeModal();

                // 주문 내역 페이지로 이동
                if (confirm('주문 내역을 확인하시겠습니까?')) {
                    window.location.href = '/dashboard.html#orders';
                }
            } else {
                alert(`주문 실패: ${result.message}`);
            }
        } catch (error) {
            console.error('주문 오류:', error);
            alert('주문 처리 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading();
        }
    }

    // 가격 계산기
    calculatePrice(serviceId) {
        const service = this.services.find(s => s.smmturk_id === serviceId);
        if (!service) return;

        const quantity = prompt(`수량을 입력하세요 (${service.min_quantity} - ${service.max_quantity}):`);
        if (quantity) {
            const total = this.calculateTotal(service.price, parseInt(quantity));
            alert(`${quantity.toLocaleString()}개 주문 시 총 금액: ₩${total.toLocaleString()}`);
        }
    }

    // 모달 닫기
    closeModal() {
        const modal = document.getElementById('orderModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    // 로딩 표시
    showLoading() {
        const btn = document.querySelector('.btn-submit');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 처리 중...';
        }
    }

    // 로딩 숨기기
    hideLoading() {
        const btn = document.querySelector('.btn-submit');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check"></i> 주문하기';
        }
    }

    // 이벤트 바인딩
    bindEvents() {
        // 검색
        const searchInput = document.getElementById('serviceSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterServices(e.target.value);
            });
        }

        // 카테고리 필터
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterByCategory(e.target.value);
            });
        }
    }

    // 서비스 필터링
    filterServices(keyword) {
        const cards = document.querySelectorAll('.service-card');
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(keyword.toLowerCase()) ? '' : 'none';
        });
    }

    // 카테고리별 필터링
    filterByCategory(category) {
        const categories = document.querySelectorAll('.service-category');
        categories.forEach(cat => {
            if (category === 'all' || cat.querySelector('.category-title').textContent.includes(category)) {
                cat.style.display = '';
            } else {
                cat.style.display = 'none';
            }
        });
    }
}

// 전역 인스턴스 생성
window.smmturkServices = new SMMTurkServices();

// CSS 스타일 추가
if (!document.getElementById('smmturk-styles')) {
    const style = document.createElement('style');
    style.id = 'smmturk-styles';
    style.textContent = `
        .service-category {
            margin-bottom: 40px;
        }
        
        .category-title {
            font-size: 24px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
            color: #333;
        }
        
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .service-card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .service-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        }
        
        .service-header h4 {
            margin: 0 0 10px 0;
            color: #333;
        }
        
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            margin-left: 5px;
        }
        
        .badge.refill {
            background: #28a745;
            color: white;
        }
        
        .badge.cancel {
            background: #ffc107;
            color: #333;
        }
        
        .service-pricing {
            margin: 15px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .price-display {
            display: flex;
            align-items: baseline;
            gap: 10px;
        }
        
        .original-price {
            text-decoration: line-through;
            color: #999;
            font-size: 14px;
        }
        
        .current-price {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
        }
        
        .price-unit {
            font-size: 12px;
            color: #666;
        }
        
        .discount-badge {
            background: #ff4757;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: auto;
        }
        
        .service-footer {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        .service-footer button {
            flex: 1;
            padding: 10px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
        }
        
        .btn-order {
            background: #667eea;
            color: white;
        }
        
        .btn-order:hover {
            background: #5a67d8;
        }
        
        .btn-calculate {
            background: #e0e0e0;
            color: #333;
        }
        
        .btn-calculate:hover {
            background: #d0d0d0;
        }
        
        /* 모달 스타일 */
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 10000;
        }
        
        .modal.show {
            opacity: 1;
        }
        
        .modal-content {
            background: white;
            border-radius: 10px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .modal-header {
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-close {
            font-size: 30px;
            background: none;
            border: none;
            cursor: pointer;
            color: #999;
        }
        
        .modal-body {
            padding: 20px;
        }
        
        .modal-footer {
            padding: 20px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        
        .price-calculation {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
        }
        
        .price-details {
            margin-top: 10px;
        }
        
        .price-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
        }
        
        .price-row.total {
            font-size: 18px;
            font-weight: bold;
            color: #667eea;
            border-top: 1px solid #dee2e6;
            margin-top: 10px;
            padding-top: 10px;
        }
    `;
    document.head.appendChild(style);
}

console.log('📦 SMM Turk 서비스 모듈 로드 완료');
