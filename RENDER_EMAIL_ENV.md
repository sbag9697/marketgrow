# 🚨 Render 이메일 환경 변수 설정 필수!

## 문제
- "서버 연결에 실패했습니다" 에러 발생
- 이메일 서비스가 환경 변수 없이 실행 중

## 즉시 해결 방법

### 1. Render Dashboard 접속
https://dashboard.render.com

### 2. 환경 변수 추가

`marketgrow` 서비스 → **Environment** 탭에서 다음 추가:

```bash
# Gmail 설정 (필수!)
EMAIL_USER=marketgrow.kr@gmail.com
EMAIL_APP_PASSWORD=nxlcjextenghopaz

# 추가 이메일 설정
FROM_EMAIL=marketgrow.kr@gmail.com
FROM_NAME=MarketGrow
```

### 3. Save Changes 클릭

### 4. 재배포 대기 (2-3분)

## 확인 방법

### 1. Render Logs 확인
성공 시:
```
📧 Email configuration check: { user: 'marketgrow.kr@gmail.com', passExists: true, passLength: 16 }
📧 Email service configured with Gmail: marketgrow.kr@gmail.com
```

실패 시:
```
❌ EMAIL_APP_PASSWORD not set in environment variables!
```

### 2. API 테스트
```bash
curl -X POST https://marketgrow.onrender.com/api/email/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

## Gmail 앱 비밀번호 재생성 (필요 시)

1. Google 계정 설정 → 보안
2. 2단계 인증 활성화
3. 앱 비밀번호 생성
4. "메일" 선택
5. 생성된 16자리 비밀번호 복사
6. Render 환경 변수 업데이트

## 체크리스트

- [ ] EMAIL_USER 설정됨
- [ ] EMAIL_APP_PASSWORD 설정됨
- [ ] Save Changes 클릭
- [ ] 재배포 시작됨
- [ ] 로그에서 "Email service configured" 확인
- [ ] 이메일 발송 테스트 성공

## 주의사항

⚠️ 일반 Gmail 비밀번호가 아닌 **앱 비밀번호**를 사용해야 합니다!
⚠️ 환경 변수 설정 후 반드시 **Save Changes** 클릭!
⚠️ 재배포가 완료될 때까지 2-3분 대기!