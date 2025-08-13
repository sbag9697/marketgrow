# 🔴 긴급 설정 가이드

## 1. Google Cloud Console 도메인 승인

### 접속 및 설정
1. https://console.cloud.google.com 접속
2. 프로젝트 선택 (MarketGrow 또는 기본 프로젝트)
3. **API 및 서비스** → **사용자 인증 정보**
4. OAuth 2.0 클라이언트 ID 클릭:
   - `1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com`

### 승인된 JavaScript 원본 추가
**승인된 JavaScript 원본** 섹션에서 **+ URI 추가** 클릭 후 다음 추가:
```
https://marketgrow.kr
https://www.marketgrow.kr
```

### 승인된 리디렉션 URI 추가
**승인된 리디렉션 URI** 섹션에서 **+ URI 추가** 클릭 후 다음 추가:
```
https://marketgrow.kr/auth-callback.html
https://www.marketgrow.kr/auth-callback.html
```

**저장** 클릭 → 5-10분 대기 (Google 서버 반영 시간)

---

## 2. Railway MongoDB URI 설정

### Railway 접속
1. https://railway.app 로그인
2. **sns-marketing-site** 프로젝트 선택
3. **backend** 서비스 클릭
4. **Variables** 탭 클릭

### MONGODB_URI 수정
현재:
```
mongodb+srv://sbag9697:nUHawo7w3RKDqO8i@cluster0.17qmchk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

수정 후 (데이터베이스 이름 추가):
```
mongodb+srv://sbag9697:nUHawo7w3RKDqO8i@cluster0.17qmchk.mongodb.net/marketgrow?retryWrites=true&w=majority&appName=Cluster0
```

⚠️ **중요**: `/marketgrow` 부분이 추가되었습니다!

---

## 3. Railway OAuth 환경변수 추가

같은 **Variables** 탭에서 다음 환경변수 추가/확인:

### 필수 환경변수

```bash
# JWT (보안 - 필수!)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long-change-this-now
JWT_EXPIRE=30d

# Google OAuth
GOOGLE_CLIENT_ID=1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=(Google Cloud Console에서 확인)

# Kakao OAuth  
KAKAO_CLIENT_ID=a7b2ddf2636cdeb3faff0517c5ec6591
KAKAO_CLIENT_SECRET=(선택사항 - Kakao Developers에서 확인)

# 기본 설정
NODE_ENV=production
```

### Google Client Secret 찾기
1. Google Cloud Console → **사용자 인증 정보**
2. OAuth 2.0 클라이언트 ID 클릭
3. **클라이언트 보안 비밀번호** 복사

### Kakao Client Secret 찾기 (선택)
1. https://developers.kakao.com
2. 앱 선택 → **보안**
3. **Client Secret** 생성/확인

---

## 4. 추가 권장 환경변수

```bash
# 이메일 (회원가입 인증용)
EMAIL_USER=marketgrow.kr@gmail.com
EMAIL_PASS=(Gmail 앱 비밀번호)

# SMS (선택)
COOLSMS_API_KEY=NCSN4FS4EFQSCSA1
COOLSMS_API_SECRET=(CoolSMS에서 확인)
COOLSMS_SENDER=01057728658
```

### Gmail 앱 비밀번호 생성
1. https://myaccount.google.com/security
2. **2단계 인증** 활성화
3. **앱 비밀번호** 생성
4. 16자리 비밀번호 복사

---

## 5. 설정 완료 확인

### Railway 로그 확인
재배포 후 로그에서 확인:
```
✅ MongoDB connected successfully
✅ Database initialized with seed data
🚀 Server is running on port 5000
```

### API 헬스체크
```
https://marketgrow-production-c586.up.railway.app/api/health
```

응답:
```json
{
  "status": "OK",
  "mongodb": "Connected",
  "environment": "production"
}
```

### Google 로그인 테스트
1. https://marketgrow.kr/login.html
2. "구글로 시작하기" 클릭
3. 정상 작동 확인

---

## ⚠️ 주의사항

1. **JWT_SECRET 반드시 변경**: 현재 기본값은 보안 위험
2. **MongoDB URI**: `/marketgrow` 없으면 데이터 저장 안됨
3. **도메인 승인**: Google은 5-10분 소요

## 🆘 문제 발생 시

- MongoDB 연결 실패 → In-Memory DB로 자동 전환 (임시)
- Google 로그인 실패 → 도메인 승인 재확인
- 환경변수 미설정 → 기본값 사용 (보안 위험)

---

**완료 후**: Railway는 자동 재배포됩니다. 2-3분 대기 후 테스트하세요.