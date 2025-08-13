# 🚨 MongoDB Atlas 인증 문제 해결

## 현재 상황
- URI 형식: ✅ 올바름
- 클러스터 주소: ✅ cluster0.17qmchk.mongodb.net
- 문제: ❌ Authentication failed (bad auth)

## 즉시 해결 방법

### Option 1: 새 데이터베이스 사용자 생성 (권장)

1. **MongoDB Atlas 로그인**
   - https://cloud.mongodb.com
   - 구글 계정으로 로그인

2. **Security → Database Access**
   - **ADD NEW DATABASE USER** 클릭

3. **새 사용자 생성**
   - Authentication Method: **Password**
   - Username: `marketgrow`
   - Password: `MarketGrow2024` (특수문자 없이)
   - Database User Privileges: **Atlas Admin**
   - **Add User** 클릭

4. **새 연결 문자열 사용**
   ```
   MONGODB_URI=mongodb+srv://marketgrow:MarketGrow2024@cluster0.17qmchk.mongodb.net/marketgrow?retryWrites=true&w=majority&appName=Cluster0
   ```

### Option 2: 기존 사용자 비밀번호 재설정

1. **Security → Database Access**
2. `sbag9697` 사용자 찾기
3. **Edit** 클릭
4. **Edit Password** 클릭
5. 새 비밀번호: `MarketGrow2024` (특수문자 없이)
6. **Update User** 클릭

### Option 3: 제공된 연결 문자열 사용

MongoDB Atlas에서 제공한 기본 연결 문자열:
```
mongodb+srv://sbag9697:nUHawo7w3RKDqO8i@cluster0.17qmchk.mongodb.net/marketgrow?retryWrites=true&w=majority&appName=Cluster0
```

비밀번호가 `nUHawo7w3RKDqO8i`인 경우 이 문자열 사용

## .env 파일 업데이트

`backend/.env` 파일에서 MONGODB_URI 수정:

```env
# 새 사용자로 연결
MONGODB_URI=mongodb+srv://marketgrow:MarketGrow2024@cluster0.17qmchk.mongodb.net/marketgrow?retryWrites=true&w=majority&appName=Cluster0
```

## Railway 환경변수 업데이트

1. https://railway.app 로그인
2. **sns-marketing-site** 프로젝트
3. **backend** 서비스
4. **Variables** 탭
5. **MONGODB_URI** 수정
6. 자동 재배포 대기

## 테스트 명령어

```bash
cd backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Atlas 연결 성공!');
    mongoose.disconnect();
  })
  .catch(err => console.error('❌ 연결 실패:', err.message));
"
```

## IP 화이트리스트 확인

1. **Security → Network Access**
2. **0.0.0.0/0** (Allow from anywhere) 있는지 확인
3. 없으면 추가

## 성공 확인

Railway 로그에서:
```
MongoDB connected successfully
Database initialized with seed data
```

## 문제 지속 시

In-Memory MongoDB가 자동으로 실행되므로 서비스는 정상 작동합니다.
단, 데이터가 영구 저장되지 않습니다.