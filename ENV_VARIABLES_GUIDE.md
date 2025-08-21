# 🔐 환경변수 설정 가이드

## 📌 필수 환경변수 (반드시 설정)

### 1. 서버 기본 설정
```bash
NODE_ENV=production
PORT=5001  # Render는 자동으로 포트 할당하므로 생략 가능
```

### 2. MongoDB 설정 ⭐ (가장 중요)
```bash
MONGODB_URI=mongodb+srv://marketgrow:JXcmH4vNz26QKjEo@cluster0.c586sbu.mongodb.net/marketgrow?retryWrites=true&w=majority&appName=Cluster0
```

### 3. JWT 보안 키 ⭐ (필수)
```bash
JWT_SECRET=marketgrow2024secretkey!@#$
JWT_EXPIRE=30d
```

### 4. 관리자 계정
```bash
ADMIN_EMAIL=admin@marketgrow.com
ADMIN_PASSWORD=admin123!@#
```

## 📧 이메일 설정 (선택사항)

### Gmail 설정 (이미 설정됨)
```bash
EMAIL_USER=marketgrow.kr@gmail.com
EMAIL_APP_PASSWORD=nxlcjextenghopaz
FROM_EMAIL=marketgrow.kr@gmail.com
FROM_NAME=SNS그로우
```

## 🔗 소셜 로그인 (선택사항)

### Google OAuth
```bash
GOOGLE_CLIENT_ID=1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET  # 실제 값 필요
```

### Kakao OAuth
```bash
KAKAO_APP_KEY=95a2c17a5ec078dd1762950680e53267
KAKAO_REST_API_KEY=YOUR_KAKAO_REST_API_KEY  # 실제 값 필요
```

### Naver OAuth
```bash
NAVER_CLIENT_ID=Cirw8aXNIq8wF518fNMZ
NAVER_CLIENT_SECRET=x1lNqh6xcJ
```

## 🏦 오픈뱅킹 설정 (자동 입금 확인)

### 오픈뱅킹 API 설정 ⭐ (중요)
```bash
# 오픈뱅킹 API 기본 설정
OPENBANKING_BASE_URL=https://testapi.openbanking.or.kr  # 테스트: testapi, 운영: openapi
OPENBANKING_CLIENT_ID=YOUR_CLIENT_ID  # 오픈뱅킹에서 발급받은 Client ID
OPENBANKING_CLIENT_SECRET=YOUR_CLIENT_SECRET  # 오픈뱅킹에서 발급받은 Client Secret
OPENBANKING_CLIENT_USE_CODE=M202301234  # 기관코드 (9자리)
OPENBANKING_REDIRECT_URI=https://marketgrow.kr/api/openbanking/callback  # OAuth 콜백 URL
OPENBANKING_STATE=marketgrow_oauth_state  # CSRF 방지용 상태값

# 농협 계좌 정보
NH_ACCOUNT_NUMBER=3010373375401  # 하이픈 없이
NH_ACCOUNT_HOLDER=박시현
NH_FINTECH_USE_NUM=199005123456789012345678901234  # 농협에서 발급받은 핀테크이용번호 (34자리)

# 관리자 설정
ADMIN_SECRET=your_admin_secret_key_here  # 관리자 API 접근용 시크릿
```

## 💼 비즈니스 설정

### SMM 패널 API
```bash
SMM_API_URL=https://smmturk.org/api/v2
SMM_API_KEY=60370e0dabe133a030c2597a41882694
SMM_ENABLED=true
```

### 사업자 정보
```bash
BUSINESS_NAME=SNS그로우
BUSINESS_OWNER=박시현
BUSINESS_NUMBER=154-38-01411
BUSINESS_PHONE=010-5772-8658
BUSINESS_EMAIL=marketgrow.kr@gmail.com
PRICE_MARGIN=90
```

## 🚀 Render 배포 시 설정 방법

