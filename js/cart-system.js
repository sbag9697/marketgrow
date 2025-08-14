// 장바구니 시스템
const API_URL = 'https://marketgrow-production-c586.up.railway.app/api';

class CartSystem {
    constructor() {
        this.cart = [];
        this.cartCount = 0;
        this.cartTotal = 0;
        this.isLoggedIn = false;
        this.init();
    }

    // 초기화
    init() {
        this.checkLoginStatus();
        this.loadCart();
        this.updateCartUI();
        this.setupEventListeners();
    }

    // 로그인 상태 확인
    checkLoginStatus() {
        const token = localStorage.getItem('authToken');
        this.isLoggedIn = !!token;
    }

    // 장바구니 로드
    async loadCart() {
        if (this.isLoggedIn) {
            // 서버에서 장바구니 로드
            await this.loadServerCart();
        } else {
            // 로컬 스토리지에서 로드
            this.loadLocalCart();
        }
    }

    // 서버 장바구니 로드
    async loadServerCart() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/cart`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                this.cart = data.data.items || [];
                this.syncLocalCart();
            }
        } catch (error) {
            console.error('서버 장바구니 로드 실패:', error);
            this.loadLocalCart();
        }
    }

    // 로컬 장바구니 로드
    loadLocalCart() {
        const saved = localStorage.getItem('cart');
        if (saved) {
            this.cart = JSON.parse(saved);
        }
    }

    // 장바구니 동기화
    syncLocalCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.calculateTotals();
        this.updateCartUI();
    }

    // 장바구니에 추가
    async addToCart(service, options = {}) {
        const cartItem = {
            id: Date.now().toString(),
            serviceId: service.id || service._id,
            serviceName: service.name,
            platform: service.platform,
            category: service.category,
            price: service.price,
            quantity: options.quantity || 100,
            targetUrl: options.targetUrl || '',
            totalPrice: (service.price * (options.quantity || 100)),
            addedAt: new Date().toISOString()
        };

        // 중복 체크
        const existingIndex = this.cart.findIndex(item => 
            item.serviceId === cartItem.serviceId && 
            item.targetUrl === cartItem.targetUrl
        );

        if (existingIndex >= 0) {
            // 수량 업데이트
            this.cart[existingIndex].quantity += cartItem.quantity;
            this.cart[existingIndex].totalPrice = this.cart[existingIndex].price * this.cart[existingIndex].quantity;
        } else {
            // 새 아이템 추가
            this.cart.push(cartItem);
        }

        // 서버 동기화
        if (this.isLoggedIn) {
            await this.syncCartToServer();
        }

        this.syncLocalCart();
        this.showAddedNotification(service.name);
        
        return cartItem;
    }

    // 장바구니에서 제거
    async removeFromCart(itemId) {
        const index = this.cart.findIndex(item => item.id === itemId);
        if (index >= 0) {
            const removed = this.cart.splice(index, 1)[0];
            
            if (this.isLoggedIn) {
                await this.syncCartToServer();
            }
            
            this.syncLocalCart();
            this.showRemovedNotification(removed.serviceName);
        }
    }

    // 수량 업데이트
    async updateQuantity(itemId, newQuantity) {
        const item = this.cart.find(item => item.id === itemId);
        if (item) {
            item.quantity = newQuantity;
            item.totalPrice = item.price * newQuantity;
            
            if (this.isLoggedIn) {
                await this.syncCartToServer();
            }
            
            this.syncLocalCart();
        }
    }

    // 장바구니 비우기
    async clearCart() {
        this.cart = [];
        
        if (this.isLoggedIn) {
            await this.syncCartToServer();
        }
        
        this.syncLocalCart();
    }

    // 서버에 장바구니 동기화
    async syncCartToServer() {
        try {
            const token = localStorage.getItem('authToken');
            await fetch(`${API_URL}/cart/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ items: this.cart })
            });
        } catch (error) {
            console.error('장바구니 동기화 실패:', error);
        }
    }

    // 합계 계산
    calculateTotals() {
        this.cartCount = this.cart.length;
        this.cartTotal = this.cart.reduce((total, item) => total + item.totalPrice, 0);
    }

    // UI 업데이트
    updateCartUI() {
        this.calculateTotals();
        
        // 장바구니 카운트 업데이트
        const cartBadges = document.querySelectorAll('.cart-badge');
        cartBadges.forEach(badge => {
            badge.textContent = this.cartCount;
            badge.style.display = this.cartCount > 0 ? 'flex' : 'none';
        });

        // 장바구니 아이콘 업데이트
        const cartIcons = document.querySelectorAll('.cart-icon');
        cartIcons.forEach(icon => {
            if (this.cartCount > 0) {
                icon.classList.add('has-items');
            } else {
                icon.classList.remove('has-items');
            }
        });

        // 장바구니 미리보기 업데이트
        this.updateCartPreview();
    }

    // 장바구니 미리보기 업데이트
    updateCartPreview() {
        const preview = document.getElementById('cartPreview');
        if (!preview) return;

        if (this.cart.length === 0) {
            preview.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-shopping-cart"></i>
                    <p>장바구니가 비어있습니다</p>
                </div>
            `;
            return;
        }

        let itemsHtml = '';
        this.cart.slice(0, 3).forEach(item => {
            itemsHtml += `
                <div class="cart-preview-item">
                    <div class="item-info">
                        <div class="item-name">${item.serviceName}</div>
                        <div class="item-quantity">${item.quantity.toLocaleString()}개</div>
                    </div>
                    <div class="item-price">₩${item.totalPrice.toLocaleString()}</div>
                </div>
            `;
        });

        if (this.cart.length > 3) {
            itemsHtml += `
                <div class="more-items">
                    +${this.cart.length - 3}개 더보기
                </div>
            `;
        }

        preview.innerHTML = `
            ${itemsHtml}
            <div class="cart-preview-footer">
                <div class="total">
                    <span>합계</span>
                    <span class="total-price">₩${this.cartTotal.toLocaleString()}</span>
                </div>
                <a href="cart.html" class="view-cart-btn">장바구니 보기</a>
            </div>
        `;
    }

    // 알림 표시
    showAddedNotification(serviceName) {
        this.showNotification(`${serviceName}이(가) 장바구니에 추가되었습니다`, 'success');
    }

    showRemovedNotification(serviceName) {
        this.showNotification(`${serviceName}이(가) 장바구니에서 제거되었습니다`, 'info');
    }

    showNotification(message, type = 'info') {
        // 기존 알림 제거
        const existing = document.querySelector('.cart-notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = `cart-notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
            <button class="close-notification" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        // 애니메이션
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // 자동 제거
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 장바구니 아이콘 클릭
        document.addEventListener('click', (e) => {
            if (e.target.closest('.cart-icon')) {
                this.toggleCartPreview();
            }
        });

        // 장바구니 미리보기 외부 클릭
        document.addEventListener('click', (e) => {
            const preview = document.getElementById('cartPreviewContainer');
            if (preview && !preview.contains(e.target) && !e.target.closest('.cart-icon')) {
                preview.classList.remove('show');
            }
        });
    }

    // 장바구니 미리보기 토글
    toggleCartPreview() {
        const container = document.getElementById('cartPreviewContainer');
        if (container) {
            container.classList.toggle('show');
        }
    }

    // 장바구니 페이지 렌더링
    renderCartPage() {
        const container = document.getElementById('cartItemsContainer');
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>장바구니가 비어있습니다</h3>
                    <p>원하는 서비스를 장바구니에 담아보세요</p>
                    <a href="services.html" class="btn-primary">서비스 둘러보기</a>
                </div>
            `;
            document.getElementById('cartSummary').style.display = 'none';
            return;
        }

        let itemsHtml = '';
        this.cart.forEach(item => {
            itemsHtml += `
                <div class="cart-item" data-item-id="${item.id}">
                    <div class="item-details">
                        <h4>${item.serviceName}</h4>
                        <p class="item-platform">${item.platform} - ${item.category}</p>
                        ${item.targetUrl ? `<p class="item-url">대상: ${item.targetUrl}</p>` : ''}
                    </div>
                    <div class="item-quantity">
                        <button class="quantity-btn minus" onclick="cartSystem.changeQuantity('${item.id}', -100)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" class="quantity-input" value="${item.quantity}" 
                               onchange="cartSystem.updateQuantity('${item.id}', this.value)">
                        <button class="quantity-btn plus" onclick="cartSystem.changeQuantity('${item.id}', 100)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="item-price">
                        <div class="unit-price">₩${item.price}/개</div>
                        <div class="total-price">₩${item.totalPrice.toLocaleString()}</div>
                    </div>
                    <button class="remove-btn" onclick="cartSystem.removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });

        container.innerHTML = itemsHtml;

        // 요약 정보 업데이트
        this.updateCartSummary();
    }

    // 장바구니 요약 업데이트
    updateCartSummary() {
        const summary = document.getElementById('cartSummary');
        if (!summary) return;

        summary.style.display = 'block';
        
        const subtotal = this.cartTotal;
        const discount = 0; // 할인 로직 추가 가능
        const total = subtotal - discount;

        summary.innerHTML = `
            <h3>주문 요약</h3>
            <div class="summary-row">
                <span>상품 금액</span>
                <span>₩${subtotal.toLocaleString()}</span>
            </div>
            ${discount > 0 ? `
                <div class="summary-row discount">
                    <span>할인 금액</span>
                    <span>-₩${discount.toLocaleString()}</span>
                </div>
            ` : ''}
            <div class="summary-row total">
                <span>총 결제금액</span>
                <span>₩${total.toLocaleString()}</span>
            </div>
            <button class="checkout-btn" onclick="cartSystem.proceedToCheckout()">
                결제하기 (${this.cart.length}개)
            </button>
            <button class="clear-cart-btn" onclick="cartSystem.confirmClearCart()">
                장바구니 비우기
            </button>
        `;
    }

    // 수량 변경
    changeQuantity(itemId, delta) {
        const item = this.cart.find(item => item.id === itemId);
        if (item) {
            const newQuantity = Math.max(100, item.quantity + delta);
            this.updateQuantity(itemId, newQuantity);
            this.renderCartPage();
        }
    }

    // 장바구니 비우기 확인
    confirmClearCart() {
        if (confirm('장바구니를 비우시겠습니까?')) {
            this.clearCart();
            this.renderCartPage();
        }
    }

    // 결제 진행
    proceedToCheckout() {
        if (!this.isLoggedIn) {
            if (confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
                window.location.href = '/login.html?redirect=/cart.html';
            }
            return;
        }

        // 장바구니 데이터를 세션 스토리지에 저장
        sessionStorage.setItem('checkoutItems', JSON.stringify(this.cart));
        sessionStorage.setItem('checkoutTotal', this.cartTotal);
        
        // 결제 페이지로 이동
        window.location.href = '/payment.html?from=cart';
    }
}

