# GitHub Secrets 설정 가이드

## GitHub Actions 자동 배포를 위한 시크릿 설정

### 1. GitHub 저장소 설정

1. GitHub 저장소로 이동
2. Settings → Secrets and variables → Actions
3. "New repository secret" 클릭

### 2. 필수 시크릿 추가

#### Railway 관련
```
RAILWAY_TOKEN
```
- Railway 대시보드 → Account Settings → Tokens
- "Create Token" 클릭하여 생성
- 생성된 토큰 복사하여 GitHub Secret에 추가

#### Netlify 관련
```
NETLIFY_AUTH_TOKEN
```
- Netlify 대시보드 → User Settings → Applications
- "New access token" 생성
- 토큰 복사하여 GitHub Secret에 추가

```
NETLIFY_SITE_ID
```
- Netlify 대시보드 → Site settings → General
- Site ID 복사하여 GitHub Secret에 추가

#### API URL
```
BACKEND_URL
```
- Railway 배포 후 생성된 URL
- 예: https://marketgrow-backend.up.railway.app

```
FRONTEND_URL
```
- Netlify 배포 후 생성된 URL
- 예: https://melodious-banoffee-c450ea.netlify.app

#### 선택 사항 (알림)
```
SLACK_WEBHOOK
```
- Slack 워크스페이스에서 Incoming Webhook 생성
- 배포 상태 알림을 받을 수 있음

### 3. 시크릿 추가 방법

1. **GitHub 웹 인터페이스**
   ```
   Settings → Secrets → New repository secret
   Name: RAILWAY_TOKEN
   Value: [토큰 값 붙여넣기]
   → Add secret
   ```

2. **GitHub CLI**
   ```bash
   gh secret set RAILWAY_TOKEN
   gh secret set NETLIFY_AUTH_TOKEN
   gh secret set NETLIFY_SITE_ID
   gh secret set BACKEND_URL
   gh secret set FRONTEND_URL
   ```

### 4. 로컬 개발 환경 설정

`.env` 파일 생성:
```env
# Backend (.env)
RAILWAY_TOKEN=your-railway-token
NETLIFY_AUTH_TOKEN=your-netlify-token
NETLIFY_SITE_ID=your-site-id
```

**중요**: `.env` 파일은 절대 Git에 커밋하지 마세요!

### 5. 시크릿 검증

GitHub Actions 워크플로우 수동 실행:
1. Actions 탭 이동
2. "Deploy MarketGrow" 워크플로우 선택
3. "Run workflow" 클릭
4. 배포 로그 확인

### 6. 보안 주의사항

- ⚠️ 시크릿은 한 번 저장하면 다시 볼 수 없음
- ⚠️ 시크릿 값을 로그에 출력하지 않도록 주의
- ⚠️ 정기적으로 토큰 갱신
- ⚠️ 최소 권한 원칙 적용

### 7. 문제 해결

**"Bad credentials" 오류**
- 토큰이 올바른지 확인
- 토큰 권한 확인
- 토큰 만료 여부 확인

**"Site not found" 오류**
- NETLIFY_SITE_ID가 올바른지 확인
- Netlify 사이트가 존재하는지 확인

**"Deployment failed" 오류**
- Railway/Netlify 대시보드에서 상세 로그 확인
- 환경 변수 누락 확인

### 8. 추가 환경 변수 (선택사항)

프로덕션 환경을 위한 추가 시크릿:
```
# 데이터베이스
MONGODB_URI

# 인증
JWT_SECRET
JWT_REFRESH_SECRET

# 결제
INICIS_MID
INICIS_API_KEY

# SMM Panel
SMM_API_KEY

# 이메일
SMTP_USER
SMTP_PASS

# 관리자
ADMIN_EMAIL
ADMIN_PASSWORD
```

### 9. 배포 파이프라인 흐름

1. 코드 푸시 → GitHub
2. GitHub Actions 트리거
3. 테스트 실행
4. Railway 백엔드 배포
5. Netlify 프론트엔드 배포
6. 헬스체크
7. Slack 알림 (선택사항)

### 10. 시크릿 관리 베스트 프랙티스

1. **정기 갱신**: 3-6개월마다 토큰 갱신
2. **접근 제한**: 필요한 팀원만 접근 권한 부여
3. **감사 로그**: GitHub 감사 로그 정기 확인
4. **백업**: 시크릿 값을 안전한 곳에 별도 백업
5. **문서화**: 각 시크릿의 용도와 갱신 주기 문서화

## 완료 체크리스트

- [ ] Railway 토큰 생성 및 추가
- [ ] Netlify 토큰 생성 및 추가
- [ ] Site ID 추가
- [ ] API URL 추가
- [ ] GitHub Actions 테스트 실행
- [ ] 배포 성공 확인
- [ ] 헬스체크 통과
- [ ] 문서화 완료