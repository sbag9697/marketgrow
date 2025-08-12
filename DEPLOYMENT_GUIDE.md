# 🚀 MarketGrow 배포 가이드

## 📋 배포 체크리스트

### 1. 백엔드 배포 (Railway)

#### 준비 사항
- [ ] GitHub 저장소에 백엔드 코드 푸시
- [ ] MongoDB Atlas 계정 및 클러스터 생성
- [ ] KG이니시스 가맹점 계정 (테스트/운영)
- [ ] SMM Panel API 키 (선택사항)

#### Railway 배포 단계

1. **Railway 프로젝트 생성**
```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 백엔드 디렉토리로 이동
cd sns-marketing-site/backend

# 새 프로젝트 생성
railway init

# 프로젝트 링크
railway link
```

2. **MongoDB 추가**
```bash
# Railway 대시보드에서 MongoDB 추가
railway add mongodb

# 또는 MongoDB Atlas 사용 시 환경 변수만 설정
```

3. **환경 변수 설정**
```bash
# Railway 대시보드 또는 CLI로 설정
railway variables set NODE_ENV=production
railway variables set MONGODB_URI="mongodb+srv://..."
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set ADMIN_EMAIL="admin@marketgrow.com"
railway variables set ADMIN_PASSWORD="SecurePassword123!"
```

4. **배포 실행**
```bash
# 배포
railway up

# 로그 확인
railway logs

# 배포 상태 확인
railway status
```

5. **배포 확인**
```bash
# 헬스체크
curl https://your-app.up.railway.app/api/health

# 관리자 로그인 테스트
curl -X POST https://your-app.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@marketgrow.com","password":"your-password"}'
```

### 2. 프론트엔드 배포 (Netlify)

#### 준비 사항
- [ ] Netlify 계정
- [ ] 백엔드 Railway URL 확인
- [ ] Google Analytics ID (선택사항)

#### Netlify 배포 단계

1. **빌드 준비**
```bash
# 프론트엔드 디렉토리로 이동
cd sns-marketing-site

# API URL 업데이트
# js/config.js 파일에서 Railway URL 설정
```

2. **빌드 실행**
```bash
# 의존성 설치
npm install

# 프로덕션 빌드
npm run build
```

3. **Netlify 배포**

**방법 1: Netlify CLI**
```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 로그인
netlify login

# 배포
netlify deploy --prod --dir=dist

# 또는 Git 연동 배포
netlify init
netlify deploy --prod
```

**방법 2: 드래그 앤 드롭**
- Netlify 대시보드에서 dist 폴더 드래그 앤 드롭

**방법 3: Git 연동**
- GitHub 저장소 연결
- 자동 배포 설정

4. **환경 변수 설정 (Netlify)**
```
# Netlify 대시보드 > Site settings > Environment variables
API_URL=https://your-backend.up.railway.app
```

5. **커스텀 도메인 설정**
```
# Netlify 대시보드 > Domain settings
# 커스텀 도메인 추가 및 DNS 설정
```

### 3. 배포 후 확인 사항

#### 백엔드 체크리스트
- [ ] API 헬스체크 정상 응답
- [ ] 데이터베이스 연결 확인
- [ ] 관리자 계정 로그인 가능
- [ ] CORS 설정 확인 (프론트엔드 도메인 허용)
- [ ] Rate limiting 동작 확인
- [ ] 로그 수집 정상 동작

#### 프론트엔드 체크리스트
- [ ] 홈페이지 정상 로딩
- [ ] 로그인/회원가입 기능 동작
- [ ] 서비스 목록 표시
- [ ] 주문 프로세스 테스트
- [ ] 결제 테스트 (테스트 모드)
- [ ] 관리자 대시보드 접근
- [ ] 모바일 반응형 확인

### 4. 모니터링 설정

#### Railway 모니터링
```bash
# 실시간 로그
railway logs --tail

# 리소스 사용량
railway status

# 환경 변수 확인
railway variables
```

#### Netlify 모니터링
- Analytics 대시보드 확인
- Build 로그 확인
- Function 로그 확인 (사용 시)

### 5. 문제 해결

#### 일반적인 문제들

**CORS 오류**
```javascript
// backend/server.js에서 CORS 설정 확인
const allowedOrigins = [
    'https://your-frontend.netlify.app',
    // 추가 도메인
];
```

**MongoDB 연결 실패**
```bash
# MongoDB Atlas에서 IP Whitelist 확인
# 0.0.0.0/0 허용 (개발) 또는 Railway IP 추가
```

**환경 변수 누락**
```bash
# Railway에서 모든 필수 환경 변수 확인
railway variables
```

**빌드 실패**
```bash
# Node 버전 확인
node --version  # 18.x 필요

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

### 6. 보안 체크리스트

- [ ] HTTPS 활성화 확인
- [ ] 환경 변수에 민감 정보 저장
- [ ] JWT 시크릿 키 강력한 값 사용
- [ ] 관리자 비밀번호 변경
- [ ] Rate limiting 설정 확인
- [ ] CORS 프로덕션 도메인만 허용
- [ ] 에러 메시지 민감 정보 노출 방지
- [ ] 정기적인 보안 업데이트

### 7. 백업 전략

#### 데이터베이스 백업
```bash
# MongoDB 백업 (매일)
mongodump --uri="$MONGODB_URI" --out=backup/$(date +%Y%m%d)

# 복구
mongorestore --uri="$MONGODB_URI" backup/20240101/
```

#### 코드 백업
- GitHub 자동 백업
- 태그/릴리즈 생성

### 8. 성능 최적화

#### 백엔드
- [ ] 데이터베이스 인덱스 설정
- [ ] Redis 캐싱 추가 (선택사항)
- [ ] 이미지 최적화
- [ ] Gzip 압축 활성화

#### 프론트엔드
- [ ] 이미지 lazy loading
- [ ] 코드 스플리팅
- [ ] CDN 활용
- [ ] 브라우저 캐싱

### 9. 스케일링 준비

#### Railway 스케일링
```bash
# 인스턴스 수 증가
railway scale --replicas 3

# 리소스 증가
railway scale --memory 1024
```

#### 데이터베이스 스케일링
- MongoDB Atlas 클러스터 업그레이드
- 읽기 전용 복제본 추가

### 10. 운영 체크리스트

#### 일일 체크
- [ ] 에러 로그 확인
- [ ] 주문 처리 상태
- [ ] 결제 정산 확인

#### 주간 체크
- [ ] 백업 상태 확인
- [ ] 보안 업데이트 확인
- [ ] 성능 메트릭 검토

#### 월간 체크
- [ ] 전체 시스템 점검
- [ ] 사용자 피드백 검토
- [ ] 기능 개선 계획

## 📞 지원 및 문의

- **기술 지원**: tech@marketgrow.com
- **Railway 상태**: https://railway.app/status
- **Netlify 상태**: https://www.netlifystatus.com
- **MongoDB Atlas 상태**: https://status.cloud.mongodb.com

## 🎉 배포 완료!

모든 단계를 완료했다면 MarketGrow가 성공적으로 배포되었습니다.
사용자들에게 서비스를 제공할 준비가 완료되었습니다!