# 📦 배포 가이드

## 🚀 즉시 배포 가능한 플랫폼들

### 1. **GitHub Pages (무료 추천)**
```bash
# 1. GitHub 저장소 생성
git init
git add .
git commit -m "Initial commit - SNS Marketing Pro"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sns-marketing-pro.git
git push -u origin main

# 2. GitHub Pages 활성화
# GitHub → Settings → Pages → Source: Deploy from a branch → main
```
**배포 URL**: `https://YOUR_USERNAME.github.io/sns-marketing-pro/`

### 2. **Netlify (무료)**
```bash
# 방법 1: 드래그 앤 드롭
# 1. 프로젝트 폴더를 ZIP으로 압축
# 2. https://netlify.com → Sites → "Add new site" → "Deploy manually"
# 3. ZIP 파일 드래그 앤 드롭

# 방법 2: GitHub 연동
# 1. GitHub에 푸시 후
# 2. Netlify → "Add new site" → "Import from Git"
# 3. GitHub 저장소 선택
```

### 3. **Vercel (무료)**
```bash
# CLI 사용
npm install -g vercel
cd sns-marketing-site
vercel

# 또는 GitHub 연동
# 1. https://vercel.com → "Add New Project"
# 2. GitHub 저장소 연결
```

### 4. **Firebase Hosting (무료)**
```bash
# Firebase CLI 설치
npm install -g firebase-tools

# 프로젝트 초기화
firebase login
firebase init hosting

# 배포
firebase deploy
```

### 5. **일반 웹 호스팅**
모든 파일을 웹 서버의 `public_html` 또는 루트 디렉토리에 업로드

## ⚙️ 실서비스 전환 가이드

### 📋 필수 변경사항

#### 1. **토스페이먼츠 실서비스 전환**
```javascript
// payment.js 수정 필요
// 테스트 키 → 실제 키
this.clientKey = 'live_ck_YOUR_LIVE_CLIENT_KEY';
```

#### 2. **백엔드 API 서버 구축**
```javascript
// 필요한 API 엔드포인트
POST /api/payment/confirm    // 결제 승인 검증
POST /api/orders/create      // 주문 생성
GET  /api/orders/:id         // 주문 조회
POST /api/services/start     // 서비스 시작
```

#### 3. **데이터베이스 설정**
```sql
-- 사용자 테이블
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 주문 테이블
CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY,
    user_id INT,
    service_type VARCHAR(100),
    target_url TEXT,
    quantity INT,
    total_price INT,
    status ENUM('pending', 'processing', 'completed', 'failed'),
    payment_key VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 🛡️ 보안 설정

### 1. **환경 변수 설정**
```bash
# .env 파일 생성
TOSS_CLIENT_KEY=live_ck_YOUR_CLIENT_KEY
TOSS_SECRET_KEY=live_sk_YOUR_SECRET_KEY
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASS=your_database_password
```

### 2. **HTTPS 강제 설정**
```javascript
// 모든 페이지 상단에 추가
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    location.replace('https:' + window.location.href.substring(window.location.protocol.length));
}
```

### 3. **CSP (Content Security Policy) 설정**
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://js.tosspayments.com; 
               style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;">
```

## 📊 비즈니스 로직

### 💰 수익 모델
1. **서비스 판매 수익**: 각 서비스별 마진 설정
2. **패키지 할인**: 다중 서비스 구매시 할인 제공
3. **멤버십**: 월정액 구독 서비스
4. **파트너십**: 다른 마케팅 업체와의 협력

### 📈 확장 계획
1. **API 제공**: 다른 서비스에서 이용할 수 있는 API
2. **모바일 앱**: React Native/Flutter 앱 개발
3. **관리자 대시보드**: 주문 관리, 통계, 사용자 관리
4. **고객센터**: 실시간 채팅, 티켓 시스템

## 🎯 마케팅 전략

### 1. **SEO 최적화**
- 각 페이지별 메타 태그 최적화
- 구글 서치 콘솔 등록
- 사이트맵 생성 및 제출

### 2. **소셜미디어 마케팅**
- 인스타그램/틱톡 계정 운영
- 성공 사례 콘텐츠 제작
- 인플루언서 협업

### 3. **콘텐츠 마케팅**
- 블로그 섹션 활용
- SNS 마케팅 가이드 작성
- 무료 리소스 제공

## 📱 모니터링 설정

### 1. **구글 애널리틱스**
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 2. **결제 추적**
```javascript
// 결제 완료시 이벤트 전송
gtag('event', 'purchase', {
    transaction_id: orderData.id,
    value: orderData.totalPrice,
    currency: 'KRW'
});
```

## 🔧 유지보수

### 1. **정기 업데이트**
- 토스페이먼츠 SDK 업데이트
- 보안 패치 적용
- 새로운 서비스 추가

### 2. **백업 설정**
- 데이터베이스 자동 백업
- 코드 버전 관리
- 결제 데이터 보관

### 3. **성능 모니터링**
- 페이지 로딩 속도 측정
- 결제 성공률 추적
- 서버 리소스 모니터링

## 📞 고객 지원

### 1. **문의 채널**
- 이메일: support@socialmarketingpro.com
- 전화: 1588-1234
- 카카오톡: @socialmarketing
- 텔레그램: @socialmarketing_support

### 2. **FAQ 업데이트**
- 자주 묻는 질문 정리
- 문제 해결 가이드
- 서비스 이용 방법

---

## ✅ 배포 체크리스트

### 🚀 배포 전 확인사항
- [ ] 모든 링크 동작 확인
- [ ] 결제 테스트 완료
- [ ] 반응형 디자인 확인
- [ ] 브라우저 호환성 테스트
- [ ] 로딩 속도 최적화
- [ ] SEO 메타 태그 설정
- [ ] 에러 페이지 처리
- [ ] 보안 설정 완료

### 🔐 실서비스 전환 체크리스트
- [ ] 토스페이먼츠 실계정 전환
- [ ] 백엔드 API 구축
- [ ] 데이터베이스 설정
- [ ] HTTPS 인증서 설치
- [ ] 도메인 연결
- [ ] 모니터링 도구 설정
- [ ] 백업 시스템 구축
- [ ] 고객센터 준비

**🎉 현재 상태**: 즉시 배포 가능한 MVP 완성!