### 1. Render Dashboard에서 설정
1. **Web Service** 생성 후
2. **Environment** 탭 클릭
3. **Environment Variables** 섹션에서 **Add Environment Variable** 클릭
4. 아래 변수들을 하나씩 추가

### 2. 최소 필수 변수만 설정 (빠른 시작)
```bash
# 이것만 있어도 기본 동작 가능
MONGODB_URI=mongodb+srv://marketgrow:JXcmH4vNz26QKjEo@cluster0.c586sbu.mongodb.net/marketgrow
JWT_SECRET=marketgrow2024secretkey!@#$
NODE_ENV=production
```

### 3. 권장 설정 (전체 기능)
```bash
# 필수
MONGODB_URI=mongodb+srv://marketgrow:JXcmH4vNz26QKjEo@cluster0.c586sbu.mongodb.net/marketgrow
JWT_SECRET=marketgrow2024secretkey!@#$
NODE_ENV=production

# 관리자
ADMIN_EMAIL=admin@marketgrow.com
ADMIN_PASSWORD=admin123!@#
ADMIN_SECRET=your_admin_secret_key_here

# 이메일
EMAIL_USER=marketgrow.kr@gmail.com
EMAIL_APP_PASSWORD=nxlcjextenghopaz
FROM_EMAIL=marketgrow.kr@gmail.com
FROM_NAME=SNS그로우

# 오픈뱅킹 (자동 입금 확인) ⭐ 중요
OPENBANKING_BASE_URL=https://openapi.openbanking.or.kr
OPENBANKING_CLIENT_ID=YOUR_CLIENT_ID
OPENBANKING_CLIENT_SECRET=YOUR_CLIENT_SECRET
OPENBANKING_CLIENT_USE_CODE=M202301234
OPENBANKING_REDIRECT_URI=https://marketgrow.kr/api/openbanking/callback
NH_FINTECH_USE_NUM=199005123456789012345678901234

# SMM API
SMM_API_URL=https://smmturk.org/api/v2
SMM_API_KEY=60370e0dabe133a030c2597a41882694
SMM_ENABLED=true

# 비즈니스
BUSINESS_NAME=SNS그로우
PRICE_MARGIN=90
```

## ⚠️ 보안 주의사항

### 절대 공개하면 안 되는 값
- `MONGODB_URI` - 데이터베이스 접속 정보
- `JWT_SECRET` - 토큰 생성 키
- `EMAIL_APP_PASSWORD` - Gmail 앱 비밀번호
- `SMM_API_KEY` - SMM 패널 API 키
- `OPENBANKING_CLIENT_SECRET` - 오픈뱅킹 API 시크릿
- `NH_FINTECH_USE_NUM` - 농협 핀테크이용번호
- `ADMIN_SECRET` - 관리자 시크릿 키

### GitHub에 올리면 안 됨
- `.env` 파일은 절대 커밋하지 마세요
- `.gitignore`에 `.env` 포함 확인

## 📝 Railway 배포 시

Railway는 이미 설정된 환경변수가 있을 수 있습니다.

1. https://railway.app 로그인
2. 프로젝트 선택
3. **Variables** 탭
4. 위 변수들 추가/수정

## 🔧 환경변수 테스트

배포 후 확인:
```bash
# Health Check
curl https://[your-app].onrender.com/api/health

# 응답 예시
{
  "status": "OK",
  "mongodb": "Connected",
  "environment": "production"
}
```

## 💡 문제 해결

### MongoDB 연결 실패
- MongoDB Atlas에서 IP 화이트리스트 확인 (0.0.0.0/0 허용)
- 연결 문자열의 비밀번호 확인

### 이메일 전송 실패
- Gmail 2단계 인증 활성화 확인
- 앱 비밀번호 재생성

### SMM API 실패
- API 키 유효성 확인
- 크레딧 잔액 확인

## 📞 지원

환경변수 관련 문제 시:
1. Render/Railway 로그 확인
2. MongoDB Atlas 연결 상태 확인
3. 각 서비스의 API 키 유효성 확인