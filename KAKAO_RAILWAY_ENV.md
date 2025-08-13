# 🚀 Railway 환경변수 설정 - 카카오 로그인

## Railway Dashboard에서 설정할 환경변수

1. Railway 대시보드 접속: https://railway.app
2. 프로젝트 선택
3. **Variables** 탭 클릭
4. 다음 변수 추가:

```env
KAKAO_CLIENT_ID=a7b2ddf2636cdeb3faff0517c5ec6591
KAKAO_REDIRECT_URI=https://marketgrow.kr/auth-callback.html
```

## 선택사항 (보안 강화용)
```env
KAKAO_CLIENT_SECRET=(카카오 개발자 센터에서 확인 가능)
```

## 설정 완료 후
1. Railway가 자동으로 재배포됩니다
2. 배포 완료 후 카카오 로그인 테스트

## ⚠️ 중요
- REST API 키(`a7b2ddf2636cdeb3faff0517c5ec6591`)는 백엔드용입니다
- JavaScript 키(`95a2c17a5ec078dd1762950680e53267`)는 프론트엔드용입니다
- 절대 JavaScript 키를 백엔드에, REST API 키를 프론트엔드에 사용하지 마세요!