# ✅ Railway 환경변수 업데이트 가이드

## MongoDB Atlas 연결 성공!

로컬 테스트 결과: **✅ 연결 성공**

## Railway에 동일한 설정 적용하기

### 1. Railway 로그인
https://railway.app

### 2. 환경변수 업데이트

1. **sns-marketing-site** 프로젝트 선택
2. **backend** 서비스 클릭
3. **Variables** 탭 클릭
4. 다음 환경변수 추가/수정:

```
MONGODB_URI=mongodb+srv://sbag9697:nUHawo7w3RKDqO8i@cluster0.17qmchk.mongodb.net/marketgrow?retryWrites=true&w=majority&appName=Cluster0
```

### 3. 기타 필수 환경변수 확인

```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long-for-production
JWT_EXPIRE=30d

# Google OAuth
GOOGLE_CLIENT_ID=1020058007586-n4h8saihm59tjehs90sv00u5efuu00uo.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=(구글 시크릿 키)

# Kakao OAuth  
KAKAO_CLIENT_ID=a7b2ddf2636cdeb3faff0517c5ec6591
KAKAO_CLIENT_SECRET=(카카오 시크릿 키)

# Email
EMAIL_USER=marketgrow.kr@gmail.com
EMAIL_PASS=(Gmail 앱 비밀번호)

# SMS
COOLSMS_API_KEY=NCSN4FS4EFQSCSA1
COOLSMS_API_SECRET=(쿨SMS 시크릿)
COOLSMS_SENDER=01057728658
```

### 4. 재배포

환경변수 저장 시 자동으로 재배포됩니다.

### 5. 성공 확인

Railway 로그에서 확인:
```
MongoDB connected successfully
Database initialized with seed data
🚀 Server is running on http://localhost:5000
```

### 6. API 헬스체크

```
https://marketgrow-production-c586.up.railway.app/api/health
```

응답:
```json
{
  "status": "OK",
  "mongodb": "Connected",
  "environment": "production"
}
```

## 🎉 완료!

이제 MongoDB Atlas가 Railway에서도 정상 작동합니다.
데이터가 영구적으로 저장됩니다.