// 결제 시스템 통합 JavaScript
class PaymentManager {
    constructor() {
        this.tossPayments = null;
        this.currentPaymentData = null;
        this.initTossPayments();
    }

    // 토스페이먼츠 초기화
    initTossPayments() {
        // 토스페이먼츠 클라이언트 키 (테스트용)
        const clientKey = 'test_ck_4yKeq5bgrpWzD1k5BzQ8KfYgZdXJ';

        // 토스페이먼츠 SDK 로드 확인
        if (typeof TossPayments !== 'undefined') {
            this.tossPayments = TossPayments(clientKey);
        } else {
            console.error('토스페이먼츠 SDK가 로드되지 않았습니다.');
        }
    }

    // 결제 요청
    async requestPayment(paymentData) {
        const { method, orderData } = paymentData;

        switch (method) {
            case 'card':
                return await this.requestTossCardPayment(orderData);
            case 'bank':
                return await this.requestBankTransfer(orderData);
            case 'paypal':
                return await this.requestPayPalPayment(orderData);
            default:
                throw new Error('지원하지 않는 결제 방법입니다.');
        }
    }

    // 토스페이먼츠 카드 결제
    async requestTossCardPayment(orderData) {
        if (!this.tossPayments) {
            throw new Error('토스페이먼츠가 초기화되지 않았습니다.');
        }

        try {
            const paymentRequest = {
                amount: orderData.totalPrice,
                orderId: this.generateOrderId(),
                orderName: this.generateOrderName(orderData),
                customerName: orderData.customerName || '고객',
                customerEmail: orderData.customerEmail || 'customer@example.com',
                successUrl: `${window.location.origin}/payment-success.html`,
                failUrl: `${window.location.origin}/payment-fail.html`
            };

            // 결제 정보 저장 (결제 완료 후 사용)
            this.currentPaymentData = {
                ...paymentRequest,
                orderData
            };
            localStorage.setItem('currentPaymentData', JSON.stringify(this.currentPaymentData));

            // 토스페이먼츠 결제창 호출
            await this.tossPayments.requestPayment('카드', paymentRequest);
        } catch (error) {
            console.error('토스페이먼츠 결제 오류:', error);
            throw new Error('결제 처리 중 오류가 발생했습니다.');
        }
    }

