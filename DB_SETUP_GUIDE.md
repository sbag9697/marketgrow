# 🗄️ MarketGrow 데이터베이스 설정 가이드

## 현재 DB 상태
- ✅ **In-Memory MongoDB** 자동 실행 (기본값)
- ⚠️ 서버 재시작 시 데이터 초기화됨
- 💡 프로덕션용 MongoDB 설정 권장

## Option 1: MongoDB Atlas 사용 (무료, 권장) 

### Step 1: MongoDB Atlas 가입
1. https://www.mongodb.com/cloud/atlas 접속
2. **"Try Free"** 클릭
3. Google 계정으로 가입

### Step 2: 클러스터 생성
1. **"Build a Database"** 클릭
2. **FREE** 플랜 선택 (M0 Sandbox)
3. Provider: **AWS**
4. Region: **Seoul (ap-northeast-2)** 선택
5. Cluster Name: `marketgrow-cluster`
6. **"Create"** 클릭

### Step 3: 데이터베이스 접속 설정
1. **Security** → **Database Access**
2. **"Add New Database User"**
   - Username: `marketgrow`
   - Password: (강한 비밀번호 생성)
   - User Privileges: **Atlas Admin**
3. **"Add User"** 클릭

### Step 4: 네트워크 접속 허용
1. **Security** → **Network Access**
2. **"Add IP Address"**
3. **"Allow Access from Anywhere"** 클릭 (0.0.0.0/0)
4. **"Confirm"** 클릭

### Step 5: 연결 문자열 가져오기
1. **Database** → **Connect** 클릭
2. **"Connect your application"** 선택
3. Driver: **Node.js**, Version: **4.1 or later**
4. Connection String 복사:
```
mongodb+srv://marketgrow:<password>@marketgrow-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Step 6: Railway 환경변수 설정
1. Railway 대시보드 → **Variables**
2. 추가:
```
MONGODB_URI=mongodb+srv://marketgrow:비밀번호@marketgrow-cluster.xxxxx.mongodb.net/marketgrow?retryWrites=true&w=majority
```
⚠️ `<password>`를 실제 비밀번호로 교체
⚠️ 끝에 `/marketgrow` 데이터베이스 이름 추가

---

## Option 2: Railway MongoDB 플러그인 사용

### Step 1: Railway 대시보드
1. 프로젝트 선택
2. **"New"** → **"Database"** → **"MongoDB"**
3. MongoDB 플러그인 추가

### Step 2: 연결 정보 확인
1. MongoDB 플러그인 클릭
2. **Connect** 탭
3. `MONGO_URL` 복사

### Step 3: 백엔드 서비스 연결
1. 백엔드 서비스 선택
2. **Variables** 탭
3. 추가:
```
MONGODB_URI=${{MongoDB.MONGO_URL}}
```

---

## Option 3: In-Memory DB 계속 사용 (개발용)

### 현재 상태
- 별도 설정 불필요
- 서버 시작 시 자동으로 In-Memory MongoDB 실행
- ⚠️ **주의**: 서버 재시작 시 모든 데이터 삭제됨

### 장점
- 설정 불필요
- 빠른 성능
- 테스트에 적합

### 단점
- 데이터 영구 저장 불가
- 프로덕션 사용 불가

---

## 🔍 DB 연결 상태 확인

### Railway 로그 확인
```
MongoDB connected successfully  // 클라우드 DB 연결 성공
또는
In-memory MongoDB connected successfully  // In-memory DB 사용 중
```

### API 헬스체크
```
https://marketgrow-production-c586.up.railway.app/api/health
```

응답:
```json
{
  "status": "OK",
  "mongodb": "Connected",  // DB 연결 상태
  "environment": "production"
}
```

---

## 📝 Railway 환경변수 체크리스트

필수:
```
NODE_ENV=production
JWT_SECRET=(32자 이상 랜덤 문자열)
JWT_EXPIRE=30d
```

선택 (MongoDB Atlas 사용 시):
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/marketgrow
```

OAuth:
```
GOOGLE_CLIENT_ID=1020058007586-n4h8saihm59tjehs90sv00u5efuu00uo.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=(구글 시크릿)
KAKAO_CLIENT_ID=a7b2ddf2636cdeb3faff0517c5ec6591
```

이메일:
```
EMAIL_USER=marketgrow.kr@gmail.com
EMAIL_PASS=(Gmail 앱 비밀번호)
```

SMS:
```
COOLSMS_API_KEY=NCSN4FS4EFQSCSA1
COOLSMS_API_SECRET=(시크릿)
COOLSMS_SENDER=01057728658
```

---

## 🚀 권장 사항

1. **개발/테스트**: In-Memory DB 사용 (현재 상태)
2. **프로덕션**: MongoDB Atlas 무료 플랜 사용
3. **대규모**: MongoDB Atlas 유료 플랜 또는 자체 서버

---

## ❓ 문제 해결

### "MongoDB connection error" 로그
- MONGODB_URI가 잘못됨
- 자동으로 In-Memory DB로 전환됨
- 데이터는 임시 저장됨

### 회원가입 후 데이터가 사라짐
- In-Memory DB 사용 중
- MongoDB Atlas 설정 필요

### Railway 재배포 시 데이터 초기화
- 영구 DB 설정 필요
- MongoDB Atlas 권장