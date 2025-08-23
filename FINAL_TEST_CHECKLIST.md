# 🔍 최종 점검 체크리스트

## 1. 토큰/유저 저장 확인

### 브라우저 DevTools 콘솔에서 실행:
```javascript
// 토큰 확인
localStorage.getItem('authToken')

// 사용자 정보 확인
localStorage.getItem('userInfo')

// 파싱된 사용자 정보 보기
JSON.parse(localStorage.getItem('userInfo'))
```

✅ 둘 다 값이 있으면 OK

## 2. 대시보드 이동 및 API 헤더 확인

### 체크 포인트:
1. 로그인 후 `dashboard.html`로 자동 이동
2. Network 탭에서 `/api/orders` 요청 확인
3. Request Headers에 `Authorization: Bearer <토큰>` 확인

## 3. 주문 API 테스트 (콘솔에서 직접 실행)

```javascript
// 토큰 가져오기
const token = localStorage.getItem('authToken');

// 주문 생성 테스트
fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token,
    'Idempotency-Key': 'test-' + Date.now()
  },
  body: JSON.stringify({
    orderId: 'ord_test_' + Date.now(),
    serviceType: 'instagram-followers',
    serviceName: '인스타그램 팔로워',
    targetUrl: 'https://instagram.com/example',
    quantity: 100,
    originalPrice: 10000,
    discountAmount: 0,
    totalPrice: 10000
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### 주문 목록 조회
```javascript
const token = localStorage.getItem('authToken');

fetch('/api/orders?page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## 4. 에러 방어 코드 (이미 적용됨)

### auth-utils.js에 구현된 안전한 파싱:
```javascript
function parseAuthResponse(data) {
    const ok = data?.success ?? data?.status === 'success';
    const token = data?.token ?? data?.data?.token;
    const user = data?.user ?? data?.data?.user;
    return { ok, token, user };
}
```

### getSelection 에러 방어 (자동 실행):
- auth-utils.js에 이미 구현
- 모든 페이지에서 자동으로 에러 방지

## 5. 콘솔 경고 확인

### 정상 상태:
- ✅ WebSocket 연결 메시지만 보이면 정상
- ✅ getSelection 에러 없음
- ✅ token undefined 에러 없음

### 문제가 있을 때:
- ❌ `Cannot read properties of undefined` → 파싱 문제
- ❌ `getSelection` 에러 → auth-utils.js 로드 확인

## 6. 빠른 디버깅 명령어

### MongoDB 연결 확인
```bash
curl -s https://marketgrow.kr/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"diagnose"}' | jq
```

### 로그인 테스트
```javascript
// 브라우저 콘솔에서
fetch('/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'login',
    username: 'test@test.com',
    password: 'password123'
  })
})
.then(r => r.json())
.then(data => {
  console.log('Response:', data);
  if (window.authUtils) {
    const parsed = window.authUtils.parseAuthResponse(data);
    console.log('Parsed:', parsed);
  }
});
```

## 7. 적용된 파일 목록

### 핵심 파일:
- ✅ `js/auth-utils.js` - 공통 파싱 함수
- ✅ `login.html` - 메인 로그인 페이지
- ✅ `js/simple-auth.js` - 간단한 인증
- ✅ `js/social-auth.js` - 소셜 로그인
- ✅ `js/social-login.js` - 소셜 로그인 클래스
- ✅ `js/social-login-fix.js` - 소셜 로그인 수정본

### 모든 파일이 사용하는 패턴:
```javascript
const token = data?.token ?? data?.data?.token;
const user = data?.user ?? data?.data?.user;
```

## 8. 관리자 계정 테스트

### 관리자 권한 부여 (로컬):
```bash
cd sns-marketing-site
node scripts/update-to-admin.js admin@marketgrow.kr
```

### 관리자 확인:
```javascript
const userInfo = JSON.parse(localStorage.getItem('userInfo'));
console.log('Role:', userInfo?.role); // 'admin' 이어야 함
```

---

## ✅ 체크 완료 기준

1. 로그인 → 토큰 저장 → 대시보드 이동
2. API 요청에 Authorization 헤더 포함
3. 콘솔에 에러 없음 (WebSocket 제외)
4. 주문 API 정상 응답

모든 항목이 정상이면 시스템 준비 완료!