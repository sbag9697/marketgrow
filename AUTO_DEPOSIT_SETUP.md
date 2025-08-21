# 자동 입금 확인 설정 가이드

## 개요
예치금 충전 시 자동으로 입금을 확인하고 잔액을 업데이트하는 기능입니다.

## 두 가지 방법

### 방법 1: 간단한 자동 확인 (테스트/개발용) ✅ 추천
수동 관리자 확인 없이 일정 시간 후 자동으로 입금을 승인합니다.

#### 환경변수 설정 (.env)
```env
# 자동 입금 확인 활성화
AUTO_CONFIRM_DEPOSITS=true

# 입금 확인 간격 (분 단위, 기본값: 1분)
DEPOSIT_CHECK_INTERVAL=1

# 입금 요청 후 자동 승인까지 대기 시간 (초 단위, 기본값: 30초)
AUTO_CONFIRM_DELAY=30

# 테스트 모드 활성화 (선택사항)
TEST_MODE=true

# 이메일 알림 (선택사항)
EMAIL_NOTIFICATIONS=true
```

#### 작동 방식
1. 사용자가 예치금 충전 신청
2. 설정된 시간(AUTO_CONFIRM_DELAY) 후 자동으로 입금 확인
3. 실시간으로 사용자 화면에 잔액 업데이트
4. 알림 팝업 표시

#### 장점
- 설정이 매우 간단
- 추가 API 키 불필요
- 테스트/개발에 적합
- 즉시 사용 가능

#### 단점
- 실제 입금 확인 없이 자동 승인
- 프로덕션에는 부적합

---

### 방법 2: 오픈뱅킹 API 연동 (프로덕션용)
실제 은행 계좌의 입금 내역을 확인하여 자동으로 처리합니다.

#### 환경변수 설정 (.env)
```env
# 오픈뱅킹 API 설정
OPENBANKING_CLIENT_ID=your_client_id
OPENBANKING_CLIENT_SECRET=your_client_secret
OPENBANKING_REDIRECT_URI=https://yourdomain.com/callback
OPENBANKING_SCOPE=inquiry

# 농협 API 설정 (선택사항)
NH_API_KEY=your_nh_api_key
NH_FINTECH_USE_NUM=your_fintech_use_num
NH_ACCOUNT_NUM=301-0373-3754-01

# 관리자 이메일 (미확인 입금 알림용)
ADMIN_EMAIL=admin@yourdomain.com
```

#### 작동 방식
1. 사용자가 예치금 충전 신청
2. 5분마다 자동으로 은행 API로 입금 확인
3. 입금자명과 금액이 일치하면 자동 승인
4. 실시간으로 사용자 화면에 잔액 업데이트

#### 장점
- 실제 입금 확인
- 완전 자동화
- 프로덕션 사용 가능

#### 단점
- 오픈뱅킹 API 신청 필요
- 설정이 복잡
- API 사용료 발생 가능

---

## 빠른 시작 (방법 1 - 테스트용)

### 1. 환경변수 추가
`.env` 파일에 다음 추가:
```env
AUTO_CONFIRM_DEPOSITS=true
AUTO_CONFIRM_DELAY=10
```

### 2. 서버 재시작
```bash
npm install
npm start
```

### 3. 테스트
- 예치금 충전 신청
- 10초 후 자동으로 잔액 업데이트 확인

---

## 관리자 기능

### 모든 대기 중인 입금 즉시 확인
```bash
# API 호출
POST /api/deposits/auto-confirm/all

# 헤더
Authorization: Bearer {admin_token}
```

### 자동 확인 서비스 상태 확인
```bash
# API 호출
GET /api/deposits/auto-confirm/status

# 응답 예시
{
  "isRunning": true,
  "autoConfirmEnabled": true,
  "checkInterval": "1",
  "autoConfirmDelay": "30",
  "testMode": true
}
```

---

## 실시간 업데이트 확인

### WebSocket 연결 상태
- 브라우저 콘솔에서 확인: `window.wsClient.isConnected()`
- 연결 성공 시: "WebSocket connected" 메시지

### 폴링 상태 (WebSocket 실패 시)
- 30초마다 자동으로 잔액 확인
- 브라우저 콘솔: "Balance polling started" 메시지

---

## 문제 해결

### 자동 확인이 작동하지 않을 때
1. 환경변수 확인: `AUTO_CONFIRM_DEPOSITS=true`
2. 서버 로그 확인: "Auto deposit confirmation service started"
3. 데이터베이스 연결 확인

### 실시간 업데이트가 안 될 때
1. Socket.IO 라이브러리 로드 확인
2. 방화벽/프록시 설정 확인
3. 폴링 모드로 자동 전환 확인

---

## 프로덕션 배포 시 주의사항

⚠️ **방법 1 (AUTO_CONFIRM_DEPOSITS)은 테스트/개발용입니다.**

프로덕션에서는:
1. 오픈뱅킹 API 연동 (방법 2) 사용
2. 또는 관리자 수동 확인 유지
3. `AUTO_CONFIRM_DEPOSITS=false` 설정

---

## Railway 배포 설정

Railway 환경변수 추가:
```
AUTO_CONFIRM_DEPOSITS=true
AUTO_CONFIRM_DELAY=30
DEPOSIT_CHECK_INTERVAL=1
TEST_MODE=true
```

이후 자동으로 재배포되며 서비스가 시작됩니다.