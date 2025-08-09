# Google Analytics 4 설정 가이드

## 1. GA4 계정 생성

### 1.1 계정 설정
1. [Google Analytics](https://analytics.google.com) 접속
2. Google 계정으로 로그인
3. "측정 시작" 클릭

### 1.2 속성 생성
1. **계정 이름**: MarketGrow
2. **속성 이름**: MarketGrow Website
3. **시간대**: 대한민국 (GMT+09:00)
4. **통화**: KRW - 대한민국 원

### 1.3 비즈니스 정보
- 업종: 비즈니스 및 산업 서비스
- 비즈니스 규모: 소규모
- 사용 목적: 
  - 사이트 또는 앱 개선
  - 전환 최적화
  - 마케팅 최적화

## 2. 웹 스트림 설정

### 2.1 데이터 스트림 추가
1. 관리 → 데이터 스트림 → 웹
2. **웹사이트 URL**: https://resplendent-heliotrope-e5c264.netlify.app
3. **스트림 이름**: MarketGrow Main Site
4. "스트림 만들기" 클릭

### 2.2 측정 ID 확인
- 형식: `G-XXXXXXXXXX`
- 위치: 웹 스트림 세부정보 상단

## 3. 코드 설치

### 3.1 측정 ID 업데이트
`js/analytics.js` 파일에서:
```javascript
const GA_MEASUREMENT_ID = 'G-YOUR_ACTUAL_ID'; // 실제 ID로 교체
```

### 3.2 모든 페이지에 추가
각 HTML 파일의 `<head>` 섹션에:
```html
<script src="js/analytics.js" defer></script>
```

## 4. 이벤트 추적 구현

### 4.1 자동 추적 이벤트
- page_view (페이지 조회)
- session_start (세션 시작)
- first_visit (첫 방문)
- user_engagement (사용자 참여)

### 4.2 커스텀 이벤트 추적
```javascript
// 회원가입
analytics.trackSignUp('email');

// 로그인
analytics.trackLogin('email');

// 상품 조회
analytics.trackViewItem('service_id', '인스타그램 팔로워', 'instagram', 24000);

// 구매 완료
analytics.trackPurchase('order_12345', items, 50000);
```

## 5. 전환 설정

### 5.1 주요 전환 이벤트
1. GA4 관리 → 이벤트
2. 다음 이벤트를 전환으로 표시:
   - sign_up (회원가입)
   - purchase (구매)
   - begin_checkout (결제 시작)
   - contact (문의)

### 5.2 전환 값 설정
- 구매: 실제 구매 금액
- 회원가입: 예상 고객 생애 가치
- 문의: 예상 전환 가치

## 6. 대상 설정

### 6.1 리마케팅 대상
- 구매자
- 장바구니 이탈자
- 7일 이내 방문자
- 특정 서비스 조회자

### 6.2 맞춤 대상
- 고가치 고객 (50만원 이상 구매)
- 반복 구매 고객
- 참여도 높은 사용자

## 7. 보고서 설정

### 7.1 실시간 보고서
- 현재 활성 사용자
- 실시간 전환
- 인기 페이지

### 7.2 맞춤 보고서
1. 탐색 → 새 탐색 만들기
2. 주요 보고서:
   - 서비스별 매출
   - 사용자 획득 채널
   - 전환 퍼널
   - 코호트 분석

## 8. Google Ads 연결

### 8.1 연결 설정
1. 관리 → Google Ads 연결
2. Google Ads 계정 선택
3. 연결 구성

### 8.2 전환 가져오기
- GA4 전환을 Google Ads로 가져오기
- 입찰 최적화에 활용

## 9. 향상된 전자상거래

### 9.1 필수 이벤트
- view_item (상품 조회)
- add_to_cart (장바구니 추가)
- begin_checkout (결제 시작)
- purchase (구매 완료)
- refund (환불)

### 9.2 상품 데이터
```javascript
{
  item_id: "SKU123",
  item_name: "인스타그램 팔로워 1000개",
  item_category: "instagram",
  item_category2: "followers",
  price: 24000,
  quantity: 1,
  currency: "KRW"
}
```

## 10. 데이터 프라이버시

### 10.1 GDPR 준수
- 쿠키 동의 배너 구현
- 사용자 동의 관리
- 데이터 삭제 요청 처리

### 10.2 IP 익명화
```javascript
gtag('config', 'G-XXXXXXXXXX', {
  anonymize_ip: true
});
```

## 11. 테스트 및 디버깅

### 11.1 DebugView 사용
1. GA4 → 관리 → DebugView
2. Chrome 확장 프로그램: Google Analytics Debugger
3. 실시간 이벤트 확인

### 11.2 Google Tag Assistant
- Chrome 확장 프로그램 설치
- 태그 구현 검증
- 오류 진단

## 12. 대시보드 생성

### 12.1 주요 KPI 대시보드
- 일일 활성 사용자 (DAU)
- 전환율
- 평균 주문 가치
- 사용자당 수익
- 이탈률

### 12.2 마케팅 대시보드
- 채널별 성과
- 캠페인 ROI
- 광고 비용 대비 수익
- 신규 vs 재방문

## 13. 알림 설정

### 13.1 맞춤 알림
- 일일 매출 목표 달성
- 비정상적인 트래픽 증가
- 전환율 하락
- 서버 오류 발생

### 13.2 알림 채널
- 이메일
- SMS (선택사항)
- Slack 연동 (선택사항)

## 14. 체크리스트

- [ ] GA4 계정 생성 완료
- [ ] 측정 ID 발급 (G-XXXXXXXXXX)
- [ ] analytics.js에 측정 ID 입력
- [ ] 모든 페이지에 스크립트 추가
- [ ] 전환 이벤트 설정
- [ ] 실시간 데이터 확인
- [ ] Google Ads 연결 (선택)
- [ ] 맞춤 보고서 생성
- [ ] 알림 설정