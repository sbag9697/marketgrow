# 🔧 MongoDB 환경 변수 설정 가이드

## 📌 즉시 실행 필요 사항

### 1. Railway MongoDB URI 확인
1. Railway 대시보드 접속
2. MongoDB 서비스 클릭
3. "Connect" 탭에서 MongoDB URI 복사

### 2. Netlify 환경 변수 설정

**Netlify 대시보드에서:**
```
Site settings → Environment variables → Add a variable
```

**필수 환경 변수:**
```env
# MongoDB 연결 (Railway에서 복사한 값)
MONGODB_URI=mongodb+srv://[username]:[password]@[cluster].mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=marketgrow

# JWT 시크릿 (32자 이상)
JWT_SECRET=your-user-secret-key-min-32-chars-here
JWT_SECRET_ADMIN=your-admin-secret-key-different-min-32-chars-here

# CORS 설정
ALLOWED_ORIGINS=https://marketgrow.kr,https://www.marketgrow.kr

# 환경
NODE_ENV=production
```

### 3. Railway 환경 변수 설정

**Railway 대시보드에서:**
```
서비스 선택 → Variables → Add Variable
```

**필수 환경 변수:**
```env
# MongoDB (자동 설정됨)
MONGODB_URI=[자동]
MONGODB_DB=marketgrow

# JWT (Netlify와 동일한 값 사용)
JWT_SECRET=your-user-secret-key-min-32-chars-here
JWT_SECRET_ADMIN=your-admin-secret-key-different-min-32-chars-here

# 포트 (Railway 자동 설정)
PORT=${{PORT}}

# 환경
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://marketgrow.kr,https://www.marketgrow.kr,https://marketgrow.netlify.app
```

### 4. 로컬 테스트용 .env 설정
```bash
# .env 파일 생성 (로컬 테스트용)
cat > .env << 'EOF'
# Railway MongoDB URI 복사
MONGODB_URI=mongodb+srv://[실제값입력]
MONGODB_DB=marketgrow

# JWT 시크릿
JWT_SECRET=dev-jwt-secret-for-testing-only-32chars
JWT_SECRET_ADMIN=dev-admin-secret-for-testing-only-32chars

# 포트
PORT=5002

# 환경
NODE_ENV=development
EOF
```

## ⚠️ 주의사항

1. **JWT 시크릿 생성 방법:**
   ```bash
   # 안전한 랜덤 시크릿 생성
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **MONGODB_URI 형식:**
   - Railway: `mongodb+srv://` 형식
   - 로컬: `mongodb://localhost:27017/` 형식

3. **환경 변수 우선순위:**
   - Netlify: Dashboard > netlify.toml > .env
   - Railway: Dashboard 설정이 최우선

## 🚀 다음 단계

1. **환경 변수 설정 확인:**
   ```bash
   # 로컬에서 테스트
   node scripts/test-mongodb-connection.js
   ```

2. **인덱스 생성:**
   ```bash
   node scripts/mongodb-indexes.js
   ```

3. **관리자 계정 생성:**
   ```bash
   node backend/utils/seed.js
   ```

4. **배포:**
   ```bash
   git add -A
   git commit -m "feat: MongoDB 단일화 완료"
   git push
   ```

## 📝 체크리스트

- [ ] Railway MongoDB URI 복사
- [ ] Netlify 환경 변수 설정
- [ ] Railway 환경 변수 설정
- [ ] 로컬 .env 파일 생성
- [ ] MongoDB 연결 테스트
- [ ] 인덱스 생성
- [ ] 관리자 계정 생성
- [ ] Git 푸시 및 배포

---
작성일: 2025-08-22