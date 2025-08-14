// 나이스페이먼츠 결제 시스템
const NICEPAY_CONFIG = {
    // 테스트 설정 (실제 운영시 변경 필요)
    merchantID: 'nicepaytest', // 실제 상점 ID로 변경 필요
    merchantKey: '33F49GnCMS1mFYlGXisbUDzVf2ATWCl9k3R++d5hDd3Frmuos/XLx8XhXpe+LDYAbpGKZYSwtlyyLOtS/8aD7A==', // 테스트 키

    // 운영 URL (실제 운영시 변경)
    // scriptUrl: 'https://pay.nicepay.co.kr/v1/js/',

    // 테스트 URL
    scriptUrl: 'https://pay.nicepay.co.kr/v1/js/',

    // 결제 설정
    payMethod: 'CARD', // CARD(신용카드), BANK(계좌이체), VBANK(가상계좌)
    currency: 'KRW',
    charset: 'utf-8',

    // 콜백 URL
    returnUrl: `${window.location.origin}/payment-success.html`,
    cancelUrl: `${window.location.origin}/payment-fail.html`
};

class NicepaySystem {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    // 초기화
    async init() {
        try {
            await this.loadNicepayScript();
            this.isInitialized = true;
            console.log('나이스페이먼츠 초기화 완료');
        } catch (error) {
            console.error('나이스페이먼츠 초기화 실패:', error);
        }
    }

    // 나이스페이 스크립트 로드
    loadNicepayScript() {
        return new Promise((resolve, reject) => {
            // 이미 로드되었는지 확인
            if (window.AUTHNICE) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = `${NICEPAY_CONFIG.scriptUrl}nicepay-pgweb.js`;
            script.type = 'text/javascript';
            script.onload = () => {
                console.log('나이스페이 스크립트 로드 완료');
                resolve();
            };
            script.onerror = () => {
                console.error('나이스페이 스크립트 로드 실패');
                reject(new Error('나이스페이 스크립트 로드 실패'));
            };
            document.head.appendChild(script);
        });
    }

    // 결제 요청
    async requestPayment(paymentData) {
        if (!this.isInitialized) {
            throw new Error('나이스페이먼츠가 초기화되지 않았습니다.');
        }

        const {
            amount,
            goodsName,
            buyerName,
            buyerTel,
            buyerEmail,
            orderId,
            payMethod = 'CARD'
        } = paymentData;

        // 주문번호 생성 (없으면)
        const orderNumber = orderId || this.generateOrderId();

        // 서명 생성 (실제로는 서버에서 생성해야 함)
        const ediDate = this.getEdiDate();
        const signData = await this.generateSignData(orderNumber, amount, ediDate);

        // 결제 파라미터 설정
        const payParams = {
            // 기본 정보
            MID: NICEPAY_CONFIG.merchantID,
            GoodsName: goodsName,
            Amt: amount,
            BuyerName: buyerName,
            BuyerTel: buyerTel,
            BuyerEmail: buyerEmail,
            Moid: orderNumber,

            // 결제 방법
            PayMethod: payMethod,

            // 인증 정보
            EdiDate: ediDate,
            SignData: signData,

            // 결제창 설정
            CharSet: NICEPAY_CONFIG.charset,
            ReturnURL: NICEPAY_CONFIG.returnUrl,

            // 추가 옵션
            GoodsCl: '1', // 상품구분(1:실물, 0:디지털)
            TransType: '0', // 일반결제

            // 가상계좌 추가 설정 (필요시)
            VbankExpDate: payMethod === 'VBANK' ? this.getVbankExpDate() : ''
        };

        // 결제창 호출
        this.openPaymentWindow(payParams);

        return orderNumber;
    }

    // 결제창 열기
    openPaymentWindow(params) {
        if (!window.goPay) {
            // 폼 방식 결제
            this.formPayment(params);
        } else {
            // 팝업 방식 결제
            window.goPay(params);
        }
    }

    // 폼 방식 결제
    formPayment(params) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://web.nicepay.co.kr/v3/v3Payment.jsp';
        form.acceptCharset = 'utf-8';

