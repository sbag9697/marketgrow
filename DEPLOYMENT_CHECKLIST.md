# 🚀 MarketGrow 배포 체크리스트

## 📋 Railway 백엔드 배포

### 1. Railway CLI 설치 및 로그인
```bash
# Windows PowerShell (관리자 권한)
iwr -useb https://railway.app/install.ps1 | iex

# 로그인
railway login
```

### 2. 백엔드 배포
```bash
# backend 디렉토리로 이동
cd sns-marketing-site/backend

# Railway 프로젝트 초기화
railway init

# MongoDB 추가 (옵션에서 MongoDB 선택)
railway add

# 배포
railway up
```

### 3. 환경변수 설정 (Railway 대시보드에서)
```
필수 환경변수:
- NODE_ENV=production
- JWT_SECRET=(32자 이상 랜덤 문자열)
- FRONTEND_URL=https://melodious-banoffee-c450ea.netlify.app
- ADMIN_EMAIL=admin@marketgrow.com
- ADMIN_PASSWORD=(강력한 비밀번호)

SMM Turk API (실제 키 필요):
- SMM_API_KEY=(SMM Turk에서 발급받은 API 키)
- SMM_API_URL=https://smmturk.com/api/v2
- SMM_ENABLED=true
- PRICE_MARGIN=800

Toss Payments (사업자등록 후):
- TOSS_SECRET_KEY=(토스페이먼츠 시크릿 키)
- TOSS_CLIENT_KEY=(토스페이먼츠 클라이언트 키)
```

### 4. Railway URL 확인
```bash
railway domain
# 출력된 URL을 복사 (예: https://marketgrow-backend-production.up.railway.app)
```

## 📱 프론트엔드 설정 업데이트

### 1. API URL 변경
`js/config.js` 파일 수정:
```javascript
BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:5001/api'
    : 'https://YOUR-RAILWAY-URL.railway.app/api', // Railway URL로 변경
    
USE_MOCK: false  // Mock 모드 비활성화
```

### 2. Netlify 환경변수 추가
Netlify 대시보드 > Site settings > Environment variables:
```
RAILWAY_API_URL=https://YOUR-RAILWAY-URL.railway.app/api
TOSS_CLIENT_KEY=(토스페이먼츠 클라이언트 키)
```

### 3. Git 커밋 및 푸시
```bash
git add .
git commit -m "Railway 백엔드 URL 업데이트"
git push
```

## ✅ 배포 후 테스트

### 기본 기능 테스트
- [ ] 홈페이지 접속 확인
- [ ] 서비스 목록 표시 확인
- [ ] 회원가입 테스트
- [ ] 로그인 테스트
- [ ] 서비스 주문 테스트
- [ ] 결제 프로세스 테스트 (테스트 모드)

### API 연동 테스트
- [ ] Railway 백엔드 상태 확인
- [ ] 데이터베이스 연결 확인
- [ ] SMM Turk API 연동 확인
- [ ] CORS 설정 확인

### 관리자 기능
- [ ] 관리자 계정 로그인
- [ ] 대시보드 접속
- [ ] 주문 관리 확인

## 🔒 보안 체크리스트

- [ ] 환경변수에 민감한 정보 저장
- [ ] HTTPS 활성화 확인
- [ ] CORS 설정 확인
- [ ] Rate Limiting 활성화
- [ ] SQL Injection 방지
- [ ] XSS 방지

## 📊 모니터링

### Railway 모니터링
```bash
# 로그 확인
railway logs

# 상태 확인
railway status

# 대시보드 열기
railway open
```

### 에러 처리
- CORS 에러: backend/server.js의 allowedOrigins에 URL 추가
- 데이터베이스 연결 실패: DATABASE_URL 환경변수 확인
- API 호출 실패: Railway 로그 확인

## 💰 비용 관리

### Railway
- 무료: $5 크레딧/월
- Hobby: $5/월
- Pro: $20/월

### Netlify
- 무료: 100GB 대역폭/월
- Pro: $19/월

### 예상 월 비용
- 최소: 무료 (Railway + Netlify 무료 플랜)
- 권장: $25/월 (Railway Hobby + Netlify 무료)
- 성장: $50+/월 (Railway Pro + Netlify Pro)

## 🚨 긴급 연락처

### 기술 지원
- Railway Discord: https://discord.gg/railway
- Netlify Support: https://www.netlify.com/support/
- SMM Turk Support: (SMM Turk 고객센터)

### 문제 발생 시
1. Railway 로그 확인
2. Netlify 빌드 로그 확인
3. 브라우저 콘솔 에러 확인
4. 네트워크 탭에서 API 호출 확인

## 📝 다음 단계

1. **사업자등록 완료 후**
   - 통신판매업 신고
   - 토스페이먼츠 정식 가맹점 전환
   - 실제 결제 모드 활성화

2. **도메인 구매**
   - marketgrow.co.kr 또는 .com
   - Netlify 커스텀 도메인 연결
   - SSL 인증서 설정

3. **마케팅 시작**
   - Google Analytics 설정
   - 네이버 서치어드바이저 등록
   - 소셜미디어 계정 개설

---
마지막 업데이트: 2025-08-10