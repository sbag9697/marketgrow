# 소셜 로그인 설정 가이드

## 1. 카카오 로그인 설정

### 1-1. Kakao Developers 가입 및 앱 생성
1. [Kakao Developers](https://developers.kakao.com) 접속
2. 카카오 계정으로 로그인
3. "내 애플리케이션" → "애플리케이션 추가하기" 클릭
4. 앱 정보 입력:
   - 앱 이름: MarketGrow
   - 사업자명: (사업자명 입력)
   - 카테고리: 비즈니스

### 1-2. 카카오 로그인 활성화
1. 생성된 앱 선택 → "카카오 로그인" 메뉴
2. "활성화 설정" ON
3. Redirect URI 추가:
   - `https://melodious-banoffee-c450ea.netlify.app/login.html`
   - `http://localhost:3000/login.html` (개발용)

### 1-3. JavaScript 키 확인
1. "요약 정보" 메뉴에서 "JavaScript 키" 복사
2. 이 키를 아래 파일에 입력해야 합니다

### 1-4. 동의 항목 설정
1. "카카오 로그인" → "동의항목" 메뉴
2. 다음 항목 설정:
   - 프로필 정보(닉네임/프로필 사진): 필수 동의
   - 카카오계정(이메일): 필수 동의

---

## 2. 네이버 로그인 설정

### 2-1. NAVER Developers 가입 및 앱 생성
1. [NAVER Developers](https://developers.naver.com) 접속
2. 네이버 계정으로 로그인
3. "Application" → "애플리케이션 등록" 클릭

### 2-2. 애플리케이션 정보 입력
1. 애플리케이션 이름: MarketGrow
2. 사용 API: "네이버 로그인" 선택
3. 제공 정보 선택:
   - 이메일 주소 (필수)
   - 별명 (필수)
   - 프로필 사진 (선택)

### 2-3. 서비스 환경 설정
1. 서비스 URL: `https://melodious-banoffee-c450ea.netlify.app`
2. 네이버 로그인 Callback URL:
   - `https://melodious-banoffee-c450ea.netlify.app/login.html`
   - `http://localhost:3000/login.html` (개발용)

### 2-4. Client ID 및 Secret 확인
1. 애플리케이션 정보에서 다음 값 확인:
   - Client ID: (이 값을 social-auth.js에 입력)
   - Client Secret: (백엔드에서 사용)

---

## 3. 코드에 API 키 적용하기

### 3-1. Frontend 설정 (social-auth.js)
`sns-marketing-site/js/social-auth.js` 파일을 열고 다음 부분을 수정:

```javascript
// 기존 코드
const KAKAO_APP_KEY = 'YOUR_KAKAO_APP_KEY'; 
const NAVER_CLIENT_ID = 'YOUR_NAVER_CLIENT_ID';

// 수정 후 (실제 키로 변경)
const KAKAO_APP_KEY = '카카오에서_받은_JavaScript_키';
const NAVER_CLIENT_ID = '네이버에서_받은_Client_ID';
```

### 3-2. Backend 환경 변수 설정
Railway 또는 로컬 환경에 다음 환경 변수 추가:

```
KAKAO_REST_API_KEY=카카오_REST_API_키
NAVER_CLIENT_ID=네이버_Client_ID
NAVER_CLIENT_SECRET=네이버_Client_Secret
```

### 3-3. Netlify 환경 변수 설정
1. Netlify 대시보드 → Site settings → Environment variables
2. 다음 변수 추가:
   - `KAKAO_REST_API_KEY`: 카카오 REST API 키
   - `NAVER_CLIENT_ID`: 네이버 Client ID
   - `NAVER_CLIENT_SECRET`: 네이버 Client Secret

---

## 4. 테스트 방법

### 로컬 테스트
1. 각 플랫폼에 localhost URL을 Redirect URI로 등록
2. 로컬 서버 실행 후 테스트

### 프로덕션 테스트
1. 변경사항 커밋 및 푸시
2. Netlify 자동 배포 완료 대기
3. 실제 도메인에서 테스트

---

## 5. 주의사항

### 보안 관련
- API 키는 절대 GitHub에 직접 커밋하지 마세요
- 프로덕션 키와 개발 키를 분리 관리하세요
- Client Secret은 반드시 백엔드에서만 사용하세요

### 도메인 변경 시
도메인이 변경되면 각 플랫폼에서 Redirect URI를 수정해야 합니다:
1. Kakao Developers → 앱 설정 → Redirect URI 수정
2. NAVER Developers → 애플리케이션 설정 → Callback URL 수정

### 에러 대응
- "redirect_uri_mismatch": Redirect URI가 등록되지 않았거나 일치하지 않음
- "invalid_client": Client ID가 잘못되었거나 앱이 비활성화됨
- "unauthorized": API 키가 잘못되었거나 권한이 없음

---

## 6. Google 로그인 문제 해결

### Google Cloud Console 설정 확인
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 (Client ID: 641017178501-b62koacmej8ess6jr9clgpae907356mn.apps.googleusercontent.com)
3. "API 및 서비스" → "사용자 인증 정보" 메뉴
4. OAuth 2.0 클라이언트 ID 클릭하여 편집

### 승인된 JavaScript 원본 (Authorized JavaScript origins) 추가:
```
https://melodious-banoffee-c450ea.netlify.app
http://localhost:3000
http://localhost
```

### 승인된 리디렉션 URI (Authorized redirect URIs) 추가:
```
https://melodious-banoffee-c450ea.netlify.app/login.html
https://melodious-banoffee-c450ea.netlify.app/signup.html
http://localhost:3000/login.html
http://localhost:3000/signup.html
```

### 브라우저 콘솔에서 디버깅
1. F12를 눌러 개발자 도구 열기
2. Console 탭에서 다음 명령 실행:
```javascript
debugGoogleAuth()
```
3. 에러 메시지 확인

### 일반적인 문제 해결
- **"popup_closed_by_user"**: 팝업 차단기가 활성화됨 → 브라우저 설정에서 팝업 허용
- **"invalid_client"**: Client ID가 잘못됨 → Google Cloud Console에서 확인
- **"origin_mismatch"**: 도메인이 승인되지 않음 → Authorized JavaScript origins에 추가

---

## 7. 현재 상태

⚠️ Google 로그인: Client ID 설정됨, 도메인 승인 필요
❌ Kakao 로그인: API 키 필요
❌ Naver 로그인: Client ID 필요

위 가이드를 따라 각 플랫폼에서 앱을 등록하고 받은 키를 입력하면 모든 소셜 로그인이 작동합니다.