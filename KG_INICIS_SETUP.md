# 💳 KG이니시스 PG 연동 가이드

## 1. KG이니시스 가입 절차

### 필요 서류
- 사업자등록증
- 법인등기부등본 (법인만)
- 통장사본
- 대표자 신분증
- 통신판매업 신고증

### Step 1: 가입 신청
1. https://www.inicis.com 접속
2. **가맹점 가입** 클릭
3. 가입 유형 선택:
   - 개인사업자
   - 법인사업자

### Step 2: 서류 제출
1. 온라인 신청서 작성
2. 필요 서류 업로드
3. 심사 대기 (1-3일)

### Step 3: 계약 체결
1. 심사 승인 후 계약서 발송
2. 전자계약 또는 서면계약
3. 상점 ID(MID) 발급

## 2. 결제 수수료

### 신용카드
- 온라인: 2.5% ~ 3.5%
- 수수료 협상 가능

### 간편결제
- 카카오페이: 2.8% ~ 3.2%
- 네이버페이: 2.9% ~ 3.3%
- 토스: 2.7% ~ 3.1%

### 기타
- 가상계좌: 300원/건
- 계좌이체: 1.8% ~ 2.2%
- 휴대폰: 5% ~ 7%

## 3. 테스트 연동

### 테스트 MID 발급
```
상점아이디: INIpayTest
상점키: SU5JTElURV9UUklQTEVERVNfS0VZU1RS
```

### 테스트 카드번호
```
카드번호: 4111-1111-1111-1111
유효기간: 12/25
CVC: 123
```

## 4. 백엔드 연동 코드

### 패키지 설치
```bash
cd backend
npm install axios crypto
```

### 결제 서비스 구현
```javascript
// backend/services/payment.service.js
const crypto = require('crypto');
const axios = require('axios');

class PaymentService {
    constructor() {
        this.mid = process.env.INICIS_MID || 'INIpayTest';
        this.signKey = process.env.INICIS_SIGN_KEY || 'SU5JTElURV9UUklQTEVERVNfS0VZU1RS';
        this.apiUrl = process.env.NODE_ENV === 'production' 
            ? 'https://iniapi.inicis.com/api/v1'
            : 'https://stginiapi.inicis.com/api/v1';
    }

    // 결제 요청
    async requestPayment(orderData) {
        const {
            orderId,
            amount,
            productName,
            customerName,
            customerEmail,
            customerPhone
        } = orderData;

        const timestamp = Date.now();
        const mKey = this.makeHash(this.signKey, 'sha256');
        const signature = this.makeSignature(orderId, amount, timestamp);

        const paymentData = {
            mid: this.mid,
            orderId,
            amount,
            productName,
            customerName,
            customerEmail,
            customerPhone,
            timestamp,
            signature,
            returnUrl: `${process.env.FRONTEND_URL}/payment-result`,
            closeUrl: `${process.env.FRONTEND_URL}/payment-cancel`
        };

        return paymentData;
    }

    // 결제 검증
    async verifyPayment(paymentResult) {
        const { tid, orderId, amount } = paymentResult;
        
        const verifyData = {
            mid: this.mid,
            tid,
            orderId,
            amount
        };

        try {
            const response = await axios.post(
                `${this.apiUrl}/receipt`,
                verifyData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Payment verification error:', error);
            throw error;
        }
    }

    // 서명 생성
    makeSignature(orderId, amount, timestamp) {
        const data = `orderId=${orderId}&amount=${amount}&timestamp=${timestamp}`;
        return this.makeHash(data, 'sha256');
    }

    // 해시 생성
    makeHash(data, algorithm) {
        return crypto.createHash(algorithm).update(data).digest('hex');
    }
}

module.exports = new PaymentService();
```

## 5. 프론트엔드 연동

### 결제 페이지 구현
```html
<!-- payment.html -->
<script src="https://stdpay.inicis.com/stdjs/INIStdPay.js"></script>

<script>
async function requestPayment(orderData) {
    try {
        // 백엔드에서 결제 데이터 받기
        const response = await fetch(`${API_URL}/payment/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        const paymentData = await response.json();

        // KG이니시스 결제창 호출
        INIStdPay.pay({
            mid: paymentData.mid,
            orderId: paymentData.orderId,
            amount: paymentData.amount,
            productName: paymentData.productName,
            customerName: paymentData.customerName,
            customerEmail: paymentData.customerEmail,
            customerPhone: paymentData.customerPhone,
            returnUrl: paymentData.returnUrl,
            closeUrl: paymentData.closeUrl,
            acceptmethod: 'HPP(1):below1000',
            signature: paymentData.signature,
            timestamp: paymentData.timestamp
        });
    } catch (error) {
        console.error('Payment request error:', error);
        alert('결제 요청 중 오류가 발생했습니다.');
    }
}

