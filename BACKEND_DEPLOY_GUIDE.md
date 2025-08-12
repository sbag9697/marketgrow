# 🚀 백엔드 서버 배포 가이드 (Railway)

## 📋 현재 상태
- **Frontend**: ✅ Netlify에 배포됨 (https://melodious-banoffee-c450ea.netlify.app)
- **Backend**: ⚠️ Railway 배포 필요

## 🎯 Railway 배포 방법

### 1. Railway 계정 생성
1. https://railway.app 접속
2. GitHub으로 로그인
3. 무료 플랜 사용 가능 (월 $5 크레딧 제공)

### 2. 새 프로젝트 생성
```bash
1. "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. "marketgrow" 저장소 선택
4. 배포 설정:
   - Root Directory: backend
   - Build Command: npm install
   - Start Command: npm start
```

### 3. 환경 변수 설정 (Railway Dashboard)
```env
# 필수 환경 변수
NODE_ENV=production
PORT=5001

# MongoDB (MongoDB Atlas 무료 계정 필요)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/marketgrow

# JWT Secret (32자 이상 랜덤 문자열)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 이메일 설정 (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-16-digit-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# SMS 설정 (선택사항 - 없으면 Mock 모드)
SMS_API_KEY=your-sms-api-key
SMS_API_SECRET=your-sms-api-secret
SMS_SENDER=01012345678

# Toss Payments (선택사항)
TOSSPAYMENTS_SECRET_KEY=your-secret-key
TOSSPAYMENTS_CLIENT_KEY=your-client-key

# 프론트엔드 URL
FRONTEND_URL=https://melodious-banoffee-c450ea.netlify.app
```

### 4. MongoDB Atlas 설정 (무료)
1. https://www.mongodb.com/atlas 접속
2. 무료 클러스터 생성 (M0 - 512MB)
3. Database Access에서 사용자 생성
4. Network Access에서 0.0.0.0/0 추가 (모든 IP 허용)
5. Connect → Connect your application → Connection String 복사
6. Railway에 MONGODB_URI로 추가

### 5. Gmail 앱 비밀번호 생성
1. Google 계정 → 보안 → 2단계 인증 활성화
2. 앱 비밀번호 생성
3. Railway에 EMAIL_APP_PASSWORD로 추가

### 6. 배포 확인
```bash
# Railway CLI 설치 (선택사항)
npm install -g @railway/cli

# 로그 확인
railway logs

# 또는 Railway 대시보드에서 확인
```

## 🔧 로컬 테스트

### 백엔드 서버 실행
```bash
cd backend
npm install
npm run dev
```

### 환경 변수 파일 (.env)
```bash
cd backend
cp .env.example .env
# .env 파일 편집하여 환경 변수 설정
```

## 📝 배포 체크리스트

- [ ] Railway 계정 생성
- [ ] MongoDB Atlas 계정 생성 및 클러스터 설정
- [ ] Gmail 앱 비밀번호 생성
- [ ] Railway에 프로젝트 생성
- [ ] 환경 변수 설정
- [ ] 배포 및 로그 확인
- [ ] API 엔드포인트 테스트

## 🌐 API 엔드포인트

배포 후 사용 가능한 엔드포인트:
- `https://your-app.up.railway.app/api/health` - 상태 확인
- `https://your-app.up.railway.app/api/auth/check-username` - 아이디 중복확인
- `https://your-app.up.railway.app/api/auth/register` - 회원가입
- `https://your-app.up.railway.app/api/sms/send-verification` - SMS 인증
- `https://your-app.up.railway.app/api/email/send-verification` - 이메일 인증

## 💰 비용

### 무료 옵션
- **Railway**: 월 $5 크레딧 무료 (소규모 앱 충분)
- **MongoDB Atlas**: M0 클러스터 무료 (512MB)
- **Gmail SMTP**: 일 500건 무료
- **Netlify**: 월 100GB 대역폭 무료

### 예상 월 비용
- 개발/테스트: $0 (모두 무료 플랜)
- 소규모 운영: $0-5 (Railway 크레딧 내)
- 중규모 운영: $20-50

## 🆘 문제 해결

### "Cannot connect to MongoDB"
- MongoDB Atlas Network Access에 0.0.0.0/0 추가
- Connection String에 데이터베이스 이름 포함 확인

### "Email not sending"
- Gmail 2단계 인증 활성화 확인
- 앱 비밀번호 정확히 입력 (공백 제거)

### "Server not starting"
- Railway 로그 확인
- 환경 변수 모두 설정되었는지 확인
- package.json의 start 스크립트 확인

## 🎉 완료!

백엔드 배포가 완료되면:
1. https://melodious-banoffee-c450ea.netlify.app/signup 에서 회원가입 테스트
2. 아이디 중복확인 기능 테스트
3. SMS/이메일 인증 테스트

---

**도움이 필요하면**: Railway 대시보드의 로그를 확인하거나, GitHub Issues에 문의하세요.