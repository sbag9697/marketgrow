# 🚀 Render 환경 변수 최종 설정

## 1️⃣ 즉시 복사해서 사용할 환경 변수

### 필수 환경 변수 (Render Dashboard → Environment)

```bash
# MongoDB 연결 (Railway 외부 프록시)
MONGODB_URI=mongodb://mongo:<PASSWORD>@turntable.proxy.rlwy.net:41740/marketgrow?authSource=admin&directConnection=true

# 서버 설정
NODE_ENV=production
PORT=5001

# JWT 설정
JWT_SECRET=marketgrow2024secretkey!@#$
JWT_EXPIRE=30d

# SMM 동기화 (일단 비활성화)
SMM_ENABLED=false
SMM_API_URL=https://smmturk.org/api/v2
SMM_API_KEY=60370e0dabe133a030c2597a41882694

# 이메일 설정 (Gmail)
EMAIL_USER=marketgrow.kr@gmail.com
EMAIL_APP_PASSWORD=nxlcjextenghopaz
FROM_EMAIL=marketgrow.kr@gmail.com
FROM_NAME=MarketGrow

# OAuth 설정
GOOGLE_CLIENT_ID=1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

KAKAO_APP_KEY=95a2c17a5ec078dd1762950680e53267
KAKAO_REST_API_KEY=YOUR_KAKAO_REST_API_KEY

NAVER_CLIENT_ID=Cirw8aXNIq8wF518fNMZ
NAVER_CLIENT_SECRET=x1lNqh6xcJ

# 프론트엔드 URL
FRONTEND_URL=https://marketgrow-snsmarketing.netlify.app
API_BASE_URL=https://marketgrow.onrender.com

# 관리자 계정
ADMIN_EMAIL=admin@marketgrow.com
ADMIN_PASSWORD=admin123!@#

# 사업자 정보
BUSINESS_NAME=MarketGrow
BUSINESS_OWNER=박시현
BUSINESS_NUMBER=154-38-01411
BUSINESS_PHONE=010-5772-8658
BUSINESS_EMAIL=marketgrow.kr@gmail.com
```

## 2️⃣ MongoDB 비밀번호 확인

### Railway Variables에서 확인:
1. Railway Dashboard → MongoDB 서비스
2. **Variables** 탭
3. `MONGO_PASSWORD` 값 복사
4. 위의 `<PASSWORD>` 부분에 붙여넣기

### 또는 Railway에서 직접 복사:
`DATABASE_PUBLIC_URL` 값이 있다면 그대로 사용 (단, `railway` 대신 `marketgrow` DB 이름으로 변경)

## 3️⃣ 적용 방법

1. [Render Dashboard](https://dashboard.render.com) 접속
2. `marketgrow` 서비스 선택
3. **Environment** 탭 클릭
4. 위의 환경 변수들을 하나씩 추가 또는 수정
5. **Save Changes** 클릭
6. 자동 재배포 시작

## 4️⃣ 연결 확인

### Render Shell에서 테스트:
```bash
# DNS 확인
nslookup turntable.proxy.rlwy.net

# 포트 확인
nc -vz turntable.proxy.rlwy.net 41740

# MongoDB 직접 연결 테스트 (mongosh 있으면)
mongosh "mongodb://mongo:<PASSWORD>@turntable.proxy.rlwy.net:41740/marketgrow?authSource=admin&directConnection=true"
```

### 로그 확인:
성공 시:
```
Using Railway MongoDB (External Connection)
Attempting to connect to MongoDB...
✅ MongoDB connected successfully
```

실패 시:
```
MongoDB connection failed: [에러 메시지]
```

## 5️⃣ 헬스체크

배포 완료 후:
```
https://marketgrow.onrender.com/api/health
```

응답:
```json
{
  "status": "OK",
  "mongodb": "Connected"
}
```

## 6️⃣ 보안 강화 (나중에)

### MongoDB 사용자 생성 (권장):
```javascript
// mongosh로 접속 후
use admin
db.createUser({
  user: "marketgrow_app",
  pwd: "새로운_강한_비밀번호",
  roles: [
    { role: "readWrite", db: "marketgrow" }
  ]
})
```

### TLS 활성화 (향후):
Railway MongoDB에 TLS 설정 후:
```bash
MONGODB_URI=mongodb://user:pass@turntable.proxy.rlwy.net:41740/marketgrow?authSource=admin&directConnection=true&tls=true
```

## ⚠️ 주의사항

1. **절대 사용하지 마세요:**
   - `mongodb.railway.internal` (내부 전용)
   - `sslValidate` 옵션 (deprecated)
   - `useNewUrlParser` (불필요)
   - `useUnifiedTopology` (불필요)

2. **현재 TLS 미사용:**
   - Railway MongoDB가 TLS 미설정 상태
   - `tls=true` 옵션 넣지 마세요

3. **비밀번호 보안:**
   - Git에 커밋하지 마세요
   - 로그에 출력하지 마세요
   - 정기적으로 변경하세요

## ✅ 체크리스트

- [ ] Railway에서 MongoDB 비밀번호 확인
- [ ] Render 환경 변수에 MONGODB_URI 설정
- [ ] 기타 환경 변수들 복사/붙여넣기
- [ ] Save Changes 클릭
- [ ] 재배포 시작 확인
- [ ] 로그에서 MongoDB 연결 성공 확인
- [ ] API 헬스체크 정상 응답 확인
- [ ] 회원가입/로그인 테스트

## 🆘 문제 발생 시

1. **Authentication failed:**
   - Railway MongoDB 비밀번호 다시 확인
   - authSource=admin 확인

2. **Connection timeout:**
   - 포트 번호 확인 (41740)
   - directConnection=true 확인

3. **DNS 해석 실패:**
   - turntable.proxy.rlwy.net 철자 확인
   - Railway Public Networking 활성화 확인