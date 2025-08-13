# 📊 Google Analytics 설치 가이드

## 1. Google Analytics 계정 생성

### Step 1: GA4 속성 만들기
1. https://analytics.google.com 접속
2. **관리** → **속성 만들기**
3. 속성 정보 입력:
   - 속성 이름: MarketGrow
   - 시간대: 대한민국
   - 통화: KRW (₩)

### Step 2: 데이터 스트림 설정
1. **웹** 선택
2. 웹사이트 URL: https://marketgrow.kr
3. 스트림 이름: MarketGrow 웹사이트
4. **스트림 만들기** 클릭

### Step 3: 측정 ID 복사
- 형식: G-XXXXXXXXXX
- 이 ID를 복사해두세요

## 2. 웹사이트에 GA 코드 추가

모든 HTML 파일의 `<head>` 태그에 다음 코드를 추가하세요:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## 3. 주요 이벤트 설정

### 회원가입 완료 추적
```javascript
// signup.html - 회원가입 성공 시
gtag('event', 'sign_up', {
    method: 'email'
});
```

### 로그인 추적
```javascript
// login.html - 로그인 성공 시
gtag('event', 'login', {
    method: 'email'
});
```

### 주문 완료 추적
```javascript
// order-success.html
gtag('event', 'purchase', {
    transaction_id: orderId,
    value: totalPrice,
    currency: 'KRW',
    items: [{
        item_name: serviceName,
        price: price,
        quantity: 1
    }]
});
```

### 페이지뷰 자동 추적
- GA4는 자동으로 페이지뷰를 추적합니다

## 4. 전환 설정

### Google Analytics 대시보드에서:
1. **관리** → **이벤트** → **전환으로 표시**
2. 다음 이벤트를 전환으로 표시:
   - sign_up (회원가입)
   - purchase (구매)
   - generate_lead (문의)

## 5. 대시보드 설정

### 추천 보고서
1. **실시간** - 현재 사용자 모니터링
2. **획득** → **트래픽 획득** - 유입 채널 분석
3. **참여도** → **페이지 및 화면** - 인기 페이지
4. **수익 창출** → **전자상거래 구매** - 매출 분석

### 맞춤 대시보드 만들기
1. **탐색** → **빈 보고서**
2. 주요 지표 추가:
   - 사용자 수
   - 신규 사용자
   - 전환율
   - 평균 세션 시간
   - 매출

## 6. Google Ads 연결 (선택)

### 리마케팅 설정
1. **관리** → **Google Ads 연결**
2. Google Ads 계정 연결
3. 리마케팅 태그 활성화

## 7. 테스트 방법

### 실시간 보고서 확인
1. Google Analytics → **실시간**
2. 웹사이트 방문
3. 실시간 사용자 확인

### DebugView 사용
1. Chrome 확장 프로그램 "Google Analytics Debugger" 설치
2. 확장 프로그램 활성화
3. GA4 → **관리** → **DebugView**에서 이벤트 확인

## 8. 파일 업데이트 목록

다음 파일들의 `<head>` 태그에 GA 코드 추가:
- [ ] index.html
- [ ] login.html
- [ ] signup.html
- [ ] dashboard.html
- [ ] services.html
- [ ] packages.html
- [ ] order.html
- [ ] order-success.html
- [ ] payment.html
- [ ] blog.html

## 9. 개인정보 보호

### 쿠키 동의 배너 추가
```html
<div id="cookie-consent" style="position: fixed; bottom: 0; width: 100%; background: #333; color: white; padding: 20px; display: none;">
    <p>이 사이트는 분석 및 마케팅 목적으로 쿠키를 사용합니다.</p>
    <button onclick="acceptCookies()">동의</button>
    <button onclick="rejectCookies()">거부</button>
</div>
```

### IP 익명화
```javascript
gtag('config', 'G-XXXXXXXXXX', {
    anonymize_ip: true
});
```

## 10. 유용한 팁

### 맞춤 측정 기준
- 로그인 상태
- 회원 유형 (무료/유료)
- 구매 패키지 종류

### 이벤트 매개변수
- 검색어
- 필터 옵션
- 정렬 방법

### 목표 설정
- 회원가입률 5% 이상
- 구매 전환율 2% 이상
- 평균 세션 시간 3분 이상

## 문제 해결

### 데이터가 표시되지 않음
1. 측정 ID 확인
2. 광고 차단기 비활성화
3. 24-48시간 대기 (초기 데이터 수집)

### 이중 추적
1. GA 코드가 여러 번 포함되지 않았는지 확인
2. GTM과 직접 설치 중복 확인

### 전환 추적 안 됨
1. 이벤트 이름 정확성 확인
2. 전환으로 표시 설정 확인
3. DebugView에서 이벤트 발생 확인

---

**Google Analytics 고객센터**: https://support.google.com/analytics