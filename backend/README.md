# MarketGrow Backend API

SNS 마케팅 서비스를 위한 Node.js/Express 백엔드 API 서버입니다.

## 기능

### 인증 시스템
- 사용자 회원가입/로그인
- JWT 토큰 기반 인증
- 이메일/전화번호 인증
- 비밀번호 재설정
- 소셜 로그인 지원 (카카오, 구글, 네이버)

### 사용자 관리
- 사용자 프로필 관리
- 멤버십 레벨 시스템 (Bronze, Silver, Gold, Platinum, Diamond)
- 추천 시스템
- 포인트 시스템

### 서비스 관리
- SNS 플랫폼별 서비스 (Instagram, YouTube, TikTok, Facebook 등)
- 동적 가격 계산 (멤버십 레벨별 할인)
- 서비스 카테고리 (팔로워, 좋아요, 조회수 등)

### 주문 시스템
- 주문 생성 및 관리
- 주문 진행 상황 추적
- 주문 취소 및 환불
- 실시간 통계

### 결제 시스템
- 다양한 결제 방법 지원
- 결제 상태 관리
- 환불 처리
- 결제 내역 조회

### 상담 시스템
- 상담 신청 및 관리
- 팔로우업 관리
- 상담 상태 추적
- 전환 통계

### 키워드 노출 서비스
- 비디오 키워드 노출
- 라이브 키워드 노출
- 플랫폼별 패키지
- 키워드 캠페인 관리

### 관리자 시스템
- 대시보드 통계
- 사용자 관리
- 주문/결제 관리
- 서비스 관리
- 시스템 로그

## 기술 스택

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator, Joi
- **Security**: helmet, cors, bcryptjs
- **File Upload**: multer
- **Logging**: winston, morgan
- **Testing**: Jest, supertest
- **Process Management**: nodemon (development)

## 설치 및 실행

### 1. 의존성 설치
```bash
cd backend
npm install
```

### 2. 환경 변수 설정
`.env.example` 파일을 `.env`로 복사하고 환경에 맞게 수정:

```bash
cp .env.example .env
```

### 3. 데이터베이스 시드 (선택사항)
```bash
npm run seed
```

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 프로덕션 서버 실행
```bash
npm start
```

## API 엔드포인트

### 인증 (`/api/auth`)
- `POST /register` - 회원가입
- `POST /login` - 로그인
- `GET /profile` - 프로필 조회
- `PUT /profile` - 프로필 수정
- `PUT /change-password` - 비밀번호 변경
- `POST /forgot-password` - 비밀번호 재설정 요청
- `POST /reset-password` - 비밀번호 재설정
- `GET /verify-email/:token` - 이메일 인증
- `POST /resend-verification` - 인증 이메일 재전송

### 사용자 (`/api/users`)
- `GET /dashboard` - 사용자 대시보드
- `GET /orders` - 사용자 주문 목록
- `GET /payments` - 사용자 결제 내역
- `GET /referrals` - 추천 현황

### 서비스 (`/api/services`)
- `GET /` - 서비스 목록
- `GET /stats` - 플랫폼 통계
- `GET /platform/:platform` - 플랫폼별 서비스
- `GET /:id` - 서비스 상세
- `POST /:serviceId/calculate-price` - 가격 계산

### 주문 (`/api/orders`)
- `POST /` - 주문 생성
- `GET /` - 주문 목록
- `GET /statistics` - 주문 통계
- `GET /:id` - 주문 상세
- `POST /:id/cancel` - 주문 취소
- `POST /:id/refund` - 환불 요청
- `PUT /:id/progress` - 진행률 업데이트 (관리자)

### 결제 (`/api/payments`)
- `POST /initialize` - 결제 초기화
- `POST /webhook` - 결제 웹훅
- `GET /` - 결제 내역
- `GET /statistics` - 결제 통계
- `GET /:id` - 결제 상세
- `POST /:id/refund` - 환불 처리 (관리자)

