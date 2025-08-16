# 🟡 Kakao OAuth 설정 가이드

## 현재 Kakao App Key
`95a2c17a5ec078dd1762950680e53267`

## 설정 방법

### 1. Kakao Developers 접속
1. https://developers.kakao.com 접속
2. 카카오 계정으로 로그인
3. **내 애플리케이션** 클릭

### 2. 앱 찾기 또는 생성
- 기존 앱이 있으면 선택
- 없으면 **애플리케이션 추가하기** 클릭

### 3. 앱 키 확인
**앱 설정** → **요약 정보**에서:
- JavaScript 키: `95a2c17a5ec078dd1762950680e53267`

### 4. 플랫폼 설정
**앱 설정** → **플랫폼**에서:

#### Web 플랫폼 등록
1. **Web 플랫폼 등록** 클릭
2. 사이트 도메인 추가:
```
https://marketgrow.kr
https://melodious-banoffee-c450ea.netlify.app
http://localhost:3000
http://localhost:5001
```

### 5. 카카오 로그인 설정
**제품 설정** → **카카오 로그인**에서:

#### 활성화 설정
- 카카오 로그인: **ON**
- OpenID Connect: **ON** (선택)

#### Redirect URI 설정
1. **Redirect URI 등록** 클릭
2. 다음 URI 모두 추가:
```
https://marketgrow.kr/auth-callback.html
https://marketgrow.kr/login.html
https://marketgrow.kr/signup.html
https://melodious-banoffee-c450ea.netlify.app/auth-callback.html
http://localhost:3000/auth-callback.html
```

### 6. 동의항목 설정
**제품 설정** → **카카오 로그인** → **동의항목**에서:

필수 동의:
- [x] 프로필 정보(닉네임/프로필 사진)
- [x] 카카오계정(이메일)

선택 동의:
- [ ] 성별
- [ ] 연령대
- [ ] 생일

### 7. 보안 설정
**앱 설정** → **보안**에서:
- Client Secret: 사용 안함 (웹 전용)

## ⚠️ 중요 체크리스트

### ✅ 필수 확인 사항
- [ ] 카카오 로그인 활성화됨
- [ ] Web 플랫폼에 `marketgrow.kr` 등록됨
- [ ] Redirect URI 모두 등록됨
- [ ] 이메일 동의항목 설정됨

### 🔍 자주 발생하는 오류

#### "KOE006" 오류 (redirect_uri_mismatch)
- Redirect URI가 정확히 일치하는지 확인
- https vs http 확인
- 대소문자 구분 확인

#### "KOE010" 오류 (invalid_client)
- App Key가 잘못됨
- 앱이 삭제되거나 비활성화됨

#### "KOE101" 오류 (not_agreed)
- 동의항목이 설정되지 않음
- 필수 동의항목 확인

## 📱 테스트 방법

### 1. 테스트 실행
https://marketgrow.kr/login.html 에서:
1. "카카오톡으로 로그인" 클릭
2. 카카오 계정 로그인
3. 동의하고 계속하기
4. 자동으로 대시보드로 이동

### 2. 오류 확인
개발자 도구(F12) → Console에서 오류 확인

## 🔗 관련 링크
- [Kakao Developers](https://developers.kakao.com)
- [카카오 로그인 문서](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [에러 코드 목록](https://developers.kakao.com/docs/latest/ko/reference/rest-api-reference#error-code)

---
*작성일: 2025-08-15*