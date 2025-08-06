// 토스페이먼츠 결제 시스템
class PaymentManager {
    constructor() {
        // 토스페이먼츠 클라이언트 키 (테스트용)
        this.clientKey = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoqy';
        this.customerKey = this.generateCustomerKey();
        this.paymentWidget = null;
        this.currentOrder = null;
        
        this.init();
    }

    // 고객 키 생성
    generateCustomerKey() {
        const user = authManager?.getCurrentUser();
        if (user) {
            return `customer_${user.id}`;
        }
        return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 초기화
    async init() {
        try {
            // URL에서 주문 정보 가져오기
            this.loadOrderFromURL();
            
            // 토스페이먼츠 위젯 초기화
            await this.initPaymentWidget();
            
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

    // 토스페이먼츠 위젯 초기화
    async initPaymentWidget() {
        try {
            this.paymentWidget = PaymentWidget(this.clientKey, this.customerKey);

            // 결제 수단 렌더링
            await this.paymentWidget.renderPaymentMethods(
                '#payment-method',
                { value: this.currentOrder?.finalAmount || 50000 },
                { variantKey: 'DEFAULT' }
            );

            // 이용약관 렌더링
            await this.paymentWidget.renderAgreement('#agreement', {
                variantKey: 'AGREEMENT'
            });

        } catch (error) {
            console.error('결제 위젯 초기화 실패:', error);
            this.showError('결제 위젯을 로드할 수 없습니다.');
        }
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        const paymentButton = document.getElementById('payment-request-button');
        if (paymentButton) {
            paymentButton.addEventListener('click', () => this.requestPayment());
        }
    }

    // 결제 요청
    async requestPayment() {
        if (!this.currentOrder) {
            this.showError('주문 정보가 없습니다.');
            return;
        }

        try {
            this.showLoading(true);

            // 주문 ID 생성
            const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            await this.paymentWidget.requestPayment({
                orderId: orderId,
                orderName: this.currentOrder.serviceName,
                customerName: authManager?.getCurrentUser()?.username || '게스트',
                customerEmail: authManager?.getCurrentUser()?.email || 'guest@example.com',
                successUrl: `${window.location.origin}/payment-success.html`,
                failUrl: `${window.location.origin}/payment-fail.html`,
            });

        } catch (error) {
            this.showLoading(false);
            console.error('결제 요청 실패:', error);
            
            if (error.code === 'USER_CANCEL') {
                this.showError('결제가 취소되었습니다.');
            } else if (error.code === 'INVALID_CARD') {
                this.showError('유효하지 않은 카드입니다.');
            } else {
                this.showError('결제 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
        }
    }

    // 로딩 표시
    showLoading(show) {
        const loadingModal = document.getElementById('loadingModal');
        if (loadingModal) {
            loadingModal.style.display = show ? 'block' : 'none';
        }
    }

    // 에러 메시지 표시
    showError(message) {
        alert(`❌ ${message}`);
    }

    // 서비스 페이지로 리다이렉트
    redirectToServices() {
        alert('주문 정보가 없습니다. 서비스 페이지로 이동합니다.');
        window.location.href = 'services.html';
    }
}

// 결제 매니저 인스턴스 생성
let paymentManager;

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', function() {
    paymentManager = new PaymentManager();
});