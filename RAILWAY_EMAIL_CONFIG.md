# 🚀 Railway 이메일 설정 가이드

## Railway 환경 변수 설정 (꼭 해야 함!)

Railway 백엔드가 실제 이메일을 보내려면 Gmail 설정이 필요합니다.

### 1. Railway 대시보드 접속
1. https://railway.app 접속
2. 로그인
3. **marketgrow** 프로젝트 클릭

### 2. 환경 변수 추가
1. **Variables** 탭 클릭
2. 다음 변수들을 추가/수정:

```
EMAIL_USER=marketgrow.kr@gmail.com
EMAIL_APP_PASSWORD=nxlcjextenghopaz
```

### 3. 저장 및 재배포
1. 변수 추가 후 자동으로 재배포됩니다
2. 1-2분 기다려주세요

## ✅ 설정 확인 방법

1. https://marketgrow.kr/signup 접속
2. 이메일 입력 후 "인증" 버튼 클릭
3. 이메일 확인 (스팸함도 확인)
4. 6자리 인증 코드 입력

## 현재 상태
- ❌ Railway 백엔드: Gmail 설정 안 됨 (이메일 발송 실패)
- ✅ 로컬 백엔드: Gmail 설정 완료 (이메일 발송 성공)

## 중요!
Railway에 환경 변수를 설정하지 않으면 이메일 인증이 작동하지 않습니다!

---
*작성일: 2025-08-15*