# MarketGrow Backend Server

MarketGrow SNS 마케팅 서비스의 백엔드 API 서버입니다.

## 🚀 빠른 시작

### 필요 조건

- Node.js 18.0.0 이상
- MongoDB (로컬 또는 MongoDB Atlas)
- npm 또는 yarn

### 설치

1. 의존성 패키지 설치
```bash
npm install
```

2. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 편집하여 실제 값으로 변경
```

3. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

## 📁 프로젝트 구조

```
server/
├── config/          # 설정 파일
├── middleware/       # Express 미들웨어
├── models/          # MongoDB 모델
├── routes/          # API 라우터
├── scripts/         # 스크립트 파일
├── utils/           # 유틸리티 함수
├── logs/            # 로그 파일 (자동 생성)
├── uploads/         # 업로드된 파일 (자동 생성)
├── .env             # 환경 변수
├── .env.example     # 환경 변수 예시
└── server.js        # 메인 서버 파일
```

## 🔧 환경 변수

### 필수 설정

```env
# MongoDB 연결
MONGODB_URI=mongodb://localhost:27017/marketgrow

# JWT 토큰
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# 서버 설정
PORT=3001
NODE_ENV=development
```

### 선택적 설정

```env
# 이메일 설정 (NodeMailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS 설정 (CoolSMS)
COOLSMS_API_KEY=your-api-key
COOLSMS_API_SECRET=your-api-secret

# 결제 설정 (토스페이먼츠)
TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...
```

## 🛠 API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `GET /api/auth/me` - 내 정보 조회

### 서비스
- `GET /api/services` - 서비스 목록 조회
- `GET /api/services/:id` - 서비스 상세 조회
- `GET /api/services/featured` - 추천 서비스
- `GET /api/services/popular` - 인기 서비스

### 주문
- `GET /api/orders` - 내 주문 목록
- `POST /api/orders` - 주문 생성
- `GET /api/orders/:id` - 주문 상세 조회

### 결제
- `GET /api/payments` - 내 결제 내역
- `POST /api/payments` - 결제 생성
- `POST /api/payments/:id/process` - 결제 처리

### 알림
- `GET /api/notifications/settings` - 알림 설정 조회
- `PUT /api/notifications/settings` - 알림 설정 업데이트
- `POST /api/notifications/verify-phone` - 휴대폰 인증

## 🗄 데이터베이스

### MongoDB 컬렉션

- `users` - 사용자 정보
- `services` - 서비스 정보
- `orders` - 주문 정보
- `payments` - 결제 정보
- `notifications` - 알림 내역

### 인덱스

서버 시작 시 자동으로 다음 인덱스가 생성됩니다:

- Users: email, phone, createdAt
- Orders: userId, orderNumber, status
- Payments: paymentId, userId, status
- Services: platform, category, isActive

## 🔐 보안

### 인증 및 권한
- JWT 기반 인증
- 역할 기반 접근 제어 (user, admin, manager)
- Rate limiting (15분당 100회 요청)

### 데이터 보안
- bcrypt 비밀번호 해싱
- MongoDB Sanitization
- HPP (HTTP Parameter Pollution) 방지
- Helmet.js 기본 보안 헤더

## 📊 로깅

Winston을 사용한 구조화된 로깅:

- `logs/combined.log` - 모든 로그
- `logs/error.log` - 에러 로그만
- `logs/debug.log` - 디버그 로그 (개발 환경)

## 🧪 테스트

```bash
# 테스트 실행
npm test

# 테스트 커버리지
npm run test:coverage
```

## 📦 배포

### PM2를 사용한 배포

```bash
# PM2 설치
npm install -g pm2

# 서버 시작
pm2 start server.js --name "marketgrow-api"

# 서버 상태 확인
pm2 status

# 로그 확인
pm2 logs marketgrow-api
```

### Docker를 사용한 배포

```dockerfile
# Dockerfile 예시
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3001

CMD ["node", "server.js"]
```

## 🔍 모니터링

### Health Check
- `GET /health` - 서버 상태 확인

### 관리자 대시보드
- `GET /api/admin/dashboard` - 관리자 통계
- `GET /api/admin/health` - 시스템 상태

## 🤝 개발

### 코드 스타일
- ESLint 설정 준수
- Prettier를 사용한 코드 포맷팅

### Git 워크플로우
1. feature 브랜치 생성
2. 코드 작성 및 테스트
3. Pull Request 생성
4. 코드 리뷰 후 merge

## 📝 라이센스

MIT License

## 🆘 지원

문제가 발생하면 다음을 확인해주세요:

1. 환경 변수가 올바르게 설정되었는지
2. MongoDB가 실행 중인지
3. 로그 파일에서 에러 메시지 확인
4. Node.js 버전이 18.0.0 이상인지

추가 지원이 필요한 경우 이슈를 생성해주세요.