# 🚨 긴급: DB 통합 및 보안 설정 가이드

## ⚠️ 현재 문제점
- **Netlify Functions**: PostgreSQL (Neon) 사용 중
- **Railway Backend**: MongoDB 사용 중
- **문제**: 관리자 계정이 DB별로 다르게 저장되어 충돌 발생

## ✅ 해결 방안: PostgreSQL로 통합

### 1. 즉시 실행 (5분)

#### A. 비밀번호 로그 제거 확인
```bash
# 이미 제거됨 - backend/utils/seed.js 46번 라인
# console.log('Admin password:', ...) 삭제 완료
```

#### B. PostgreSQL 관리자 생성
```bash
# Netlify 또는 Railway에서 실행
npm run seed:postgres

# 또는 직접 실행
node backend/utils/seed.pg.js
```

### 2. 환경 변수 설정 (Railway & Netlify)

#### 필수 환경 변수
```env
# PostgreSQL 연결 (Neon)
DATABASE_URL=postgresql://user:pass@host/dbname
POSTGRES_URL=postgresql://user:pass@host/dbname  # 백업

# 관리자 계정
ADMIN_EMAIL=admin@marketgrow.kr
ADMIN_PASSWORD=[강력한 비밀번호 16자 이상]

# JWT 보안 (별도 시크릿)
JWT_SECRET=[일반 사용자용]
JWT_SECRET_ADMIN=[관리자 전용 - 다른 값]

# CORS 설정
ALLOWED_ORIGINS=https://marketgrow.kr,https://www.marketgrow.kr

# 환경
NODE_ENV=production
```

### 3. DB 스키마 통합

#### PostgreSQL 필수 컬럼 (users 테이블)
```sql
-- 이미 seed.pg.js에서 자동 추가됨
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_level VARCHAR(50) DEFAULT 'bronze';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deposit_balance DECIMAL(10,2) DEFAULT 0;
```

### 4. 배포 후 검증 (3분)

#### A. PostgreSQL에서 확인
```sql
-- Neon 콘솔에서 실행
SELECT id, email, role, membership_level 
FROM users 
WHERE email='admin@marketgrow.kr';
```

#### B. 관리자 API 테스트
```bash
# 로그인 테스트
curl -X POST https://marketgrow.kr/.netlify/functions/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"login","email":"admin@marketgrow.kr","password":"[비밀번호]"}'

# 권한 확인
curl https://marketgrow.kr/.netlify/functions/admin-check \
  -H "Authorization: Bearer [토큰]"
```

## 🔒 보안 체크리스트

### 즉시 적용 (오늘)
- [x] 비밀번호 로그 출력 제거
- [ ] JWT_SECRET_ADMIN 별도 설정
- [ ] CORS에서 * 제거, 특정 도메인만 허용
- [ ] 관리자 로그인 시 IP 로깅
- [ ] 로그인 실패 5회 시 계정 잠금

### 1주 내 적용
- [ ] 2FA (Two-Factor Authentication) 구현
- [ ] 관리자 활동 감사 로그 (admin_audit_logs 테이블)
- [ ] 세션 타임아웃 (30분)
- [ ] IP 화이트리스트

## 📱 관리자 페이지 접속

### 메인 사이트에 링크 추가
```html
<!-- index.html 푸터에 추가 -->
<footer>
  <!-- 기존 내용 -->
  <div class="admin-link">
    <a href="/admin-standalone.html" rel="nofollow">관리자</a>
  </div>
</footer>
```

### SEO 차단
```html
<!-- admin-standalone.html 헤더에 추가 -->
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="googlebot" content="noindex">
```

## 🚀 Railway 재배포 명령

```bash
# package.json의 start 스크립트 수정
"start": "node backend/utils/seed.pg.js && node backend/server.js"
```

또는 Railway 설정에서:
```
Start Command: npm run seed:postgres && npm start
```

## ⚡ 긴급 연락

문제 발생 시:
1. Railway 로그 확인: `railway logs`
2. Neon DB 상태: https://console.neon.tech
3. Netlify Functions 로그: Netlify 대시보드

## 📅 마이그레이션 일정

- **오늘**: PostgreSQL 관리자 계정 생성
- **내일**: MongoDB → PostgreSQL 데이터 마이그레이션
- **3일차**: MongoDB 연결 제거, 전체 PostgreSQL 전환
- **1주차**: 보안 강화 완료

---
⚠️ **중요**: 이 문서의 비밀번호 관련 정보는 설정 후 즉시 삭제하세요.
작성일: 2025-08-22