// 결제 완료 처리
async function handlePaymentResult() {
    const params = new URLSearchParams(window.location.search);
    const resultCode = params.get('resultCode');
    const resultMsg = params.get('resultMsg');
    const tid = params.get('tid');
    const orderId = params.get('orderId');

    if (resultCode === '00') {
        // 결제 성공 - 백엔드 검증
        const verification = await verifyPayment({
            tid,
            orderId,
            amount: params.get('amount')
        });

        if (verification.success) {
            window.location.href = '/payment-success.html';
        } else {
            alert('결제 검증 실패');
        }
    } else {
        // 결제 실패
        alert(`결제 실패: ${resultMsg}`);
        window.location.href = '/payment-fail.html';
    }
}
</script>
```

## 6. Railway 환경변수 설정

```
INICIS_MID=your_merchant_id
INICIS_SIGN_KEY=your_sign_key
INICIS_API_KEY=your_api_key
PAYMENT_MODE=production
```

## 7. 결제 플로우

```mermaid
1. 사용자 → 상품 선택
2. 프론트엔드 → 백엔드: 결제 요청
3. 백엔드 → 결제 데이터 생성 (서명 포함)
4. 프론트엔드 → KG이니시스: 결제창 호출
5. 사용자 → 결제 정보 입력
6. KG이니시스 → 프론트엔드: 결제 결과
7. 프론트엔드 → 백엔드: 결제 검증
8. 백엔드 → KG이니시스: 검증 API 호출
9. 백엔드 → DB: 결제 정보 저장
10. 프론트엔드 → 결제 완료 페이지
```

## 8. 보안 설정

### 화이트리스트 설정
1. 이니시스 관리자 페이지 로그인
2. **보안설정** → **IP 제한**
3. Railway 서버 IP 추가

### 웹훅 설정
```javascript
// 결제 상태 변경 알림 수신
app.post('/webhook/inicis', (req, res) => {
    const { tid, status, orderId } = req.body;
    
    // 결제 상태 업데이트
    updatePaymentStatus(orderId, status);
    
    res.status(200).send('OK');
});
```

## 9. 테스트 시나리오

### 성공 케이스
- 정상 결제
- 부분 취소
- 전체 취소

### 실패 케이스
- 잔액 부족
- 한도 초과
- 카드 정지

### 테스트 체크리스트
- [ ] 결제창 정상 호출
- [ ] 카드 결제 성공
- [ ] 간편결제 성공
- [ ] 결제 취소 성공
- [ ] 웹훅 수신 확인
- [ ] 에러 처리 확인

## 10. 관리자 페이지

### 이니시스 관리자
- URL: https://iniweb.inicis.com
- 기능:
  - 거래 내역 조회
  - 정산 확인
  - 취소/환불 처리
  - 매출 통계

### 정산 주기
- D+2 영업일 (신용카드)
- D+1 영업일 (계좌이체)

## 11. 고객 지원

### KG이니시스 고객센터
- 전화: 1588-4954
- 이메일: cs@inicis.com
- 영업시간: 평일 09:00 ~ 18:00

### 기술 지원
- 개발자 센터: https://manual.inicis.com
- API 문서: https://developers.inicis.com

## 12. 주의사항

### 필수 확인사항
- PCI DSS 준수
- 개인정보보호법 준수
- 전자금융거래법 준수
- SSL 인증서 필수

### 제한사항
- 최소 결제금액: 100원
- 최대 결제금액: 설정 가능
- 중복 결제 방지 로직 필요

---

## 대안: 토스페이먼츠 (더 간단)

KG이니시스가 복잡하다면 토스페이먼츠 추천:
- 가입 더 간단
- API 더 직관적
- 수수료 비슷 (2.7% ~ 3.2%)
- 당일 심사 가능

**토스페이먼츠 바로가기**: https://www.tosspayments.com