# 📱 CoolSMS 전화번호 인증 완전 가이드

## 📌 Step 1: CoolSMS 가입 (3분)

### 1. 사이트 접속
- https://coolsms.co.kr 접속
- 우측 상단 **회원가입** 클릭

### 2. 회원가입
- 이메일 주소 입력
- 비밀번호 설정
- **개인회원**으로 가입 (사업자등록증 불필요!)
- 이메일 인증 완료

### 3. 로그인
- 가입한 계정으로 로그인

---

## 📌 Step 2: API 키 발급 (1분)

### 1. 개발자센터 이동
- 로그인 후 상단 메뉴 **개발자센터** 클릭
- 또는 https://console.coolsms.co.kr 직접 접속

### 2. API 키 생성
- 좌측 메뉴 **API Key 관리** 클릭
- **새 API Key 만들기** 버튼 클릭
- 메모: "MarketGrow SMS" 입력
- **생성** 클릭

### 3. API 키 복사
```
⚠️ 중요: 이 정보는 한 번만 보여집니다!

API Key: NCXXXXXXXXXXXXXXXXXX
API Secret: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

이 두 값을 안전한 곳에 복사해두세요!
```

---

## 📌 Step 3: 발신번호 등록 (2분)

### 1. 발신번호 관리
- 좌측 메뉴 **발신번호** 클릭
- **발신번호 등록** 버튼 클릭

### 2. 번호 인증
- 본인 휴대폰 번호 입력 (예: 01012345678)
- **인증번호 요청** 클릭
- 받은 인증번호 입력
- **등록** 클릭

### 3. 확인
- 발신번호 목록에 번호가 표시되면 성공!

---

## 📌 Step 4: 무료 포인트 확인

### 대시보드에서 확인
- **잔액: 300원** (무료 제공)
- SMS 1건 = 10원
- 약 30건 테스트 가능

---

## 📌 Step 5: 백엔드 코드 수정

### 1. 패키지 설치
```bash
cd backend
npm install coolsms-node-sdk
```

### 2. SMS 서비스 파일 수정
`backend/services/sms.service.js` 파일을 다음과 같이 수정:

```javascript
const coolsms = require('coolsms-node-sdk').default;

class SMSService {
    constructor() {
        // CoolSMS 설정
        if (process.env.COOLSMS_API_KEY && process.env.COOLSMS_API_SECRET) {
            this.messageService = new coolsms(
                process.env.COOLSMS_API_KEY,
                process.env.COOLSMS_API_SECRET
            );
            this.senderNumber = process.env.COOLSMS_SENDER;
            console.log('✅ CoolSMS 초기화 완료');
        } else {
            console.log('⚠️ CoolSMS 설정 없음 - 개발 모드 사용');
        }
        
        // 인증 코드 저장소
        this.verificationCodes = new Map();
    }

    // 6자리 인증 코드 생성
    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // 인증 코드 저장 (3분 유효)
    saveVerificationCode(phoneNumber, code) {
        this.verificationCodes.set(phoneNumber, {
            code,
            createdAt: Date.now(),
            attempts: 0
        });

        // 3분 후 자동 삭제
        setTimeout(() => {
            this.verificationCodes.delete(phoneNumber);
        }, 3 * 60 * 1000);
    }

    // 인증 코드 검증
    verifyCode(phoneNumber, code) {
        const stored = this.verificationCodes.get(phoneNumber);
        
        if (!stored) {
            return { success: false, message: '인증 코드가 만료되었거나 존재하지 않습니다.' };
        }

        if (stored.attempts >= 5) {
            this.verificationCodes.delete(phoneNumber);
            return { success: false, message: '인증 시도 횟수를 초과했습니다.' };
        }

        stored.attempts++;

        if (Date.now() - stored.createdAt > 3 * 60 * 1000) {
            this.verificationCodes.delete(phoneNumber);
            return { success: false, message: '인증 코드가 만료되었습니다.' };
        }

        if (stored.code === code) {
            this.verificationCodes.delete(phoneNumber);
            return { success: true, message: 'SMS 인증이 완료되었습니다.' };
        }

        return { success: false, message: '인증 코드가 일치하지 않습니다.' };
    }

    // 전화번호 형식 정리
    formatPhoneNumber(phoneNumber) {
        // 숫자만 추출
        return phoneNumber.replace(/\D/g, '');
    }

    // SMS 발송
    async sendVerificationSMS(phoneNumber) {
        try {
            const formattedNumber = this.formatPhoneNumber(phoneNumber);
            const code = this.generateVerificationCode();
            this.saveVerificationCode(formattedNumber, code);

            const message = `[MarketGrow] 인증번호는 ${code}입니다. 3분 이내에 입력해주세요.`;

            if (this.messageService) {
                // 실제 SMS 발송
                try {
                    const result = await this.messageService.sendOne({
                        to: formattedNumber,
                        from: this.senderNumber,
                        text: message,
                        type: 'SMS',
                        autoTypeDetect: false
                    });
                    
                    console.log('✅ SMS 발송 성공:', result);
                    return {
                        success: true,
                        message: '인증번호가 발송되었습니다.'
                    };
                } catch (error) {
                    console.error('❌ CoolSMS 발송 실패:', error);
                    throw error;
                }
            } else {
                // 개발 모드 - 콘솔에 출력
                console.log(`📱 [개발모드] SMS to ${formattedNumber}: ${message}`);
                return {
                    success: true,
                    message: '인증번호가 발송되었습니다.',
                    devMode: true,
                    code: process.env.NODE_ENV === 'development' ? code : undefined
                };
            }
        } catch (error) {
            console.error('SMS 발송 오류:', error);
            return {
                success: false,
                message: 'SMS 발송에 실패했습니다.',
                error: error.message
            };
        }
    }
}

module.exports = new SMSService();
```

