# Netlify 환경 변수 설정 가이드

## 📝 필수 환경 변수

Netlify에 배포된 사이트가 제대로 작동하려면 다음 환경 변수들을 설정해야 합니다:

### 1. BACKEND_URL
- **현재 값**: `https://marketgrow-production.up.railway.app`
- **설명**: Railway에 배포된 백엔드 API 서버 주소

### 2. TOSSPAYMENTS_CLIENT_KEY
- **테스트 키**: `test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoqy`
- **프로덕션 키**: 토스페이먼츠에서 발급받은 실제 키 사용
- **설명**: 결제 시스템용 토스페이먼츠 클라이언트 키

## 🚀 Netlify에서 환경 변수 설정하기

### 방법 1: Netlify 웹 대시보드 사용

1. [Netlify](https://app.netlify.com/) 로그인
2. 배포된 사이트 선택 (resplendent-heliotrope-e5c264)
3. **Site settings** 클릭
4. 왼쪽 메뉴에서 **Environment variables** 선택
5. **Add a variable** 버튼 클릭
6. 다음 변수들 추가:
   ```
   Key: BACKEND_URL
   Value: https://marketgrow-production.up.railway.app
   
   Key: TOSSPAYMENTS_CLIENT_KEY
   Value: test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoqy
   ```
7. **Save** 클릭
8. **Deploys** 탭에서 **Trigger deploy** > **Deploy site** 클릭하여 재배포

### 방법 2: Netlify CLI 사용

```bash
# Netlify CLI 설치 (이미 설치된 경우 생략)
npm install -g netlify-cli

# 로그인
netlify login

# 사이트 연결
netlify link

# 환경 변수 설정
netlify env:set BACKEND_URL "https://marketgrow-production.up.railway.app"
netlify env:set TOSSPAYMENTS_CLIENT_KEY "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoqy"

# 재배포
netlify deploy --prod
```

## 🔍 환경 변수 확인

환경 변수가 제대로 설정되었는지 확인:

```bash
netlify env:list
```

## 📌 중요 사항

1. **환경 변수 변경 후 반드시 재배포해야 합니다**
2. **프로덕션 환경에서는 테스트 키를 실제 키로 교체하세요**
3. **백엔드 URL이 변경되면 환경 변수도 업데이트해야 합니다**

## 🔧 문제 해결

### 백엔드 연결 오류
- BACKEND_URL이 올바른지 확인
- Railway 백엔드가 실행 중인지 확인
- CORS 설정이 Netlify 도메인을 허용하는지 확인

### 결제 오류
- TOSSPAYMENTS_CLIENT_KEY가 올바른지 확인
- 테스트/프로덕션 키 구분 확인

## 📞 추가 지원

문제가 지속되면 다음을 확인하세요:
- Railway 백엔드 로그: Railway 대시보드에서 확인
- Netlify 빌드 로그: Netlify 대시보드 > Deploys 탭
- 브라우저 콘솔: F12 > Console 탭