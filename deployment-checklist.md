# 🚀 MarketGrow 배포 체크리스트

## ✅ 배포 전 필수 확인 사항

### 1. 환경 변수 준비
- [ ] MongoDB Atlas 프로덕션 DB 생성
- [ ] SMM 패널 API 키 확보
- [ ] 토스페이먼츠 프로덕션 키 준비
- [ ] JWT Secret 생성 (최소 32자 이상)
- [ ] 관리자 계정 정보 설정

### 2. 보안 설정
- [ ] 모든 비밀번호가 강력한가?
- [ ] API 키가 노출되지 않았는가?
- [ ] CORS 설정이 올바른가?
- [ ] MongoDB IP 화이트리스트 설정

### 3. 코드 검증
- [ ] console.log 제거 또는 주석 처리
- [ ] 테스트 코드 제거
- [ ] 에러 처리 확인
- [ ] API 엔드포인트 보안 확인

### 4. 성능 최적화
- [ ] 이미지 최적화
- [ ] CSS/JS 최소화
- [ ] 캐싱 설정
- [ ] 로딩 속도 테스트

### 5. 기능 테스트
- [ ] 회원가입/로그인
- [ ] 서비스 주문
- [ ] 결제 프로세스
- [ ] SMM 패널 연동
- [ ] 주문 상태 확인

## 🛠️ 빠른 배포 명령어

### Frontend (Netlify)
```bash
# 환경 변수 설정
export BACKEND_URL=https://your-backend-url.herokuapp.com
export TOSSPAYMENTS_CLIENT_KEY=your-production-key

# 빌드
node build-netlify.js

# 배포
netlify deploy --prod --dir=dist
```

### Backend (Heroku)
```bash
cd backend
heroku create marketgrow-backend
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your-mongodb-uri"
heroku config:set JWT_SECRET="your-secret"
heroku config:set SMM_PANEL_API_KEY="your-api-key"
heroku config:set PRICE_MARGIN=90
git push heroku main
```

## 📋 배포 후 확인
- [ ] 사이트 접속 확인
- [ ] HTTPS 작동 확인
- [ ] API 연결 테스트
- [ ] 실제 주문 테스트 (소액)
- [ ] 모니터링 설정