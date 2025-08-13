# 📱 SMS 인증 설정 가이드

## 옵션 1: 네이버 클라우드 플랫폼 (한국 번호용) - 추천

### 1. 네이버 클라우드 플랫폼 가입
1. https://www.ncloud.com 접속
2. 회원가입 및 로그인
3. 콘솔 접속

### 2. SMS 서비스 신청
1. **상품** → **Application Services** → **SENS** → **SMS**
2. **프로젝트 생성**
   - 프로젝트명: MarketGrow
   - 서비스 선택: SMS
3. **발신번호 등록**
   - 대표번호 또는 휴대폰 번호 등록
   - 통신서비스 이용증명원 제출 필요

### 3. API 키 발급
1. **마이페이지** → **인증키 관리**
2. **새 API 인증키 생성**
3. Access Key ID와 Secret Key 복사

### 4. Railway 환경변수 설정
```
NAVER_ACCESS_KEY=your_access_key
NAVER_SECRET_KEY=your_secret_key
NAVER_SERVICE_ID=your_service_id
NAVER_SEND_NUMBER=01012345678
```

### 비용
- SMS: 9원/건
- LMS: 26원/건
- 월 무료 50건 제공

---

## 옵션 2: Twilio (국제 서비스)

### 1. Twilio 가입
1. https://www.twilio.com 접속
2. 회원가입 (무료 크레딧 $15 제공)
3. 전화번호 인증

### 2. 전화번호 구매
1. **Phone Numbers** → **Buy a Number**
2. 한국 번호 또는 미국 번호 선택
3. SMS 기능 활성화된 번호 구매

### 3. API 키 확인
1. **Dashboard**에서 확인:
   - Account SID
   - Auth Token
   - Phone Number

### 4. Railway 환경변수 설정
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 비용
- 한국으로 SMS: $0.079/건 (약 100원)
- 월 기본료: $1-15 (번호 유형에 따라)

---

## 옵션 3: 알리고 (한국 전문)

### 1. 알리고 가입
1. https://smartsms.aligo.in 접속
2. 사업자 회원가입
3. 서비스 신청

### 2. API 설정
1. **API 연동** → **API Key 발급**
2. 발신번호 사전 등록 (필수)

### 3. Railway 환경변수 설정
```
ALIGO_API_KEY=your_api_key
ALIGO_USER_ID=your_user_id
ALIGO_SENDER=01012345678
```

### 비용
- SMS: 9원/건
- LMS: 30원/건
- 충전식 (최소 1만원)

---

## 개발 환경 설정 (무료)

개발 중에는 실제 SMS 발송 없이 콘솔에 출력:

### backend/.env
```env
NODE_ENV=development
# SMS 설정 비워두기 - 개발 모드에서는 콘솔 출력
```

### 콘솔 출력 예시
```
[DEV MODE] SMS to 01012345678: [MarketGrow] 인증번호는 123456입니다. 3분 이내에 입력해주세요.
```

---

## 테스트 방법

### 1. 로컬 테스트
```bash
cd backend
npm start
```

### 2. 테스트 요청
```javascript
// 테스트 스크립트
fetch('http://localhost:5001/api/auth/send-sms-verification', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({phoneNumber: '01012345678'})
})
.then(res => res.json())
.then(console.log);
```

### 3. 개발 모드 응답
```json
{
    "success": true,
    "message": "인증번호가 발송되었습니다.",
    "devMode": true,
    "code": "123456"  // 개발 모드에서만 표시
}
```

---

## 프로덕션 체크리스트

- [ ] SMS 서비스 가입 완료
- [ ] 발신번호 등록 완료
- [ ] API 키 발급 완료
- [ ] Railway 환경변수 설정
- [ ] 충전 또는 결제 설정
- [ ] 테스트 발송 성공
- [ ] 에러 처리 구현

---

## 주의사항

1. **발신번호 사전등록 필수** (한국)
   - 통신사 정책상 사전 등록된 번호만 발신 가능
   - 사업자 서류 필요

2. **스팸 방지**
   - 동일 번호로 하루 10회 이상 발송 제한
   - 야간 발송 자제 (21:00 ~ 08:00)

3. **개인정보 보호**
   - 인증 코드는 3-5분 후 자동 삭제
   - 전화번호는 암호화하여 저장

4. **비용 관리**
   - 월별 발송량 모니터링
   - 이상 발송 감지 시스템 구축

---

## 문제 해결

### "발신번호 미등록" 오류
- 네이버/알리고: 발신번호 사전 등록 필요
- 통신서비스 이용증명원 제출

### "잔액 부족" 오류
- 서비스 충전 필요
- 자동 충전 설정 권장

### "인증 실패" 오류
- API 키 확인
- 환경변수 설정 확인
- 서비스 상태 확인