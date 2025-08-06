# 🚂 Railway 배포 가이드

## 1. GitHub에 코드 푸시

```bash
# 프로젝트 루트에서
git add .
git commit -m "Initial commit - MarketGrow SNS Marketing Platform"
git branch -M main

# GitHub에서 새 레포지토리 생성 후
git remote add origin https://github.com/YOUR_USERNAME/marketgrow.git
git push -u origin main
```

## 2. Railway 배포

### Railway 웹사이트에서:

1. **https://railway.app** 접속
2. **"Start a New Project"** 클릭
3. **"Deploy from GitHub repo"** 선택
4. **GitHub 계정 연동** (처음인 경우)
5. **레포지토리 선택**: `marketgrow`

### 프로젝트 설정:

1. **Root Directory**: `/backend` 설정
2. **Deploy** 클릭

### 환경 변수 설정:

1. **Variables** 탭 클릭
2. **"Raw Editor"** 클릭
3. 아래 내용 복사/붙여넣기:

```
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://sbag9697:tlgus0611!@cluster0.17qmchk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=abd84b4a6864dc82378baa9363575ccff49e66662cbd4dc4705dcab67cbb2ed0
ADMIN_EMAIL=admin@marketgrow.com
ADMIN_PASSWORD=YihQwkFRFN8Fcbdl!@#
SMM_PANEL_API_KEY=3285e23e5c360ef8216179db7cb716f4
SMM_PANEL_API_URL=https://smmturk.org/api/v2
PRICE_MARGIN=90
TOSSPAYMENTS_SECRET_KEY=test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R
TOSSPAYMENTS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq
CORS_ORIGIN=http://localhost:3000,https://marketgrow.netlify.app
```

4. **Save** 클릭

## 3. 도메인 생성

1. **Settings** 탭
2. **Domains** 섹션
3. **Generate Domain** 클릭
4. 생성된 URL 확인 (예: `marketgrow-backend.up.railway.app`)

## 4. 배포 확인

### Health Check:
```
https://YOUR-APP-NAME.up.railway.app/api/health
```

### 서비스 목록:
```
https://YOUR-APP-NAME.up.railway.app/api/services
```

## 5. 서비스 데이터 추가

Railway CLI 설치 후:
```bash
railway run npm run seed
```

또는 Railway 웹 콘솔에서:
1. **Deploy** 탭
2. **View Logs** 클릭
3. **Run Command** 버튼
4. `npm run seed` 입력

## 6. 프론트엔드 CORS 업데이트

백엔드 URL이 생성되면:
1. Variables에서 `CORS_ORIGIN` 업데이트
2. Netlify 환경변수에 백엔드 URL 추가

## 문제 해결

### 빌드 실패:
- package.json의 engines 확인
- node_modules 삭제 후 재시도

### 연결 오류:
- MongoDB Atlas IP 화이트리스트 확인 (0.0.0.0/0)
- 환경 변수 확인

### 로그 확인:
- Deploy 탭 > View Logs