# 💚 Naver OAuth 설정 가이드

## 현재 Naver Client 정보
- **Client ID**: `Cirw8aXNIq8wF518fNMZ`
- **Client Secret**: `x1lNqh6xcJ`

## 설정 방법

### 1. NAVER Developers 접속
1. https://developers.naver.com 접속
2. 네이버 계정으로 로그인
3. **Application** → **내 애플리케이션** 클릭

### 2. 애플리케이션 찾기 또는 생성
- 기존 앱이 있으면 선택
- 없으면 **애플리케이션 등록** 클릭

### 3. 애플리케이션 정보 설정
**애플리케이션 정보**에서:
- 애플리케이션 이름: MarketGrow
- 사용 API: **네이버 로그인** 선택

### 4. 로그인 오픈API 서비스 환경
**API 설정** → **로그인 오픈API 서비스 환경**에서:

#### 서비스 URL
```
https://marketgrow.kr
https://melodious-banoffee-c450ea.netlify.app
http://localhost:3000
```

#### 네이버 로그인 Callback URL
```
https://marketgrow.kr/auth-callback.html
https://marketgrow.kr/login.html
https://melodious-banoffee-c450ea.netlify.app/auth-callback.html
http://localhost:3000/auth-callback.html
```

### 5. 권한 설정
**제공 정보 선택**에서:

필수:
- [x] 이메일 주소
- [x] 별명
- [x] 프로필 사진

선택:
- [ ] 이름
- [ ] 생일
- [ ] 연령대
- [ ] 성별

### 6. 환경 추가 (모바일 웹)
모바일에서도 사용하려면:
1. **환경 추가** → **모바일 웹** 선택
2. 동일한 URL 설정

## ⚠️ 중요 체크리스트

### ✅ 필수 확인 사항
- [ ] 네이버 로그인 API 사용 신청됨
- [ ] 서비스 URL에 `marketgrow.kr` 등록됨
- [ ] Callback URL 모두 등록됨
- [ ] 이메일 권한 설정됨
- [ ] Client Secret이 Railway에 설정됨

### 🔍 자주 발생하는 오류

#### "invalid_request" 오류
- Callback URL이 등록되지 않음
- URL이 정확히 일치하지 않음

#### "invalid_client" 오류
- Client ID 또는 Secret이 잘못됨
- 애플리케이션이 삭제됨

#### "unauthorized_client" 오류
- 네이버 로그인 API가 비활성화됨
- 서비스 검수가 필요함 (대량 사용자)

## 📱 테스트 방법

### 1. 테스트 실행
https://marketgrow.kr/login.html 에서:
1. "네이버로 로그인" 클릭
2. 네이버 계정 로그인
3. 동의하기
4. 자동으로 대시보드로 이동

### 2. 오류 확인
개발자 도구(F12) → Console에서 오류 확인

### 3. 테스트 계정
개발 중에는 등록된 관리자 계정만 로그인 가능
(검수 완료 후 모든 사용자 이용 가능)

## 🔗 관련 링크
- [NAVER Developers](https://developers.naver.com)
- [네이버 로그인 개발가이드](https://developers.naver.com/docs/login/devguide/)
- [API 명세](https://developers.naver.com/docs/login/api/)

## 📝 검수 신청 (선택)
대량 사용자를 위해서는 검수 필요:
1. **내 애플리케이션** → **API 설정**
2. **검수 요청** 클릭
3. 서비스 설명 및 스크린샷 제출
4. 3-5일 내 검수 완료

---
*작성일: 2025-08-15*