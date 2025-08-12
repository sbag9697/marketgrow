# MarketGrow Backend API Documentation

## 개요
MarketGrow SNS 마케팅 서비스의 백엔드 API 문서입니다.

**Base URL**: `http://localhost:5001/api` (개발환경)  
**Base URL**: `https://your-domain.railway.app/api` (프로덕션 환경)

## 인증
대부분의 API는 JWT 토큰 기반 인증을 사용합니다.  
헤더에 다음과 같이 포함해야 합니다:
```
Authorization: Bearer <your-jwt-token>
```

## 공통 응답 형식
```json
{
  "success": true,
  "message": "성공 메시지",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalItems": 50
  }
}
```

## Rate Limiting
- 일반 API: 15분당 100회
- 인증 API: 15분당 5회
- 비밀번호 재설정: 1시간당 3회

---

## 1. 인증 API (/api/auth)

### 회원가입
**POST** `/auth/register`

요청 body:
```json
{
  "username": "string (4-16자, 영문+숫자)",
  "email": "string (유효한 이메일)",
  "password": "string (최소 8자, 대소문자+숫자+특수문자)",
  "name": "string (2-50자)",
  "phone": "string (10-11자리 숫자)",
  "businessType": "string (optional: personal|small|startup|agency|corporation|other)",
  "referralCode": "string (optional, 3-20자)"
}
```

