# 🚀 MarketGrow Netlify 배포 가이드

## 📋 배포 구조
- **프론트엔드**: Netlify (무료)
- **백엔드**: Heroku, Railway, 또는 Render (무료 티어 제공)
- **데이터베이스**: MongoDB Atlas (무료 티어 제공)

## 1️⃣ 백엔드 배포 (먼저 진행)

### 옵션 A: Heroku (추천)
```bash
# Heroku CLI 설치 후
cd backend
heroku create marketgrow-backend
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your-mongodb-uri"
heroku config:set JWT_SECRET="your-jwt-secret"
# 기타 환경 변수 설정...
git push heroku main
```

### 옵션 B: Railway
1. railway.app 접속
2. GitHub 연동
3. backend 폴더 선택
4. 환경 변수 설정

### 옵션 C: Render
1. render.com 접속
2. Web Service 생성
3. GitHub 연동
4. 환경 변수 설정

백엔드 URL 예시: `https://marketgrow-backend.herokuapp.com`

## 2️⃣ Netlify 프론트엔드 배포

### 방법 1: Netlify CLI 사용
```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 빌드 (백엔드 URL 설정)
export BACKEND_URL=https://marketgrow-backend.herokuapp.com
export TOSSPAYMENTS_CLIENT_KEY=your-toss-key
node build-netlify.js

# 배포
netlify deploy --prod --dir=dist
```

### 방법 2: GitHub 연동 (추천)
1. GitHub에 코드 푸시
2. app.netlify.com 접속
3. "New site from Git" 클릭
4. GitHub 연동 및 레포지토리 선택
5. 빌드 설정:
   - Build command: `node build-netlify.js`
   - Publish directory: `dist`
6. 환경 변수 설정:
   - `BACKEND_URL`: 백엔드 URL
   - `TOSSPAYMENTS_CLIENT_KEY`: 토스페이먼츠 클라이언트 키

### 방법 3: 드래그 앤 드롭
1. 로컬에서 빌드:
   ```bash
   export BACKEND_URL=https://marketgrow-backend.herokuapp.com
   node build-netlify.js
   ```
2. app.netlify.com 접속
3. dist 폴더를 드래그 앤 드롭

## 3️⃣ 환경 변수 설정

### Netlify 환경 변수 (Site settings > Environment variables)
- `BACKEND_URL`: 백엔드 API URL
- `TOSSPAYMENTS_CLIENT_KEY`: 토스페이먼츠 클라이언트 키

### 백엔드 환경 변수
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
ADMIN_EMAIL=admin@marketgrow.com
ADMIN_PASSWORD=secure-password
TOSSPAYMENTS_SECRET_KEY=your-secret-key
TOSSPAYMENTS_CLIENT_KEY=your-client-key
```

## 4️⃣ 도메인 설정

1. **Netlify 도메인 설정**
   - Domain settings > Add custom domain
   - DNS 설정 안내 따르기

2. **SSL 인증서**
   - Netlify가 자동으로 Let's Encrypt SSL 제공

## 5️⃣ 배포 후 확인

### 체크리스트
- [ ] 홈페이지 접속 확인
- [ ] 로그인/회원가입 테스트
- [ ] API 연결 확인 (서비스 목록 로드)
- [ ] 주문 프로세스 테스트
- [ ] 결제 테스트 (테스트 모드)

### 문제 해결

**CORS 오류**
백엔드 server.js에서 CORS 설정 확인:
```javascript
app.use(cors({
    origin: ['https://your-site.netlify.app', 'https://yourdomain.com'],
    credentials: true
}));
```

**API 연결 실패**
1. 백엔드 URL이 올바른지 확인
2. 백엔드가 실행 중인지 확인
3. 환경 변수가 제대로 설정되었는지 확인

**빌드 실패**
1. Node 버전 확인 (18.x 권장)
2. package.json 확인
3. 빌드 로그 확인

## 🎉 완료!

배포가 완료되면:
- 프론트엔드: `https://your-site.netlify.app`
- 백엔드 API: `https://your-backend.herokuapp.com/api`

## 📱 모니터링

### Netlify Analytics (유료)
- 방문자 통계
- 성능 메트릭

### 무료 대안
- Google Analytics
- Cloudflare Analytics
- Plausible Analytics