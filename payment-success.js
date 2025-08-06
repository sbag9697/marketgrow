// 결제 성공 페이지 관리
class PaymentSuccessManager {
    constructor() {
        this.paymentData = null;
        this.init();
    }

    async init() {
        try {
            // URL 파라미터에서 결제 정보 가져오기
            await this.getPaymentInfo();
            
            // 결제 승인 처리
            await this.confirmPayment();
            
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
        
        this.paymentData = {
            paymentKey: urlParams.get('paymentKey'),
            orderId: urlParams.get('orderId'),
            amount: urlParams.get('amount')
        };

        if (!this.paymentData.paymentKey || !this.paymentData.orderId || !this.paymentData.amount) {
            throw new Error('결제 정보가 incomplete합니다.');
        }
    }

    // 토스페이먼츠 결제 승인
    async confirmPayment() {
        try {
            // 실제 서비스에서는 백엔드 API를 호출해야 합니다
            // 여기서는 시뮬레이션으로 처리합니다
            
            const response = await this.simulatePaymentConfirmation();
            
            if (response.status === 'DONE') {
                this.displayPaymentInfo(response);
                this.showSuccessMessage();
            } else {
                throw new Error('결제 승인 실패');
            }
            
        } catch (error) {
            console.error('결제 승인 실패:', error);
            throw error;
        }
    }

    // 결제 승인 시뮬레이션 (실제로는 백엔드에서 처리)
    async simulatePaymentConfirmation() {
        // 실제 토스페이먼츠 API 호출 시뮬레이션
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    status: 'DONE',
                    paymentKey: this.paymentData.paymentKey,
                    orderId: this.paymentData.orderId,
                    orderName: sessionStorage.getItem('orderName') || 'SNS 마케팅 서비스',
                    method: '카드',
                    totalAmount: parseInt(this.paymentData.amount),
                    approvedAt: new Date().toISOString(),
                    receipt: {
                        url: `https://dashboard.tosspayments.com/receipt/${this.paymentData.paymentKey}`
                    }
                });
            }, 1000);
        });
    }

    // 결제 정보 화면에 표시
    displayPaymentInfo(paymentInfo) {
        document.getElementById('orderId').textContent = paymentInfo.orderId;
        document.getElementById('paymentKey').textContent = paymentInfo.paymentKey;
        document.getElementById('orderName').textContent = paymentInfo.orderName;
        document.getElementById('amount').textContent = `₩${paymentInfo.totalAmount.toLocaleString()}`;
        document.getElementById('method').textContent = paymentInfo.method;
        document.getElementById('approvedAt').textContent = new Date(paymentInfo.approvedAt).toLocaleString();

        // 영수증 URL 저장
        if (paymentInfo.receipt?.url) {
            document.getElementById('receiptBtn').setAttribute('data-receipt-url', paymentInfo.receipt.url);
        }
    }

    // 주문 데이터 저장 및 자동 처리
    async saveOrderData() {
        try {
            const orderData = {
                id: this.paymentData.orderId,
                paymentKey: this.paymentData.paymentKey,
                serviceName: document.getElementById('orderName').textContent,
                totalAmount: parseInt(this.paymentData.amount),
                status: 'completed',
                createdAt: new Date().toISOString(),
                userId: authManager?.getCurrentUser()?.id || 'guest'
            };

            // 로컬 스토리지에 주문 내역 저장
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            orders.push(orderData);
            localStorage.setItem('orders', JSON.stringify(orders));

            // 사용자 정보 업데이트
            const user = authManager?.getCurrentUser();
            if (user) {
                user.orders = user.orders || [];
                user.orders.push(orderData.id);
                
                // 포인트 적립 (결제금액의 1%)
                const points = Math.floor(orderData.totalAmount * 0.01);
                user.points = (user.points || 0) + points;
                
                localStorage.setItem('currentUser', JSON.stringify(user));
            }

            // SMMTurk API로 자동 주문 처리
            await this.processOrderAutomatically(orderData);

            // 세션 스토리지 정리
            sessionStorage.removeItem('currentOrder');
            sessionStorage.removeItem('orderName');

        } catch (error) {
            console.error('주문 데이터 저장 실패:', error);
        }
    }

    // 자동 주문 처리
    async processOrderAutomatically(orderData) {
        try {
            // 주문 상세 정보 가져오기
            const cartItems = JSON.parse(sessionStorage.getItem('cartItems') || '[]');
            
            if (cartItems.length === 0) {
                console.log('처리할 주문 항목이 없습니다.');
                return;
            }

            console.log('SMMTurk API로 주문 처리 시작...');

            // 각 서비스별로 SMMTurk에 주문 전송
            for (const item of cartItems) {
                try {
                    const response = await fetch('/.netlify/functions/smmturk', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            action: 'process-order',
                            orderId: orderData.id,
                            serviceType: item.serviceType,
                            targetUrl: item.targetUrl,
                            quantity: item.quantity
                        })
                    });

                    const result = await response.json();
                    
                    if (result.success) {
                        console.log(`서비스 ${item.serviceName} 주문 처리 완료`);
                        
                        // 성공 알림 표시
                        this.showProcessingAlert(item.serviceName, result.estimatedStartTime);
                    } else {
                        console.error(`서비스 ${item.serviceName} 주문 실패:`, result.error);
                    }
                } catch (error) {
                    console.error('개별 주문 처리 실패:', error);
                }
            }

        } catch (error) {
            console.error('자동 주문 처리 실패:', error);
        }
    }

    // 주문 처리 알림
    showProcessingAlert(serviceName, estimatedTime) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'processing-alert';
        alertDiv.innerHTML = `
            <i class="fas fa-cog fa-spin"></i>
            <div>
                <strong>${serviceName}</strong><br>
                <small>처리 시작됨 (예상 시간: ${estimatedTime})</small>
            </div>
        `;
        
        // 스타일 추가
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 250px;
            animation: slideInRight 0.5s ease;
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => {
                if (document.body.contains(alertDiv)) {
                    document.body.removeChild(alertDiv);
                }
            }, 500);
        }, 4000);
    }
    }

    // 성공 메시지 표시
    showSuccessMessage() {
        // 애니메이션 효과
        const resultContainer = document.querySelector('.result-container');
        if (resultContainer) {
            resultContainer.style.animation = 'fadeInUp 0.8s ease';
        }

        // 포인트 적립 알림
        const user = authManager?.getCurrentUser();
        if (user && user.points) {
            const points = Math.floor(parseInt(this.paymentData.amount) * 0.01);
            if (points > 0) {
                setTimeout(() => {
                    this.showPointsAlert(points);
                }, 1500);
            }
        }
    }

    // 포인트 적립 알림
    showPointsAlert(points) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'points-alert';
        alertDiv.innerHTML = `
            <i class="fas fa-gift"></i>
            <span>${points}P가 적립되었습니다!</span>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.style.animation = 'slideInRight 0.5s ease';
        }, 100);
        
        setTimeout(() => {
            alertDiv.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => {
                document.body.removeChild(alertDiv);
            }, 500);
        }, 3000);
    }

    // 에러 표시
    showError(message) {
        alert(`❌ ${message}`);
        // 에러 발생시 서비스 페이지로 리다이렉트
        setTimeout(() => {
            window.location.href = 'services.html';
        }, 2000);
    }
}

// 전역 함수들
function goToDashboard() {
    if (authManager?.isAuthenticated()) {
        window.location.href = 'dashboard.html';
    } else {
        alert('로그인이 필요합니다.');
        window.location.href = 'index.html';
    }
}

function goToServices() {
    window.location.href = 'services.html';
}

function downloadReceipt() {
    const receiptBtn = document.getElementById('receiptBtn');
    const receiptUrl = receiptBtn.getAttribute('data-receipt-url');
    
    if (receiptUrl) {
        window.open(receiptUrl, '_blank');
    } else {
        // 자체 영수증 생성
        generateCustomReceipt();
    }
}

function generateCustomReceipt() {
    const orderId = document.getElementById('orderId').textContent;
    const orderName = document.getElementById('orderName').textContent;
    const amount = document.getElementById('amount').textContent;
    const method = document.getElementById('method').textContent;
    const approvedAt = document.getElementById('approvedAt').textContent;

    const receiptContent = `
===========================================
          SOCIAL MARKETING PRO
              결제 영수증
===========================================

주문번호: ${orderId}
서비스명: ${orderName}
결제금액: ${amount}
결제방법: ${method}
결제일시: ${approvedAt}

===========================================
문의: support@socialmarketingpro.com
전화: 1588-1234
===========================================
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${orderId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', function() {
    new PaymentSuccessManager();
});