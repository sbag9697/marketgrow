# 🔒 JWT_SECRET 생성 및 설정 가이드

## 🚨 왜 중요한가?

JWT_SECRET은 사용자 인증 토큰을 암호화하는 비밀 키입니다.
- **기본값 사용 시**: 해커가 가짜 토큰을 만들어 관리자 권한 획득 가능
- **약한 키 사용 시**: 무차별 대입 공격에 취약
- **유출 시**: 모든 사용자 계정 접근 가능

## 🎲 Step 1: 강력한 JWT_SECRET 생성

### 방법 1: 온라인 생성기 (가장 쉬움)
1. https://www.grc.com/passwords.htm 접속
2. "63 random alpha-numeric characters" 섹션의 문자열 복사
3. 예시:
   ```
   xK9mN3pQ7rT5vY2wA4bC6dE8fG1hJ0kL3mN5oP7qR9sT2uV4wX6yZ8aB0cD2eF4g
   ```

### 방법 2: 터미널/CMD에서 생성
```bash
# Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})

# 또는 Node.js 사용
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 방법 3: 수동 생성 (권장하지 않음)
- 최소 32자 이상
- 대소문자, 숫자, 특수문자 혼합
- 예시: `MySuper$ecret2024!Key@MarketGrow#Hash$Value123`

## 🔧 Step 2: Railway에 JWT_SECRET 설정

### Railway 접속
1. https://railway.app 로그인
2. **sns-marketing-site** 프로젝트 선택
3. **backend** 서비스 클릭
4. **Variables** 탭 클릭

### JWT_SECRET 추가/수정
1. **New Variable** 클릭 (또는 기존 JWT_SECRET 수정)
2. 입력:
   ```
   Name: JWT_SECRET
   Value: [생성한 64자 문자열 붙여넣기]
   ```

### 추가 JWT 관련 설정
```bash
JWT_SECRET=xK9mN3pQ7rT5vY2wA4bC6dE8fG1hJ0kL3mN5oP7qR9sT2uV4wX6yZ8aB0cD2eF4g
JWT_EXPIRE=30d
JWT_REFRESH_SECRET=다른_64자_랜덤_문자열_생성해서_넣기
JWT_REFRESH_EXPIRE=90d
```

## ✅ Step 3: 설정 확인

### Railway 자동 재배포
- 환경변수 저장 시 자동으로 재배포 시작
- 2-3분 대기

### 로그 확인
Railway Logs에서:
```
✅ Server is running on port 5000
✅ JWT configured with secure secret
```

## 🔐 보안 체크리스트

### DO (해야 할 것)
- [x] 64자 이상의 랜덤 문자열 사용
- [x] 정기적으로 변경 (6개월마다)
- [x] Railway 환경변수로만 관리
- [x] JWT_REFRESH_SECRET도 다른 값으로 설정

### DON'T (하지 말아야 할 것)
- [ ] 코드에 직접 입력 ❌
- [ ] GitHub에 커밋 ❌
- [ ] 다른 프로젝트와 동일한 키 사용 ❌
- [ ] 단순한 문자열 사용 (예: "secret", "12345") ❌

## 📝 JWT_SECRET 예시

### ✅ 좋은 예시:
```
7f4a8d9b3c6e1f5a2d8b4c7e9f3a6d8b5c7e2f4a7d9b3c6e1f5a2d8b4c7e9f3a
Kx9$mN3#pQ7@rT5&vY2*wA4!bC6^dE8%fG1~hJ0+kL3=mN5
```

### ❌ 나쁜 예시:
```
mysecretkey
marketgrow2024
password123
your-super-secret-jwt-key-change-this-in-production
```

## 🔄 향후 JWT_SECRET 변경 시

1. 새로운 SECRET 생성
2. Railway 환경변수 업데이트
3. **주의**: 모든 사용자가 다시 로그인해야 함
4. 이전 토큰은 모두 무효화됨

## 💡 추가 보안 팁

### 1. 토큰 만료 시간 설정
```bash
JWT_EXPIRE=7d        # 일반 토큰: 7일
JWT_REFRESH_EXPIRE=30d  # 리프레시 토큰: 30일
```

### 2. 환경별 다른 SECRET 사용
- 개발: 테스트용 SECRET
- 프로덕션: 강력한 랜덤 SECRET

### 3. SECRET 로테이션 정책
- 6개월마다 변경
- 보안 사고 시 즉시 변경
- 변경 시 사용자 공지

## 🆘 문제 해결

### "Invalid token" 오류
- JWT_SECRET이 변경되었을 수 있음
- 사용자에게 재로그인 안내

### "Token expired" 오류
- 정상적인 만료
- JWT_EXPIRE 값 조정 고려

## 📋 최종 체크리스트

- [ ] 64자 이상의 강력한 SECRET 생성
- [ ] Railway 환경변수에 설정
- [ ] JWT_REFRESH_SECRET도 설정
- [ ] 재배포 완료 확인
- [ ] 로그인 테스트

---

**예상 소요시간**: 5분
**난이도**: ⭐☆☆☆☆ (매우 쉬움)
**중요도**: ⭐⭐⭐⭐⭐ (필수!)