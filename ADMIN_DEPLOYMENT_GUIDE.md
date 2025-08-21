# 관리자 대시보드 배포 가이드

## 📌 현재 상황

### 로컬 개발 환경
- **경로**: `sns-marketing-site/admin/`
- **접속**: http://localhost:5002/admin/
- **파일 구조**:
  ```
  admin/
  ├── index.html          # 메인 HTML
  ├── css/
  │   └── admin-style.css # 스타일
  └── js/
      └── admin-core.js   # 실제 기능 구현
  ```

### 실제 사이트
- **URL**: https://marketgrow.kr/
- **기존 관리자 페이지**: /admin-dashboard.html (리다이렉트)
- **새 관리자 페이지**: /admin/

## 🚀 배포 방법

### 1. 파일 업로드
```bash
# admin 폴더 전체를 서버에 업로드
admin/
├── index.html
├── css/admin-style.css
└── js/admin-core.js
```

### 2. 백엔드 API 연동
```javascript
// admin-core.js의 API_URL 수정
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5002/api' 
    : 'https://marketgrow.kr/api';  // 실제 API 주소로 변경
```

### 3. 관리자 계정 설정
```sql
# MongoDB에서 관리자 role 설정
db.users.updateOne(
  { email: "admin@marketgrow.kr" },
  { $set: { role: "admin" } }
)
```

## ✅ 구현된 기능

### 1. 대시보드
- 실시간 통계 표시
- 매출, 주문, 사용자 현황
- 최근 주문 목록

### 2. 주문 관리
- 주문 목록 조회
- 주문 상태 변경 (완료/취소)
- 주문 상세 정보

### 3. 회원 관리
- ✅ **회원 추가** (모달 창)
- ✅ **회원 수정** (정보, 등급, 포인트 등)
- ✅ **회원 활성화/비활성화**
- 회원 목록 검색 및 필터

### 4. 서비스 관리
- ✅ **서비스 추가** (모달 창)
- 서비스 수정
- 서비스 활성화/비활성화
- 서비스 삭제

### 5. 예치금 관리
- 예치금 요청 목록
- 예치금 승인/거절
- 자동 확인 설정

### 6. 쿠폰 관리
- 쿠폰 생성
- 쿠폰 삭제
- 사용 현황 확인

## 🔐 보안 설정

### 필수 확인 사항
1. **JWT 인증** 구현됨
2. **관리자 role 체크** 구현됨
3. **HTTPS** 사용 필수
4. **CORS** 설정 확인

### 환경 변수 설정
```env
# .env 파일
JWT_SECRET=your-secret-key
ADMIN_EMAIL=admin@marketgrow.kr
ADMIN_PASSWORD=secure-password
```

## 📱 모바일 대응
- 반응형 디자인 적용
- 768px 이하에서 사이드바 토글
- 터치 친화적 UI

## 🐛 문제 해결

### API 연결 안 될 때
1. CORS 설정 확인
2. API URL 확인
3. JWT 토큰 확인

### 로그인 안 될 때
1. 사용자 role이 'admin'인지 확인
2. 비밀번호 확인
3. MongoDB 연결 확인

## 📞 테스트 계정

### 로컬 테스트
- 이메일: `newadmin@marketgrow.kr`
- 비밀번호: `Admin123!`

### 프로덕션 (설정 필요)
- 이메일: `admin@marketgrow.kr`
- 비밀번호: (설정한 비밀번호)
- **중요**: MongoDB에서 role을 'admin'으로 변경 필요

## 🎯 다음 단계

1. **백엔드 배포**
   - Railway/Render에 백엔드 배포
   - MongoDB Atlas 연결
   - 환경 변수 설정

2. **프론트엔드 배포**
   - admin 폴더 업로드
   - API URL 수정
   - 테스트

3. **실제 데이터 마이그레이션**
   - 기존 데이터 백업
   - 새 스키마로 마이그레이션
   - 데이터 검증

## 📅 업데이트 내역
- 2025.08.20: 관리자 대시보드 전체 기능 구현
- 회원 추가/수정 기능 완성
- 서비스 관리 기능 완성
- 실시간 데이터 연동