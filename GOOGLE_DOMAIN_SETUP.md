# 🔐 Google Cloud Console 도메인 승인 상세 가이드

## 📍 Step 1: Google Cloud Console 접속

1. **브라우저에서 접속**
   ```
   https://console.cloud.google.com
   ```

2. **Google 계정으로 로그인**
   - marketgrow.kr@gmail.com 또는 개인 Gmail 계정

## 📍 Step 2: 프로젝트 선택

1. 상단 프로젝트 선택 드롭다운 클릭
2. 프로젝트가 없으면 기본 프로젝트 사용
3. 또는 "새 프로젝트" 생성 (선택사항)

## 📍 Step 3: OAuth 설정 페이지로 이동

1. **좌측 메뉴** → **API 및 서비스** 클릭
2. **사용자 인증 정보** 클릭
3. OAuth 2.0 클라이언트 ID 목록에서 클릭:
   ```
   1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com
   ```

## 📍 Step 4: 승인된 JavaScript 원본 추가

### 현재 설정되어 있을 수 있는 항목:
- http://localhost:3000
- http://localhost:5000

### 추가해야 할 항목:
1. **"+ URI 추가"** 버튼 클릭
2. 다음 URL을 하나씩 추가:
   ```
   https://marketgrow.kr
   ```
3. 한 번 더 **"+ URI 추가"** 클릭
   ```
   https://www.marketgrow.kr
   ```

⚠️ **주의사항**:
- `https://` 반드시 포함 (http 아님!)
- 뒤에 슬래시(/) 없음
- 정확한 도메인 입력

## 📍 Step 5: 승인된 리디렉션 URI 추가 (선택사항)

### 스크롤 내려서 "승인된 리디렉션 URI" 섹션 찾기

1. **"+ URI 추가"** 버튼 클릭
2. 다음 URL 추가:
   ```
   https://marketgrow.kr/auth-callback.html
   ```
3. 한 번 더 추가:
   ```
   https://www.marketgrow.kr/auth-callback.html
   ```

## 📍 Step 6: 저장

1. 페이지 하단 **"저장"** 버튼 클릭
2. "변경사항이 저장되었습니다" 메시지 확인

## ⏰ Step 7: 대기

- **5-10분 대기** (Google 서버에 반영되는 시간)
- 바로 테스트하면 작동 안 할 수 있음

## ✅ Step 8: 테스트

1. https://marketgrow.kr/login.html 접속
2. "구글로 시작하기" 클릭
3. 정상 작동 확인

## 🔍 문제 해결

### 여전히 "origin not allowed" 오류가 나는 경우:

1. **캐시 삭제**
   - 브라우저 캐시 및 쿠키 삭제
   - 시크릿 모드에서 테스트

2. **OAuth 동의 화면 확인**
   - API 및 서비스 → OAuth 동의 화면
   - 게시 상태: "테스트" 또는 "프로덕션"
   - 테스트 모드인 경우 테스트 사용자에 이메일 추가

3. **Client ID 재확인**
   - 프론트엔드 코드의 Client ID와 일치하는지 확인
   ```javascript
   // js/social-auth.js 파일 확인
   const GOOGLE_CLIENT_ID = '1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com';
   ```

4. **API 활성화 확인**
   - API 및 서비스 → 라이브러리
   - "Google+ API" 또는 "Google Identity" 활성화 확인

## 📸 스크린샷 가이드

### 올바른 설정 예시:
```
승인된 JavaScript 원본:
✅ https://marketgrow.kr
✅ https://www.marketgrow.kr
✅ http://localhost:3000

승인된 리디렉션 URI:
✅ https://marketgrow.kr/auth-callback.html
✅ https://www.marketgrow.kr/auth-callback.html
```

## 🆘 추가 도움

문제가 지속되면:
1. 브라우저 개발자 도구(F12) → Console 에러 메시지 확인
2. 정확한 오류 메시지 복사
3. Google Cloud Console에서 다시 확인

---

**완료 시간**: 약 5-10분 소요
**난이도**: ⭐⭐☆☆☆ (쉬움)