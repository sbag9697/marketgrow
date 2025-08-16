# Railway MongoDB 외부 연결 활성화 가이드

## 🚨 문제: Railway MongoDB 외부 연결 옵션이 없음

Railway MongoDB는 기본적으로 내부 네트워크만 허용합니다.
외부(Render)에서 접속하려면 **Public Networking**을 활성화해야 합니다.

## ✅ 해결 방법

### 방법 1: Railway에서 Public Networking 활성화

1. **Railway Dashboard** 접속
2. MongoDB 서비스 클릭
3. **Settings** 탭 이동
4. **Networking** 섹션 찾기
5. 다음 옵션 활성화:
   - **"Generate Domain"** 버튼 클릭
   - 또는 **"Enable Public Networking"** 토글 ON
   - 또는 **"TCP Proxy"** 활성화

6. 활성화 후 **Variables** 탭에서:
   - `DATABASE_URL` 또는 `DATABASE_PUBLIC_URL` 확인
   - 형태: `mongodb://mongo:password@monorail.proxy.rlwy.net:12345/railway`

### 방법 2: Railway CLI로 확인

```bash
# Railway CLI 설치 (없으면)
npm i -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 변수 확인
railway variables

# Public URL 찾기
railway status
```

### 방법 3: 대안 - 다른 MongoDB 서비스 사용

#### A. MongoDB Atlas (무료 512MB)
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 가입
2. 새 클러스터 생성 (M0 Free)
3. Network Access → 0.0.0.0/0 추가
4. Connect → Drivers → 연결 문자열 복사

#### B. Neon PostgreSQL (무료 3GB) - MongoDB 대신
1. [Neon](https://neon.tech) 가입
2. 새 프로젝트 생성
3. 연결 문자열 복사
4. 백엔드를 PostgreSQL + Prisma로 마이그레이션

#### C. 임시 - 테스트 모드
Render 환경 변수:
```
USE_TEST_MODE=true
MONGODB_URI=localhost
```
⚠️ 데이터가 저장되지 않음 (메모리 DB)

## 📋 Railway Public URL 예시

활성화 성공 시 나타나는 형태들:

1. **Proxy URL** (최신):
```
mongodb://mongo:xxxxx@monorail.proxy.rlwy.net:12345/railway
```

2. **Containers URL** (구버전):
```
mongodb://mongo:xxxxx@containers-us-west-123.railway.app:7890/railway
```

3. **Roundhouse URL** (일부 리전):
```
mongodb://mongo:xxxxx@roundhouse.proxy.rlwy.net:12345/railway
```

## 🔧 Render 환경 변수 설정

Railway에서 Public URL을 얻었다면:

```bash
# Render Dashboard → Environment
MONGODB_URI=mongodb://mongo:password@monorail.proxy.rlwy.net:12345/railway?authSource=admin&directConnection=true

# 추가 옵션
NODE_ENV=production
SMM_ENABLED=false
USE_TEST_MODE=false
```

## 🧪 연결 테스트

### 로컬에서 테스트:
```bash
# MongoDB 클라이언트 설치 (없으면)
npm install -g mongosh

# 연결 테스트
mongosh "mongodb://mongo:password@monorail.proxy.rlwy.net:12345/railway"
```

### Render Shell에서:
```bash
# DNS 확인
nslookup monorail.proxy.rlwy.net

# 포트 확인
nc -vz monorail.proxy.rlwy.net 12345
```

## ⚡ 빠른 해결책

Railway Public Networking이 안 되면:

### 옵션 1: MongoDB Atlas로 전환
```bash
# Render 환경 변수
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/marketgrow?retryWrites=true&w=majority
```

### 옵션 2: 테스트 모드로 임시 운영
```bash
# Render 환경 변수
USE_TEST_MODE=true
MONGODB_URI=test
```

### 옵션 3: Supabase PostgreSQL (무료)
1. [Supabase](https://supabase.com) 가입
2. 새 프로젝트 생성
3. Settings → Database → Connection String
4. Prisma로 백엔드 마이그레이션

## 📞 Railway 지원

Public Networking이 안 보이면:
1. Railway Discord/Support 문의
2. 플랜 업그레이드 필요 여부 확인
3. 리전 변경 시도

## 🎯 결론

1. **최우선**: Railway Public Networking 활성화 시도
2. **안 되면**: MongoDB Atlas로 전환
3. **긴급**: 테스트 모드로 임시 운영
4. **장기**: PostgreSQL 마이그레이션 검토