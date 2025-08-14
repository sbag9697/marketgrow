# 💳 KG이니시스 결제 연동 가이드

## 1. KG이니시스 가입 및 계약

### 1.1 가맹점 가입
1. [KG이니시스 홈페이지](https://www.inicis.com) 접속
2. 사업자 회원가입
3. 필요 서류:
   - 사업자등록증 (154-38-01411)
   - 통장 사본
   - 대표자 신분증

### 1.2 서비스 신청
- 상품: 웹표준결제 (INIpay Standard)
- 결제수단: 신용카드, 가상계좌, 계좌이체

## 2. 상점 정보 받기

가입 승인 후 받게 되는 정보:
```
상점 ID (MID): (실제 발급받은 MID)
Sign Key: (실제 발급받은 키)
API Key: (실제 발급받은 API 키)
```

## 3. 코드 설정 변경

### 3.1 결제 설정 파일 수정
`js/payment-complete.js` 파일에서:

```javascript
// 현재 (테스트)
const INICIS_CONFIG = {
    mid: 'INIpayTest',
    signKey: 'SU5JTElURV9UUklQTEVERVNfS0VZU1RS',
    // ...
};

// 변경 (실제)
const INICIS_CONFIG = {
    mid: '실제_상점_ID',
    signKey: '실제_Sign_Key',
    // ...
};
```

### 3.2 환불 설정 파일 수정
`js/refund-system.js` 파일에서:

```javascript
// 현재 (테스트)
const INICIS_REFUND_CONFIG = {
    mid: 'INIpayTest',
    signKey: 'SU5JTElURV9UUklQTEVERVNfS0VZU1RS',
    // ...
};

// 변경 (실제)
const INICIS_REFUND_CONFIG = {
    mid: '실제_상점_ID',
    signKey: '실제_Sign_Key',
    // ...
};
```

### 3.3 백엔드 환경변수 설정
`backend/.env` 파일에:

```env
# KG이니시스 설정
INICIS_MID=실제_상점_ID
INICIS_SIGN_KEY=실제_Sign_Key
INICIS_API_KEY=실제_API_Key
INICIS_API_URL=https://iniapi.inicis.com/api/v1
```

## 4. 테스트 모드 → 운영 모드

### 4.1 URL 변경
- 테스트: `https://stgstdpay.inicis.com/stdjs/INIStdPay.js`
- 운영: `https://stdpay.inicis.com/stdjs/INIStdPay.js`

### 4.2 payment.html 수정
```html
<!-- 테스트 -->
<script src="https://stgstdpay.inicis.com/stdjs/INIStdPay.js"></script>

<!-- 운영 -->
<script src="https://stdpay.inicis.com/stdjs/INIStdPay.js"></script>
```

## 5. 웹훅 설정

KG이니시스 관리자 페이지에서:
1. 웹훅 URL 설정: `https://marketgrow-production-c586.up.railway.app/api/payments/inicis/webhook`
2. 알림 설정:
   - 결제 완료
   - 결제 취소
   - 가상계좌 입금

## 6. 테스트 체크리스트

### 6.1 결제 테스트
- [ ] 신용카드 결제 (1,000원)
- [ ] 가상계좌 발급
- [ ] 계좌이체 결제

### 6.2 환불 테스트
- [ ] 전체 환불
- [ ] 부분 환불

### 6.3 오류 처리
- [ ] 잔액 부족
- [ ] 카드 한도 초과
- [ ] 네트워크 오류

## 7. 정산 설정

### 7.1 정산 계좌
- 은행: (은행명)
- 계좌번호: (계좌번호)
- 예금주: SNS그로우 (박시현)

### 7.2 정산 주기
- 기본: D+2 (영업일 기준)
- 수수료: 3.3% (VAT 별도)

## 8. 관리자 페이지

- URL: https://iniweb.inicis.com
- ID: (발급받은 ID)
- PW: (설정한 비밀번호)

## 9. 고객센터

- KG이니시스 기술지원: 1588-4954
- 이메일: tech@inicis.com
- 운영시간: 평일 09:00~18:00

## ⚠️ 주의사항

1. **Sign Key는 절대 외부 노출 금지**
2. **프론트엔드에 키 직접 노출 금지** (백엔드 경유)
3. **정기적인 비밀번호 변경**
4. **IP 제한 설정 권장**
5. **테스트 후 반드시 운영 모드로 전환**

---

## 현재 상태: ⏳ 대기중

필요한 작업:
1. KG이니시스 가맹점 가입 신청
2. 계약 완료 후 상점 정보 받기
3. 코드에 실제 값 적용
4. 테스트 진행
5. 운영 모드 전환