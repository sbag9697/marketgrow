# 🔄 MongoDB 단일화 마이그레이션 가이드

## 📋 현재 상태
- ✅ MongoDB 공통 유틸리티 생성 완료
- ✅ 인증 유틸리티 생성 완료  
- ✅ 인덱스 생성 스크립트 준비 완료
- ✅ orders.js MongoDB 버전 생성 완료
- ⏳ smmturk.js, support.js 변환 필요

## 🚀 즉시 실행 체크리스트

### 1. 환경 변수 설정 (Railway & Netlify)

```env
# MongoDB 연결 (Railway에서 제공)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB=marketgrow

# JWT 시크릿 (분리)
JWT_SECRET=your-user-secret-key-min-32-chars
JWT_SECRET_ADMIN=your-admin-secret-key-different-min-32-chars

# CORS 설정
ALLOWED_ORIGINS=https://marketgrow.kr,https://www.marketgrow.kr

# 환경
NODE_ENV=production
```

### 2. MongoDB 인덱스 생성

```bash
# 로컬에서 실행
npm install mongodb
node scripts/mongodb-indexes.js

# 또는 Railway에서 실행
railway run node scripts/mongodb-indexes.js
```

### 3. 관리자 계정 생성 (MongoDB)

```bash
# 기존 seed.js 실행
node backend/utils/seed.js
```

### 4. Netlify Functions 배포

```bash
# 기존 PostgreSQL 버전 백업
mv netlify/functions/orders.js netlify/functions/orders-postgres.backup.js

# MongoDB 버전으로 교체
mv netlify/functions/orders-mongo.js netlify/functions/orders.js

# Git 커밋 & 푸시
git add -A
git commit -m "feat: MongoDB 단일화 - Netlify Functions 마이그레이션"
git push
```

## 📊 MongoDB 컬렉션 구조

### users
```javascript
{
  _id: ObjectId("..."),
  email: "user@example.com",
  username: "user123",
  password: "$2a$10$...", // bcrypt hash
  name: "홍길동",
  phone: "01012345678",
  role: "user", // user|admin|staff
  membershipLevel: "bronze", // bronze|silver|gold|platinum|diamond
  points: 0,
  depositBalance: 0,
  isActive: true,
  isEmailVerified: false,
  isPhoneVerified: false,
  createdAt: ISODate("2025-01-01"),
  updatedAt: ISODate("2025-01-01")
}
```

### orders
```javascript
{
  _id: "ORD-2025-0001", // 주문번호
  userId: ObjectId("..."),
  userEmail: "user@example.com",
  userName: "홍길동",
  
  serviceType: "instagram_followers",
  serviceName: "인스타그램 팔로워",
  targetUrl: "https://instagram.com/username",
  quantity: 1000,
  
  originalPrice: 50000,
  discountAmount: 5000,
  totalPrice: 45000,
  couponCode: "WELCOME10",
  
  status: "pending", // pending|paid|processing|completed|failed|refunded
  progress: 0, // 0-100
  
  paymentKey: "toss_payment_key",
  paymentMethod: "card",
  paidAt: ISODate("..."),
  
  providerName: "smmturk",
  providerOrderId: "SMM123456",
  
  createdAt: ISODate("..."),
  updatedAt: ISODate("..."),
  startedAt: ISODate("..."),
  completedAt: ISODate("...")
}
```

### service_logs
```javascript
{
  _id: ObjectId("..."),
  orderId: "ORD-2025-0001",
  userId: ObjectId("..."),
  action: "order_created", // order_created|status_updated|auto_sync|payment_received
  details: "주문이 생성되었습니다",
  metadata: {
    previousStatus: "pending",
    newStatus: "paid"
  },
  progressBefore: 0,
  progressAfter: 10,
  createdAt: ISODate("...")
}
```

## ⚠️ 주의사항

### 1. ObjectId 처리
- MongoDB는 `_id`로 ObjectId 사용
- 문자열 ID와 호환성 유지 필요
- 조회 시 ObjectId 변환 처리

### 2. 트랜잭션
- MongoDB 4.0+ 필요
- Replica Set 환경에서만 작동
- Railway MongoDB는 트랜잭션 지원 확인 필요

### 3. 서버리스 연결 관리
- Cold start 시 연결 재사용
- Connection pool 크기 제한 (5-10)
- Lambda 타임아웃 고려

## 🔍 검증 단계

### 1. 로컬 테스트
```bash
# 환경 변수 설정
export MONGODB_URI=mongodb://localhost:27017/
export MONGODB_DB=marketgrow_test

# Functions 테스트
netlify dev
```

### 2. 스테이징 테스트
- Netlify Preview 배포로 테스트
- Railway Review App 활용

### 3. 프로덕션 배포
- 트래픽 낮은 시간대 선택
- 롤백 계획 준비
- 모니터링 강화

## 📈 성능 최적화

### 1. 인덱스 확인
```javascript
// MongoDB Shell
db.orders.getIndexes()
db.users.getIndexes()
```

### 2. 느린 쿼리 모니터링
```javascript
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().limit(5).sort({ ts: -1 })
```

### 3. Connection Pool 튜닝
```javascript
// 서버리스 환경
maxPoolSize: 5  // 작게 유지

// 일반 서버
maxPoolSize: 50 // 여유있게
```

## 🚨 롤백 계획

### PostgreSQL로 복구
```bash
# Functions 복구
mv netlify/functions/orders-postgres.backup.js netlify/functions/orders.js

# 재배포
git add -A
git commit -m "rollback: PostgreSQL 복구"
git push
```

## 📞 지원

문제 발생 시:
1. Railway 로그: `railway logs`
2. Netlify Functions 로그: Netlify 대시보드
3. MongoDB Atlas 모니터링: Atlas 콘솔

---
작성일: 2025-08-22
버전: 1.0