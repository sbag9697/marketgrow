# 🚀 CoolSMS Railway 설정 완료하기

## 📌 Railway 환경변수 설정

### 1. Railway 대시보드 접속
- https://railway.app 로그인
- **marketgrow** 프로젝트 클릭

### 2. Variables 탭에서 다음 3개 추가

```
COOLSMS_API_KEY=NCSN4FS4EFQSCSA1
COOLSMS_API_SECRET=9R9CC9Y0LQEMFMCJHYOFVQAKMUQP4NLP
COOLSMS_SENDER=여기에_발신번호_입력
```

⚠️ **COOLSMS_SENDER**에는 CoolSMS에 등록한 발신번호를 입력하세요!
- 예: 01012345678 (하이픈 없이)

### 3. 저장
- 변수 추가 후 자동으로 재배포됨
- 약 1-2분 대기

---

## 📌 발신번호 확인/등록

### CoolSMS 콘솔에서 확인
1. https://console.coolsms.co.kr 로그인
2. 좌측 메뉴 **발신번호** 클릭
3. 등록된 번호 확인

### 발신번호가 없다면
1. **발신번호 등록** 버튼 클릭
2. 본인 휴대폰 번호 입력
3. 인증번호 받아서 입력
4. 등록 완료

---

## 📌 테스트 방법

### 1. 회원가입 페이지 테스트
1. https://marketgrow.kr/signup.html 접속
2. 전화번호 입력 (예: 010-1234-5678)
3. **인증** 버튼 클릭
4. SMS 수신 확인
5. 받은 인증번호 6자리 입력
6. **확인** 버튼 클릭

### 2. Railway 로그 확인
Railway 대시보드 → **Logs** 탭에서 확인:
```
✅ CoolSMS 초기화 완료
✅ SMS 발송 성공: { groupId: 'xxx', to: '01012345678' }
```

---

## 📌 로컬 테스트 (선택)

로컬에서 테스트하려면 `backend/.env` 파일에 추가:

```env
COOLSMS_API_KEY=NCSN4FS4EFQSCSA1
COOLSMS_API_SECRET=9R9CC9Y0LQEMFMCJHYOFVQAKMUQP4NLP
COOLSMS_SENDER=01012345678
```

서버 실행:
```bash
cd backend
npm start
```

---

## ⚠️ 보안 주의사항

### IP 제한 설정 (선택)
현재 "모든 IP에서 사용 허용"으로 되어 있습니다.
보안을 위해 Railway 서버 IP만 허용하려면:

1. CoolSMS 콘솔 → API Key 관리
2. 해당 키 옆 **설정** 아이콘
3. **IP 제한** 설정
4. Railway 서버 IP 추가

---

## 💰 포인트 확인

### 현재 잔액
- CoolSMS 콘솔 대시보드에서 확인
- 무료 300원 (약 30건)

### 포인트 소진 시
1. **충전** 메뉴 클릭
2. 금액 선택 (최소 1,000원)
3. 결제 진행

---

## 🔥 즉시 확인사항

### ✅ 체크리스트
- [ ] Railway에 3개 환경변수 추가했나요?
- [ ] COOLSMS_SENDER에 발신번호 입력했나요?
- [ ] Railway 재배포 완료되었나요? (1-2분)
- [ ] 발신번호가 CoolSMS에 등록되어 있나요?

### 모두 완료되었다면
→ https://marketgrow.kr/signup.html 에서 테스트!

---

## ❌ 문제 해결

### "발신번호 오류"
```
해결: COOLSMS_SENDER 환경변수 확인
- 하이픈 없이 입력 (01012345678 ✅)
- 010-1234-5678 ❌
```

### "인증 실패"
```
해결: API Key와 Secret 확인
- 복사할 때 공백 포함되지 않았는지 확인
- Railway에서 정확히 입력되었는지 확인
```

### "잔액 부족"
```
해결: 무료 포인트 소진
- CoolSMS 콘솔에서 충전 필요
```

---

## 📞 도움이 필요하면

### CoolSMS 고객센터
- 전화: 1855-1471
- 카카오톡: @coolsms

### 콘솔 로그 확인
Railway Logs 또는 브라우저 개발자 도구(F12) 콘솔에서 오류 메시지 확인

---

🎉 **거의 완료되었습니다! Railway 환경변수만 설정하면 끝!**