# 🔥 MongoDB Atlas 긴급 설정 가이드

## 현재 문제
Railway 로그에서 MongoDB 연결 실패:
```
querySrv ENOTFOUND _mongodb._tcp.cluster0.ot3kp.mongodb.net
```

## 즉시 해결 방법

### Step 1: MongoDB Atlas 로그인
1. https://cloud.mongodb.com 접속
2. 구글 계정으로 로그인

### Step 2: 정확한 연결 문자열 가져오기
1. **Database** 메뉴 클릭
2. 클러스터의 **Connect** 버튼 클릭
3. **Connect your application** 선택
4. **Node.js** 선택, Version **4.1 or later**
5. Connection String 복사

정확한 형식:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

### Step 3: Railway 환경변수 설정
1. https://railway.app 로그인
2. **sns-marketing-site** 프로젝트 선택
3. **backend** 서비스 클릭
4. **Variables** 탭 클릭
5. **MONGODB_URI** 변수 찾기
6. 값을 다음과 같이 수정:

```
mongodb+srv://실제유저명:실제비밀번호@실제클러스터주소/marketgrow?retryWrites=true&w=majority&appName=Cluster0
```

⚠️ **중요 체크포인트:**
- `cluster0.ot3kp` → 실제 클러스터 주소로 변경
- 비밀번호에 특수문자 있으면 URL 인코딩 필요
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
- 끝에 `/marketgrow` 데이터베이스 이름 추가

### Step 4: IP 화이트리스트 확인
1. MongoDB Atlas → **Network Access**
2. **0.0.0.0/0** (Allow from anywhere) 있는지 확인
3. 없으면 **Add IP Address** → **Allow Access from Anywhere**

### Step 5: 재배포
1. Railway에서 **Deploy** 클릭
2. 로그 확인:
   - ✅ 성공: `MongoDB connected successfully`
   - ❌ 실패: `In-memory MongoDB connected successfully`

## 예시 (실제 값으로 교체)

잘못된 예:
```
mongodb+srv://cluster0.ot3kp.mongodb.net
```

올바른 예:
```
mongodb+srv://marketgrow:MyP@ssw0rd@cluster0.abcde.mongodb.net/marketgrow?retryWrites=true&w=majority&appName=Cluster0
```

## 디버깅 명령어

Railway Shell에서 테스트:
```bash
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ 연결 실패:', err.message));
"
```

## 여전히 안 되면?

1. MongoDB Atlas에서 새 사용자 생성:
   - Username: `marketgrow`
   - Password: 간단한 비밀번호 (특수문자 없이)
   - Role: **Atlas Admin**

2. 새 연결 문자열로 재시도

3. 그래도 안 되면 In-Memory DB 계속 사용 (데이터는 임시 저장)