// 장바구니 스타일
const cartStyles = `
<style>
.cart-notification {
    position: fixed;
    top: -100px;
    right: 20px;
    background: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 10000;
    transition: top 0.3s ease;
}

.cart-notification.show {
    top: 20px;
}

.cart-notification.success {
    border-left: 4px solid #10b981;
}

.cart-notification.info {
    border-left: 4px solid #3b82f6;
}

.cart-notification i {
    font-size: 20px;
}

.cart-notification.success i {
    color: #10b981;
}

.cart-notification.info i {
    color: #3b82f6;
}

.close-notification {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    margin-left: 10px;
}

.cart-icon {
    position: relative;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.cart-icon:hover {
    transform: scale(1.1);
}

.cart-icon.has-items {
    animation: bounce 0.5s ease;
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
}

.cart-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ef4444;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: bold;
}

.cart-preview-container {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 10px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    width: 320px;
    max-height: 400px;
    display: none;
    z-index: 1000;
}

.cart-preview-container.show {
    display: block;
    animation: slideDown 0.3s ease;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.cart-preview-item {
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.cart-preview-item:hover {
    background: #f8fafc;
}

.item-info {
    flex: 1;
}

.item-name {
    font-weight: 600;
    color: #1a365d;
    margin-bottom: 4px;
}

.item-quantity {
    font-size: 13px;
    color: #64748b;
}

.item-price {
    font-weight: 600;
    color: #667eea;
}

.cart-preview-footer {
    padding: 16px;
    background: #f8fafc;
    border-radius: 0 0 8px 8px;
}

.cart-preview-footer .total {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-weight: 600;
}

.total-price {
    color: #667eea;
    font-size: 18px;
}

.view-cart-btn {
    display: block;
    width: 100%;
    padding: 10px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-align: center;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    transition: transform 0.3s ease;
}

.view-cart-btn:hover {
    transform: translateY(-2px);
}

.cart-empty {
    padding: 40px;
    text-align: center;
    color: #94a3b8;
}

.cart-empty i {
    font-size: 48px;
    margin-bottom: 10px;
}

.more-items {
    padding: 8px 16px;
    text-align: center;
    color: #64748b;
    font-size: 13px;
    background: #f1f5f9;
}

/* 장바구니 페이지 스타일 */
.cart-item {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 20px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    margin-bottom: 12px;
    align-items: center;
    border: 1px solid #e5e7eb;
}

.cart-item:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.item-details h4 {
    color: #1a365d;
    margin-bottom: 8px;
}

.item-platform {
    color: #64748b;
    font-size: 14px;
}

.item-url {
    color: #94a3b8;
    font-size: 13px;
    margin-top: 4px;
}

.item-quantity {
    display: flex;
    align-items: center;
    gap: 8px;
}

.quantity-btn {
    width: 32px;
    height: 32px;
    border: 1px solid #e5e7eb;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.quantity-btn:hover {
    background: #f8fafc;
    border-color: #667eea;
}

.quantity-input {
    width: 80px;
    padding: 6px;
    text-align: center;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
}

.unit-price {
    font-size: 13px;
    color: #64748b;
    margin-bottom: 4px;
}

.total-price {
    font-size: 18px;
    font-weight: 600;
    color: #667eea;
}

.remove-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: #fee2e2;
    color: #dc2626;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.remove-btn:hover {
    background: #dc2626;
    color: white;
}

.empty-cart {
    padding: 80px 20px;
    text-align: center;
}

.empty-cart i {
    font-size: 64px;
    color: #cbd5e1;
    margin-bottom: 20px;
}

.empty-cart h3 {
    color: #475569;
    margin-bottom: 10px;
}

.empty-cart p {
    color: #94a3b8;
    margin-bottom: 30px;
}

.checkout-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.checkout-btn:hover {
    transform: translateY(-2px);
}

.clear-cart-btn {
    width: 100%;
    padding: 12px;
    background: white;
    color: #dc2626;
    border: 2px solid #dc2626;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 10px;
    transition: all 0.3s ease;
}

.clear-cart-btn:hover {
    background: #dc2626;
    color: white;
}
</style>
`;

// 스타일 삽입
document.head.insertAdjacentHTML('beforeend', cartStyles);

// 전역 인스턴스 생성
const cartSystem = new CartSystem();

// 전역 함수 등록
window.cartSystem = cartSystem;

// 장바구니에 추가하는 헬퍼 함수
window.addToCart = function(service, options) {
    return cartSystem.addToCart(service, options);
};