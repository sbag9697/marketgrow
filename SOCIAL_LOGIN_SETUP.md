# 소셜 로그인 설정 가이드

## 📱 소셜 로그인 기능이 구현되었습니다!

Google, Kakao, Naver 로그인을 사용하려면 각 플랫폼에서 앱을 등록하고 API 키를 받아야 합니다.

## 1. Google 로그인 설정

### Google Cloud Console에서 설정하기:

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스** → **사용자 인증 정보** 이동
4. **사용자 인증 정보 만들기** → **OAuth 클라이언트 ID** 선택
5. 애플리케이션 유형: **웹 애플리케이션** 선택
6. 설정:
   - 이름: `MarketGrow`
   - 승인된 JavaScript 원본:
     - `http://localhost:3000` (개발용)
     - `https://resplendent-heliotrope-e5c264.netlify.app` (프로덕션)
   - 승인된 리디렉션 URI:
     - `http://localhost:3000/login.html`
     - `https://resplendent-heliotrope-e5c264.netlify.app/login.html`
7. **만들기** 클릭
8. 생성된 **클라이언트 ID** 복사

### 코드에 적용:
```javascript
// js/social-auth.js 파일에서
const GOOGLE_CLIENT_ID = '여기에-구글-클라이언트-ID-입력';
```

## 2. Kakao 로그인 설정

### Kakao Developers에서 설정하기:

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. **내 애플리케이션** → **애플리케이션 추가하기**
3. 앱 정보 입력:
   - 앱 이름: `MarketGrow`
   - 사업자명: 회사명 또는 개인
4. 생성된 앱 클릭 → **앱 키** 확인
5. **플랫폼** → **Web 플랫폼 등록**:
   - 사이트 도메인:
     - `http://localhost:3000`
     - `https://resplendent-heliotrope-e5c264.netlify.app`
6. **카카오 로그인** → **활성화 설정** ON
7. **Redirect URI 등록**:
   - `http://localhost:3000/login.html`
   - `https://resplendent-heliotrope-e5c264.netlify.app/login.html`
8. **동의항목** 설정:
   - 프로필 정보(닉네임/프로필 사진): 필수 동의
   - 카카오계정(이메일): 선택 동의
9. **JavaScript 키** 복사

### 코드에 적용:
```javascript
// js/social-auth.js 파일에서
const KAKAO_APP_KEY = '여기에-카카오-JavaScript-키-입력';
```

## 3. Naver 로그인 설정

### Naver Developers에서 설정하기:

1. [Naver Developers](https://developers.naver.com/) 접속
2. **Application** → **애플리케이션 등록**
3. 애플리케이션 정보:
   - 애플리케이션 이름: `MarketGrow`
   - 사용 API: **네이버 로그인** 선택
4. 로그인 오픈API 서비스 환경:
   - PC 웹 선택
   - 서비스 URL: `https://resplendent-heliotrope-e5c264.netlify.app`
   - 네이버 로그인 Callback URL:
     - `http://localhost:3000/login.html`
     - `https://resplendent-heliotrope-e5c264.netlify.app/login.html`
5. **등록하기** 클릭
6. **Client ID**와 **Client Secret** 확인

### 코드에 적용:
```javascript
// js/social-auth.js 파일에서
const NAVER_CLIENT_ID = '여기에-네이버-클라이언트-ID-입력';
```

## 4. 백엔드 환경 변수 설정

### Railway 또는 로컬 .env 파일에 추가:
```env
# JWT Secret (필수)
JWT_SECRET=your-secret-key-here-change-this-in-production

# 소셜 로그인 (선택사항 - 추가 검증용)
GOOGLE_CLIENT_ID=your-google-client-id
KAKAO_APP_KEY=your-kakao-app-key
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
```

## 5. 배포 전 체크리스트

### 프론트엔드:
- [ ] `js/social-auth.js`에 실제 API 키 입력
- [ ] Git에 커밋 및 푸시

### 백엔드 (Railway):
- [ ] 환경 변수에 `JWT_SECRET` 설정
- [ ] 재배포

### Netlify:
- [ ] 자동으로 재배포됨 (Git 푸시 시)

## 6. 테스트 방법

1. **로컬 테스트**:
   ```bash
   # 백엔드 실행
   cd backend
   npm install
   npm start
   
   # 프론트엔드 실행
   cd ..
   python -m http.server 3000
   ```

2. **프로덕션 테스트**:
   - https://resplendent-heliotrope-e5c264.netlify.app/login.html 접속
   - 각 소셜 로그인 버튼 클릭
   - 로그인 성공 시 대시보드로 이동

## 7. 트러블슈팅

### "준비 중입니다" 메시지가 계속 나올 때:
- API 키가 올바르게 설정되었는지 확인
- 브라우저 콘솔(F12)에서 에러 메시지 확인

### CORS 에러가 발생할 때:
- 각 플랫폼에서 도메인이 올바르게 등록되었는지 확인
- Railway 백엔드의 CORS 설정 확인

### 로그인은 되지만 대시보드로 이동하지 않을 때:
- 백엔드가 실행 중인지 확인
- JWT_SECRET 환경 변수가 설정되었는지 확인

## 📌 중요 사항

1. **API 키는 절대 GitHub에 직접 커밋하지 마세요**
2. **프로덕션에서는 환경 변수나 별도 설정 파일 사용 권장**
3. **각 플랫폼의 도메인 설정을 정확히 해야 합니다**

## 🎉 완료!

모든 설정이 완료되면 사용자들이 소셜 계정으로 쉽게 로그인할 수 있습니다!