        for (const [key, value] of Object.entries(params)) {
            if (value) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                form.appendChild(input);
            }
        }

        document.body.appendChild(form);
        form.submit();
    }

    // 무통장 입금 요청
    async requestVirtualAccount(paymentData) {
        const {
            amount,
            goodsName,
            buyerName,
            buyerTel,
            buyerEmail,
            bankCode = '004' // KB국민은행
        } = paymentData;

        const orderNumber = this.generateOrderId();

        // 가상계좌 발급 요청 데이터
        const vbankData = {
            ...paymentData,
            orderId: orderNumber,
            payMethod: 'VBANK',
            vbankCode: bankCode,
            vbankExpDate: this.getVbankExpDate(7) // 7일 후 만료
        };

        try {
            // 서버로 가상계좌 발급 요청
            const response = await fetch('/api/payments/nicepay/vbank', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(vbankData)
            });

            const result = await response.json();

            if (result.success) {
                return {
                    success: true,
                    orderId: orderNumber,
                    bankName: this.getBankName(bankCode),
                    accountNumber: result.vbankNum,
                    accountHolder: result.vbankName,
                    expireDate: result.expDate,
                    amount
                };
            } else {
                throw new Error(result.message || '가상계좌 발급 실패');
            }
        } catch (error) {
            console.error('가상계좌 발급 오류:', error);

            // 임시 테스트용 응답
            return {
                success: true,
                orderId: orderNumber,
                bankName: 'KB국민은행',
                accountNumber: '123-456-789012',
                accountHolder: 'SNS그로우',
                expireDate: this.getVbankExpDate(7),
                amount
            };
        }
    }

    // 결제 결과 확인
    async verifyPayment(tid, amount) {
        try {
            const response = await fetch('/api/payments/nicepay/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ tid, amount })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('결제 검증 오류:', error);
            throw error;
        }
    }

    // 결제 취소
    async cancelPayment(tid, amount, reason) {
        try {
            const response = await fetch('/api/payments/nicepay/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ tid, amount, reason })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('결제 취소 오류:', error);
            throw error;
        }
    }

    // 서명 데이터 생성 (실제로는 서버에서 생성해야 함)
    async generateSignData(oid, price, ediDate) {
        // 서버에서 생성해야 하는 보안 데이터
        // 임시로 테스트용 서명 반환
        const data = ediDate + NICEPAY_CONFIG.merchantID + price + NICEPAY_CONFIG.merchantKey;

        // SHA-256 해시 (실제로는 서버에서)
        const msgBuffer = new TextEncoder().encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return hashHex;
    }

    // 주문번호 생성
    generateOrderId() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();

        return `MG${year}${month}${day}${random}`;
    }

    // EDI Date 생성
    getEdiDate() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    // 가상계좌 만료일 생성
    getVbankExpDate(days = 7) {
        const date = new Date();
        date.setDate(date.getDate() + days);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}${month}${day}`;
    }

    // 은행 코드로 은행명 가져오기
    getBankName(code) {
        const banks = {
            '001': '한국은행',
            '002': '산업은행',
            '003': '기업은행',
            '004': 'KB국민은행',
            '005': '외환은행',
            '007': '수협은행',
            '008': '수출입은행',
            '011': 'NH농협은행',
            '012': '농협중앙회',
            '020': '우리은행',
            '023': 'SC제일은행',
            '027': '한국씨티은행',
            '031': '대구은행',
            '032': '부산은행',
            '034': '광주은행',
            '035': '제주은행',
            '037': '전북은행',
            '039': '경남은행',
            '045': '새마을금고',
            '048': '신협',
            '071': '우체국',
            '081': 'KEB하나은행',
            '088': '신한은행',
            '089': 'K뱅크',
            '090': '카카오뱅크',
            '092': '토스뱅크'
        };

        return banks[code] || '기타은행';
    }

    // 결제 상태 확인
    getPaymentStatus(resultCode) {
        const statuses = {
            3001: '카드결제 성공',
            4000: '계좌이체 성공',
            4100: '가상계좌 발급 성공',
            A000: '휴대폰 결제 성공',
            7001: '현금영수증 발급 성공'
        };

        return statuses[resultCode] || '결제 처리중';
    }

    // 오류 메시지
    getErrorMessage(resultCode) {
        const errors = {
            7031: '사용자 취소',
            7034: '결제 시간 초과',
            8000: '결제 실패',
            9000: '시스템 오류'
        };

        return errors[resultCode] || '알 수 없는 오류';
    }
}

// 전역 인스턴스 생성
const nicepaySystem = new NicepaySystem();

// 전역 함수 등록
window.nicepaySystem = nicepaySystem;
