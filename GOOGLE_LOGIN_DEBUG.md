# 🔍 Google 로그인 문제 진단 및 해결

## 현재 상태 확인 ✅

### ✅ 정상 작동 중:
- **MongoDB**: Connected (정상)
- **백엔드 서버**: Running (정상)
- **프론트엔드**: 배포 완료
- **Client ID**: 올바르게 설정됨

### ❓ 확인 필요:
- Google Cloud Console 도메인 승인 상태
- Google Client Secret 설정

## 🧪 테스트 방법

### 1. 테스트 페이지 사용
`test-google-login.html` 파일을 브라우저에서 열어보세요:
1. 파일을 더블클릭하여 브라우저에서 열기
2. Google 로그인 버튼 클릭
3. 콘솔(F12) 에러 메시지 확인

### 2. 브라우저 콘솔에서 직접 테스트
https://marketgrow.kr 접속 후 F12 → Console:

```javascript
// 현재 설정 확인
console.log('Origin:', window.location.origin);
console.log('Client ID:', '1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn');

// Google 객체 확인
console.log('Google loaded:', typeof google);
if (typeof google !== 'undefined') {
    console.log('Google accounts:', google.accounts);
}

// 수동으로 인증 URL 생성
const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
    'client_id=1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com' +
    '&redirect_uri=' + encodeURIComponent('https://marketgrow.kr/auth-callback.html') +
    '&response_type=code' +
    '&scope=email profile';
console.log('Auth URL:', authUrl);
// window.location.href = authUrl; // 실제로 이동하려면 주석 해제
```

## 🔴 일반적인 오류와 해결법

### 1. "The given origin is not allowed"
**원인**: Google Cloud Console에 도메인이 등록되지 않음

**해결**:
1. https://console.cloud.google.com
2. OAuth 2.0 클라이언트 ID 편집
3. 승인된 JavaScript 원본:
   - `https://marketgrow.kr` (이미 추가했다면 다시 확인)
   - `https://www.marketgrow.kr`
4. **중요**: 저장 후 10-15분 대기 (Google 캐시)

### 2. "popup_closed_by_user"
**원인**: 팝업 차단

**해결**:
- 브라우저 주소창 오른쪽 팝업 차단 아이콘 클릭
- "marketgrow.kr 항상 허용" 선택

### 3. "idpiframe_initialization_failed"
**원인**: 쿠키 또는 localStorage 문제

**해결**:
1. 브라우저 캐시/쿠키 삭제
2. 시크릿 모드에서 테스트
3. 다른 브라우저에서 테스트

## 🔐 Google Client Secret 확인

### Railway에 Client Secret이 설정되어 있나요?

1. https://console.cloud.google.com
2. **사용자 인증 정보** → OAuth 2.0 클라이언트 ID
3. **클라이언트 보안 비밀번호** 확인 (GOCSPX-로 시작하는 문자열)
4. Railway Variables에 추가:
   ```
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
   ```

## 🎯 즉시 시도해볼 것들

### 1. 캐시 완전 삭제
```
Chrome: Ctrl+Shift+Delete → 모든 항목 선택 → 삭제
```

### 2. 다른 도메인으로 테스트
Google Cloud Console에 추가:
- `http://localhost:3000` (로컬 테스트용)
- `https://sns-marketing-site.netlify.app` (Netlify 기본 도메인)

### 3. Google 서버 캐시 대기
Google은 도메인 변경사항을 캐시하므로:
- 최소 10-15분 대기
- 최대 1시간까지 걸릴 수 있음

### 4. OAuth 동의 화면 확인
1. Google Cloud Console → OAuth 동의 화면
2. **게시 상태**: "테스트" 또는 "프로덕션"?
3. 테스트 모드라면 **테스트 사용자**에 이메일 추가

## 📱 대체 방안

Google 로그인이 계속 안 되면:

### Kakao 로그인 사용 (즉시 가능)
- 이미 완전히 구현됨
- API 키 설정 완료
- 바로 사용 가능

### 이메일 로그인 사용
- 기본 이메일/비밀번호 로그인
- 정상 작동 중

## 🆘 최종 체크리스트

- [ ] Google Cloud Console에서 도메인 추가 확인
- [ ] 저장 후 15분 이상 대기했는가?
- [ ] 브라우저 캐시 삭제했는가?
- [ ] 팝업 차단 해제했는가?
- [ ] 시크릿 모드에서 테스트했는가?
- [ ] 다른 브라우저에서 테스트했는가?
- [ ] Railway에 GOOGLE_CLIENT_SECRET 설정했는가?

모든 항목을 확인했는데도 안 되면, 정확한 오류 메시지를 알려주세요.