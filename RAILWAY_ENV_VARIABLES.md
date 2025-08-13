# Railway 환경변수 설정 가이드

## Railway 대시보드에서 설정 방법
1. https://railway.app 접속
2. 프로젝트 선택
3. **Variables** 탭 클릭
4. **Raw Editor** 또는 개별 추가

## 필수 환경변수 (복사해서 붙여넣기)

```bash
# MongoDB 연결 (필수)
MONGODB_URI=mongodb+srv://sbag9697:Rkdwogur12@cluster0.ot3kp.mongodb.net/marketgrow?retryWrites=true&w=majority

# JWT 인증 토큰 비밀키 (필수)
JWT_SECRET=your-secret-key-here-change-this-in-production-2024

# 환경 설정 (필수)
NODE_ENV=production

# 이메일 설정 (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=sbag9697@gmail.com
EMAIL_PASS=여기에_Gmail_앱_비밀번호_입력

# SMS 설정 (선택사항 - 나중에 추가)
SMS_API_KEY=
SMS_API_SECRET=
SMS_SENDER=

# 관리자 계정 (선택사항)
ADMIN_EMAIL=admin@marketgrow.com
ADMIN_PASSWORD=Admin123!@#

# 결제 설정 (선택사항 - 나중에 추가)
PAYMENT_MERCHANT_ID=
PAYMENT_API_KEY=

# 세션 설정 (선택사항)
SESSION_SECRET=your-session-secret-key-2024

# CORS 설정 (선택사항)
ALLOWED_ORIGINS=https://melodious-banoffee-c450ea.netlify.app,http://localhost:3000

# 로그 레벨 (선택사항)
LOG_LEVEL=info
```

## Gmail 앱 비밀번호 생성 방법
1. Google 계정 설정 → 보안
2. 2단계 인증 활성화
3. 앱 비밀번호 생성
4. "메일" 선택
5. 생성된 16자리 비밀번호를 EMAIL_PASS에 입력

## 중요한 환경변수 설명

### 1. MONGODB_URI (필수)
- MongoDB Atlas 데이터베이스 연결 문자열
- 현재 설정된 값으로 사용하면 됨

### 2. JWT_SECRET (필수)
- JWT 토큰 생성/검증용 비밀키
- 프로덕션에서는 더 복잡한 키로 변경 권장
- 예: `uuidgen` 명령어로 생성한 UUID 사용

### 3. NODE_ENV (필수)
- `production`으로 설정
- 프로덕션 최적화 활성화

### 4. EMAIL_USER / EMAIL_PASS
- 이메일 인증 발송용
- Gmail 계정과 앱 비밀번호 필요

## Railway에서 설정 확인
Variables 탭에서 다음과 같이 표시되어야 함:
- MONGODB_URI: ••••••• (숨김 처리)
- JWT_SECRET: ••••••• (숨김 처리)
- NODE_ENV: production
- EMAIL_HOST: smtp.gmail.com
- EMAIL_PORT: 587

## 설정 후 확인 방법
```bash
# Health check
curl https://marketgrow-production-9802.up.railway.app/api/health

# 응답에 MongoDB: "Connected" 확인
```

## 문제 해결
- **MongoDB 연결 실패**: MONGODB_URI 확인, IP 화이트리스트 확인
- **이메일 발송 실패**: Gmail 앱 비밀번호 확인
- **JWT 오류**: JWT_SECRET 설정 확인