# 🚀 Railway 백엔드 배포 가이드 (5분 완성)

## 📋 사전 준비
- GitHub 계정 (이미 있음 ✅)
- Railway 계정 (무료)
- MongoDB Atlas 계정 (무료)

---

## 1️⃣ MongoDB Atlas 설정 (3분)

### 1. 계정 생성
1. https://www.mongodb.com/cloud/atlas/register 접속
2. Google 계정으로 가입

### 2. 무료 클러스터 생성
1. **Create Cluster** 클릭
2. **FREE** 플랜 선택 (M0 Sandbox)
3. **AWS** + **Seoul (ap-northeast-2)** 선택
4. Cluster Name: `marketgrow-cluster`
5. **Create Cluster** 클릭

### 3. 데이터베이스 접속 설정
1. **Database Access** → **Add New Database User**
   - Username: `marketgrow`
   - Password: `자동 생성` 클릭 (비밀번호 복사!)
   - **Add User** 클릭

2. **Network Access** → **Add IP Address**
   - **Allow Access from Anywhere** 클릭
   - **Confirm** 클릭

### 4. Connection String 획득
1. **Database** → **Connect** 클릭
2. **Connect your application** 선택
3. Connection String 복사:
```
mongodb+srv://marketgrow:<password>@marketgrow-cluster.xxxxx.mongodb.net/marketgrow?retryWrites=true&w=majority
```
4. `<password>` 부분을 실제 비밀번호로 교체

---

## 2️⃣ Railway 배포 (2분)

### 1. Railway 가입
1. https://railway.app 접속
2. **Login with GitHub** 클릭

### 2. 프로젝트 생성
1. **New Project** 클릭
2. **Deploy from GitHub repo** 선택
3. **Configure GitHub App** → `marketgrow` 저장소 선택
4. **Deploy Now** 클릭

### 3. 환경 변수 설정
Railway 대시보드에서 **Variables** 탭 클릭 후 아래 변수 추가:

```env
# 필수 환경 변수만 설정 (복사해서 사용)

NODE_ENV=production
PORT=5001

# MongoDB (위에서 복사한 Connection String)
MONGODB_URI=mongodb+srv://marketgrow:YOUR_PASSWORD@marketgrow-cluster.xxxxx.mongodb.net/marketgrow?retryWrites=true&w=majority

# JWT Secret (아래 문자열 그대로 사용 가능)
JWT_SECRET=marketgrow-secret-key-2024-change-this-in-production-abc123xyz789

# 이메일 설정 (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# 프론트엔드 URL
FRONTEND_URL=https://melodious-banoffee-c450ea.netlify.app
```

### 4. Gmail 앱 비밀번호 생성 (선택사항)
1. Google 계정 → 보안 → 2단계 인증 활성화
2. 앱 비밀번호 → 메일 → 생성
3. 16자리 비밀번호를 `EMAIL_APP_PASSWORD`에 입력

### 5. 배포 확인
1. Railway 대시보드에서 **Deployments** 탭
2. 빌드 로그 확인 (2-3분 소요)
3. ✅ **Deploy Success** 확인
4. 생성된 URL 확인 (예: `marketgrow-production.up.railway.app`)

---

## 3️⃣ 배포 확인

### 1. 헬스체크
```bash
https://YOUR-APP.up.railway.app/api/health
```

### 2. 프론트엔드 연결
1. https://melodious-banoffee-c450ea.netlify.app/signup 접속
2. 아이디 중복확인 테스트
3. 회원가입 테스트

---

## 🔥 빠른 설정 (복사용)

### MongoDB URI (예시)
```
mongodb+srv://marketgrow:AbCdEfGh123456@marketgrow-cluster.abcde.mongodb.net/marketgrow?retryWrites=true&w=majority
```

### JWT Secret (예시)
```
marketgrow-jwt-secret-2024-production-key-minimum-32-characters-required
```

### 테스트용 Gmail (선택사항)
```
EMAIL_USER=marketgrow.test@gmail.com
EMAIL_APP_PASSWORD=abcd efgh ijkl mnop (공백 제거)
```

---

## ⚠️ 주의사항

1. **MongoDB Network Access**에서 `0.0.0.0/0` (모든 IP) 허용 필수
2. **Railway 무료 플랜**: 월 $5 크레딧 (충분함)
3. **MongoDB 무료 플랜**: 512MB (충분함)
4. **환경 변수**: Railway에서 직접 입력 (`.env` 파일 업로드 X)

---

## 🎉 완료!

- **백엔드 URL**: `https://YOUR-APP.up.railway.app`
- **프론트엔드**: https://melodious-banoffee-c450ea.netlify.app
- **헬스체크**: `https://YOUR-APP.up.railway.app/api/health`

이제 실제 회원가입, 로그인, SMS/이메일 인증이 작동합니다!