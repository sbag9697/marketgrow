# 관리자 대시보드 설정 가이드

## 🚀 빠른 시작

### 1. 관리자 계정 생성

#### 방법 1: 빠른 생성 (추천)
```bash
cd backend
npm run create-admin-quick
```
- 기본 계정 생성: `admin@marketgrow.kr` / `Admin123!@#`

#### 방법 2: 대화형 생성
```bash
cd backend
npm run create-admin
```
- 이메일, 비밀번호, 이름 등을 직접 입력

### 2. 테스트 데이터 생성 (선택사항)

실제 데이터를 보기 위한 샘플 데이터 생성:
```bash
cd backend
npm run seed-admin-data
```

기존 데이터 삭제 후 새로 생성:
```bash
npm run seed-admin-clean
```

### 3. 서버 시작

```bash
cd backend
npm install
npm start
```

### 4. 관리자 페이지 접속

- URL: `http://localhost:5000/admin/` (로컬)
- URL: `https://yourdomain.com/admin/` (프로덕션)
- 이메일: `admin@marketgrow.kr`
- 비밀번호: `Admin123!@#` (생성 시 설정한 비밀번호)

---

## 📊 대시보드 기능

### 실시간 통계
- **총 매출**: 완료된 주문의 총 금액
- **신규 주문**: 오늘 들어온 주문 수
- **활성 사용자**: 최근 24시간 내 활동한 사용자
- **처리 대기**: pending 상태의 주문

### 주요 메뉴

#### 1. 주문 관리
- 주문 목록 조회
- 주문 상태 변경 (처리/취소/환불)
- 주문 상세 정보 확인
- SMM 패널 자동 연동

#### 2. 회원 관리
- 회원 목록 및 검색
- 회원 등급 변경
- 포인트/예치금 조정
- 계정 활성화/비활성화

#### 3. 서비스 관리
- 서비스 목록 관리
- 가격 및 재고 조정
- 서비스 활성화/비활성화

#### 4. 예치금 관리
- 대기중인 입금 확인
- 입금 승인/취소
- 자동 입금 확인 (설정 시)

#### 5. 쿠폰 관리
- 쿠폰 생성/수정/삭제
- 사용 통계 확인
- 만료일 관리

#### 6. 활동 로그
- 시스템 로그 조회
- 보안 이벤트 확인
- 사용자 활동 추적

---

## 🔧 환경변수 설정

### 필수 설정 (.env)
```env
# 관리자 설정
ADMIN_EMAIL=admin@marketgrow.kr
SITE_NAME=MarketGrow

# 보안 설정
JWT_SECRET=your-very-strong-secret-key-here
COOKIE_SECRET=your-cookie-secret-key

# CORS 설정 (프로덕션)
ALLOWED_ORIGINS=https://marketgrow.kr,https://www.marketgrow.kr

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

---

## 📈 실제 데이터 확인

### 현재 통계 조회
```bash
# MongoDB 접속
mongo marketgrow

# 통계 확인
db.orders.countDocuments()                    # 총 주문 수
db.orders.countDocuments({status:"pending"})  # 대기중 주문
db.users.countDocuments()                     # 총 사용자
db.deposits.countDocuments({status:"pending"}) # 대기중 예치금
```

### API로 통계 확인
```bash
# 로그인
curl -X POST http://localhost:5000/api/admin-enhanced/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@marketgrow.kr","password":"Admin123!@#"}'

# 통계 조회 (토큰 사용)
curl http://localhost:5000/api/admin-enhanced/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🛠️ 문제 해결

### 로그인이 안 될 때
1. 관리자 계정 확인
```bash
npm run create-admin-quick
```

2. 권한 확인
```javascript
// MongoDB에서 직접 확인
db.users.findOne({email:"admin@marketgrow.kr"})
// role이 "admin"인지 확인
```

### 데이터가 안 보일 때
1. 테스트 데이터 생성
```bash
npm run seed-admin-data
```

2. API 연결 확인
```bash
curl http://localhost:5000/api/health
```

### CORS 오류
`.env` 파일에 추가:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
```

---

## 📊 실시간 데이터 모니터링

### WebSocket 연결 (자동)
- 입금 확인 시 실시간 알림
- 새 주문 알림
- 통계 자동 업데이트 (30초마다)

### 수동 새로고침
- 대시보드 우측 상단 "새로고침" 버튼 클릭

---

## 🔐 보안 권장사항

1. **비밀번호 변경**
```bash
npm run create-admin
# 새 비밀번호 입력
```

2. **IP 화이트리스트** (.env)
```env
ADMIN_WHITELIST_IPS=1.2.3.4,5.6.7.8
```

3. **2FA 활성화** (추후 구현 예정)

4. **감사 로그 확인**
- 관리자 페이지 > 활동 로그
- 의심스러운 활동 모니터링

---

## 📱 모바일 접속

관리자 페이지는 반응형으로 제작되어 모바일에서도 사용 가능합니다.
- 사이드바는 햄버거 메뉴로 변경
- 테이블은 스크롤 가능

---

## Railway 배포

### 환경변수 설정
Railway 대시보드에서 다음 변수 추가:
```
ADMIN_EMAIL=admin@marketgrow.kr
JWT_SECRET=your-production-secret
ALLOWED_ORIGINS=https://marketgrow-production.up.railway.app
```

### 관리자 계정 생성
Railway Shell에서:
```bash
npm run create-admin-quick
```

또는 로컬에서 Railway DB 연결:
```bash
MONGODB_URI=your-railway-mongodb-uri npm run create-admin
```

---

## 📞 지원

문제가 있으신가요?
- 이메일: support@marketgrow.kr
- 카카오톡: @marketgrow
- GitHub Issues: https://github.com/marketgrow/admin-dashboard

---

## 체크리스트

- [ ] 관리자 계정 생성 완료
- [ ] 환경변수 설정 완료
- [ ] 서버 시작 확인
- [ ] 관리자 페이지 접속 성공
- [ ] 실제 데이터 표시 확인
- [ ] 주문 처리 테스트
- [ ] 예치금 확인 테스트
- [ ] 로그 기록 확인