# 🔐 소셜 로그인 API 설정 가이드

## 1. Google 로그인 설정

### 1.1 Google Cloud Console 접속
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. Google 계정으로 로그인

### 1.2 프로젝트 생성
1. 상단 프로젝트 선택 → "새 프로젝트"
2. 프로젝트 이름: `MarketGrow`
3. 만들기 클릭

### 1.3 OAuth 2.0 설정
1. 좌측 메뉴 → "API 및 서비스" → "사용자 인증 정보"
2. "+ 사용자 인증 정보 만들기" → "OAuth 클라이언트 ID"
3. 애플리케이션 유형: "웹 애플리케이션"
4. 이름: `MarketGrow Web`
5. 승인된 JavaScript 원본:
   ```
   http://localhost:3000
   https://marketgrow-production-c586.up.railway.app
   https://marketgrow.kr
   https://www.marketgrow.kr
   ```
6. 승인된 리디렉션 URI:
   ```
   http://localhost:3000/auth/google/callback
   https://marketgrow-production-c586.up.railway.app/auth/google/callback
   https://marketgrow.kr/auth/google/callback
   ```
7. 만들기 클릭

### 1.4 발급된 정보
```
클라이언트 ID: [자동 생성됨].apps.googleusercontent.com
클라이언트 보안 비밀번호: [자동 생성됨]
```

---

## 2. Kakao 로그인 설정

### 2.1 Kakao Developers 접속
1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 카카오 계정으로 로그인

### 2.2 애플리케이션 생성
1. "내 애플리케이션" → "애플리케이션 추가하기"
2. 앱 이름: `MarketGrow`
3. 사업자명: `SNS그로우`
4. 카테고리: 비즈니스

### 2.3 앱 설정
1. 앱 설정 → 플랫폼 → Web 플랫폼 등록
2. 사이트 도메인:
   ```
   http://localhost:3000
   https://marketgrow-production-c586.up.railway.app
   https://marketgrow.kr
   ```

### 2.4 카카오 로그인 설정
1. 제품 설정 → 카카오 로그인 → 활성화
2. Redirect URI 등록:
   ```
   http://localhost:3000/auth/kakao/callback
   https://marketgrow-production-c586.up.railway.app/auth/kakao/callback
   https://marketgrow.kr/auth/kakao/callback
   ```
3. 동의 항목 설정:
   - 프로필 정보(닉네임/프로필 사진): 필수 동의
   - 카카오계정(이메일): 선택 동의

### 2.5 발급된 정보
```
앱 키 → JavaScript 키: [자동 생성됨]
앱 키 → REST API 키: [자동 생성됨]
```

---

## 3. Naver 로그인 설정

### 3.1 Naver Developers 접속
1. [Naver Developers](https://developers.naver.com/) 접속
2. 네이버 계정으로 로그인

### 3.2 애플리케이션 등록
1. Application → 애플리케이션 등록
2. 애플리케이션 이름: `MarketGrow`
3. 사용 API: "네이버 로그인" 선택
4. 제공 정보 선택:
   - 이름: 필수
   - 이메일: 필수
   - 프로필 사진: 선택

### 3.3 환경 설정
1. 서비스 환경: PC웹, 모바일웹
2. 서비스 URL:
   ```
   http://localhost:3000
   https://marketgrow.kr
   ```
3. 네이버 로그인 Callback URL:
   ```
   http://localhost:3000/auth/naver/callback
   https://marketgrow.kr/auth/naver/callback
   ```

### 3.4 발급된 정보
```
Client ID: [자동 생성됨]
Client Secret: [자동 생성됨]
```

---

## 4. 코드 적용

### 4.1 config-production.js 수정
```javascript
social: {
    google: {
        clientId: '[Google Client ID]',
        clientSecret: '[Google Client Secret]'
    },
    kakao: {
        appKey: '[Kakao JavaScript Key]',
        appSecret: '[Kakao REST API Key]'
    },
    naver: {
        clientId: '[Naver Client ID]',
        clientSecret: '[Naver Client Secret]'
    }
}
```

### 4.2 js/social-login.js 수정
```javascript
const SOCIAL_CONFIG = {
    google: {
        clientId: '[Google Client ID]'
    },
    kakao: {
        appKey: '[Kakao JavaScript Key]'
    },
    naver: {
        clientId: '[Naver Client ID]'
    }
};
```

### 4.3 backend/.env 수정
```env
# Google OAuth
GOOGLE_CLIENT_ID=[Google Client ID]
GOOGLE_CLIENT_SECRET=[Google Client Secret]

# Kakao OAuth
KAKAO_APP_KEY=[Kakao JavaScript Key]
KAKAO_REST_API_KEY=[Kakao REST API Key]

# Naver OAuth
NAVER_CLIENT_ID=[Naver Client ID]
NAVER_CLIENT_SECRET=[Naver Client Secret]
```

---

## 5. 테스트 체크리스트

### 5.1 Google 로그인
- [ ] 로그인 버튼 클릭
- [ ] Google 계정 선택
- [ ] 권한 동의
- [ ] 로그인 성공 확인

### 5.2 Kakao 로그인
- [ ] 로그인 버튼 클릭
- [ ] 카카오 계정 로그인
- [ ] 권한 동의
- [ ] 로그인 성공 확인

### 5.3 Naver 로그인
- [ ] 로그인 버튼 클릭
- [ ] 네이버 계정 로그인
- [ ] 권한 동의
- [ ] 로그인 성공 확인

---

## 6. 주의사항

1. **Client Secret은 절대 프론트엔드에 노출하지 마세요**
2. **모든 Redirect URI를 정확히 등록하세요**
3. **개발/운영 환경 URL을 모두 등록하세요**
4. **API 키는 .gitignore에 포함시키세요**

---

## 7. 현재 상태

### ✅ 필요한 작업
1. Google Cloud Console에서 OAuth 설정 (10분)
2. Kakao Developers에서 앱 생성 (10분)
3. Naver Developers에서 앱 등록 (10분)
4. 발급받은 키를 코드에 적용
5. 테스트 진행

### 📱 지원팀 연락처
- Google: https://support.google.com/cloud
- Kakao: https://devtalk.kakao.com
- Naver: https://developers.naver.com/forum

---

## 예상 소요 시간: 30분

모든 플랫폼 즉시 발급 가능!