# Render 환경 변수 업데이트 가이드

## 즉시 수정 필요한 환경 변수

Render 대시보드에서 다음 환경 변수를 추가/수정하세요:

### 1. MongoDB 직접 연결 설정
기존 `MONGODB_URI`를 다음으로 교체:
```
MONGODB_URI=mongodb://marketgrow:JXcmH4vNz26QKjEo@cluster0-shard-00-00.c586sbu.mongodb.net:27017,cluster0-shard-00-01.c586sbu.mongodb.net:27017,cluster0-shard-00-02.c586sbu.mongodb.net:27017/marketgrow?ssl=true&replicaSet=atlas-13qgzv-shard-0&authSource=admin&retryWrites=true&w=majority
```

### 2. SMM 서비스 임시 비활성화
```
SMM_ENABLED=false
```

### 3. Node 환경 설정
```
NODE_ENV=production
```

### 4. 프론트엔드 URL 수정
```
FRONTEND_URL=https://marketgrow-snsmarketing.netlify.app
API_BASE_URL=https://marketgrow.onrender.com
```

## 환경 변수 설정 방법

1. [Render Dashboard](https://dashboard.render.com) 접속
2. `marketgrow` 서비스 선택
3. `Environment` 탭 클릭
4. 위의 환경 변수들을 추가/수정
5. `Save Changes` 클릭
6. 서비스가 자동으로 재배포됨

## 변경 사항

1. **MongoDB 연결 개선**
   - DNS 조회 문제 해결을 위해 직접 호스트 연결 방식 사용
   - SRV 레코드 대신 각 샤드에 직접 연결

2. **Order Sync 비활성화**
   - MongoDB 연결 불안정으로 인한 타임아웃 방지
   - 연결 안정화 후 재활성화 예정

3. **에러 처리 개선**
   - DB 연결 실패 시에도 서버 계속 실행
   - Mongoose buffering 비활성화로 무한 대기 방지

## 확인 방법

환경 변수 적용 후:
1. Render Logs에서 MongoDB 연결 성공 메시지 확인
2. https://marketgrow.onrender.com/api/health 접속하여 상태 확인
3. 회원가입/로그인 테스트

## 문제 지속 시

MongoDB Atlas에서:
1. Network Access > IP Whitelist 확인
2. `0.0.0.0/0` (Allow from anywhere) 설정 확인
3. Database User 권한 확인 (readWriteAnyDatabase)