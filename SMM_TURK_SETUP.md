# SMM Turk API 연동 가이드

## 1. SMM Turk 계정 설정

### 1.1 가입 방법
1. [SMM Turk](https://smmturk.com) 접속
2. "Register" 클릭
3. 계정 정보 입력:
   - Username
   - Email
   - Password
4. 이메일 인증

### 1.2 계정 충전
1. Dashboard → Add Funds
2. 최소 충전금액: $10
3. 결제 방법:
   - PayPal
   - 신용카드
   - 암호화폐
   - Perfect Money

## 2. API 키 발급

### 2.1 API 키 얻기
1. 로그인 후 Dashboard
2. 왼쪽 메뉴 → "API" 클릭
3. API Key 복사
4. API URL 확인: `https://smmturk.com/api/v2`

### 2.2 API 문서
- API Documentation 페이지에서 확인
- 주요 엔드포인트:
  - `/services` - 서비스 목록
  - `/add` - 주문 생성
  - `/status` - 주문 상태
  - `/balance` - 잔액 조회

## 3. Railway 환경 변수 설정

### 3.1 Variables 추가
Railway Dashboard → Variables 탭에서:

```
SMM_API_KEY=your_api_key_here
SMM_API_URL=https://smmturk.com/api/v2
SMM_ENABLED=true
```

### 3.2 서비스 매핑 설정
```
# Instagram
SMM_SERVICE_INSTAGRAM_FOLLOWERS=1234
SMM_SERVICE_INSTAGRAM_LIKES=1235
SMM_SERVICE_INSTAGRAM_VIEWS=1236
SMM_SERVICE_INSTAGRAM_COMMENTS=1237

# YouTube
SMM_SERVICE_YOUTUBE_SUBSCRIBERS=2234
SMM_SERVICE_YOUTUBE_VIEWS=2235
SMM_SERVICE_YOUTUBE_LIKES=2236

# TikTok
SMM_SERVICE_TIKTOK_FOLLOWERS=3234
SMM_SERVICE_TIKTOK_LIKES=3235
SMM_SERVICE_TIKTOK_VIEWS=3236
```

## 4. 서비스 ID 매핑

### 4.1 SMM Turk 서비스 확인
API로 서비스 목록 조회:
```bash
curl -X POST https://smmturk.com/api/v2 \
  -d "key=YOUR_API_KEY&action=services"
```

### 4.2 인기 서비스 ID (예시)
```
Instagram:
- 팔로워 (고품질): 1001
- 팔로워 (일반): 1002
- 좋아요: 1101
- 조회수: 1201
- 댓글: 1301

YouTube:
- 구독자: 2001
- 조회수: 2101
- 좋아요: 2201

TikTok:
- 팔로워: 3001
- 좋아요: 3101
- 조회수: 3201
```

## 5. 백엔드 코드 업데이트

### 5.1 SMM 서비스 파일 위치
`backend/services/smmPanel.service.js`

### 5.2 주요 기능
- `createOrder()` - SMM 패널에 주문 생성
- `checkStatus()` - 주문 상태 확인
- `getBalance()` - 잔액 조회
- `getServices()` - 서비스 목록 조회

## 6. 주문 프로세스

### 6.1 자동 주문 흐름
1. 고객이 MarketGrow에서 주문
2. 결제 완료
3. 백엔드가 SMM Turk API 호출
4. SMM Turk에서 주문 처리
5. 상태 업데이트 (웹훅 또는 폴링)
6. 고객에게 완료 알림

### 6.2 주문 상태
- `pending` - 대기 중
- `processing` - 처리 중
- `in_progress` - 진행 중
- `completed` - 완료
- `partial` - 부분 완료
- `canceled` - 취소됨

## 7. 가격 설정

### 7.1 마진 계산
```
고객 가격 = SMM 원가 × (1 + 마진율)

예시:
- SMM 원가: $1 (1,300원)
- 마진율: 100%
- 고객 가격: 2,600원
```

### 7.2 환율 설정
```
USD_TO_KRW=1300
MARGIN_RATE=1.0 (100% 마진)
```

## 8. 테스트

### 8.1 API 연결 테스트
```bash
# 잔액 확인
curl -X POST https://smmturk.com/api/v2 \
  -d "key=YOUR_API_KEY&action=balance"

# 서비스 목록
curl -X POST https://smmturk.com/api/v2 \
  -d "key=YOUR_API_KEY&action=services"
```

### 8.2 테스트 주문
1. 소량 주문으로 테스트 (최소 수량)
2. 자신의 계정으로 테스트
3. 처리 시간 확인
4. 품질 확인

## 9. 모니터링

### 9.1 대시보드 확인 사항
- 일일 주문 수
- 성공률
- 평균 처리 시간
- 잔액 부족 알림

### 9.2 로그 확인
Railway Logs에서:
- SMM API 호출 로그
- 오류 메시지
- 주문 상태 변경

## 10. 문제 해결

### 10.1 일반적인 오류
- `Insufficient funds` - 잔액 부족
- `Service not found` - 잘못된 서비스 ID
- `Invalid link` - 잘못된 URL 형식
- `Order quantity error` - 수량 제한 초과

### 10.2 지원
- SMM Turk Support: support@smmturk.com
- Telegram: @smmturk_support
- 응답 시간: 24시간 이내

## 11. 보안 주의사항

- API 키를 절대 공개하지 마세요
- GitHub에 커밋하지 마세요
- 환경 변수로만 관리
- 정기적으로 API 키 변경
- IP 화이트리스트 설정 (가능한 경우)

## 12. 체크리스트

- [ ] SMM Turk 계정 생성
- [ ] 계정 충전 ($10+)
- [ ] API 키 발급
- [ ] Railway 환경 변수 설정
- [ ] 서비스 ID 매핑
- [ ] 테스트 주문 성공
- [ ] 자동 주문 프로세스 확인
- [ ] 모니터링 설정