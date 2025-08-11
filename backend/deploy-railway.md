# Railway 배포 가이드

## 1. Railway CLI 설치

```bash
# Windows (PowerShell 관리자 권한으로 실행)
iwr -useb https://railway.app/install.ps1 | iex

# 또는 npm으로 설치
npm install -g @railway/cli
```

## 2. Railway 계정 생성 및 로그인

1. https://railway.app 에서 계정 생성 (GitHub 연동 추천)
2. CLI에서 로그인:
```bash
railway login
```

## 3. 프로젝트 생성 및 배포

```bash
# backend 디렉토리로 이동
cd sns-marketing-site/backend

# Railway 프로젝트 초기화
railway init

# MongoDB 추가 (무료 플랜은 500MB)
railway add

# 선택 옵션:
# - MongoDB 선택
# 또는 PostgreSQL을 선택해도 됩니다

# 배포
railway up
```

## 4. 환경변수 설정

Railway 대시보드에서 설정하거나 CLI로 설정:

```bash
# 필수 환경변수 설정
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway variables set FRONTEND_URL=https://melodious-banoffee-c450ea.netlify.app
railway variables set ADMIN_PASSWORD=YourSecureAdminPassword123!

# SMM Turk API (실제 API 키 필요)
railway variables set SMM_TURK_API_KEY=your-actual-api-key

# Toss Payments (실제 키 필요)
railway variables set TOSS_SECRET_KEY=your-toss-secret-key
railway variables set TOSS_CLIENT_KEY=your-toss-client-key
```

## 5. 도메인 설정

```bash
# Railway가 제공하는 도메인 확인
railway domain

# 출력된 URL을 복사하여 프론트엔드 설정에 추가
```

## 6. 프론트엔드 API URL 업데이트

프론트엔드 파일들에서 API URL을 Railway URL로 변경:

1. `js/config.js` 파일 수정:
```javascript
const API_BASE_URL = 'https://your-app.up.railway.app'; // Railway URL로 변경
```

2. Netlify 환경변수 추가:
   - Netlify 대시보드 > Site settings > Environment variables
   - `REACT_APP_API_URL` = `https://your-app.up.railway.app`

## 7. 데이터베이스 초기화

```bash
# Railway 콘솔 접속
railway run node seed-services.js

# 관리자 계정 생성
railway run node reset-admin.js
```

## 8. 모니터링

```bash
# 로그 확인
railway logs

# 상태 확인
railway status

# Railway 대시보드 열기
railway open
```

## 9. 문제 해결

### CORS 에러가 발생하는 경우
- Railway URL을 `backend/server.js`의 allowedOrigins에 추가
- 재배포: `railway up`

### 데이터베이스 연결 실패
- Railway 대시보드에서 DATABASE_URL 확인
- MongoDB/PostgreSQL 서비스가 활성화되어 있는지 확인

### 배포 실패
- `railway logs` 로 에러 확인
- package.json의 engines 필드 확인 (Node.js 버전)

## 10. 프로덕션 체크리스트

- [ ] 모든 환경변수 설정 완료
- [ ] 데이터베이스 연결 확인
- [ ] 프론트엔드 API URL 업데이트
- [ ] CORS 설정 확인
- [ ] 관리자 계정 생성
- [ ] 결제 API 키 설정
- [ ] SMM Turk API 키 설정
- [ ] SSL 인증서 확인 (Railway 자동 제공)

## 비용

Railway 무료 플랜:
- $5 크레딧/월
- 500MB MongoDB
- 512MB RAM
- 충분한 시작점

유료 플랜 ($20/월):
- 무제한 사용
- 더 많은 리소스
- 커스텀 도메인

## 지원

문제가 있으면:
1. Railway Discord: https://discord.gg/railway
2. Railway Docs: https://docs.railway.app
3. GitHub Issues: 프로젝트 리포지토리에 이슈 생성