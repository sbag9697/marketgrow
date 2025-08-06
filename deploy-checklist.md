# 배포 체크리스트

## 🔧 배포 전 필수 작업

### 1. 백엔드 API 연결
- [ ] auth.js - 실제 로그인/회원가입 API 연결
- [ ] services.js - 주문 처리 API 연결
- [ ] keywords.js - 상담 신청 폼 처리 API 연결
- [ ] payment.js - 결제 시스템 연동

### 2. 환경 변수 설정
- [ ] `.env` 파일 생성 (`.env.example` 참고)
- [ ] API URL 설정
- [ ] 결제 키 설정
- [ ] 소셜 로그인 키 설정

### 3. 이미지 최적화
- [ ] 로고 이미지 추가
- [ ] 파비콘 생성 및 추가
- [ ] 서비스 아이콘 최적화

### 4. SEO 최적화
- [ ] 메타 태그 확인
- [ ] sitemap.xml 생성
- [ ] robots.txt 생성

### 5. 보안 설정
- [ ] HTTPS 설정
- [ ] CSP 헤더 설정
- [ ] API 키 보안 확인

## 🚀 배포 방법

### Netlify 배포 (추천)
```bash
# 1. netlify.toml 파일 확인
# 2. Netlify 계정 연결
netlify init

# 3. 배포
netlify deploy --prod
```

### Vercel 배포
```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 배포
vercel --prod
```

### 수동 배포
1. 모든 파일을 웹 서버에 업로드
2. index.html을 루트로 설정
3. 404 페이지 설정

## ⚠️ 주의사항

1. **실제 서비스 운영 전 반드시 백엔드 구현 필요**
   - 현재는 프론트엔드만 구현된 상태
   - 실제 주문, 결제, 회원 관리 기능 없음

2. **법적 요구사항**
   - 이용약관 페이지 작성
   - 개인정보처리방침 페이지 작성
   - 전자상거래 관련 정보 표시

3. **테스트**
   - 모든 페이지 링크 확인
   - 모바일 반응형 테스트
   - 크로스 브라우저 테스트

## 📝 배포 후 작업

1. Google Analytics 설정
2. Search Console 등록
3. 성능 모니터링 설정
4. 에러 추적 시스템 설정