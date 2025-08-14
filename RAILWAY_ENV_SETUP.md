# 🚀 Railway 환경변수 설정 가이드

## 필수 환경변수 목록

Railway 대시보드 → Variables 탭에서 다음 변수들을 설정하세요:

### 1. 기본 설정
```
NODE_ENV=production
PORT=5001
```

### 2. JWT 설정
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
JWT_EXPIRE=30d
```

### 3. MongoDB 설정 (이미 설정됨)
```
MONGODB_URI=mongodb+srv://sbag9697:tlgus0611!@cluster0.17qmchk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

### 4. Google OAuth 설정 ⚠️ 중요
```
GOOGLE_CLIENT_ID=1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### 5. Kakao OAuth 설정
```
KAKAO_APP_KEY=95a2c17a5ec078dd1762950680e53267
KAKAO_CLIENT_SECRET=your_kakao_client_secret_here
```

### 6. Naver OAuth 설정
```
NAVER_CLIENT_ID=Cirw8aXNIq8wF518fNMZ
NAVER_CLIENT_SECRET=your_naver_client_secret_here
```

### 7. 이메일 설정 ⚠️ 중요
```
EMAIL_USER=sbag9697@gmail.com
EMAIL_APP_PASSWORD=여기에_Gmail_앱_비밀번호_16자리_입력
```

**Gmail 앱 비밀번호 생성 방법:**
1. https://myaccount.google.com/security 접속
2. 2단계 인증 활성화
3. https://myaccount.google.com/apppasswords 접속
4. 앱: "메일", 기기: "기타" → "MarketGrow" 입력
5. 생성된 16자리 비밀번호 복사 (공백 제거)

### 5. 프론트엔드 URL
```
FRONTEND_URL=https://marketgrow.kr
```

### 8. SMS 설정 (선택 - 아직 설정 안 해도 됨)
```
# 네이버 클라우드 플랫폼 사용 시
NAVER_ACCESS_KEY=
NAVER_SECRET_KEY=
NAVER_SERVICE_ID=
NAVER_SEND_NUMBER=

# 또는 Twilio 사용 시
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### 9. 관리자 계정
```
ADMIN_EMAIL=admin@marketgrow.com
ADMIN_PASSWORD=admin123!@#
```

## 설정 방법

### Step 1: Railway 대시보드 접속
1. https://railway.app 로그인
2. marketgrow 프로젝트 선택
3. **Variables** 탭 클릭

### Step 2: 변수 추가
1. **New Variable** 버튼 클릭
2. 변수명과 값 입력
3. **Add** 클릭

### Step 3: 재배포
- 변수 추가 후 자동으로 재배포됨
- 약 1-2분 소요

## 현재 설정 상태 확인

### ✅ 완료된 설정
- MongoDB 연결
- JWT Secret
- 기본 서버 설정

### ⚠️ 필요한 설정
- **EMAIL_APP_PASSWORD** - Gmail 앱 비밀번호 설정 필요
- SMS 서비스 (선택사항)

## 테스트 방법

### 1. 서버 상태 확인
```bash
curl https://marketgrow-production-9802.up.railway.app/health
```

### 2. 이메일 발송 테스트
회원가입 페이지에서 이메일 인증 테스트

### 3. 로그 확인
Railway 대시보드 → Logs 탭에서 실시간 로그 확인

## 문제 해결

### "이메일 발송 실패" 오류
1. EMAIL_APP_PASSWORD 확인
2. Gmail 2단계 인증 활성화 확인
3. 앱 비밀번호 재생성 시도

### "MongoDB 연결 실패" 오류
1. MONGODB_URI 확인
2. MongoDB Atlas 화이트리스트에 0.0.0.0/0 추가

### "서버 시작 실패" 오류
1. 환경변수 오타 확인
2. PORT 설정 확인
3. package.json scripts 확인

## 보안 주의사항

⚠️ **절대 하지 말아야 할 것:**
- 실제 Gmail 비밀번호 사용 (앱 비밀번호만 사용)
- 환경변수를 코드에 하드코딩
- 환경변수를 GitHub에 커밋

✅ **반드시 해야 할 것:**
- 프로덕션용 강력한 JWT_SECRET 사용
- 정기적인 비밀번호 변경
- 환경변수 백업 보관

---

**도움이 필요하면 Railway Discord 커뮤니티 또는 support@railway.app로 문의하세요.**