---

## 📌 Step 6: Railway 환경변수 설정

### 1. Railway 대시보드 접속
- https://railway.app 로그인
- MarketGrow 프로젝트 선택

### 2. Variables 탭에서 추가
```
COOLSMS_API_KEY=NCXXXXXXXXXXXXXXXXXX
COOLSMS_API_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
COOLSMS_SENDER=01012345678
```
⚠️ 본인이 등록한 발신번호 입력!

### 3. 저장
- 자동으로 재배포됨 (1-2분 소요)

---

## 📌 Step 7: 로컬 테스트 (선택)

### 1. 로컬 환경변수 설정
`backend/.env` 파일에 추가:
```env
COOLSMS_API_KEY=NCXXXXXXXXXXXXXXXXXX
COOLSMS_API_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
COOLSMS_SENDER=01012345678
```

### 2. 서버 실행
```bash
cd backend
npm start
```

### 3. 테스트
- https://marketgrow.kr/signup.html 접속
- 전화번호 입력 후 인증 버튼 클릭
- SMS 수신 확인!

---

## 📌 문제 해결

### "잔액 부족" 오류
```
해결: CoolSMS 대시보드에서 포인트 충전
- 최소 충전: 1,000원
- 카드결제 가능
```

### "발신번호 미등록" 오류
```
해결: CoolSMS 콘솔에서 발신번호 등록
- 본인 명의 번호만 가능
- 인증 필요
```

### "인증 실패" 오류
```
확인사항:
1. API Key가 정확한지
2. API Secret이 정확한지
3. 발신번호가 등록되었는지
4. Railway 환경변수가 저장되었는지
```

---

## 💰 요금 충전 (필요시)

### 충전 방법
1. CoolSMS 콘솔 → **충전**
2. 금액 선택 (1,000원 ~ 100,000원)
3. 결제 수단 선택
4. 결제 완료

### 요금표
- SMS (90자): 10원
- LMS (2000자): 30원
- MMS (이미지): 50원

---

## 📞 고객지원

### CoolSMS 고객센터
- 전화: 1855-1471
- 이메일: support@coolsms.co.kr
- 카카오톡: @coolsms
- 영업시간: 평일 10:00 ~ 18:00

---

## ✅ 최종 체크리스트

- [ ] CoolSMS 가입 완료
- [ ] API Key 발급 완료
- [ ] API Secret 저장 완료
- [ ] 발신번호 등록 완료
- [ ] Railway 환경변수 설정 완료
- [ ] 테스트 SMS 발송 성공
- [ ] 인증번호 입력 테스트 성공

---

## 🎉 완료!

이제 전화번호 인증이 작동합니다!
문제가 있으면 콘솔 로그를 확인하세요.