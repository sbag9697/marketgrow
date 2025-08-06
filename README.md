# MarketGrow - SNS 마케팅 서비스 플랫폼

![MarketGrow Logo](https://via.placeholder.com/600x200/007bff/ffffff?text=MarketGrow)

**MarketGrow**는 인스타그램, 유튜브, 틱톡 등 주요 소셜미디어 플랫폼에서 팔로워, 좋아요, 조회수 등을 증가시키는 종합 마케팅 서비스 플랫폼입니다.

## 🚀 주요 기능

### 💼 비즈니스 기능
- **140개 이상의 SNS 마케팅 서비스** 제공
- **실시간 주문 처리** 및 진행 상황 추적
- **토스페이먼츠 연동** 안전한 결제 시스템
- **이메일/SMS 알림** 시스템
- **사용자 대시보드** 및 주문 내역 관리

### 🏢 지원 플랫폼
- **Instagram**: 팔로워, 좋아요, 조회수, 댓글
- **YouTube**: 구독자, 조회수, 좋아요, 댓글
- **TikTok**: 팔로워, 좋아요, 조회수, 공유
- **Facebook**: 페이지 좋아요, 포스트 좋아요
- **Twitter**: 팔로워, 리트윗, 좋아요

### 🛡️ 보안 & 품질
- **SSL/TLS 암호화** 보안 연결
- **JWT 토큰** 기반 인증
- **Rate Limiting** DDoS 방지
- **실제 사용자** 기반 서비스 (봇 X)
- **24/7 고객 지원**

## 🏗️ 기술 스택

### Frontend
- **HTML5, CSS3, JavaScript (ES6+)**
- **Responsive Design** - 모바일 최적화
- **PWA** (Progressive Web App) 지원
- **Service Worker** 오프라인 캐싱

### Backend
- **Node.js + Express.js**
- **MongoDB** - 메인 데이터베이스
- **Redis** - 캐시 및 세션 관리
- **JWT** - 인증 시스템

### DevOps & 배포
- **Docker** - 컨테이너화
- **Docker Compose** - 멀티 컨테이너 관리
- **Nginx** - 리버스 프록시 & 로드 밸런서
- **Let's Encrypt** - SSL 인증서 자동 관리

### 모니터링
- **Prometheus** - 메트릭 수집
- **Grafana** - 대시보드 및 시각화
- **AlertManager** - 실시간 알림 시스템

## 📦 설치 및 실행

### 요구사항
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18.0+ (개발 환경)

### 1. 프로젝트 클론
```bash
git clone https://github.com/marketgrow/sns-marketing-site.git
cd sns-marketing-site
```

### 2. 환경 설정
```bash
# 환경 변수 파일 생성
cp .env.example .env

# .env 파일 편집 (필수 설정값 입력)
nano .env
```

### 3. 배포 실행
```bash
# 프로덕션 배포
./scripts/deploy.sh production

# 개발 환경 실행
./scripts/deploy.sh development
```

### 4. SSL 인증서 설정 (프로덕션)
```bash
# Let's Encrypt 인증서 발급
./scripts/ssl-setup.sh yourdomain.com admin@yourdomain.com
```

### 5. 모니터링 시스템 시작
```bash
# 모니터링 대시보드 실행
./scripts/monitoring-start.sh
```

## 🔧 개발 환경 설정

### 로컬 개발
```bash
# 프론트엔드 개발 서버
npm run dev

# 백엔드 개발 서버
npm run server:dev

# 전체 개발 환경 (Docker)
docker-compose -f docker-compose.dev.yml up
```

### 코드 품질 관리
```bash
# 린팅
npm run lint

# 포맷팅
npm run format

# 테스트
npm test

# 빌드
npm run build
```

## 📊 서비스 접속 정보

### 프로덕션 환경
- **메인 사이트**: https://yourdomain.com
- **API 서버**: https://yourdomain.com/api
- **관리자 대시보드**: https://yourdomain.com/admin

### 개발 환경
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:3001
- **MongoDB 관리**: http://localhost:8081
- **Redis 관리**: http://localhost:8082

### 모니터링 대시보드
- **Grafana**: http://localhost:3000 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **AlertManager**: http://localhost:9093

## 🗂️ 프로젝트 구조

```
sns-marketing-site/
├── 📁 scripts/              # 배포 및 관리 스크립트
│   ├── deploy.sh            # 메인 배포 스크립트
│   ├── ssl-setup.sh         # SSL 인증서 설정
│   ├── backup.sh            # 데이터 백업
│   └── monitoring-start.sh  # 모니터링 시작
├── 📁 server/               # 백엔드 서버
│   ├── routes/              # API 라우터
│   ├── models/              # 데이터베이스 모델
│   ├── middleware/          # Express 미들웨어
│   └── config/              # 서버 설정
├── 📁 js/                   # 프론트엔드 JavaScript
│   ├── api.js               # API 클라이언트
│   ├── auth.js              # 인증 관리
│   ├── payment.js           # 결제 시스템
│   └── dashboard.js         # 대시보드 로직
├── 📁 monitoring/           # 모니터링 설정
│   ├── prometheus.yml       # Prometheus 설정
│   ├── alertmanager.yml     # 알림 규칙
│   └── rules/               # 모니터링 규칙
├── 📁 nginx/                # Nginx 설정
│   ├── nginx.conf           # 메인 설정
│   └── conf.d/              # 가상 호스트 설정
├── 🐳 Dockerfile            # 프로덕션 컨테이너
├── 🐳 docker-compose.yml    # 메인 서비스 구성
└── 📋 package.json          # Node.js 의존성
```

## 🔐 보안 설정

### 환경 변수 (필수 설정)
```env
# 데이터베이스
MONGODB_URI=mongodb://localhost:27017/marketgrow
MONGO_ROOT_PASSWORD=secure-password

# JWT 토큰 (32자 이상)
JWT_SECRET=your-very-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# 결제 시스템
TOSS_CLIENT_KEY=your-toss-client-key
TOSS_SECRET_KEY=your-toss-secret-key

# 이메일/SMS
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
COOLSMS_API_KEY=your-coolsms-key
```

### SSL 인증서
- **Let's Encrypt**: 무료 자동 인증서
- **자체 서명**: 개발/테스트 환경용
- **상용 인증서**: 기업용 고급 인증서

## 📈 성능 최적화

### 프론트엔드
- **코드 분할** (Code Splitting)
- **지연 로딩** (Lazy Loading)
- **Service Worker** 캐싱
- **CDN** 정적 자원 배포

### 백엔드
- **Redis** 캐싱 시스템
- **MongoDB** 인덱스 최적화
- **API Rate Limiting**
- **압축** (Gzip/Brotli)

### 인프라
- **Nginx** 로드 밸런싱
- **Docker** 컨테이너 최적화
- **모니터링** 실시간 성능 추적

## 🚨 모니터링 & 알림

### 메트릭 수집
- **시스템 메트릭**: CPU, 메모리, 디스크
- **애플리케이션 메트릭**: 응답 시간, 에러율
- **비즈니스 메트릭**: 주문량, 결제 성공률

### 알림 규칙
- **Critical**: 서비스 다운, 높은 에러율
- **Warning**: 높은 리소스 사용률, 느린 응답
- **Info**: 정기적인 상태 리포트

## 🔄 백업 & 복원

### 자동 백업
```bash
# 매일 자동 백업 설정
crontab -e
0 2 * * * /path/to/backup.sh full
```

### 수동 백업
```bash
# 전체 백업
./scripts/backup.sh full

# 데이터베이스만 백업
./scripts/backup.sh db

# 파일만 백업
./scripts/backup.sh files
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원 & 문의

- **이메일**: support@marketgrow.co
- **홈페이지**: https://marketgrow.co
- **문서**: https://docs.marketgrow.co
- **이슈 리포트**: https://github.com/marketgrow/sns-marketing-site/issues

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🙏 감사의 말

- [Express.js](https://expressjs.com/) - 웹 프레임워크
- [MongoDB](https://www.mongodb.com/) - 데이터베이스
- [Docker](https://www.docker.com/) - 컨테이너화
- [Prometheus](https://prometheus.io/) - 모니터링
- [Grafana](https://grafana.com/) - 시각화

---

<div align="center">
  <strong>⭐ 이 프로젝트가 도움이 되셨다면 Star를 눌러주세요! ⭐</strong>
</div>