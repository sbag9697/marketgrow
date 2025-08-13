# 🚀 Railway 환경변수 설정 - 구글 로그인

## Railway Dashboard에서 설정할 환경변수

1. Railway 대시보드 접속: https://railway.app
2. 프로젝트 선택
3. **Variables** 탭 클릭
4. 다음 변수 추가:

```env
GOOGLE_CLIENT_ID=1020058007586-n4h8saihm59tjehs90sv00u5efuu00uo.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=(Google Cloud Console에서 확인한 시크릿 키)
GOOGLE_REDIRECT_URI=https://marketgrow.kr/auth-callback.html
```

## Google Client Secret 확인 방법
1. https://console.cloud.google.com 접속
2. API 및 서비스 → 사용자 인증 정보
3. OAuth 2.0 클라이언트 ID 클릭
4. 클라이언트 보안 비밀번호 복사

## 설정 완료 후
1. Railway가 자동으로 재배포됩니다
2. 배포 완료 후 구글 로그인 테스트

## ✅ 현재 설정된 Client ID
```
1020058007586-n4h8saihm59tjehs90sv00u5efuu00uo.apps.googleusercontent.com
```

## 테스트
1. https://marketgrow.kr/login.html 접속
2. "구글로 시작하기" 버튼 클릭
3. 구글 계정으로 로그인
4. 성공!