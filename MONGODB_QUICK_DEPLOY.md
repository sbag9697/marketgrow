# 🚀 MongoDB 빠른 배포 가이드

## 1️⃣ Railway MongoDB URI 복사 (2분)

1. [Railway Dashboard](https://railway.app) 접속
2. MongoDB 서비스 클릭
3. "Connect" 탭 → MongoDB URI 복사

## 2️⃣ 환경 변수 설정 (5분)

### Netlify 환경 변수
```
Site settings → Environment variables → Add
```

복사/붙여넣기:
```env
MONGODB_URI=[Railway에서 복사한 URI]
MONGODB_DB=marketgrow
JWT_SECRET=dev-jwt-secret-32chars-minimum-required
JWT_SECRET_ADMIN=admin-jwt-secret-32chars-different-required
ALLOWED_ORIGINS=https://marketgrow.kr,https://www.marketgrow.kr
NODE_ENV=production
```

### Railway 환경 변수
```env
MONGODB_DB=marketgrow
JWT_SECRET=dev-jwt-secret-32chars-minimum-required
JWT_SECRET_ADMIN=admin-jwt-secret-32chars-different-required
ALLOWED_ORIGINS=https://marketgrow.kr,https://www.marketgrow.kr,https://marketgrow.netlify.app
NODE_ENV=production
```

## 3️⃣ 로컬 테스트 (3분)

```bash
# .env 파일 생성
echo "MONGODB_URI=[Railway URI 붙여넣기]" > .env
echo "MONGODB_DB=marketgrow" >> .env

# 연결 테스트
node scripts/test-mongodb-connection.js

# 인덱스 생성
node scripts/mongodb-indexes.js

# 관리자 계정 생성
node backend/utils/seed.js
```

## 4️⃣ Functions 교체 & 배포 (2분)

```bash
# Functions 자동 교체
node scripts/switch-to-mongodb.js

# Git 커밋 & 푸시
git add -A
git commit -m "feat: MongoDB 마이그레이션 완료"
git push
```

## 5️⃣ 배포 확인 (2분)

1. Netlify 대시보드에서 빌드 상태 확인
2. 배포 완료 후 테스트:
   - https://marketgrow.kr 접속
   - 회원가입/로그인 테스트
   - 주문 생성 테스트

## ⚡ 총 소요시간: 약 15분

## 🔧 문제 발생 시

### 롤백 방법
```bash
# PostgreSQL로 즉시 복구
node scripts/switch-to-mongodb.js rollback
git add -A
git commit -m "rollback: PostgreSQL 복구"
git push
```

### 디버깅
```bash
# MongoDB 연결 확인
node scripts/test-mongodb-connection.js

# 로그 확인
# Netlify: Functions 탭 → 실시간 로그
# Railway: 서비스 → Logs
```

---
작성일: 2025-08-22