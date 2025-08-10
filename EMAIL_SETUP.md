# 이메일 인증 설정 가이드

## Gmail SMTP 설정

### 1. Google 계정 설정

#### 1-1. 2단계 인증 활성화
1. [Google 계정 설정](https://myaccount.google.com/security) 접속
2. "2단계 인증" 클릭
3. 설정 안내에 따라 2단계 인증 활성화

#### 1-2. 앱 비밀번호 생성
1. [앱 비밀번호 페이지](https://myaccount.google.com/apppasswords) 접속
2. "앱 선택" → "메일" 선택
3. "기기 선택" → "기타(맞춤 이름)" 선택
4. "MarketGrow" 입력 후 "생성" 클릭
5. **생성된 16자리 앱 비밀번호 복사** (공백 제거)

### 2. 환경 변수 설정

#### 2-1. 로컬 개발 환경 (.env 파일)
```bash
# backend/.env 파일에 추가
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=생성한_16자리_앱비밀번호
FRONTEND_URL=http://localhost:3000
```

#### 2-2. Railway 환경 변수 설정
1. Railway 대시보드 접속
2. 프로젝트 선택 → Settings → Variables
3. 다음 변수 추가:
   - `EMAIL_USER`: Gmail 이메일 주소
   - `EMAIL_APP_PASSWORD`: 앱 비밀번호 (공백 제거)
   - `FRONTEND_URL`: https://melodious-banoffee-c450ea.netlify.app

#### 2-3. Netlify 환경 변수 설정
1. Netlify 대시보드 → Site settings → Environment variables
2. 다음 변수 추가:
   - `EMAIL_USER`: Gmail 이메일 주소
   - `EMAIL_APP_PASSWORD`: 앱 비밀번호

### 3. 이메일 발송 테스트

#### 테스트 방법
1. 회원가입 페이지에서 이메일 입력
2. "인증" 버튼 클릭
3. Gmail 받은편지함 확인
4. 6자리 인증 코드 입력

#### 문제 해결

**"이메일 발송에 실패했습니다" 오류**
- Gmail 계정의 2단계 인증이 활성화되었는지 확인
- 앱 비밀번호가 올바르게 입력되었는지 확인 (공백 제거)
- Gmail 계정의 "보안 수준이 낮은 앱 액세스" 허용 확인

**인증 메일을 받지 못한 경우**
- 스팸함 확인
- 이메일 주소가 올바른지 확인
- Railway/Netlify의 환경 변수가 설정되었는지 확인

### 4. 대체 이메일 서비스 (선택사항)

#### SendGrid 사용하기
```javascript
// backend/services/email.service.js 수정
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// nodemailer 대신 SendGrid 사용
const msg = {
    to: email,
    from: 'noreply@marketgrow.com',
    subject: '[MarketGrow] 이메일 인증 코드',
    html: emailHtml
};
await sgMail.send(msg);
```

#### Mailgun 사용하기
```javascript
const mailgun = require('mailgun-js')({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN
});
```

### 5. 보안 주의사항

- **절대 앱 비밀번호를 GitHub에 커밋하지 마세요**
- .env 파일은 .gitignore에 포함되어 있는지 확인
- 프로덕션 환경에서는 전용 이메일 계정 사용 권장
- 이메일 발송 제한 설정으로 스팸 방지 (5분에 3회)

### 6. 이메일 템플릿 커스터마이징

`backend/services/email.service.js` 파일에서 이메일 템플릿을 수정할 수 있습니다:
- 로고 변경
- 색상 테마 변경
- 문구 수정
- 푸터 정보 업데이트

### 7. 현재 구현된 기능

✅ 이메일 인증 코드 발송
✅ 인증 코드 검증 (5분 유효)
✅ 인증 시도 횟수 제한 (5회)
✅ 비밀번호 재설정 이메일
✅ 주문 확인 이메일
✅ 이메일 발송 속도 제한

### 8. 테스트 체크리스트

- [ ] Gmail 2단계 인증 활성화
- [ ] 앱 비밀번호 생성
- [ ] 환경 변수 설정 (로컬)
- [ ] 환경 변수 설정 (Railway)
- [ ] 회원가입 시 이메일 인증 테스트
- [ ] 인증 코드 만료 테스트 (5분)
- [ ] 인증 재발송 테스트
- [ ] 잘못된 코드 입력 테스트