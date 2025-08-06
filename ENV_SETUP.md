# 🔐 환경 변수 설정 가이드

## 필수 환경 변수 설정

### 1. Netlify 대시보드에서 설정
`https://app.netlify.com/projects/sns-marketing-pro/settings/deploys#environment-variables`

```bash
# 데이터베이스 (자동 설정됨)
NETLIFY_DATABASE_URL=postgresql://...
NETLIFY_DATABASE_URL_UNPOOLED=postgresql://...

# JWT 보안 키 (필수)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# 토스페이먼츠 (필수)
TOSSPAYMENTS_CLIENT_KEY=live_ck_YOUR_LIVE_CLIENT_KEY
TOSSPAYMENTS_SECRET_KEY=live_sk_YOUR_LIVE_SECRET_KEY

# SMMTurk API 연동 (필수)
SMMTURK_API_KEY=your_smmturk_api_key_here

# 카카오톡 상담 (옵션)
KAKAO_API_KEY=your_kakao_api_key
KAKAO_SENDER_KEY=your_kakao_sender_key
KAKAO_COUNSELOR_ID=your_counselor_id

# 관리자 연락처 (알림용)
ADMIN_PHONE=01012345678
ADMIN_EMAIL=admin@socialmarketingpro.com
```

### 2. 환경 변수 설정 방법

#### Netlify CLI 사용:
```bash
# 개발 환경
netlify env:set JWT_SECRET "your-super-secret-jwt-key-here"
netlify env:set TOSSPAYMENTS_CLIENT_KEY "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoqy"

# 프로덕션 환경 
netlify env:set JWT_SECRET "your-super-secret-jwt-key-here" --context production
netlify env:set TOSSPAYMENTS_CLIENT_KEY "live_ck_YOUR_LIVE_KEY" --context production
```

#### 웹 대시보드 사용:
1. Netlify 대시보드 → 프로젝트 → Settings → Environment variables
2. "Add a variable" 클릭하여 각 변수 추가

### 3. 카카오톡 상담 설정

#### 카카오톡 비즈니스 API 신청:
1. https://business.kakao.com 접속
2. 카카오톡 상담톡 서비스 신청
3. API 키 발급 받기

#### 설정값:
```bash
KAKAO_API_KEY=발급받은_API_키
KAKAO_SENDER_KEY=발급받은_발신프로필_키
KAKAO_COUNSELOR_ID=상담원_ID
```

### 4. 토스페이먼츠 실계정 전환

#### 테스트 → 실계정 변경:
```bash
# 기존 (테스트)
TOSSPAYMENTS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoqy

# 실계정으로 변경
TOSSPAYMENTS_CLIENT_KEY=live_ck_YOUR_LIVE_CLIENT_KEY
TOSSPAYMENTS_SECRET_KEY=live_sk_YOUR_LIVE_SECRET_KEY
```

### 5. JWT 보안 키 생성

#### 강력한 JWT 시크릿 생성:
```bash
# Node.js 사용
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 또는 온라인 생성기 사용
# https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
```

## 배포 전 체크리스트

### ✅ 확인사항:
- [ ] JWT_SECRET 설정 완료
- [ ] 토스페이먼츠 키 설정 완료  
- [ ] 데이터베이스 연결 확인
- [ ] 카카오톡 API 설정 (옵션)
- [ ] 환경별 변수 구분 설정

### 🔒 보안 주의사항:
1. **JWT_SECRET**: 절대 노출되면 안되는 키
2. **토스페이먼츠 키**: 실계정 키는 극비 관리
3. **데이터베이스 URL**: 외부 노출 금지
4. **API 키들**: GitHub 등에 커밋 금지

## 데이터베이스 스키마 적용

### 1. 데이터베이스 스키마 실행:
```bash
# Neon Console에서 직접 실행하거나
# netlify dev 환경에서 스키마 파일 실행
```

### 2. 초기 관리자 계정:
```
사용자명: admin
이메일: admin@socialmarketingpro.com  
비밀번호: admin123! (즉시 변경 필요)
```

## 🚀 배포 명령어

### 전체 배포:
```bash
# 의존성 설치
npm install

# 배포
netlify deploy --prod

# 함수 배포 확인
netlify functions:list
```

### 환경 변수 확인:
```bash
netlify env:list
```

---

**⚠️ 중요**: 실서비스 운영 전 모든 테스트 키를 실제 키로 교체하고, 관리자 계정 비밀번호를 변경하세요!