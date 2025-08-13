# 🚨 긴급 설정 필요!

## Railway 환경변수 설정 (지금 바로!)

Railway 대시보드(https://railway.app)에서 다음 환경변수들을 추가해주세요:

### 1. 이메일 인증용 (필수!)
```
EMAIL_USER=sbag9697@gmail.com
EMAIL_APP_PASSWORD=여기에_Gmail_앱_비밀번호_16자리
```

**Gmail 앱 비밀번호 받는 방법:**
1. https://myaccount.google.com/apppasswords 접속
2. 앱: "메일" 선택
3. 기기: "기타" → "MarketGrow" 입력
4. 생성된 16자리 비밀번호 복사 (공백 제거!)

### 2. SMS 인증용 (CoolSMS)
```
COOLSMS_API_KEY=NCSN4FS4EFQSCSA1
COOLSMS_API_SECRET=9R9CC9Y0LQEMFMCJHYOFVQAKMUQP4NLP
COOLSMS_SENDER=발신번호 (예: 01012345678)
```

### 3. 기타 필수 설정
```
NODE_ENV=production
FRONTEND_URL=https://marketgrow.kr
```

---

## 📋 체크리스트

- [ ] Gmail 앱 비밀번호 생성
- [ ] EMAIL_APP_PASSWORD 환경변수 설정
- [ ] CoolSMS 발신번호 등록
- [ ] COOLSMS_SENDER 환경변수 설정
- [ ] Railway 재배포 확인 (2-3분 대기)

---

## 🔍 확인 방법

### 1. Railway 로그 확인
Railway 대시보드 → Logs 탭에서:
- "Server running on port 5001" 메시지 확인
- 에러 메시지 없는지 확인

### 2. 서버 상태 확인
```bash
curl https://marketgrow-production-9802.up.railway.app/health
```

### 3. 이메일 인증 테스트
https://marketgrow.kr/signup.html 에서:
1. 이메일 입력 → 인증 버튼
2. 이메일 확인
3. 인증번호 입력

---

## ⚠️ 현재 상태

- 서버 코드: ✅ 수정 완료
- GitHub: ✅ 푸시 완료
- Railway: ⏳ 재배포 중 (2-3분)
- **환경변수: ❌ 설정 필요!**

**Gmail 앱 비밀번호를 설정하지 않으면 이메일 인증이 작동하지 않습니다!**