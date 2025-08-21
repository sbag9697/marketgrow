# 🚀 관리자 대시보드 즉시 배포 가이드

## 📦 배포할 파일들

### 1. admin 폴더 구조
```
sns-marketing-site/
├── admin/                    # 이 폴더 전체를 업로드
│   ├── index.html           # 관리자 대시보드 메인
│   ├── css/
│   │   └── admin-style.css  # 스타일시트
│   └── js/
│       └── admin-core.js    # 기능 구현 (API URL 수정됨)
```

## 🔧 즉시 배포 단계

### 1단계: 파일 확인
```bash
# 현재 위치: C:\Users\박시현\sns-marketing-site

# admin 폴더 확인
dir admin
```

### 2단계: Git에 커밋 및 푸시
```bash
# Git 상태 확인
git status

# admin 폴더 추가
git add admin/
git add ADMIN_DEPLOYMENT_GUIDE.md

# 커밋
git commit -m "feat: 관리자 대시보드 전체 기능 구현 - 회원/서비스/주문 관리"

# 푸시 (main 브랜치로)
git push origin main
```

### 3단계: 자동 배포 확인
- Netlify/Vercel/Railway 등에서 자동 배포되는지 확인
- 보통 2-3분 내 배포 완료

## ✅ 구현된 기능들

### 관리자 대시보드 주요 기능
1. **회원 관리**
   - ✅ 회원 추가 (모달창)
   - ✅ 회원 정보 수정
   - ✅ 회원 등급 변경
   - ✅ 포인트/예치금 조정

2. **서비스 관리**
   - ✅ 서비스 추가 (모달창)
   - ✅ 서비스 가격 수정
   - ✅ 서비스 활성화/비활성화
   - ✅ 서비스 삭제

3. **주문 관리**
   - ✅ 주문 상태 변경
   - ✅ 주문 목록 조회
   - ✅ 주문 완료/취소 처리

4. **예치금 관리**
   - ✅ 예치금 승인/거절
   - ✅ 예치금 요청 목록

5. **대시보드**
   - ✅ 실시간 통계
   - ✅ 최근 주문 표시
   - ✅ 자동 새로고침

## 🔐 관리자 계정 설정

### Railway 백엔드에서 관리자 생성
1. Railway 대시보드 접속
2. MongoDB 연결
3. 관리자 계정 생성:
```javascript
// MongoDB Shell에서 실행
db.users.updateOne(
  { email: "admin@marketgrow.kr" },
  { $set: { 
      role: "admin",
      isEmailVerified: true,
      isPhoneVerified: true 
  }}
)
```

### 또는 API로 생성
```bash
# 1. 일반 회원가입
POST https://marketgrow-production-c586.up.railway.app/api/auth/signup
{
  "username": "admin",
  "email": "admin@marketgrow.kr",
  "password": "SecurePassword123!",
  "name": "관리자",
  "phone": "01012345678"
}

# 2. MongoDB에서 role만 admin으로 변경
```

## 🌐 접속 정보

### 배포 후 접속
- **URL**: https://marketgrow.kr/admin/
- **계정**: admin@marketgrow.kr
- **비밀번호**: (설정한 비밀번호)

### 테스트 확인사항
1. ✅ 로그인 가능 여부
2. ✅ 회원 목록 표시
3. ✅ 서비스 추가 기능
4. ✅ 주문 상태 변경
5. ✅ 통계 데이터 표시

## ⚠️ 중요 사항

### API 연결
- 현재 Railway 서버 주소로 설정됨
- `https://marketgrow-production-c586.up.railway.app/api`

### CORS 설정
- 백엔드에서 marketgrow.kr 도메인 허용 필요
- 이미 설정되어 있을 것으로 예상

### 보안
- HTTPS 필수
- JWT 토큰 기반 인증
- 관리자 role 체크

## 📱 모바일 지원
- 완전 반응형 디자인
- 모바일에서도 모든 기능 사용 가능

## 🎉 배포 완료 후
1. https://marketgrow.kr/admin/ 접속
2. 관리자 계정으로 로그인
3. 모든 기능 테스트
4. 실제 운영 시작!

---
배포 준비 완료! Git push만 하면 자동 배포됩니다.