### 상담 (`/api/consultations`)
- `POST /` - 상담 신청
- `GET /` - 상담 목록 (관리자)
- `GET /statistics` - 상담 통계 (관리자)
- `GET /:id` - 상담 상세 (관리자)
- `PUT /:id/status` - 상담 상태 수정 (관리자)
- `POST /:id/follow-up` - 팔로우업 추가 (관리자)
- `POST /:id/schedule-call` - 통화 예약 (관리자)
- `POST /:id/complete` - 상담 완료 (관리자)

### 키워드 (`/api/keywords`)
- `GET /packages` - 키워드 패키지 목록
- `POST /order` - 키워드 캠페인 주문
- `POST /calculate-price` - 키워드 패키지 가격 계산
- `GET /orders` - 키워드 캠페인 주문 목록
- `GET /admin/orders` - 키워드 캠페인 관리 (관리자)

### 관리자 (`/api/admin`)
- `GET /dashboard` - 관리자 대시보드
- `GET /users` - 사용자 관리
- `PUT /users/:id` - 사용자 정보 수정
- `GET /orders` - 전체 주문 관리
- `GET /payments` - 전체 결제 관리
- `GET /services` - 서비스 관리
- `POST /services` - 서비스 생성
- `PUT /services/:id` - 서비스 수정
- `DELETE /services/:id` - 서비스 삭제
- `GET /logs` - 시스템 로그

## 데이터 모델

### User (사용자)
- 기본 정보 (이름, 이메일, 전화번호)
- 인증 정보 (비밀번호, 토큰)
- 멤버십 정보 (레벨, 총 구매액, 포인트)
- 추천 시스템 (추천 코드, 추천인)
- 소셜 로그인 정보

### Service (서비스)
- 기본 정보 (이름, 설명, 플랫폼, 카테고리)
- 가격 정보 (단계별 가격, 할인율)
- 배송 정보 (최소/최대 수량, 배송 시간)
- 통계 정보 (주문 수, 매출, 평점)
- 제공업체 정보

### Order (주문)
- 주문 정보 (주문번호, 사용자, 서비스)
- 가격 정보 (단가, 할인, 최종 금액)
- 상태 정보 (진행 상태, 결제 상태)
- 진행률 추적 (현재/전체, 퍼센트)
- 메타데이터 (대상 URL, 메모 등)

### Payment (결제)
- 결제 정보 (결제 ID, 금액, 방법)
- 상태 정보 (결제 상태, 제공업체 응답)
- 환불 정보 (환불 내역, 환불 금액)
- 카드/계좌 정보 (마스킹된 정보)

### Consultation (상담)
- 신청자 정보 (이름, 연락처, 회사)
- 상담 내용 (관심 서비스, 예산, 목표)
- 상태 관리 (진행 상태, 담당자, 우선순위)
- 팔로우업 내역
- 결과 추적 (전환 여부, 전환 가치)

## 보안

- JWT 토큰 기반 인증
- 비밀번호 해싱 (bcryptjs)
- Rate Limiting
- CORS 설정
- Helmet 보안 헤더
- 입력 데이터 검증 및 살균
- MongoDB Injection 방지

## 모니터링 및 로깅

- Winston 로깅 시스템
- Morgan HTTP 요청 로깅
- 에러 추적 및 로깅
- 성능 모니터링

## 테스팅

```bash
# 테스트 실행
npm test

# 테스트 커버리지
npm run test:coverage
```

## 배포

### Docker (권장)
```bash
# 이미지 빌드
docker build -t marketgrow-backend .

# 컨테이너 실행
docker run -p 5000:5000 --env-file .env marketgrow-backend
```

### PM2
```bash
# PM2로 실행
pm2 start ecosystem.config.js

# 상태 확인
pm2 status

# 로그 확인
pm2 logs
```

## 개발

### 코드 스타일
- ESLint + Prettier 사용
- 일관된 네이밍 컨벤션
- JSDoc 주석 권장

### 커밋 메시지
- Conventional Commits 스타일 권장
- feat: 새로운 기능
- fix: 버그 수정
- docs: 문서 수정
- refactor: 코드 리팩토링

## 라이센스

ISC License

## 지원

기술 지원이 필요한 경우 개발팀에 문의하세요.