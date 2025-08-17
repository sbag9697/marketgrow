# ✅ Gmail 이메일 발송 문제 해결 완료

## 🔧 수정된 내용

### 1. 핵심 오타 수정
- ❌ `nodemailer.createTransporter()` (잘못된 메서드명)
- ✅ `nodemailer.createTransport()` (올바른 메서드명)

### 2. Gmail SMTP 설정 최적화
```javascript
// 465 포트 사용 (더 안정적)
{
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: emailUser,
        pass: emailPass  // 16자리 앱 비밀번호
    }
}
```

### 3. 에러 처리 강화
- try/catch로 transporter 생성 실패 처리
- 폴백 모드 추가 (이메일 실패시 콘솔 출력)

## 📋 Render 환경 변수 설정

### 필수 환경 변수
```bash
EMAIL_USER=marketgrow.kr@gmail.com
EMAIL_APP_PASSWORD=<16자리 구글 앱 비밀번호>
```

또는

```bash
EMAIL_USER=marketgrow.kr@gmail.com
EMAIL_PASS=<16자리 구글 앱 비밀번호>
```

### 선택 환경 변수
```bash
EMAIL_HOST=smtp.gmail.com  # 기본값
EMAIL_PORT=465              # 기본값
EMAIL_FROM=marketgrow.kr@gmail.com  # 발신자 주소
```

## 🔑 Google 앱 비밀번호 생성

1. [Google 계정 설정](https://myaccount.google.com/security) 접속
2. **보안** → **2단계 인증** 활성화
3. **앱 비밀번호** 클릭
4. 앱 선택: **메일**
5. 기기 선택: **기타** → "MarketGrow" 입력
6. **생성** 클릭
7. 16자리 비밀번호 복사 (공백 제거!)

### ⚠️ 주의사항
- 일반 Gmail 비밀번호 ❌
- 앱 비밀번호 16자리 ✅
- 공백 없이 입력 (복사 시 공백 제거)

## 🧪 테스트 방법

### 1. 로컬 테스트
```javascript
// test-email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'marketgrow.kr@gmail.com',
        pass: '16자리_앱_비밀번호'
    }
});

transporter.sendMail({
    from: 'marketgrow.kr@gmail.com',
    to: 'test@example.com',
    subject: 'Test Email',
    text: 'Hello World'
}, (err, info) => {
    if (err) console.error(err);
    else console.log('Email sent:', info.messageId);
});
```

### 2. API 테스트
```bash
curl -X POST https://marketgrow.onrender.com/api/email/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","username":"test"}'
```

## ✅ 체크리스트

- [x] `createTransporter` → `createTransport` 오타 수정
- [x] Gmail SMTP 465 포트 설정
- [x] 환경 변수 EMAIL_APP_PASSWORD 또는 EMAIL_PASS 지원
- [x] try/catch 에러 처리 추가
- [x] 폴백 모드 구현
- [ ] Render 환경 변수 설정
- [ ] 재배포 완료
- [ ] 이메일 발송 테스트

## 🚀 예상 로그

### 성공 시:
```
📧 Email configuration check: { user: 'marketgrow.kr@gmail.com', passExists: true, passLength: 16 }
📧 Email service configured with Gmail: marketgrow.kr@gmail.com
✅ SMTP transporter verified and ready
```

### 실패 시:
```
📧 SMTP verify failed: Invalid login: 535-5.7.8 Username and Password not accepted
```
→ 앱 비밀번호 재확인 필요

## 🆘 문제 지속 시

1. **앱 비밀번호 재생성**
2. **Less secure app access** 확인 (구글 계정 설정)
3. **IMAP 활성화** 확인 (Gmail 설정)
4. **587 포트 시도**:
   ```javascript
   port: 587,
   secure: false,
   requireTLS: true
   ```