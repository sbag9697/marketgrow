# 관리자 대시보드 통합 가이드

## 📌 현재 구현 상태

### ✅ 완료된 항목
1. **관리자 대시보드 UI** - `/admin/` 경로에 구현
2. **백엔드 API** - 포트 5002에서 실행 중
3. **인증 시스템** - JWT 기반 로그인
4. **메인 사이트 연결** - Footer에 관리자 링크 추가

### 🔗 접속 경로
- **로컬**: http://localhost:5002/admin/
- **프로덕션**: https://marketgrow.kr/admin/
- **메인 사이트 Footer**: "관리자" 링크 클릭

## 🔧 실제 데이터 연결 방법

### 1. 데이터베이스 연결
```bash
# MongoDB Atlas 연결 (현재 설정됨)
MONGODB_URI=mongodb+srv://marketgrow:JXcmH4vNz26QKjEo@cluster0.c586sbu.mongodb.net/marketgrow
```

### 2. 관리자 계정 생성
```javascript
// 방법 1: API를 통한 생성
POST /api/auth/signup
{
  "username": "admin",
  "email": "admin@marketgrow.kr",
  "password": "SecurePassword123!",
  "name": "관리자",
  "phone": "01012345678"
}

// 방법 2: MongoDB에서 직접 role 변경
db.users.updateOne(
  { email: "admin@marketgrow.kr" },
  { $set: { role: "admin" } }
)
```

### 3. 실제 데이터 연동

#### 주문 데이터
- API: `GET /api/orders`
- 실시간 주문이 `orders` 컬렉션에 저장됨
- 대시보드에서 자동으로 표시

#### 사용자 데이터
- API: `GET /api/users`
- 회원가입한 사용자가 `users` 컬렉션에 저장됨
- 회원 등급, 포인트, 예치금 관리 가능

#### 서비스 데이터
- API: `GET /api/services`
- SNS 마케팅 서비스 목록
- 가격, 수량, 활성화 상태 관리

#### 예치금 관리
- API: `GET /api/deposits`
- 사용자 예치금 충전 요청
- 자동/수동 확인 가능

## 📊 대시보드 기능

### 메인 대시보드
- 실시간 통계 (매출, 주문, 사용자)
- 최근 주문 목록
- 30초마다 자동 새로고침

### 주문 관리
- 전체 주문 조회
- 주문 상태 변경 (대기/처리중/완료/취소)
- 주문 상세 보기
- 환불 처리

### 회원 관리
- 회원 목록 조회
- 회원 상태 관리 (활성/비활성)
- 포인트/예치금 조정
- 회원 등급 변경

### 서비스 관리
- 서비스 목록 관리
- 가격 수정
- 서비스 활성화/비활성화
- 신규 서비스 추가

### 예치금 관리
- 충전 요청 확인
- 수동 승인/거절
- 자동 확인 설정

### 쿠폰 관리
- 쿠폰 생성 (할인율/정액)
- 사용 제한 설정
- 만료일 관리

## 🚀 배포 체크리스트

### Railway/Render 배포 시
1. ✅ 환경변수 설정
   - `PORT=5000` (또는 자동 할당)
   - `NODE_ENV=production`
   - `MONGODB_URI` 설정
   - `JWT_SECRET` 설정

2. ✅ 정적 파일 제공
   - `/admin` 폴더가 Express에서 제공됨
   - `app.use('/admin', express.static(path.join(__dirname, '..', 'admin')))`

3. ✅ CORS 설정
   - 프론트엔드 도메인 허용
   - 관리자 대시보드 도메인 허용

### Netlify 배포 시 (프론트엔드)
1. ✅ 리다이렉트 설정
   ```toml
   # netlify.toml
   [[redirects]]
     from = "/admin/*"
     to = "/admin/index.html"
     status = 200
   ```

2. ✅ API URL 설정
   - `admin/js/admin.js`에서 API_URL 확인
   - 프로덕션 백엔드 URL로 설정

## 🔐 보안 설정

### 현재 적용된 보안
- JWT 인증 (8시간 만료)
- CORS 제한
- Rate Limiting
- Helmet.js
- 입력 검증 (express-validator)

### 추가 권장 사항
1. **2단계 인증** 구현
2. **IP 화이트리스트** 설정
3. **활동 로그** 기록
4. **정기 백업** 설정
5. **SSL 인증서** 적용 (프로덕션)

## 📱 모바일 대응
- 반응형 디자인 적용
- 768px 이하에서 사이드바 숨김
- 터치 친화적 버튼 크기

## 🐛 문제 해결

### 로그인이 안 될 때
1. MongoDB 연결 확인
2. JWT_SECRET 환경변수 확인
3. 사용자 role이 'admin'인지 확인

### 데이터가 표시되지 않을 때
1. API 엔드포인트 확인 (F12 → Network)
2. Authorization 헤더 확인
3. CORS 설정 확인

### 버튼이 작동하지 않을 때
1. 브라우저 콘솔 에러 확인
2. admin.js 파일 로드 확인
3. 캐시 지우고 새로고침 (Ctrl+Shift+R)

## 📞 지원
- 이메일: marketgrow.kr@gmail.com
- 전화: 010-5772-8658
- 운영시간: 평일 10:00-19:00

## 📝 업데이트 내역
- 2025.08.19: 초기 버전 구현
- 2025.08.19: 메인 사이트 연결
- 2025.08.19: 디버그 기능 추가