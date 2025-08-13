# 🔧 Railway 서버 문제 해결

## 현재 상황
- 서버는 실행 중 (로그 확인됨)
- 하지만 외부에서 접근 불가 (502 에러)

## 해결 방법

### 방법 1: Railway에서 새 도메인 생성

1. Railway 대시보드 접속
2. **Settings** → **Networking**
3. **Generate Domain** 버튼 클릭
4. 새로운 도메인 생성 (예: marketgrow-production-xxxx.up.railway.app)
5. 새 도메인으로 테스트

### 방법 2: PORT 설정 확인

Railway Variables에서:
```
PORT=5001
```
또는 제거 (Railway가 자동 설정)

### 방법 3: 환경변수 확인

필수 환경변수:
```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
MONGODB_URI=mongodb+srv://sbag9697:tlgus0611!@cluster0.17qmchk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
EMAIL_USER=sbag9697@gmail.com
EMAIL_APP_PASSWORD=여기에_Gmail_앱_비밀번호
FRONTEND_URL=https://marketgrow.kr
```

### 방법 4: Railway 재시작

1. Railway 대시보드 → **Deployments**
2. 현재 배포 옆 **...** 클릭
3. **Restart** 선택

## 임시 해결책: Vercel 사용

백엔드를 Vercel에 배포:

1. `backend/vercel.json` 생성:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

2. Vercel CLI 설치:
```bash
npm i -g vercel
```

3. 배포:
```bash
cd backend
vercel
```

## 테스트용 임시 서버

로컬에서 ngrok 사용:
```bash
cd backend
npm start
npx ngrok http 5001
```

생성된 URL을 프론트엔드에서 사용

---

## Railway 로그 확인사항

✅ 서버 실행됨: "Server running on port 5001"
✅ MongoDB 연결: In-memory DB 사용 중
❌ 외부 접근: 502 에러

**가능한 원인:**
1. Railway 네트워킹 설정 문제
2. 도메인 만료 또는 변경
3. PORT 바인딩 문제

---

## 즉시 해결책

**새 Railway 도메인 생성하기:**
1. Settings → Networking
2. Remove current domain
3. Generate new domain
4. 새 URL로 config.js 업데이트