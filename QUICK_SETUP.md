# ⚡ 빠른 설정 가이드 (5분 완료)

## 1️⃣ Google Cloud Console (2분)

1. https://console.cloud.google.com 접속
2. **API 및 서비스** → **사용자 인증 정보**
3. OAuth 클라이언트 ID 클릭 (`1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn`)
4. **승인된 JavaScript 원본** 추가:
   ```
   https://marketgrow.kr
   https://www.marketgrow.kr
   ```
5. **저장** 클릭

## 2️⃣ Railway 환경변수 (3분)

1. https://railway.app 로그인
2. **sns-marketing-site** → **backend** → **Variables**
3. 복사해서 붙여넣기:

```bash
# 🔴 필수 - MongoDB (데이터베이스 이름 추가!)
MONGODB_URI=mongodb+srv://sbag9697:nUHawo7w3RKDqO8i@cluster0.17qmchk.mongodb.net/marketgrow?retryWrites=true&w=majority&appName=Cluster0

# 🔴 필수 - JWT (아래 값 그대로 사용 가능)
JWT_SECRET=1788d4031821297776090d66502ebecd6186cf16f684a4e60d8822e1acc9ac77
JWT_REFRESH_SECRET=c07bd4a1ef0a0055dfc7598e3076643d460a77fd00a7296323572e8181005f86
JWT_EXPIRE=30d
JWT_REFRESH_EXPIRE=90d

# 🟡 권장 - Google OAuth
GOOGLE_CLIENT_ID=1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com

# 🟡 권장 - Kakao OAuth
KAKAO_CLIENT_ID=a7b2ddf2636cdeb3faff0517c5ec6591

# 🟢 선택 - 이메일 (회원가입 인증)
EMAIL_USER=marketgrow.kr@gmail.com
EMAIL_PASS=(Gmail 앱 비밀번호 16자리)

# 🟢 선택 - SMS
COOLSMS_API_KEY=NCSN4FS4EFQSCSA1
COOLSMS_SENDER=01057728658

# 기본 설정
NODE_ENV=production
```

## 3️⃣ 완료 확인

### Railway 자동 재배포 (2-3분 대기)

### 테스트
1. **API 상태**: https://marketgrow-production-c586.up.railway.app/api/health
   ```json
   {
     "status": "OK",
     "mongodb": "Connected"  ← 이것 확인!
   }
   ```

2. **Google 로그인**: https://marketgrow.kr/login.html
   - "구글로 시작하기" 클릭
   - 5-10분 후 테스트 (Google 서버 반영 시간)

## ✅ 체크리스트

- [ ] Google Console에서 도메인 추가
- [ ] Railway에 MONGODB_URI 설정 (`/marketgrow` 포함)
- [ ] Railway에 JWT_SECRET 설정
- [ ] API health 체크 확인
- [ ] 5-10분 후 Google 로그인 테스트

## 🔥 중요 포인트

1. **MongoDB URI**: 반드시 `/marketgrow` 포함!
   ```
   ❌ 잘못됨: mongodb+srv://...mongodb.net/?retryWrites=true
   ✅ 올바름: mongodb+srv://...mongodb.net/marketgrow?retryWrites=true
   ```

2. **JWT_SECRET**: 위 예시 그대로 사용 가능 (보안 강화됨)

3. **Google 도메인**: 저장 후 5-10분 대기 필요

---

**총 소요시간**: 5분
**Railway 재배포**: 자동 (2-3분)
**Google 반영**: 5-10분

문제 발생 시 상세 가이드:
- `GOOGLE_DOMAIN_SETUP.md`
- `JWT_SECRET_SETUP.md`