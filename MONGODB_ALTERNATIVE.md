# MongoDB 대체 솔루션

## 현재 문제
- MongoDB Atlas DNS 조회 실패 (Render 환경)
- IP 화이트리스트는 이미 0.0.0.0/0으로 설정됨
- 직접 연결도 DNS 문제로 실패

## 해결 방법

### 옵션 1: MongoDB Atlas 연결 문자열 재생성
1. MongoDB Atlas 대시보드 접속
2. `Connect` 버튼 클릭
3. `Connect your application` 선택
4. Driver: Node.js, Version: 4.1 or later 선택
5. 연결 문자열 복사
6. Render 환경 변수에서 `MONGODB_URI` 업데이트

### 옵션 2: Railway MongoDB 사용 (무료)
1. [Railway](https://railway.app) 가입/로그인
2. New Project → Deploy MongoDB
3. MongoDB 배포 후 Variables 탭에서 `MONGO_URL` 복사
4. Render에서 `MONGODB_URI` 환경 변수를 Railway URL로 변경

### 옵션 3: Neon PostgreSQL 사용 (무료, 추천)
MongoDB 대신 PostgreSQL 사용:
1. [Neon](https://neon.tech) 가입
2. 새 프로젝트 생성
3. 연결 문자열 복사
4. 백엔드 코드를 PostgreSQL용으로 수정 필요

### 옵션 4: 임시 해결책 - 로컬 테스트 모드
Render 환경 변수에 추가:
```
USE_TEST_MODE=true
MONGODB_URI=test
```

백엔드가 메모리 DB로 실행되도록 설정

## 즉시 적용 가능한 해결책

### Render 환경 변수 수정:
1. Render 대시보드 → Environment 탭
2. `MONGODB_URI` 값을 다음 중 하나로 변경:

#### A. MongoDB Atlas 재시도 (다른 리전)
```
MONGODB_URI=mongodb+srv://marketgrow:JXcmH4vNz26QKjEo@cluster0.c586sbu.mongodb.net/marketgrow?retryWrites=true&w=majority
```

#### B. 테스트 모드 활성화
```
MONGODB_URI=localhost
USE_TEST_MODE=true
```

3. Save Changes 클릭
4. 자동 재배포 대기

## 권장사항
현재 Render의 무료 플랜에서는 MongoDB Atlas 연결이 불안정할 수 있습니다. 
Railway의 MongoDB 또는 Neon PostgreSQL 사용을 권장합니다.