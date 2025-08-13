# 🔧 구글 로그인 문제 해결 가이드

## 1. Google Cloud Console 설정 확인

### ✅ OAuth 동의 화면
1. https://console.cloud.google.com 접속
2. **API 및 서비스** → **OAuth 동의 화면**
3. 확인 사항:
   - 게시 상태: "테스트" 또는 "프로덕션"
   - 테스트 사용자: 본인 이메일 추가되어 있는지

### ✅ 승인된 JavaScript 원본 확인
1. **API 및 서비스** → **사용자 인증 정보**
2. OAuth 2.0 클라이언트 ID 클릭
3. **승인된 JavaScript 원본**에 다음이 모두 있는지 확인:
   ```
   https://marketgrow.kr
   https://www.marketgrow.kr
   http://localhost:3000
   ```

### ✅ 승인된 리디렉션 URI 확인
같은 페이지에서 **승인된 리디렉션 URI**:
   ```
   https://marketgrow.kr/auth-callback.html
   https://www.marketgrow.kr/auth-callback.html
   ```

## 2. 자주 발생하는 오류와 해결법

### 오류: "The given origin is not allowed for the given client ID"
**원인**: JavaScript 원본이 등록되지 않음
**해결**: 
- `https://marketgrow.kr` 추가 (http 아님, https임!)
- 저장 후 5-10분 대기

### 오류: "idpiframe_initialization_failed"
**원인**: 쿠키가 차단됨
**해결**: 
- 브라우저 설정에서 제3자 쿠키 허용
- 시크릿 모드에서 테스트

### 오류: "popup_closed_by_user"
**원인**: 팝업이 차단됨
**해결**: 
- 브라우저 팝업 차단 해제
- marketgrow.kr 도메인 팝업 허용

### 오류: "invalid_client"
**원인**: Client ID가 잘못됨
**해결**: 
- Client ID 재확인
- 새 Client ID: 1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com

## 3. 디버깅 단계

### Step 1: 브라우저 콘솔에서 확인
```javascript
// F12 → Console에서 실행
console.log(GOOGLE_CLIENT_ID);
// 출력: 1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com

console.log(typeof google);
// 출력: object (Google SDK 로드 확인)

window.debugGoogleAuth();
// Google 객체 상태 확인
```

### Step 2: 네트워크 탭 확인
1. F12 → Network 탭
2. "구글로 시작하기" 클릭
3. 빨간색 요청이 있는지 확인
4. 실패한 요청 클릭 → Response 확인

### Step 3: Google One Tap 비활성화 테스트
임시로 One Tap을 비활성화하고 기본 OAuth만 사용:
```javascript
// 브라우저 콘솔에서 실행
window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com` +
  `&redirect_uri=${encodeURIComponent('https://marketgrow.kr/auth-callback.html')}` +
  `&response_type=code` +
  `&scope=email profile` +
  `&access_type=offline`;
```

## 4. 대체 방법: 직접 OAuth URL 사용

login.html에 직접 링크 추가:
```html
<a href="https://accounts.google.com/o/oauth2/v2/auth?client_id=1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com&redirect_uri=https://marketgrow.kr/auth-callback.html&response_type=code&scope=email%20profile&access_type=offline" 
   class="social-btn google">
   구글로 시작하기 (직접)
</a>
```

## 5. Railway 백엔드 확인

Railway 대시보드에서 환경변수 확인:
```
GOOGLE_CLIENT_ID=1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=(시크릿 키)
```

## 6. 최종 체크리스트

- [ ] Google Cloud Console에서 도메인 승인
- [ ] Client ID가 코드와 일치
- [ ] 팝업 차단 해제
- [ ] 쿠키 허용
- [ ] HTTPS로 접속 (HTTP 아님)
- [ ] 캐시 삭제 후 재시도
- [ ] 다른 브라우저에서 테스트

## 7. 여전히 안 되면

브라우저 콘솔의 정확한 오류 메시지를 알려주세요:
1. F12 → Console
2. 빨간색 오류 메시지 복사
3. Network 탭의 실패한 요청 정보