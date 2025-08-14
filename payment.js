// KG이니시스 결제 시스템
class PaymentManager {
    constructor() {
        this.currentOrder = null;
        this.init();
    }

    // 초기화
    async init() {
        try {
            // URL에서 주문 정보 가져오기
            this.loadOrderFromURL();

            // 결제 버튼 이벤트
            this.setupEventListeners();
        } catch (error) {
            console.error('결제 시스템 초기화 실패:', error);
            this.showError('결제 시스템을 초기화할 수 없습니다.');
        }
    }

    // URL에서 주문 정보 로드
    loadOrderFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderData = urlParams.get('order');

        if (orderData) {
            try {
                this.currentOrder = JSON.parse(decodeURIComponent(orderData));
                this.displayOrderInfo();
            } catch (error) {
                console.error('주문 정보 파싱 실패:', error);
                this.redirectToServices();
            }
        } else {
            // 세션 스토리지에서 주문 정보 가져오기
            const sessionOrder = sessionStorage.getItem('currentOrder');
            if (sessionOrder) {
                this.currentOrder = JSON.parse(sessionOrder);
                this.displayOrderInfo();
            } else {
                this.redirectToServices();
            }
        }
    }

    // 주문 정보 표시
    displayOrderInfo() {
        if (!this.currentOrder) return;

        const serviceAmount = this.currentOrder.totalPrice;
        const vatAmount = Math.floor(serviceAmount * 0.1);
        const finalAmount = serviceAmount + vatAmount;

        document.getElementById('orderServiceName').textContent = this.currentOrder.serviceName;
        document.getElementById('orderQuantity').textContent = `수량: ${this.currentOrder.quantity.toLocaleString()}개`;
        document.getElementById('orderUrl').textContent = `대상 URL: ${this.currentOrder.targetUrl}`;
        document.getElementById('orderTotalPrice').textContent = `₩${serviceAmount.toLocaleString()}`;
        document.getElementById('serviceAmount').textContent = `₩${serviceAmount.toLocaleString()}`;
        document.getElementById('vatAmount').textContent = `₩${vatAmount.toLocaleString()}`;
        document.getElementById('finalAmount').textContent = `₩${finalAmount.toLocaleString()}`;

        // 주문 정보 업데이트
        this.currentOrder.vatAmount = vatAmount;
        this.currentOrder.finalAmount = finalAmount;
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        const paymentBtn = document.getElementById('payment-button');
        if (paymentBtn) {
            paymentBtn.addEventListener('click', () => this.processPayment());
        }

        // 결제 방법 선택
        const paymentMethods = document.querySelectorAll('.payment-method-item');
        paymentMethods.forEach(method => {
            method.addEventListener('click', (e) => {
                // 기존 선택 제거
                paymentMethods.forEach(m => m.classList.remove('selected'));
                // 새로운 선택 추가
                method.classList.add('selected');
                this.currentOrder.paymentMethod = method.dataset.method;
            });
        });
    }

    // 결제 처리
    async processPayment() {
        try {
            if (!this.currentOrder) {
                throw new Error('주문 정보가 없습니다.');
            }

            // 구매자 정보 수집
            const buyerName = document.getElementById('buyer-name')?.value || '';
            const buyerEmail = document.getElementById('buyer-email')?.value || '';
            const buyerPhone = document.getElementById('buyer-phone')?.value || '';

            if (!buyerName || !buyerEmail) {
                this.showError('구매자 정보를 입력해주세요.');
                return;
            }

            // 로딩 표시
            this.showLoading();

            // KG이니시스 결제 요청 데이터
            const paymentData = {
                amount: this.currentOrder.finalAmount,
                productName: this.currentOrder.serviceName,
                buyerName,
                buyerEmail,
                buyerPhone,
                serviceId: this.currentOrder.serviceId,
                quantity: this.currentOrder.quantity,
                userId: localStorage.getItem('userId') || null,
                paymentMethod: this.currentOrder.paymentMethod || ''
            };

            // KG이니시스 결제 요청
            if (window.KGInicisPayment) {
                await window.KGInicisPayment.requestPayment(paymentData);
            } else {
                // KG이니시스 스크립트가 로드되지 않은 경우
                console.error('KG이니시스 결제 모듈이 로드되지 않았습니다.');
                this.showError('결제 모듈을 불러올 수 없습니다. 페이지를 새로고침해주세요.');
            }
        } catch (error) {
            console.error('결제 처리 실패:', error);
            this.showError(error.message || '결제 처리 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading();
        }
    }

    // 로딩 표시
    showLoading() {
        const btn = document.getElementById('payment-button');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> 처리 중...';
        }
    }

    // 로딩 숨기기
    hideLoading() {
        const btn = document.getElementById('payment-button');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '결제하기';
        }
    }

    // 에러 표시
    showError(message) {
        if (window.NotificationManager) {
            window.NotificationManager.error(message);
        } else {
            alert(message);
        }
    }

    // 서비스 페이지로 리다이렉트
    redirectToServices() {
        if (window.NotificationManager) {
            window.NotificationManager.error('주문 정보가 없습니다. 서비스를 먼저 선택해주세요.');
        }
        setTimeout(() => {
            window.location.href = '/services.html';
        }, 2000);
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.paymentManager = new PaymentManager();
});
