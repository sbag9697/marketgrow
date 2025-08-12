# 💳 KG이니시스 실제 결제 연동 가이드

## 1. KG이니시스 가맹점 가입

### 1.1 가맹점 신청
1. https://www.inicis.com 접속
2. "가맹점 가입" 클릭
3. 필요 서류:
   - 사업자등록증
   - 통장 사본
   - 대표자 신분증
   - 온라인 쇼핑몰 URL

### 1.2 심사 기간
- 일반: 3-5 영업일
- 빠른 심사: 1-2 영업일 (추가 비용)

### 1.3 수수료
- 신용카드: 2.5-3.5%
- 계좌이체: 1.5-2%
- 가상계좌: 건당 200-300원

## 2. 테스트 환경 설정

### 2.1 테스트 MID 발급
```
테스트 MID: INIpayTest
테스트 Sign Key: SU5JTElURV9UUklQTEVERVNfS0VZU19=
```

### 2.2 테스트 카드 정보
```
카드번호: 5365-0000-0000-0003
유효기간: 12/25
CVC: 123
비밀번호: 00
```

## 3. 실제 결제 연동

### 3.1 발급받은 정보 설정
```javascript
// js/kg-inicis.js 수정
const INICIS_CONFIG = {
    IS_TEST_MODE: false,  // false로 변경
    TEST_MID: 'INIpayTest',
    PRODUCTION_MID: 'YOUR_REAL_MID',  // 실제 MID 입력
    SIGN_KEY: 'YOUR_REAL_SIGN_KEY',   // 실제 Sign Key 입력
};
```

### 3.2 백엔드 환경 변수 업데이트
```env
# Railway 환경 변수
INICIS_MID=YOUR_REAL_MID
INICIS_SIGN_KEY=YOUR_REAL_SIGN_KEY
INICIS_API_KEY=YOUR_API_KEY
INICIS_API_URL=https://iniapi.inicis.com
```

### 3.3 웹훅 설정
1. KG이니시스 관리자 페이지 접속
2. 웹훅 URL 설정:
```
https://your-backend.up.railway.app/api/payments/webhook
```

## 4. PG사 대안 (더 빠른 승인)

### 4.1 토스페이먼츠 (당일 승인 가능)
- 온라인 신청 즉시 테스트
- 서류 제출 후 1-2일 승인
- 수수료: 2.5-2.9%
- https://www.tosspayments.com

### 4.2 아임포트 (통합 PG)
- 여러 PG사 통합 관리
- 빠른 심사 (1-2일)
- 수수료: PG사 수수료 + 0.5%
- https://iamport.kr

### 4.3 페이플 (간편 결제)
- 소규모 사업자 특화
- 당일 승인 가능
- 수수료: 3.2%
- https://www.payple.kr

## 5. 테스트 결제 프로세스

### 5.1 테스트 시나리오
```javascript
// 테스트 주문 생성
const testOrder = {
    serviceName: "인스타그램 팔로워 100개",
    amount: 1000,  // 1,000원 (최소 금액)
    customerName: "테스트",
    customerEmail: "test@test.com"
};

// 결제 요청
const payment = new KGInicisPayment();
payment.requestPayment(testOrder);
```

### 5.2 테스트 체크리스트
- [ ] 결제창 정상 호출
- [ ] 카드 결제 성공
- [ ] 계좌이체 성공
- [ ] 가상계좌 발급
- [ ] 결제 취소 처리
- [ ] 부분 취소 처리
- [ ] 영수증 발급

## 6. 보안 설정

### 6.1 필수 보안 항목
```javascript
// 결제 검증 로직 (백엔드)
const verifyPayment = async (paymentData) => {
    // 1. 금액 검증
    if (order.amount !== paymentData.amount) {
        throw new Error('금액 불일치');
    }
    
    // 2. 서명 검증
    const signature = generateSignature(paymentData);
    if (signature !== paymentData.signature) {
        throw new Error('서명 검증 실패');
    }
    
    // 3. 중복 결제 체크
    const existing = await Payment.findOne({ tid: paymentData.tid });
    if (existing) {
        throw new Error('중복 결제');
    }
};
```

### 6.2 SSL 인증서 확인
- Netlify: 자동 SSL 제공
- Railway: 자동 SSL 제공
- 커스텀 도메인: Let's Encrypt 무료 SSL

## 7. 정산 설정

### 7.1 정산 주기
- D+2: 결제일로부터 2영업일 후
- D+1: 결제일로부터 1영업일 후 (추가 수수료)
- D+0: 당일 정산 (프리미엄)

### 7.2 정산 계좌 등록
1. KG이니시스 관리자 페이지
2. 정산 관리 → 계좌 정보
3. 계좌 인증 완료

## 8. 운영 준비

### 8.1 환불 정책 작성
```markdown
# 환불 정책
- 서비스 시작 전: 100% 환불
- 진행률 30% 미만: 70% 환불
- 진행률 30-70%: 50% 환불
- 진행률 70% 이상: 환불 불가
```

### 8.2 고객 지원 준비
- CS 이메일: support@marketgrow.com
- 카카오톡 채널: @marketgrow
- 대응 시간: 평일 09:00-18:00

## 9. 법적 준수 사항

### 9.1 필수 표시 사항
- [ ] 사업자 정보 표시
- [ ] 이용약관
- [ ] 개인정보처리방침
- [ ] 환불/취소 정책
- [ ] 고객센터 정보

### 9.2 전자상거래법 준수
- 청약철회 기간: 7일
- 구매 확인 메일 발송
- 세금계산서 발급

## 10. 모니터링

### 10.1 결제 대시보드
```javascript
// 관리자 대시보드에 추가
const paymentStats = {
    todayPayments: 0,      // 오늘 결제 건수
    todayRevenue: 0,       // 오늘 매출
    failedPayments: 0,     // 실패 건수
    refundRequests: 0,     // 환불 요청
    conversionRate: 0      // 결제 전환율
};
```

### 10.2 알림 설정
- 결제 성공 시 이메일/SMS
- 결제 실패 시 관리자 알림
- 일일 정산 리포트

## 🚨 긴급 연락처

### KG이니시스
- 기술지원: 1588-4954
- 이메일: support@inicis.com
- 24시간 장애: 1588-4370

### 대체 PG사
- 토스페이먼츠: 1544-7772
- 아임포트: 1670-5176
- 페이플: 1522-5013

## ✅ 실전 체크리스트

### 오늘 바로 할 일
1. [ ] KG이니시스 가맹점 신청
2. [ ] 테스트 결제 구현 확인
3. [ ] 환불 정책 작성
4. [ ] 이용약관 작성

### 3일 내 완료
1. [ ] 실제 MID 발급 확인
2. [ ] 정산 계좌 등록
3. [ ] CS 채널 개설
4. [ ] 법적 문서 게시

### 1주일 내 완료
1. [ ] 실제 결제 테스트
2. [ ] 정산 프로세스 확인
3. [ ] 세금계산서 발급 테스트
4. [ ] 모니터링 시스템 구축