    // 무통장입금 처리
    async requestBankTransfer(orderData) {
        try {
            // 백엔드에 무통장입금 주문 생성 요청
            const response = await api.createBankTransferOrder({
                orderData,
                paymentMethod: 'bank',
                amount: orderData.totalPrice
            });

            if (response.success) {
                // 무통장입금 안내 페이지로 이동
                window.location.href = `bank-transfer.html?orderId=${response.data.orderId}&account=${response.data.account}`;
            } else {
                throw new Error(response.message || '무통장입금 주문 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('무통장입금 처리 오류:', error);
            throw error;
        }
    }

    // PayPal 결제 처리
    async requestPayPalPayment(orderData) {
        try {
            // PayPal SDK 확인
            if (typeof paypal === 'undefined') {
                throw new Error('PayPal SDK가 로드되지 않았습니다.');
            }

            // PayPal 결제 요청
            const paymentRequest = {
                amount: orderData.totalPrice,
                currency: 'KRW',
                orderData
            };

            // PayPal 결제창 호출 (실제로는 PayPal SDK 사용)
            return await this.processPayPalPayment(paymentRequest);
        } catch (error) {
            console.error('PayPal 결제 오류:', error);
            throw new Error('PayPal 결제 처리 중 오류가 발생했습니다.');
        }
    }

    // PayPal 결제 처리 (시뮬레이션)
    async processPayPalPayment(paymentRequest) {
        return new Promise((resolve, reject) => {
            // PayPal 결제 시뮬레이션
            setTimeout(() => {
                // 실제로는 PayPal API 호출
                const success = Math.random() > 0.1; // 90% 성공률

                if (success) {
                    resolve({
                        success: true,
                        paymentId: `PP_${Date.now()}`,
                        transactionId: `TX_${Date.now()}`,
                        amount: paymentRequest.amount
                    });
                } else {
                    reject(new Error('PayPal 결제가 취소되었습니다.'));
                }
            }, 2000);
        });
    }

    // 결제 성공 처리
    async handlePaymentSuccess(paymentKey, orderId, amount) {
        try {
            // 토스페이먼츠 결제 승인 요청
            const confirmResponse = await api.confirmTossPayment({
                paymentKey,
                orderId,
                amount
            });

            if (confirmResponse.success) {
                // 주문 생성
                const paymentData = JSON.parse(localStorage.getItem('currentPaymentData') || '{}');
                const orderResponse = await api.createOrder({
                    ...paymentData.orderData,
                    paymentId: paymentKey,
                    paymentStatus: 'completed',
                    transactionId: orderId
                });

                if (orderResponse.success) {
                    // 결제 데이터 정리
                    localStorage.removeItem('currentPaymentData');

                    // 주문 완료 페이지로 이동
                    window.location.href = `order-success.html?orderId=${orderResponse.data.order._id}`;
                } else {
                    throw new Error('주문 생성에 실패했습니다.');
                }
            } else {
                throw new Error('결제 승인에 실패했습니다.');
            }
        } catch (error) {
            console.error('결제 성공 처리 오류:', error);
            // 결제 실패 페이지로 이동
            window.location.href = `payment-fail.html?error=${encodeURIComponent(error.message)}`;
        }
    }

    // 결제 실패 처리
    handlePaymentFailure(errorCode, errorMessage, orderId) {
        console.error('결제 실패:', errorCode, errorMessage);

        // 결제 실패 정보 저장
        localStorage.setItem('paymentFailure', JSON.stringify({
            errorCode,
            errorMessage,
            orderId,
            timestamp: new Date().toISOString()
        }));

        // 결제 실패 페이지로 이동
        window.location.href = `payment-fail.html?code=${errorCode}&message=${encodeURIComponent(errorMessage)}`;
    }

    // 주문 ID 생성
    generateOrderId() {
        return `MG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 주문명 생성
    generateOrderName(orderData) {
        const serviceName = orderData.service?.name || '마케팅 서비스';
        const quantity = orderData.quantity || 1;

        if (quantity > 1) {
            return `${serviceName} 외 ${quantity - 1}건`;
        } else {
            return serviceName;
        }
    }

    // 결제 정보 검증
    validatePaymentData(paymentData) {
        const { orderData } = paymentData;

        if (!orderData) {
            throw new Error('주문 정보가 없습니다.');
        }

        if (!orderData.totalPrice || orderData.totalPrice <= 0) {
            throw new Error('올바른 결제 금액이 아닙니다.');
        }

        if (!orderData.service) {
            throw new Error('선택된 서비스가 없습니다.');
        }

        return true;
    }

    // 결제 가능 여부 확인
    async checkPaymentAvailability() {
        try {
            // 사용자 결제 한도 확인
            const response = await api.checkUserPaymentLimit();

            if (!response.success) {
                throw new Error('결제 가능 여부를 확인할 수 없습니다.');
            }

            return response.data;
        } catch (error) {
            console.error('결제 가능 여부 확인 오류:', error);
            return { available: true, limit: 0 };
        }
    }

    // 할인 쿠폰 적용
    async applyCoupon(couponCode, orderAmount) {
        try {
            const response = await api.applyCoupon({
                couponCode,
                orderAmount
            });

            return response.data;
        } catch (error) {
            console.error('쿠폰 적용 오류:', error);
            throw new Error('쿠폰 적용에 실패했습니다.');
        }
    }

    // 포인트 사용
    async usePoints(pointAmount, orderAmount) {
        try {
            const response = await api.usePoints({
                pointAmount,
                orderAmount
            });

            return response.data;
        } catch (error) {
            console.error('포인트 사용 오류:', error);
            throw new Error('포인트 사용에 실패했습니다.');
        }
    }
}

// 결제 유틸리티 함수들
const PaymentUtils = {
    // 금액 포맷팅
    formatAmount(amount) {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    },

    // 결제 방법 이름 변환
    getPaymentMethodName(method) {
        const names = {
            card: '신용카드/체크카드',
            bank: '무통장입금',
            paypal: 'PayPal',
            kakaopay: '카카오페이',
            naverpay: '네이버페이'
        };
        return names[method] || method;
    },

    // 카드사 이름 변환
    getCardCompanyName(company) {
        const companies = {
            신한카드: 'SHINHAN',
            KB국민카드: 'KOOKMIN',
            하나카드: 'HANA',
            삼성카드: 'SAMSUNG',
            현대카드: 'HYUNDAI',
            롯데카드: 'LOTTE',
            NH농협카드: 'NONGHYUP',
            우리카드: 'WOORI'
        };
        return companies[company] || company;
    },

    // 결제 에러 메시지 변환
    getErrorMessage(errorCode) {
        const messages = {
            PAY_PROCESS_CANCELED: '사용자가 결제를 취소했습니다.',
            PAY_PROCESS_ABORTED: '결제 진행 중 오류가 발생했습니다.',
            REJECT_CARD_COMPANY: '카드사에서 거절했습니다.',
            INSUFFICIENT_FUNDS: '잔액이 부족합니다.',
            INVALID_CARD: '유효하지 않은 카드입니다.',
            EXPIRED_CARD: '만료된 카드입니다.',
            NETWORK_ERROR: '네트워크 오류가 발생했습니다.'
        };
        return messages[errorCode] || '알 수 없는 오류가 발생했습니다.';
    }
};

// 전역 결제 매니저 인스턴스
const paymentManager = new PaymentManager();

// 전역 함수들
window.paymentManager = paymentManager;
window.PaymentUtils = PaymentUtils;
