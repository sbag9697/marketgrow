# 🔐 Google OAuth 설정 가이드

## 현재 Google Client ID
`1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com`

## 설정 방법

### 1. Google Cloud Console 접속
1. https://console.cloud.google.com 접속
2. Google 계정으로 로그인
3. 프로젝트 선택 (또는 새 프로젝트 생성)

### 2. OAuth 동의 화면 설정
1. 왼쪽 메뉴 → **API 및 서비스** → **OAuth 동의 화면**
2. User Type: **외부** 선택
3. 앱 정보 입력:
   - 앱 이름: MarketGrow
   - 사용자 지원 이메일: marketgrow.kr@gmail.com
   - 앱 도메인: marketgrow.kr
4. 범위 추가:
   - email
   - profile
   - openid

### 3. OAuth 2.0 클라이언트 ID 설정
1. 왼쪽 메뉴 → **API 및 서비스** → **사용자 인증 정보**
2. 기존 OAuth 2.0 클라이언트 ID 클릭 (또는 새로 만들기)
3. **승인된 JavaScript 원본** 추가:
```
https://marketgrow.kr
https://www.marketgrow.kr
https://melodious-banoffee-c450ea.netlify.app
http://localhost:3000
http://localhost:5001
```

4. **승인된 리디렉션 URI** 추가:
```
https://marketgrow.kr/auth-callback.html
https://marketgrow.kr/login.html
https://marketgrow.kr/signup.html
https://melodious-banoffee-c450ea.netlify.app/auth-callback.html
http://localhost:3000/auth-callback.html
```

5. **저장** 클릭

### 4. 테스트 사용자 추가 (개발 중인 경우)
1. OAuth 동의 화면 → 테스트 사용자
2. **ADD USERS** 클릭
3. 테스트할 Gmail 주소 추가

## ⚠️ 중요 체크리스트

### ✅ 필수 확인 사항
- [ ] OAuth 동의 화면 게시 상태: **테스트** 또는 **프로덕션**
- [ ] JavaScript 원본에 `https://marketgrow.kr` 추가됨
- [ ] 리디렉션 URI에 `/auth-callback.html` 추가됨
- [ ] Client ID가 프론트엔드 코드와 일치함

### 🔍 자주 발생하는 오류

#### "redirect_uri_mismatch" 오류
- 리디렉션 URI가 정확히 일치하는지 확인
- https vs http 확인
- 도메인 끝에 슬래시(/) 없는지 확인

#### "access_blocked" 오류
- OAuth 동의 화면이 구성되지 않음
- 테스트 모드에서 테스트 사용자 추가 필요

#### "invalid_client" 오류
- Client ID가 잘못됨
- 프로젝트가 삭제되거나 비활성화됨

## 📱 테스트 방법

### 1. 개발자 도구 열기
브라우저에서 F12 → Console 탭

### 2. 테스트 실행
https://marketgrow.kr/login.html 에서:
1. "구글로 로그인" 클릭
2. Google 계정 선택
3. 권한 동의
4. 자동으로 대시보드로 이동

### 3. 오류 확인
Console에서 오류 메시지 확인

## 🔗 관련 링크
- [Google Cloud Console](https://console.cloud.google.com)
- [OAuth 2.0 가이드](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In 문서](https://developers.google.com/identity/gsi/web)

---
*작성일: 2025-08-15*