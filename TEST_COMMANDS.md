# 테스트 명령어 모음

## 1. 로그인 테스트

### 브라우저 콘솔에서 토큰 확인
```javascript
// 토큰 확인
localStorage.getItem('authToken')

// 사용자 정보 확인
JSON.parse(localStorage.getItem('userInfo'))
```

## 2. API 테스트 (curl)

### MongoDB 연결 상태 확인
```bash
curl -s https://marketgrow.kr/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"diagnose"}' | jq
```

### 로그인 테스트
```bash
curl -s https://marketgrow.kr/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "login",
    "username": "admin@marketgrow.kr",
    "password": "YOUR_PASSWORD"
  }' | jq
```

### 주문 생성 테스트 (토큰 필요)
```bash
# 토큰 설정
TOKEN="YOUR_JWT_TOKEN_HERE"

# 주문 생성
curl -s https://marketgrow.kr/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-order-$(date +%s)" \
  -d '{
    "orderId": "ord_test_001",
    "serviceType": "instagram-followers",
    "serviceName": "인스타그램 팔로워",
    "targetUrl": "https://instagram.com/example",
    "quantity": 100,
    "originalPrice": 10000,
    "discountAmount": 0,
    "totalPrice": 10000
  }' | jq
```

### 주문 목록 조회
```bash
curl -s "https://marketgrow.kr/api/orders?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 3. 관리자 계정 생성

### 대화형 스크립트 실행
```bash
cd sns-marketing-site
node scripts/create-admin.js
```

### 기존 사용자를 관리자로 업그레이드
```bash
cd sns-marketing-site
node scripts/update-to-admin.js admin@marketgrow.kr
```

## 4. MongoDB 직접 확인 (mongosh)

### 연결 테스트
```bash
# 비TLS
mongosh "mongodb://mongo:PASSWORD@turntable.proxy.rlwy.net:41740/marketgrow?authSource=admin"

# TLS 
mongosh "mongodb://mongo:PASSWORD@turntable.proxy.rlwy.net:41740/marketgrow?authSource=admin&tls=true&tlsAllowInvalidCertificates=true"
```

### 사용자 확인
```javascript
// mongosh에서
use marketgrow
db.users.findOne({ email: "admin@marketgrow.kr" })
```

### 관리자 권한 부여
```javascript
db.users.updateOne(
  { email: "admin@marketgrow.kr" },
  { $set: { role: "admin", isAdmin: true } }
)
```

## 5. 로컬 개발 환경

### 환경변수 설정 (.env 파일)
```env
MONGODB_URI=mongodb://mongo:PASSWORD@turntable.proxy.rlwy.net:41740/marketgrow?authSource=admin&directConnection=true&serverSelectionTimeoutMS=5000
MONGODB_DB=marketgrow
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 로컬 서버 실행
```bash
# Backend
cd sns-marketing-site/backend
npm install
npm start

# Frontend
cd sns-marketing-site
python -m http.server 8000
```

## 6. 디버깅 팁

### 400 에러 시
1. 브라우저 DevTools → Network → Response 확인
2. 에러 메시지 확인:
   - `invalid_action` → action 파라미터 누락
   - `missing_credentials` → 로그인 정보 누락
   - `Invalid JSON` → Content-Type 또는 JSON 형식 문제

### MongoDB 연결 실패 시
1. diagnose 엔드포인트로 상세 정보 확인
2. 에러별 대응:
   - `Authentication failed` → 비밀번호/authSource 확인
   - `server selection timed out` → TLS 옵션 추가
   - `SSL handshake failed` → tlsAllowInvalidCertificates=true 추가