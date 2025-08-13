# Railway 완전 새로운 배포 가이드

## 1. 기존 서비스 삭제 (선택사항)
1. https://railway.app 접속
2. 프로젝트 선택
3. Settings → Danger → Delete Service

## 2. 새 서비스 생성
1. Railway 대시보드에서 **New** 버튼 클릭
2. **Deploy from GitHub repo** 선택
3. **sbag9697/marketgrow** 저장소 선택
4. **Add Service** 클릭

## 3. 환경 변수 설정
Variables 탭에서 다음 변수 추가:

```
MONGODB_URI=mongodb+srv://sbag9697:Rkdwogur12@cluster0.ot3kp.mongodb.net/marketgrow?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here-change-this-in-production-2024
NODE_ENV=production
PORT=5000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 4. 배포 설정
Settings 탭에서:

### General
- **Branch**: main
- **Root Directory**: 비워두기 또는 `/`

### Build & Deploy
- **Builder**: Nixpacks
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && node server.js`

### Watch Paths (선택사항)
- `backend/**`

## 5. 배포 트리거
1. **Deploy** 버튼 클릭
2. Logs 탭에서 배포 진행 상황 확인

## 6. 확인사항
배포 완료 후 확인:

```bash
# Health check
curl https://[your-app].railway.app/api/health

# Username check
curl -X POST https://[your-app].railway.app/api/auth/check-username \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}'
```

## 7. 문제 해결
만약 여전히 404 오류가 발생한다면:

1. **Logs 탭**에서 다음 메시지 확인:
   - "Registering POST /check-username route"
   - "Auth routes registered"
   - "MongoDB connected successfully"

2. **Environment Variables**에서 모든 변수가 설정되었는지 확인

3. **Redeploy** 버튼으로 재배포

## 8. 대체 방법: Railway CLI 사용

```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 새 프로젝트 생성
railway init

# 서비스 링크
railway link

# 환경변수 설정
railway variables set MONGODB_URI="mongodb+srv://..."
railway variables set JWT_SECRET="..."
railway variables set NODE_ENV="production"

# 배포
railway up
```

## 9. 최종 체크리스트
- [ ] GitHub 저장소 연결 확인
- [ ] 환경변수 모두 설정
- [ ] Build/Start 명령어 정확히 입력
- [ ] 배포 로그에 오류 없음
- [ ] Health check 응답 확인
- [ ] API 엔드포인트 작동 확인