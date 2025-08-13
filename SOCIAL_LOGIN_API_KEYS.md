# 🔐 소셜 로그인 API 키 설정 가이드

## 현재 상태
- ✅ 백엔드 OAuth 컨트롤러 구현 완료
- ✅ 프론트엔드 소셜 로그인 UI 구현 완료
- ⏳ API 키 설정 필요

---

## 1. 카카오 로그인 설정

### Step 1: 카카오 개발자 등록
1. https://developers.kakao.com 접속
2. 카카오 계정으로 로그인
3. **내 애플리케이션** → **애플리케이션 추가하기**

### Step 2: 앱 생성
```
앱 이름: SNS그로우 (또는 MarketGrow)
사업자명: SNS그로우
```

### Step 3: 앱 키 복사
내 애플리케이션 → 앱 설정 → 앱 키
- **JavaScript 키**: (프론트엔드용)
- **REST API 키**: (백엔드용)

### Step 4: 플랫폼 등록
앱 설정 → 플랫폼 → Web 플랫폼 등록
```
사이트 도메인:
- https://marketgrow.kr
- http://localhost:3000 (개발용)
```

### Step 5: 카카오 로그인 활성화
제품 설정 → 카카오 로그인
- 활성화 설정: **ON**
- Redirect URI:
  ```
  https://marketgrow.kr/auth-callback.html
  ```

### Step 6: 동의항목 설정
카카오 로그인 → 동의항목
- 필수 동의:
  - 닉네임
  - 카카오계정(이메일)

---

## 2. 구글 로그인 설정

### 현재 구글 Client ID (이미 설정됨)
```
Client ID: 641017178501-b62koacmej8ess6jr9clgpae907356mn.apps.googleusercontent.com
```

### 추가 설정 필요
1. https://console.cloud.google.com 접속
2. 프로젝트 선택
3. **API 및 서비스** → **사용자 인증 정보**
4. OAuth 2.0 클라이언트 ID 클릭
5. **승인된 JavaScript 원본** 추가:
   ```
   https://marketgrow.kr
   ```
6. **승인된 리디렉션 URI** 추가:
   ```
   https://marketgrow.kr/auth-callback.html
   ```

---

## 3. 네이버 로그인 설정

### Step 1: 네이버 개발자 센터 등록
1. https://developers.naver.com 접속
2. 네이버 계정으로 로그인

### Step 2: 애플리케이션 등록
Application → 애플리케이션 등록
```
애플리케이션 이름: SNS그로우
사용 API: 네이버 로그인
서비스 환경: PC웹, 모바일웹
```

### Step 3: 로그인 오픈API 서비스 환경
```
서비스 URL: https://marketgrow.kr
Callback URL: https://marketgrow.kr/auth-callback.html
```

### Step 4: 필수 정보 선택
- 이메일
- 별명
- 프로필 이미지(선택)

### Step 5: API 키 복사
- **Client ID**: 
- **Client Secret**: 

---

## 4. 코드 업데이트 위치

### 프론트엔드 (js/social-auth.js)
```javascript
// Line 2-4
const GOOGLE_CLIENT_ID = '641017178501-b62koacmej8ess6jr9clgpae907356mn.apps.googleusercontent.com'; // ✅ 이미 설정됨
const KAKAO_APP_KEY = 'YOUR_KAKAO_JAVASCRIPT_KEY'; // ⚠️ 카카오 JavaScript 키 입력
const NAVER_CLIENT_ID = 'YOUR_NAVER_CLIENT_ID'; // ⚠️ 네이버 Client ID 입력
```

### 백엔드 환경변수 (Railway)
Railway Dashboard → Variables 탭에서 추가:

```env
# 카카오
KAKAO_CLIENT_ID=카카오_REST_API_키
KAKAO_CLIENT_SECRET=카카오_시크릿_키(선택사항)
KAKAO_REDIRECT_URI=https://marketgrow.kr/auth-callback.html

# 네이버  
NAVER_CLIENT_ID=네이버_클라이언트_ID
NAVER_CLIENT_SECRET=네이버_시크릿
NAVER_REDIRECT_URI=https://marketgrow.kr/auth-callback.html

# 구글 (이미 설정됨)
GOOGLE_CLIENT_ID=641017178501-b62koacmej8ess6jr9clgpae907356mn.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=구글_시크릿_키
GOOGLE_REDIRECT_URI=https://marketgrow.kr/auth-callback.html
```

---

## 5. 테스트 체크리스트

### 카카오 로그인
- [ ] 카카오 앱 생성 완료
- [ ] JavaScript 키 프론트엔드 설정
- [ ] REST API 키 백엔드 설정
- [ ] 플랫폼 도메인 등록
- [ ] Redirect URI 설정
- [ ] 로그인 테스트

### 구글 로그인
- [x] Client ID 설정 완료
- [ ] 승인된 원본 추가
- [ ] Redirect URI 추가
- [ ] 로그인 테스트

### 네이버 로그인
- [ ] 애플리케이션 등록
- [ ] Client ID/Secret 획득
- [ ] 서비스 URL 설정
- [ ] Callback URL 설정
- [ ] 로그인 테스트

---

## 6. 주의사항

1. **개발 모드 vs 프로덕션**
   - 카카오, 네이버는 처음에 개발 모드로 시작
   - 테스트 계정만 로그인 가능
   - 심사 후 프로덕션 전환 필요

2. **도메인 설정**
   - 반드시 https://marketgrow.kr 도메인 등록
   - localhost는 개발용으로만 사용

3. **보안**
   - Client Secret은 절대 프론트엔드에 노출하지 않음
   - 백엔드 환경변수로만 관리

---

## 7. 다음 단계

1. 각 플랫폼에서 앱 등록 및 API 키 획득
2. 프론트엔드 js/social-auth.js 파일 업데이트
3. Railway 환경변수 설정
4. 배포 후 테스트

---

## 지원 링크

- [카카오 로그인 가이드](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [구글 로그인 가이드](https://developers.google.com/identity/protocols/oauth2)
- [네이버 로그인 가이드](https://developers.naver.com/docs/login/api/api.md)