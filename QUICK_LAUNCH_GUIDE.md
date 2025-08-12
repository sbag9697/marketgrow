# 🚀 빠른 런칭 가이드 - 30분 안에 서비스 시작하기

## Step 1: Railway 백엔드 배포 (10분)

### 1.1 Railway 계정 생성
1. https://railway.app 접속
2. GitHub으로 로그인
3. "New Project" 클릭

### 1.2 GitHub 저장소 연결
```bash
# 터미널에서 실행
cd C:\Users\박시현\sns-marketing-site
git init
git add .
git commit -m "Initial commit - MarketGrow"
git branch -M main

# GitHub에 새 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/sns-marketing-site.git
git push -u origin main
```

### 1.3 Railway 배포
1. Railway 대시보드에서 "Deploy from GitHub repo" 선택
2. `sns-marketing-site` 저장소 선택
3. Root Directory를 `/backend`로 설정
4. "Add Variables" 클릭하여 환경 변수 추가:

```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://marketgrow:password@cluster.mongodb.net/marketgrow
JWT_SECRET=your-secret-key-here-make-it-very-long-and-random
ADMIN_EMAIL=admin@marketgrow.com
ADMIN_PASSWORD=Admin123!@#
```

5. "Deploy" 클릭

### 1.4 MongoDB Atlas 설정 (무료)
1. https://cloud.mongodb.com 접속
2. 무료 클러스터 생성 (M0 - 512MB 무료)
3. Database Access에서 사용자 생성
4. Network Access에서 0.0.0.0/0 추가 (모든 IP 허용)
5. Connection String 복사하여 Railway 환경 변수 업데이트

## Step 2: Netlify 프론트엔드 배포 (10분)

### 2.1 프론트엔드 빌드
```bash
# 프로젝트 루트에서 실행
cd C:\Users\박시현\sns-marketing-site

# Railway 백엔드 URL 업데이트
# js/config.js 파일 열어서 수정:
# BASE_URL: 'https://your-app.up.railway.app/api'

# 빌드 실행
npm run build
```

### 2.2 Netlify 배포
1. https://app.netlify.com 접속
2. Sites 탭에서 dist 폴더를 드래그 앤 드롭
3. 자동으로 배포 완료!
4. 제공된 URL 확인 (예: https://amazing-site-123.netlify.app)

### 2.3 환경 변수 설정
1. Site settings → Environment variables
2. 추가할 변수:
```
API_URL=https://your-backend.up.railway.app
```

## Step 3: 초기 테스트 (5분)

### 3.1 백엔드 확인
```bash
# 헬스체크
curl https://your-backend.up.railway.app/api/health

# 응답 예시:
# {"success":true,"message":"Server is running"}
```

### 3.2 프론트엔드 확인
1. Netlify URL 접속
2. 홈페이지 로딩 확인
3. 서비스 목록 표시 확인

### 3.3 관리자 계정 테스트
1. 홈페이지 하단 "관리자" 링크 클릭
2. 로그인:
   - Email: admin@marketgrow.com
   - Password: Admin123!@#
3. 대시보드 접근 확인

## Step 4: 도메인 연결 (5분)

### 4.1 도메인 구매 (아직 없다면)
- Namecheap: https://namecheap.com (저렴)
- GoDaddy: https://godaddy.com
- Google Domains: https://domains.google

### 4.2 Netlify에 도메인 연결
1. Netlify → Domain settings
2. Add custom domain
3. 도메인 입력 (예: marketgrow.com)
4. DNS 설정:
```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www
Value: amazing-site-123.netlify.app
```

## Step 5: 필수 설정 완료 체크리스트

### ✅ 즉시 확인 사항
- [ ] 백엔드 API 응답 확인
- [ ] 프론트엔드 페이지 로딩
- [ ] 관리자 로그인 가능
- [ ] 서비스 목록 표시
- [ ] 회원가입 테스트
- [ ] 주문 프로세스 테스트

### ⚠️ 24시간 내 설정
- [ ] 실제 도메인 연결
- [ ] SSL 인증서 확인 (자동)
- [ ] 관리자 비밀번호 변경
- [ ] 이메일 설정 (SMTP)

### 📅 1주일 내 설정
- [ ] KG이니시스 실제 가맹점 등록
- [ ] SMM Panel 실제 API 연동
- [ ] Google Analytics 설정
- [ ] 백업 시스템 구축

## 🚨 긴급 문제 해결

### "Cannot connect to database"
```bash
# MongoDB Atlas에서 Network Access 확인
# 0.0.0.0/0 추가 (모든 IP 허용)
```

### "CORS error"
```javascript
// backend/server.js에서 CORS 설정 확인
const allowedOrigins = [
    'https://your-site.netlify.app',
    // Netlify URL 추가
];
```

### "Build failed"
```bash
# Node 버전 확인
node --version  # v18 이상 필요

# 클린 빌드
rm -rf node_modules dist
npm install
npm run build
```

## 🎉 축하합니다!

30분 안에 서비스가 실제로 운영되고 있습니다!

**다음 단계:**
1. 실제 결제 시스템 연동
2. 마케팅 시작
3. 고객 피드백 수집
4. 서비스 개선

**현재 상태:**
- ✅ 백엔드: Railway에서 실행 중
- ✅ 프론트엔드: Netlify에서 실행 중
- ✅ 데이터베이스: MongoDB Atlas 연결
- ✅ 관리자 시스템: 작동 중
- ✅ 사용자 시스템: 작동 중

---

📞 **도움이 필요하신가요?**
- Railway 지원: https://railway.app/help
- Netlify 지원: https://docs.netlify.com
- MongoDB 지원: https://docs.mongodb.com