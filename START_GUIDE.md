# 🚀 MarketGrow 실행 가이드

## 📋 필수 준비사항

1. **Node.js 설치** (아직 안했다면)
   - https://nodejs.org 에서 다운로드
   - LTS 버전 추천

2. **MongoDB 설정** (택 1)
   - 로컬 설치: https://www.mongodb.com/try/download/community
   - MongoDB Atlas (추천): https://www.mongodb.com/cloud/atlas

3. **Python 설치** (프론트엔드 서버용)
   - https://www.python.org 에서 다운로드

## 🎯 실행 순서

### 1️⃣ MongoDB 실행 (로컬 설치한 경우)
```bash
# Windows 서비스로 실행
net start MongoDB

# 또는 직접 실행
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
```

### 2️⃣ 백엔드 서버 실행
```bash
# 방법 1: 배치 파일 실행
backend\start-backend.bat

# 방법 2: 수동 실행
cd backend
npm install
npm start
```

### 3️⃣ 프론트엔드 서버 실행
```bash
# 방법 1: 배치 파일 실행
start-frontend.bat

# 방법 2: 수동 실행
python -m http.server 3000
```

## 🌐 접속 정보

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:5000
- **관리자 계정**:
  - ID: admin@marketgrow.com
  - PW: admin123!@#

## ⚡ 빠른 시작

1. 터미널/명령 프롬프트 2개 열기
2. 첫 번째 터미널: `backend\start-backend.bat` 실행
3. 두 번째 터미널: `start-frontend.bat` 실행
4. 브라우저에서 http://localhost:3000 접속

## 🔍 문제 해결

### MongoDB 연결 오류
- MongoDB가 실행 중인지 확인
- `.env` 파일의 `MONGODB_URI` 확인
- 방화벽 설정 확인

### 포트 충돌
- 5000번 포트 사용 중: `.env`에서 `PORT` 변경
- 3000번 포트 사용 중: `start-frontend.bat`에서 포트 변경

### npm 오류
- Node.js가 설치되어 있는지 확인
- `npm cache clean --force` 실행 후 재시도

## 📱 모바일 테스트

같은 네트워크에서 모바일 접속:
1. PC의 IP 주소 확인: `ipconfig`
2. 모바일에서 `http://[PC-IP]:3000` 접속

## 🚀 다음 단계

1. **토스페이먼츠 실제 키 발급**
   - https://developers.tosspayments.com
   - `.env` 파일에 실제 키 입력

2. **도메인 연결**
   - 도메인 구매
   - 호스팅 서비스 설정
   - SSL 인증서 적용

3. **실제 서비스 API 연동**
   - SMM 패널 API 계약
   - 자동화 시스템 구축