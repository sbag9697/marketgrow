# MarketGrow 배포 가이드

## 🚀 빠른 배포 (Vercel + Railway)

### 1. 프론트엔드 배포 (Vercel)

1. **Vercel 계정 생성**
   - https://vercel.com 에서 GitHub으로 가입

2. **프로젝트 준비**
   ```bash
   # 빌드 실행
   node build.js
   ```

3. **Vercel CLI 설치 및 배포**
   ```bash
   npm install -g vercel
   cd dist
   vercel
   ```

4. **환경 변수 설정**
   - Vercel 대시보드 > Settings > Environment Variables
   - `VITE_API_URL`: 백엔드 URL 입력

### 2. 백엔드 배포 (Railway)

1. **Railway 계정 생성**
   - https://railway.app 에서 GitHub으로 가입

2. **새 프로젝트 생성**
   - "Deploy from GitHub repo" 선택
   - backend 폴더 선택

3. **환경 변수 설정**
   - Variables 탭에서 .env.production.example 참고하여 설정

4. **MongoDB Atlas 연결**
   - MongoDB Atlas에서 Network Access > IP Whitelist에 0.0.0.0/0 추가 (모든 IP 허용)

### 3. 도메인 설정

1. **도메인 구매** (예: Namecheap, GoDaddy)

2. **DNS 설정**
   - A 레코드: Vercel IP 주소
   - CNAME: www -> 메인 도메인

3. **SSL 인증서**
   - Vercel과 Railway 모두 자동 SSL 제공

## 🔧 프로덕션 체크리스트

### 보안
- [ ] 환경 변수 모두 설정했는가?
- [ ] JWT_SECRET 충분히 복잡한가?
- [ ] CORS 설정 올바른가?
- [ ] MongoDB IP 화이트리스트 설정했는가?

### 성능
- [ ] 프론트엔드 파일 최소화했는가?
- [ ] 이미지 최적화했는가?
- [ ] CDN 설정했는가?

### 모니터링
- [ ] 에러 트래킹 설정했는가? (Sentry)
- [ ] 로그 수집 설정했는가?
- [ ] 업타임 모니터링 설정했는가?

### 백업
- [ ] 데이터베이스 백업 설정했는가?
- [ ] 백업 복구 테스트했는가?

## 📱 배포 후 테스트

1. **기능 테스트**
   - 회원가입/로그인
   - 서비스 주문
   - 결제 프로세스

2. **성능 테스트**
   - 페이지 로딩 속도
   - API 응답 시간

3. **보안 테스트**
   - SQL Injection
   - XSS
   - CSRF

## 🆘 문제 해결

### CORS 오류
```javascript
// backend/server.js
app.use(cors({
    origin: ['https://marketgrow.com', 'https://www.marketgrow.com'],
    credentials: true
}));
```

### MongoDB 연결 오류
- IP 화이트리스트 확인
- 연결 문자열 확인
- 네트워크 액세스 권한 확인

### 빌드 오류
- Node.js 버전 확인 (18.x 권장)
- 의존성 설치 확인
- 환경 변수 확인