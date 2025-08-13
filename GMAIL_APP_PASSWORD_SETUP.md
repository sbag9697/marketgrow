# Gmail 앱 비밀번호 설정 가이드

## 1. Google 계정 2단계 인증 활성화

1. https://myaccount.google.com/security 접속
2. "Google에 로그인" 섹션에서 "2단계 인증" 클릭
3. 시작하기 → 휴대폰 번호 입력 → 인증
4. 2단계 인증 활성화 완료

## 2. 앱 비밀번호 생성

1. https://myaccount.google.com/apppasswords 접속
2. 앱 선택: "메일" 선택
3. 기기 선택: "기타(맞춤 이름)" 선택
4. 이름 입력: "MarketGrow" 입력
5. "생성" 버튼 클릭
6. **16자리 앱 비밀번호가 표시됨** (예: abcd efgh ijkl mnop)
7. 이 비밀번호를 복사 (공백 제거)

## 3. Railway 환경변수 설정

Railway 대시보드에서:
1. Variables 탭 이동
2. 다음 변수들 추가/수정:

```
EMAIL_USER=sbag9697@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop (공백 없이 16자리)
```

## 4. 로컬 테스트용 .env 파일 수정

```env
EMAIL_USER=sbag9697@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop
```

## ⚠️ 주의사항

- 앱 비밀번호는 공백 없이 16자리 연속으로 입력
- 일반 Gmail 비밀번호가 아닌 앱 비밀번호 사용
- 앱 비밀번호는 한 번만 표시되므로 안전하게 보관
- 분실 시 새로 생성 가능

## 문제 해결

### "Invalid login" 오류
- 2단계 인증이 활성화되었는지 확인
- 앱 비밀번호가 정확히 입력되었는지 확인
- 공백이 포함되지 않았는지 확인

### "Less secure app access" 오류
- 앱 비밀번호 사용 시 이 설정은 필요 없음
- 2단계 인증 + 앱 비밀번호가 더 안전한 방법