응답:
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다",
  "data": {
    "user": { ... },
    "token": "jwt-token"
  }
}
```

### 로그인
**POST** `/auth/login`

요청 body:
```json
{
  "login": "string (이메일 또는 아이디)",
  "password": "string"
}
```

### 사용자명 중복 확인
**GET** `/auth/check-username/:username`

### 이메일 중복 확인
**GET** `/auth/check-email/:email`

### 프로필 조회
**GET** `/auth/profile`
- 인증 필요

### 프로필 수정
**PUT** `/auth/profile`
- 인증 필요

요청 body:
```json
{
  "name": "string (optional)",
  "phone": "string (optional)",
  "businessType": "string (optional)",
  "marketingConsent": "boolean (optional)"
}
```

### 비밀번호 변경
**PUT** `/auth/change-password`
- 인증 필요

요청 body:
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

### 비밀번호 재설정 요청
**POST** `/auth/forgot-password`

요청 body:
```json
{
  "email": "string"
}
```

### 비밀번호 재설정
**POST** `/auth/reset-password`

요청 body:
```json
{
  "token": "string",
  "newPassword": "string"
}
```

### 이메일 인증
**GET** `/auth/verify-email/:token`

### 인증 이메일 재발송
**POST** `/auth/resend-verification`
- 인증 필요

---

## 2. 서비스 API (/api/services)

### 서비스 목록 조회
**GET** `/services`

쿼리 파라미터:
- `platform`: string (instagram|youtube|tiktok|facebook|twitter)
- `category`: string (followers|likes|views|comments|subscribers)
- `page`: number (기본값: 1)
- `limit`: number (기본값: 10)

### 플랫폼별 서비스 조회
**GET** `/services/platform/:platform`

### 서비스 상세 조회
**GET** `/services/:id`

### 플랫폼 통계 조회
**GET** `/services/stats`

응답:
```json
{
  "success": true,
  "data": {
    "platforms": [
      {
        "platform": "instagram",
        "serviceCount": 4,
        "categories": ["followers", "likes", "comments", "views"]
      }
    ]
  }
}
```

### 가격 계산
**POST** `/services/:serviceId/calculate-price`

요청 body:
```json
{
  "quantity": "number"
}
```

응답:
```json
{
  "success": true,
  "data": {
    "basePrice": 15000,
    "discountRate": 0.1,
    "discountAmount": 1500,
    "finalPrice": 13500,
    "quantity": 500
  }
}
```

---

## 3. 주문 API (/api/orders)
*모든 엔드포인트는 인증 필요*

### 주문 생성
**POST** `/orders`

요청 body:
```json
{
  "serviceId": "string (MongoDB ObjectId)",
  "quantity": "number (최소 1)",
  "targetUrl": "string (유효한 URL)",
  "targetUsername": "string (optional, 1-100자)"
}
```

응답:
```json
{
  "success": true,
  "message": "주문이 생성되었습니다",
  "data": {
    "order": {
      "id": "order-id",
      "service": { ... },
      "quantity": 1000,
      "totalAmount": 15000,
      "status": "pending",
      "targetUrl": "https://instagram.com/username",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 사용자 주문 목록
**GET** `/orders`

쿼리 파라미터:
- `status`: string (pending|processing|completed|cancelled|failed)
- `page`: number
- `limit`: number

### 주문 상세 조회
**GET** `/orders/:id`

### 주문 취소
**POST** `/orders/:id/cancel`

요청 body:
```json
{
  "reason": "string (1-500자)"
}
```

### 환불 요청
**POST** `/orders/:id/refund`

요청 body:
```json
{
  "reason": "string (1-500자)"
}
```

### 주문 통계
**GET** `/orders/statistics`

### 주문 진행률 업데이트 (관리자)
**PUT** `/orders/:id/progress`
- 관리자 권한 필요

요청 body:
```json
{
  "progress": "number (0 이상)",
  "notes": "string (optional, 1000자 이하)"
}
```

---

## 4. 결제 API (/api/payments)
*웹훅을 제외한 모든 엔드포인트는 인증 필요*

### 결제 초기화
**POST** `/payments/initialize`

요청 body:
```json
{
  "orderId": "string (MongoDB ObjectId)",
  "method": "string (card|bank|kakao|paypal|toss|naver|samsung|point)",
  "provider": "string (optional: iamport|stripe|toss|kakao|paypal)"
}
```

### 결제 완료 처리 (웹훅)
**POST** `/payments/webhook`

요청 body:
```json
{
  "paymentId": "string",
  "status": "string (completed|failed|cancelled)",
  "providerTransactionId": "string (optional)"
}
```

### 사용자 결제 내역
**GET** `/payments`

쿼리 파라미터:
- `status`: string (pending|completed|failed|cancelled|refunded)
- `method`: string
- `page`: number
- `limit`: number

### 결제 상세 조회
**GET** `/payments/:id`

### 결제 통계
**GET** `/payments/statistics`

### 환불 처리 (관리자)
**POST** `/payments/:id/refund`
- 관리자 권한 필요

요청 body:
```json
{
  "amount": "number (optional, 부분 환불 시)",
  "reason": "string (1-500자)"
}
```

---

## 5. 사용자 API (/api/users)
*모든 엔드포인트는 인증 필요*

### 대시보드 데이터
**GET** `/dashboard`

응답:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "stats": {
      "totalOrders": 10,
      "activeOrders": 3,
      "totalSpent": 150000,
      "completedOrders": 7
    },
    "recentOrders": [...],
    "recentPayments": [...]
  }
}
```

---

## 6. 관리자 API (/api/admin)
*모든 엔드포인트는 관리자 권한 필요*

### 사용자 목록
**GET** `/admin/users`

### 주문 관리
**GET** `/admin/orders`
**PUT** `/admin/orders/:id`

### 서비스 관리
**GET** `/admin/services`
**POST** `/admin/services`
**PUT** `/admin/services/:id`
**DELETE** `/admin/services/:id`

### 통계
**GET** `/admin/statistics`

---

## 7. 기타 API

### 상담 요청 (/api/consultations)
**POST** `/consultations`

요청 body:
```json
{
  "name": "string",
  "email": "string",
  "phone": "string (optional)",
  "company": "string (optional)",
  "inquiryType": "string (service|pricing|technical|other)",
  "message": "string"
}
```

### 이메일 API (/api/email)
**POST** `/email/send`
- 인증 필요

### OAuth API (/api/oauth)
**GET** `/oauth/google`
**POST** `/oauth/google/callback`
**GET** `/oauth/kakao`
**POST** `/oauth/kakao/callback`

### 헬스체크
**GET** `/health`

응답:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

## 에러 코드

| 상태 코드 | 설명 |
|----------|------|
| 400 | Bad Request - 잘못된 요청 |
| 401 | Unauthorized - 인증 필요 |
| 403 | Forbidden - 권한 없음 |
| 404 | Not Found - 리소스 없음 |
| 409 | Conflict - 중복 데이터 |
| 429 | Too Many Requests - Rate Limit 초과 |
| 500 | Internal Server Error - 서버 오류 |

## 에러 응답 형식
```json
{
  "success": false,
  "message": "에러 메시지",
  "errors": [
    {
      "field": "email",
      "message": "유효한 이메일 주소를 입력해주세요."
    }
  ]
}
```

---

## 개발 환경 설정

### 필수 환경 변수
```env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/marketgrow
JWT_SECRET=your-jwt-secret
ADMIN_EMAIL=admin@marketgrow.com
ADMIN_PASSWORD=admin123!@#
```

### 로컬 실행
```bash
npm install
npm start
# 또는 개발 모드
npm run dev
```

### 데이터베이스 시딩
```bash
npm run seed
```

---

*이 문서는 MarketGrow Backend API v1.0.0을 기준으로 작성되었습니다.*