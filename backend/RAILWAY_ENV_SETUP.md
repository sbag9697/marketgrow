# Railway 환경 변수 설정 가이드

## 1. Railway 프로젝트 생성

1. [Railway](https://railway.app) 접속 후 로그인
2. "New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. 저장소 연결

## 2. 필수 환경 변수 설정

Railway 대시보드에서 다음 환경 변수들을 설정하세요:

### 기본 설정
```
NODE_ENV=production
PORT=5001
```

### MongoDB 설정 (Railway MongoDB 사용 시)
```
MONGODB_URI=${{MongoDB.MONGO_URL}}
```

또는 MongoDB Atlas 사용 시:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/marketgrow?retryWrites=true&w=majority
```

### JWT 설정
```
JWT_SECRET=your-very-secure-jwt-secret-key-at-least-32-characters-$(openssl rand -base64 32)
JWT_REFRESH_SECRET=your-very-secure-refresh-secret-key-at-least-32-characters-$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

### KG이니시스 설정
```
INICIS_MID=INIpayTest
INICIS_SIGN_KEY=SU5JTElURV9UUklQTEVERVNfS0VZU19=
INICIS_API_KEY=your-inicis-api-key
INICIS_API_URL=https://iniapi.inicis.com
```

### SMM 패널 API 설정
```
SMM_API_URL=https://smmturk.com/api/v2
SMM_API_KEY=your-smm-api-key
```

### 이메일 설정 (선택사항)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### SMS 설정 (선택사항)
```
COOLSMS_API_KEY=your-coolsms-api-key
COOLSMS_API_SECRET=your-coolsms-api-secret
COOLSMS_SENDER=010-0000-0000
```

### CORS 설정
```
CORS_ORIGIN=https://melodious-banoffee-c450ea.netlify.app
```

### 보안 설정
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
```

### 관리자 계정
```
ADMIN_EMAIL=admin@marketgrow.com
ADMIN_PASSWORD=Admin123!@#
```

## 3. Railway에서 MongoDB 추가

1. Railway 대시보드에서 "New" 클릭
2. "Database" → "MongoDB" 선택
3. 자동으로 연결 변수가 생성됨

## 4. 배포 명령어

Railway CLI 사용:
```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 배포
railway up
```

또는 GitHub 자동 배포:
- main 브랜치에 push하면 자동 배포

## 5. 배포 확인

1. Railway 대시보드에서 배포 로그 확인
2. 제공된 URL로 접속 테스트
3. `/api/health` 엔드포인트로 상태 확인

## 6. 프론트엔드 연결

프론트엔드 코드에서 API URL 업데이트:
```javascript
// js/config.js
const API_CONFIG = {
    BASE_URL: 'https://your-app.up.railway.app',
    // ...
};
```

## 7. 문제 해결

### MongoDB 연결 실패
- MongoDB URI 형식 확인
- 네트워크 접근 권한 확인 (MongoDB Atlas의 경우)

### 포트 오류
- Railway는 자동으로 PORT 환경 변수를 제공
- 코드에서 `process.env.PORT` 사용 확인

### CORS 오류
- CORS_ORIGIN 환경 변수에 프론트엔드 URL 추가
- 여러 URL은 쉼표로 구분

## 8. 모니터링

Railway 대시보드에서:
- 실시간 로그 확인
- 리소스 사용량 모니터링
- 에러 추적

## 9. 백업 및 복구

정기적으로 데이터베이스 백업:
```bash
# MongoDB 백업
mongodump --uri="$MONGODB_URI" --out=backup/

# 복구
mongorestore --uri="$MONGODB_URI" backup/
```

## 10. 보안 체크리스트

- [ ] 모든 시크릿 키가 강력한 랜덤 값인지 확인
- [ ] HTTPS 활성화 확인
- [ ] Rate limiting 설정 확인
- [ ] 프로덕션 로그 레벨 설정
- [ ] 에러 메시지가 민감한 정보를 노출하지 않는지 확인