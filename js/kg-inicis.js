// KG이니시스 결제 모듈
(function() {
    'use strict';

    // KG이니시스 설정
    const INICIS_CONFIG = {
        // 가맹점 정보 (실제 값으로 교체 필요)
        MID: window.INICIS_MID || 'INIpayTest', // 테스트용 MID
        // 운영 환경에서는 실제 MID 사용: 'your_actual_mid'
        
        // 결제 환경 설정
        IS_TEST_MODE: window.location.hostname === 'localhost' || window.INICIS_TEST_MODE === true,
        
        // 결제 완료 후 리다이렉트 URL
        RETURN_URL: window.location.origin + '/payment-success.html',
        CLOSE_URL: window.location.origin + '/payment-fail.html',
        
        // 결제 창 옵션
        GOPAYMETHOD: '', // 결제수단 (비워두면 전체 표시)
        ACCEPTMETHOD: 'HPP(1):below1000:va_receipt', // 추가 옵션
        
        // 결제 가능 수단
        PAYMENT_METHODS: {
            CARD: 'Card',           // 신용카드
            DIRECTBANK: 'DirectBank', // 계좌이체
            VBANK: 'VBank',         // 가상계좌
            MOBILE: 'HPP',          // 휴대폰결제
            CULTURE: 'Culture',     // 문화상품권
            HAPPYMONEY: 'Hpmn',     // 해피머니
            KAKAOPAY: 'Kakaopay',   // 카카오페이
            NAVERPAY: 'Naverpay',   // 네이버페이
            SAMSUNGPAY: 'Ssgpay',   // 삼성페이
            LPAY: 'Lpay',           // L페이
            PAYCO: 'Payco'          // 페이코
        }
    };

    // KG이니시스 결제 클래스
    class KGInicisPayment {
        constructor() {
            this.orderData = null;
            this.init();
        }

        init() {
            // KG이니시스 스크립트 동적 로드
            this.loadInicisScript();
        }

        // 이니시스 스크립트 로드
        loadInicisScript() {
            const scriptUrl = INICIS_CONFIG.IS_TEST_MODE 
                ? 'https://stgstdpay.inicis.com/stdjs/INIStdPay.js'
                : 'https://stdpay.inicis.com/stdjs/INIStdPay.js';

            // 이미 로드되었는지 확인
            if (document.querySelector(`script[src="${scriptUrl}"]`)) {
                return;
            }

            const script = document.createElement('script');
            script.src = scriptUrl;
            script.charset = 'UTF-8';
            script.onload = () => {
                console.log('KG이니시스 SDK 로드 완료');
            };
            script.onerror = () => {
                console.error('KG이니시스 SDK 로드 실패');
            };
            document.head.appendChild(script);
        }

        // 주문 ID 생성
        generateOrderId() {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 9);
            return `ORD_${timestamp}_${random}`;
        }

        // 타임스탬프 생성 (YYYYMMDDHHmmss)
        getTimestamp() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            return `${year}${month}${day}${hours}${minutes}${seconds}`;
        }

        // 서명 생성 (서버에서 처리하는 것이 안전)
        async generateSignature(data) {
            // 실제 환경에서는 서버 API를 호출하여 서명 생성
            if (!INICIS_CONFIG.IS_TEST_MODE) {
                try {
                    const response = await fetch('/api/payment/signature', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': window.SecurityUtils?.CSRFToken?.get() || ''
                        },
                        body: JSON.stringify(data)
                    });
                    const result = await response.json();
                    return result.signature;
                } catch (error) {
                    console.error('서명 생성 실패:', error);
                    throw error;
                }
            }
            
            // 테스트 모드에서는 더미 서명 반환
            return 'test_signature_' + Date.now();
        }

        // 결제 요청
        async requestPayment(orderData) {
            try {
                // 주문 데이터 저장
                this.orderData = orderData;

                // 필수 파라미터 검증
                if (!orderData.amount || !orderData.productName || !orderData.buyerName || !orderData.buyerEmail) {
                    throw new Error('필수 결제 정보가 누락되었습니다.');
                }

                // 주문 ID 생성
                const orderId = orderData.orderId || this.generateOrderId();
                const timestamp = this.getTimestamp();

                // 결제 요청 데이터 구성
                const paymentData = {
                    // 기본 정보
                    version: '1.0',
                    mid: INICIS_CONFIG.MID,
                    oid: orderId,
                    price: orderData.amount,
                    timestamp: timestamp,
                    
                    // 상품 정보
                    goodname: orderData.productName,
                    
                    // 구매자 정보
                    buyername: orderData.buyerName,
                    buyertel: orderData.buyerPhone || '',
                    buyeremail: orderData.buyerEmail,
                    
                    // 결제 옵션
                    gopaymethod: orderData.paymentMethod || INICIS_CONFIG.GOPAYMETHOD,
                    acceptmethod: INICIS_CONFIG.ACCEPTMETHOD,
                    currency: 'WON',
                    
                    // URL 설정
                    returnUrl: INICIS_CONFIG.RETURN_URL,
                    closeUrl: INICIS_CONFIG.CLOSE_URL,
                    
                    // 추가 데이터
                    merchantData: JSON.stringify({
                        serviceId: orderData.serviceId,
                        quantity: orderData.quantity,
                        userId: orderData.userId
                    })
                };

                // 서명 생성 (실제 환경에서는 서버에서 처리)
                paymentData.signature = await this.generateSignature(paymentData);
                paymentData.verification = await this.generateSignature(paymentData);

                // 세션 스토리지에 주문 정보 저장
                sessionStorage.setItem('currentOrder', JSON.stringify({
                    orderId: orderId,
                    ...orderData
                }));

                // KG이니시스 결제창 호출
                this.openPaymentWindow(paymentData);

            } catch (error) {
                console.error('결제 요청 실패:', error);
                this.handlePaymentError(error);
            }
        }

        // 결제창 열기
        openPaymentWindow(paymentData) {
            // INIStdPay가 로드되었는지 확인
            if (typeof INIStdPay === 'undefined') {
                console.error('KG이니시스 SDK가 로드되지 않았습니다.');
                alert('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
                return;
            }

            // 결제 폼 생성
            const form = document.createElement('form');
            form.id = 'inicis_payment_form';
            form.method = 'POST';
            form.acceptCharset = 'UTF-8';
            form.style.display = 'none';

            // 폼 필드 추가
            Object.keys(paymentData).forEach(key => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = paymentData[key];
                form.appendChild(input);
            });

            // 폼을 body에 추가
            document.body.appendChild(form);

            // 결제창 열기
            INIStdPay.pay('inicis_payment_form');
        }

        // 결제 결과 처리
        async processPaymentResult(resultData) {
            try {
                // 결과 검증
                if (!resultData.resultCode || resultData.resultCode !== '00') {
                    throw new Error(resultData.resultMsg || '결제 처리 중 오류가 발생했습니다.');
                }

                // 서버에 결제 확인 요청
                const response = await fetch('/api/payment/confirm', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'X-CSRF-Token': window.SecurityUtils?.CSRFToken?.get() || ''
                    },
                    body: JSON.stringify({
                        orderId: resultData.MOID,
                        tid: resultData.tid,
                        amount: resultData.TotPrice,
                        paymentMethod: resultData.payMethod,
                        authCode: resultData.authCode,
                        authDate: resultData.authDate
                    })
                });

                const result = await response.json();

                if (result.success) {
                    // 결제 성공 처리
                    this.handlePaymentSuccess(result);
                } else {
                    throw new Error(result.message || '결제 확인 실패');
                }

            } catch (error) {
                console.error('결제 결과 처리 실패:', error);
                this.handlePaymentError(error);
            }
        }

        // 결제 성공 처리
        handlePaymentSuccess(result) {
            // 세션 스토리지 정리
            sessionStorage.removeItem('currentOrder');

            // 성공 메시지 표시
            if (window.NotificationManager) {
                window.NotificationManager.success('결제가 완료되었습니다.');
            }

            // 결제 성공 페이지로 이동
            window.location.href = `/payment-success.html?orderId=${result.orderId}`;
        }

        // 결제 실패 처리
        handlePaymentError(error) {
            // 에러 메시지 표시
            const message = error.message || '결제 처리 중 오류가 발생했습니다.';
            
            if (window.NotificationManager) {
                window.NotificationManager.error(message);
            } else {
                alert(message);
            }

            // 결제 실패 페이지로 이동
            window.location.href = `/payment-fail.html?error=${encodeURIComponent(message)}`;
        }

        // 결제 취소
        async cancelPayment(tid, cancelReason) {
            try {
                const response = await fetch('/api/payment/cancel', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'X-CSRF-Token': window.SecurityUtils?.CSRFToken?.get() || ''
                    },
                    body: JSON.stringify({
                        tid: tid,
                        cancelReason: cancelReason
                    })
                });

                const result = await response.json();

                if (result.success) {
                    if (window.NotificationManager) {
                        window.NotificationManager.success('결제가 취소되었습니다.');
                    }
                    return result;
                } else {
                    throw new Error(result.message || '결제 취소 실패');
                }

            } catch (error) {
                console.error('결제 취소 실패:', error);
                if (window.NotificationManager) {
                    window.NotificationManager.error(error.message);
                }
                throw error;
            }
        }

        // 결제 내역 조회
        async getPaymentHistory() {
            try {
                const response = await fetch('/api/payment/history', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'X-CSRF-Token': window.SecurityUtils?.CSRFToken?.get() || ''
                    }
                });

                const result = await response.json();
                return result;

            } catch (error) {
                console.error('결제 내역 조회 실패:', error);
                throw error;
            }
        }
    }

    // 전역 객체로 export
    window.KGInicisPayment = new KGInicisPayment();

    // 결제 헬퍼 함수들
    window.inicisPayment = {
        // 간편 결제 요청
        pay: (orderData) => {
            return window.KGInicisPayment.requestPayment(orderData);
        },

        // 결제 취소
        cancel: (tid, reason) => {
            return window.KGInicisPayment.cancelPayment(tid, reason);
        },

        // 결제 내역 조회
        getHistory: () => {
            return window.KGInicisPayment.getPaymentHistory();
        },

        // 결제 수단 목록
        methods: INICIS_CONFIG.PAYMENT_METHODS
    };

})();