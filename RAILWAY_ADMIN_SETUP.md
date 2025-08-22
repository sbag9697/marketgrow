# 🔐 Railway 관리자 계정 설정 가이드

## 📋 필수 환경 변수 설정

Railway 대시보드에서 다음 환경 변수를 추가하세요:

### 1. Railway 대시보드 접속
1. https://railway.app 로그인
2. `marketgrow-production` 프로젝트 선택
3. Backend 서비스 클릭
4. Settings → Variables 탭으로 이동

### 2. 관리자 계정 환경 변수 추가

```env
# 관리자 계정 설정
ADMIN_EMAIL=admin@marketgrow.kr
ADMIN_PASSWORD=Admin123!@#

# 기존 필수 환경 변수 (이미 설정되어 있어야 함)
JWT_SECRET=your-secret-key-here
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
PORT=5002
```

### 3. 환경 변수 추가 방법
1. Variables 탭에서 `+ New Variable` 클릭
2. 각 변수 추가:
   - Name: `ADMIN_EMAIL`
   - Value: `admin@marketgrow.kr`
   - Add 클릭
3. 같은 방법으로 `ADMIN_PASSWORD` 추가
4. 모든 변수 추가 후 자동으로 재배포됨

## 🚀 서버 재시작 후 확인

### 1. 자동 생성 확인
Railway 로그에서 다음 메시지 확인:
```
Admin user created successfully: admin@marketgrow.kr
Admin password: Admin123!@#
```

또는

```
Existing user upgraded to admin: admin@marketgrow.kr
```

### 2. 관리자 페이지 접속 테스트

#### 실제 사이트
- URL: https://marketgrow.kr/admin-standalone.html
- 이메일: admin@marketgrow.kr
- 비밀번호: Admin123!@#

## 📝 추가 관리자 계정 생성

여러 관리자가 필요한 경우:

### 방법 1: MongoDB Atlas에서 직접 수정
1. MongoDB Atlas 접속
2. Collections → users 컬렉션
3. 원하는 사용자 찾기
4. role을 "admin"으로 변경
5. membershipLevel을 "diamond"로 변경

### 방법 2: Railway 콘솔에서 스크립트 실행
```javascript
// Railway Shell에서 실행
db.users.updateOne(
  { email: "새관리자@email.com" },
  { 
    $set: { 
      role: "admin",
      membershipLevel: "diamond",
      isEmailVerified: true,
      isPhoneVerified: true
    }
  }
)
```

## ✅ 관리자 권한 확인

관리자로 로그인 후 다음 기능들이 작동하는지 확인:

1. **대시보드**: 통계 데이터 표시
2. **주문 관리**: 주문 목록 조회 및 상태 변경
3. **회원 관리**: 회원 목록 조회 및 수정
4. **서비스 관리**: 서비스 추가/수정/삭제
5. **예치금 관리**: 예치금 승인/거절

## 🔒 보안 권장사항

1. **강력한 비밀번호 사용**
   - 최소 12자 이상
   - 대소문자, 숫자, 특수문자 포함
   - 예: `MarketGrow#2025@Admin!`

2. **정기적인 비밀번호 변경**
   - 3개월마다 변경 권장
   - 이전 비밀번호 재사용 금지

3. **접속 IP 제한** (선택사항)
   - Railway 네트워크 설정에서 IP 화이트리스트 설정

## 🐛 문제 해결

### "서버 연결 실패" 오류
1. Railway 서버 상태 확인
2. MongoDB 연결 상태 확인
3. CORS 설정 확인

### "권한이 없습니다" 오류
1. 사용자 role이 "admin"인지 확인
2. JWT 토큰이 유효한지 확인
3. 브라우저 캐시/쿠키 삭제 후 재로그인

### 로그인이 안 되는 경우
1. 이메일/비밀번호 확인
2. 대소문자 구분 확인
3. Railway 로그에서 오류 메시지 확인

## 📞 지원

문제가 지속되면:
1. Railway 로그 확인
2. MongoDB Atlas 연결 상태 확인
3. 환경 변수 설정 재확인

---
작성일: 2025-08-22
버전: 1.0