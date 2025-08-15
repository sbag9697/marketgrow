# MarketGrow 시스템 상태 및 접속 가이드

## 🚀 현재 시스템 상태

### ✅ 백엔드 서버
- **상태**: 정상 작동 중
- **포트**: 5001
- **URL**: http://localhost:5001
- **API Base URL**: http://localhost:5001/api
- **데이터베이스**: 인메모리 MongoDB (임시)

### ✅ 프론트엔드 서버
- **상태**: HTTP 서버로 실행 중
- **포트**: 8080
- **URL**: http://localhost:8080

## 📋 완료된 작업

1. **프로젝트 구조 분석** ✅
   - 전체 파일 구조 파악 완료
   - 주요 컴포넌트 확인

2. **API 설정 통일** ✅
   - global-config.js 생성
   - 모든 HTML 파일의 API 설정 통일
   - JS 파일들의 API URL 수정

3. **백엔드 서버** ✅
   - Express 서버 정상 작동
   - 모든 API 엔드포인트 활성화
   - CORS 설정 완료

4. **데이터베이스** ✅
   - MongoDB Atlas 연결 실패 시 인메모리 DB 자동 전환
   - 샘플 데이터 자동 생성
   - 관리자 계정 생성 완료

5. **인증 시스템** ✅
   - 회원가입 API 정상 작동
   - 로그인 API 정상 작동
   - JWT 토큰 발급 정상

6. **서비스 관리** ✅
   - 서비스 목록 API 정상
   - 8개 기본 서비스 등록됨

## 🌐 주요 페이지 접속 URL

### 일반 사용자 페이지
- **홈페이지**: http://localhost:8080/index.html
- **회원가입**: http://localhost:8080/signup.html
- **로그인**: http://localhost:8080/login.html
- **서비스 목록**: http://localhost:8080/services.html
- **대시보드**: http://localhost:8080/dashboard.html
- **주문하기**: http://localhost:8080/order.html
- **결제**: http://localhost:8080/payment.html

### 관리자 페이지
- **관리자 로그인**: http://localhost:8080/admin-login.html
- **관리자 대시보드**: http://localhost:8080/admin-dashboard.html

## 🔑 테스트 계정

### 일반 사용자
- **아이디**: newuser
- **이메일**: newuser@example.com
- **비밀번호**: password123

### 관리자
- **이메일**: admin@marketgrow.com
- **비밀번호**: admin123!@#

## 📝 API 테스트 명령어

### 회원가입 테스트
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser2","name":"Test User 2","email":"test2@example.com","password":"password123","phone":"01011112222"}'
```

### 로그인 테스트
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"newuser@example.com","password":"password123"}'
```

### 서비스 목록 조회
```bash
curl http://localhost:5001/api/services
```

## ⚠️ 알려진 이슈

1. **MongoDB Atlas 연결 실패**
   - 현재 인메모리 DB 사용 중
   - 서버 재시작 시 데이터 초기화됨

2. **소셜 로그인**
   - OAuth 리다이렉트 URL 설정 필요
   - 로컬 환경에서는 제한적 작동

3. **결제 시스템**
   - 테스트 모드로만 작동
   - 실제 결제는 불가능

## 🛠️ 문제 해결

### 포트 충돌 시
```bash
# 5001 포트 사용 중인 프로세스 확인
netstat -an | findstr :5001

# 8080 포트 사용 중인 프로세스 확인
netstat -an | findstr :8080
```

### 서버 재시작
```bash
# 백엔드 서버 재시작
cd sns-marketing-site/backend
npm start

# 프론트엔드 서버 재시작
cd sns-marketing-site
python -m http.server 8080
```

## 📞 지원

문제 발생 시 다음 정보와 함께 문의:
- 브라우저 콘솔 에러 메시지
- 네트워크 탭 실패 요청 정보
- 백엔드 서버 로그

---
*최종 업데이트: 2025-08-15*