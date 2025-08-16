# Railway 외부 연결 URI 설정 가이드

## 🚨 문제 원인
- `mongodb.railway.internal`은 Railway 내부에서만 사용 가능
- Render(외부)에서는 DNS 해석 불가능
- 반드시 **외부 공개 URI** 필요

## ✅ 즉시 해결 방법

### 1. Railway에서 외부 URI 가져오기

1. [Railway Dashboard](https://railway.app) 접속
2. MongoDB 서비스 클릭
3. **Connect** 탭 또는 **Variables** 탭 이동
4. 다음 중 하나를 찾아 복사:
   - **"Connect from outside Railway"**
   - **"Public Connection"**
   - **"External Connection"**
   - **"Public Network"**

예시 형태:
```
mongodb://<username>:<password>@containers-us-west-xxx.railway.app:7890/railway?authSource=admin
```

⚠️ 주의: `containers-xxx.railway.app` 형태의 공개 호스트명과 포트번호가 반드시 포함되어야 함

### 2. Railway에서 외부 접속 활성화 (필요한 경우)

MongoDB 서비스 설정에서:
1. **Settings** 탭
2. **Networking** 섹션
3. **Public Networking** 또는 **Expose Port** 토글 ON
4. TCP Proxy 활성화 확인

### 3. Render 환경 변수 업데이트

1. [Render Dashboard](https://dashboard.render.com)
2. `marketgrow` 서비스 선택
3. **Environment** 탭
4. `MONGODB_URI` 값을 외부 URI로 변경:

```bash
MONGODB_URI=mongodb://<username>:<password>@containers-us-west-xxx.railway.app:7890/railway?authSource=admin&tls=true&retryWrites=true&w=majority
```

⚠️ 중요: 
- `tls=true` 포함 (보안 연결)
- `sslValidate` 제거 (deprecated)
- 비밀번호에 특수문자가 있으면 URL 인코딩 필요

### 4. 연결 테스트 (Render Shell)

```bash
# DNS 해석 확인
nslookup containers-us-west-xxx.railway.app

# 포트 연결 확인  
nc -vz containers-us-west-xxx.railway.app 7890

# MongoDB 직접 연결 테스트
mongosh "mongodb://<username>:<password>@containers-us-west-xxx.railway.app:7890/railway?authSource=admin"
```

## 📋 체크리스트

- [ ] Railway 외부 URI 복사 (containers-xxx.railway.app 형태)
- [ ] Railway Public Networking 활성화
- [ ] Render 환경 변수 MONGODB_URI 업데이트
- [ ] 재배포 시작
- [ ] 로그에서 "✅ MongoDB connected successfully" 확인
- [ ] API 헬스체크: https://marketgrow.onrender.com/api/health

## 🔒 보안 작업

### 1. Railway MongoDB 비밀번호 변경
1. Railway → MongoDB → Variables
2. `MONGO_PASSWORD` 재생성
3. 새 URI로 Render 환경 변수 업데이트

### 2. Git 히스토리 정리
```bash
# 민감 정보가 있는 파일 제거
git rm --cached backend/.env
git commit -m "Remove sensitive files"

# BFG로 히스토리 정리 (선택)
java -jar bfg.jar --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

## 🚀 예상 결과

✅ 성공 로그:
```
Using Railway MongoDB (External Connection)
Attempting to connect to MongoDB...
✅ MongoDB connected successfully
📦 SMM order sync service disabled (no DB, production mode, or SMM_ENABLED=false)
```

❌ 실패 로그 (내부 URI 사용 시):
```
MONGODB_URI is using internal Railway host. Use the PUBLIC external host/port URI.
Running without database connection in production mode
```

## 📊 모니터링

1. **Render Logs**: MongoDB 연결 상태
2. **Railway Metrics**: 연결 수, 메모리 사용량
3. **API Health**: /api/health 엔드포인트

## 🆘 추가 문제 해결

### Atlas로 돌아가기 (대안)
Railway가 안 되면 Atlas Data API 사용:
1. Atlas → Data API 활성화
2. API Key 생성
3. HTTP 기반 CRUD 구현

### 임시 테스트 모드
긴급 상황 시:
```bash
USE_TEST_MODE=true
MONGODB_URI=localhost
```