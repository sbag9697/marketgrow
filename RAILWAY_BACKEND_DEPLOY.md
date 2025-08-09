# Railway 백엔드 배포 가이드

## 1. Railway 계정 설정

### 1.1 Railway 가입
1. [Railway.app](https://railway.app) 접속
2. GitHub 계정으로 로그인 (권장)
3. 이메일 인증 완료

## 2. 새 프로젝트 생성

### 2.1 Dashboard에서 프로젝트 생성
```
1. "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. GitHub 저장소 연결 승인
4. "sbag9697/marketgrow" 저장소 선택
```

### 2.2 Root Directory 설정 (중요!)
```
1. Settings 탭 클릭
2. General 섹션에서 "Root Directory" 찾기
3. `/backend` 입력
4. Save 클릭
```

## 3. 환경 변수 설정

### 3.1 MongoDB 연결
```
Settings > Variables 에서 다음 추가:

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/marketgrow
JWT_SECRET=your-secret-key-here
NODE_ENV=production
PORT=3000
```

### 3.2 SMM 패널 API 설정
```
SMM_API_KEY=your-smm-api-key
SMM_API_URL=https://api.smmturk.com/api/v2
```

### 3.3 결제 시스템 설정 (토스페이먼츠)
```
TOSS_CLIENT_KEY=your-toss-client-key
TOSS_SECRET_KEY=your-toss-secret-key
```

### 3.4 이메일 설정 (선택사항)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 4. MongoDB Atlas 설정

### 4.1 MongoDB Atlas 계정 생성
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 가입
2. 무료 클러스터 생성 (M0 Sandbox)
3. 지역 선택: Seoul (ap-northeast-2)

### 4.2 데이터베이스 사용자 생성
```
1. Database Access > Add New Database User
2. Username: marketgrow
3. Password: 강력한 비밀번호 생성
4. Database User Privileges: Read and write to any database
```

### 4.3 Network Access 설정
```
1. Network Access > Add IP Address
2. "Allow Access from Anywhere" 선택 (0.0.0.0/0)
3. Confirm 클릭
```

### 4.4 연결 문자열 가져오기
```
1. Clusters > Connect
2. "Connect your application" 선택
3. Driver: Node.js, Version: 4.1 or later
4. Connection String 복사
5. <password>를 실제 비밀번호로 교체
```

## 5. 배포 실행

### 5.1 자동 배포 설정
```
1. Railway Dashboard > Settings
2. "Deploy on Push" 활성화
3. Branch: main 선택
```

### 5.2 수동 배포
```
1. Railway Dashboard > Deployments
2. "Deploy" 버튼 클릭
3. 로그 확인하여 오류 체크
```

## 6. 배포 확인

### 6.1 로그 확인
```
Deployments 탭에서 실시간 로그 확인:
- "Build Logs" - 빌드 과정 확인
- "Deploy Logs" - 실행 로그 확인
```

### 6.2 Health Check
```
배포된 URL 확인:
https://your-app.up.railway.app/api/health

정상 응답:
{
  "status": "OK",
  "message": "MarketGrow API is running"
}
```

## 7. 프론트엔드 연결

### 7.1 Netlify 환경 변수 업데이트
```
1. Netlify Dashboard > Site settings
2. Environment variables
3. VITE_API_URL = https://your-app.up.railway.app
```

### 7.2 로컬 개발 환경
```
# .env.local 파일
VITE_API_URL=https://your-app.up.railway.app
```

## 8. 문제 해결

### 8.1 빌드 실패
```
# package-lock.json 재생성
cd backend
rm package-lock.json
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
git push
```

### 8.2 MongoDB 연결 실패
```
1. MongoDB Atlas Network Access 확인
2. Connection String의 비밀번호 확인
3. 데이터베이스 이름 확인 (/marketgrow)
```

### 8.3 포트 오류
```
Railway는 자동으로 PORT 환경변수를 제공
코드에서 process.env.PORT || 3000 사용 확인
```

## 9. 모니터링

### 9.1 Railway 대시보드
```
- Metrics: CPU, Memory 사용량 확인
- Logs: 실시간 로그 스트리밍
- Deployments: 배포 히스토리
```

### 9.2 사용량 제한 (무료 플랜)
```
- 500시간/월 실행 시간
- 100GB 아웃바운드 트래픽
- 1GB RAM
- 1 vCPU
```

## 10. 명령어 정리

### 로컬에서 Railway CLI 사용
```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 환경변수 확인
railway variables

# 로그 확인
railway logs

# 배포
railway up
```

## 중요 체크리스트

- [ ] Root Directory를 `/backend`로 설정했는가?
- [ ] MongoDB Atlas 연결 문자열이 올바른가?
- [ ] 모든 필수 환경 변수를 설정했는가?
- [ ] Network Access에서 0.0.0.0/0을 허용했는가?
- [ ] package-lock.json이 존재하는가?
- [ ] NODE_ENV=production으로 설정했는가?

## 지원 및 문서

- [Railway 공식 문서](https://docs.railway.app)
- [MongoDB Atlas 문서](https://docs.atlas.mongodb.com)
- [Node.js on Railway](https://docs.railway.app/guides/node)