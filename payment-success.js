// 결제 성공 페이지 관리
class PaymentSuccessManager {
    constructor() {
        this.paymentData = null;
        this.init();
    }

    async init() {
        try {
            // URL 파라미터에서 결제 정보 가져오기
            this.getPaymentInfo();
            
            // 결제 정보 표시
            this.displayPaymentInfo();
            
            // 주문 정보 저장
            this.saveOrderData();
            
        } catch (error) {
            console.error('결제 처리 실패:', error);
            this.showError('결제 처리 중 오류가 발생했습니다.');
        }
    }

    // URL에서 결제 정보 추출
    getPaymentInfo() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // KG이니시스 결제 결과 파라미터
        this.paymentData = {
            orderId: urlParams.get('orderId') || urlParams.get('MOID'),
            tid: urlParams.get('tid'),
            resultCode: urlParams.get('resultCode'),
            resultMsg: urlParams.get('resultMsg'),
            amount: urlParams.get('TotPrice'),
            payMethod: urlParams.get('payMethod'),
            authCode: urlParams.get('authCode'),
            authDate: urlParams.get('authDate')
        };

        // 세션 스토리지에서 추가 정보 가져오기
        const sessionOrder = sessionStorage.getItem('currentOrder');
        if (sessionOrder) {
            const orderInfo = JSON.parse(sessionOrder);
            this.paymentData.serviceName = orderInfo.serviceName;
            this.paymentData.quantity = orderInfo.quantity;
            this.paymentData.targetUrl = orderInfo.targetUrl;
        }

        if (!this.paymentData.orderId) {
            throw new Error('결제 정보가 incomplete합니다.');
        }
    }

    // 결제 정보 화면에 표시
    displayPaymentInfo() {
        // 주문 ID
        const orderIdEl = document.getElementById('orderId');
        if (orderIdEl) orderIdEl.textContent = this.paymentData.orderId;

        // 거래 ID
        const paymentKeyEl = document.getElementById('paymentKey');
        if (paymentKeyEl) paymentKeyEl.textContent = this.paymentData.tid || '-';

        // 서비스명
        const orderNameEl = document.getElementById('orderName');
        if (orderNameEl) orderNameEl.textContent = this.paymentData.serviceName || 'SNS 마케팅 서비스';

        // 결제 금액
        const amountEl = document.getElementById('amount');
        if (amountEl && this.paymentData.amount) {
            amountEl.textContent = `₩${parseInt(this.paymentData.amount).toLocaleString()}`;
        }

        // 결제 수단
        const methodEl = document.getElementById('method');
        if (methodEl) {
            const paymentMethods = {
                'Card': '신용카드',
                'DirectBank': '계좌이체',
                'VBank': '가상계좌',
                'HPP': '휴대폰결제',
                'Kakaopay': '카카오페이',
                'Naverpay': '네이버페이',
                'Samsungpay': '삼성페이',
                'Lpay': 'L페이',
                'Payco': '페이코'
            };
            methodEl.textContent = paymentMethods[this.paymentData.payMethod] || this.paymentData.payMethod || '카드';
        }

        // 승인 시간
        const approvedAtEl = document.getElementById('approvedAt');
        if (approvedAtEl) {
            const authDate = this.paymentData.authDate || new Date().toISOString();
            approvedAtEl.textContent = new Date(authDate).toLocaleString();
        }

        // 성공 메시지 표시
        this.showSuccessMessage();
    }

    // 주문 데이터 저장 및 자동 처리
    async saveOrderData() {
        try {
            const orderData = {
                orderId: this.paymentData.orderId,
                tid: this.paymentData.tid,
                serviceName: this.paymentData.serviceName,
                quantity: this.paymentData.quantity,
                targetUrl: this.paymentData.targetUrl,
                amount: this.paymentData.amount,
                paymentMethod: this.paymentData.payMethod,
                status: 'paid',
                createdAt: new Date().toISOString()
            };

            // localStorage에 주문 내역 저장
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            orders.unshift(orderData);
            localStorage.setItem('orders', JSON.stringify(orders));

            // 세션 스토리지 정리
            sessionStorage.removeItem('currentOrder');

            // API 호출 (백엔드가 있는 경우)
            if (window.api) {
                try {
                    await window.api.post('/orders/complete', orderData);
                } catch (error) {
                    console.error('서버 저장 실패:', error);
                }
            }

        } catch (error) {
            console.error('주문 데이터 저장 실패:', error);
        }
    }

    // 성공 메시지 표시
    showSuccessMessage() {
        const checkIcon = document.querySelector('.check-icon');
        if (checkIcon) {
            checkIcon.style.display = 'block';
        }

        if (window.NotificationManager) {
            window.NotificationManager.success('결제가 성공적으로 완료되었습니다!');
        }
    }

    // 에러 표시
    showError(message) {
        if (window.NotificationManager) {
            window.NotificationManager.error(message);
        } else {
            alert(message);
        }
        
        // 결제 페이지로 리다이렉트
        setTimeout(() => {
            window.location.href = '/payment.html';
        }, 3000);
    }
}

// 영수증 보기
function viewReceipt() {
    // KG이니시스는 별도의 영수증 URL을 제공하지 않을 수 있음
    // 자체 영수증 페이지로 이동하거나 API를 통해 영수증 정보를 가져옴
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId') || urlParams.get('MOID');
    
    if (orderId) {
        window.open(`/receipt.html?orderId=${orderId}`, '_blank');
    } else {
        if (window.NotificationManager) {
            window.NotificationManager.warning('영수증 정보를 불러올 수 없습니다.');
        }
    }
}

// 대시보드로 이동
function goToDashboard() {
    window.location.href = '/dashboard.html';
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.paymentSuccessManager = new PaymentSuccessManager();
});