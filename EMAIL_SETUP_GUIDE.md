# 📧 이메일 인증 시스템 설정 가이드

## 1. Gmail SMTP 설정 (무료)

### 1.1 Gmail 계정 준비
1. 서비스용 Gmail 계정 생성 (기존 계정도 가능)
   - 예: `marketgrow.service@gmail.com`

### 1.2 2단계 인증 활성화
1. Google 계정 설정 접속: https://myaccount.google.com
2. 보안 → 2단계 인증 → 사용 설정
3. 휴대폰 번호 인증 완료

### 1.3 앱 비밀번호 생성
1. Google 계정 설정 → 보안
2. 2단계 인증 섹션에서 "앱 비밀번호" 클릭
3. 앱 선택: "메일"
4. 기기 선택: "기타(맞춤 이름)"
5. 이름 입력: "MarketGrow"
6. 생성된 16자리 비밀번호 복사 (예: `abcd efgh ijkl mnop`)

### 1.4 환경 변수 설정
```env
# Railway 또는 .env 파일에 추가
EMAIL_USER=marketgrow.service@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop  # 공백 제거
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

## 2. 이메일 인증 플로우

### 2.1 회원가입 시
```
1. 사용자가 회원가입 폼 작성
2. 서버에서 인증 토큰 생성
3. 인증 링크가 포함된 이메일 발송
4. 사용자가 이메일의 링크 클릭
5. verify-email.html 페이지에서 인증 처리
6. 인증 완료 후 로그인 페이지로 이동
```

### 2.2 인증 재발송
```
1. 사용자가 인증 이메일 재발송 요청
2. 기존 토큰 무효화 및 새 토큰 생성
3. 새로운 인증 이메일 발송
4. 60초 쿨다운 적용
```

## 3. 보안 설정

### 3.1 Rate Limiting
```javascript
// 이메일 발송 제한
- IP당 5분에 3회
- 인증 시도 분당 10회
```

### 3.2 토큰 보안
```javascript
// 토큰 생성
- 32바이트 랜덤 토큰
- SHA256 해싱 저장
- 24시간 유효기간
```

## 4. 대체 이메일 서비스

### 4.1 SendGrid (월 100건 무료)
```env
SENDGRID_API_KEY=your-api-key
EMAIL_SERVICE=sendgrid
```

### 4.2 Mailgun (월 1000건 무료)
```env
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
EMAIL_SERVICE=mailgun
```

### 4.3 Amazon SES (월 62,000건 무료)
```env
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ap-northeast-2
EMAIL_SERVICE=ses
```

## 5. 테스트 방법

### 5.1 로컬 테스트
```bash
# 백엔드 서버 실행
cd backend
npm run dev

# 테스트 이메일 발송
curl -X POST http://localhost:5001/api/email/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser"}'
```

### 5.2 프로덕션 테스트
1. 회원가입 페이지에서 실제 이메일로 가입
2. 이메일 수신 확인 (스팸함 확인)
3. 인증 링크 클릭
4. 인증 완료 확인

## 6. 이메일 템플릿 커스터마이징

### 6.1 템플릿 위치
```
backend/services/email.service.js
- sendVerificationEmail(): 인증 링크 이메일
- sendVerificationCode(): 6자리 코드 이메일
- sendPasswordResetEmail(): 비밀번호 재설정
- sendOrderConfirmationEmail(): 주문 확인
```

### 6.2 템플릿 수정 예시
```javascript
const mailOptions = {
    from: '"귀사명" <noreply@yourdomain.com>',
    subject: '[귀사명] 이메일 인증',
    html: `
        <div style="your-custom-styles">
            <!-- 커스텀 HTML -->
        </div>
    `
};
```

## 7. 문제 해결

### 7.1 "Authentication failed"
- 2단계 인증 활성화 확인
- 앱 비밀번호 정확히 입력 (공백 제거)
- Less secure app access 허용 (필요시)

### 7.2 "Connection timeout"
- 방화벽 설정 확인
- SMTP 포트 (587) 열려있는지 확인
- VPN 사용 시 끄고 테스트

### 7.3 이메일이 스팸함으로
- SPF 레코드 설정
- DKIM 서명 추가
- 발신자 이메일 인증

### 7.4 Railway 배포 시
```env
# Railway 환경 변수에 추가
EMAIL_USER=${{EMAIL_USER}}
EMAIL_APP_PASSWORD=${{EMAIL_APP_PASSWORD}}
```

## 8. 프로덕션 체크리스트

- [ ] Gmail 앱 비밀번호 생성
- [ ] 환경 변수 설정
- [ ] 이메일 템플릿 브랜딩
- [ ] Rate limiting 설정
- [ ] 스팸 방지 설정
- [ ] 이메일 로그 모니터링
- [ ] 실패 시 재시도 로직
- [ ] 바운스 이메일 처리

## 9. 모니터링

### 9.1 이메일 발송 통계
```javascript
// 대시보드에 추가할 메트릭
- 일일 발송량
- 성공/실패 비율
- 인증 완료율
- 평균 인증 시간
```

### 9.2 로그 확인
```bash
# Railway 로그
railway logs --tail

# 이메일 관련 로그 필터
railway logs | grep "email"
```

## 10. 비용 최적화

### 무료 한도
- Gmail SMTP: 일 500건
- SendGrid: 월 100건
- Mailgun: 월 1000건
- AWS SES: 월 62,000건 (EC2에서)

### 추천 설정
- 개발/테스트: Gmail SMTP
- 소규모 (월 1000건 이하): Mailgun
- 대규모: AWS SES

## 🎯 즉시 설정 방법 (5분)

1. Gmail 계정에서 2단계 인증 활성화
2. 앱 비밀번호 생성
3. Railway 환경 변수 추가:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_APP_PASSWORD=your-app-password
   ```
4. 배포 및 테스트

완료! 이제 이메일 인증이 작동합니다.