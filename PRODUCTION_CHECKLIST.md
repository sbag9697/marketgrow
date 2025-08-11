# 🚀 MarketGrow 실제 운영 체크리스트

## 📌 현재 상태 (2025-08-10)

### ✅ 완료된 작업
- [x] 프론트엔드 배포 (Netlify)
- [x] 백엔드 배포 (Railway)
- [x] 데이터베이스 연결 (MongoDB)
- [x] API 연동 완료
- [x] 서비스 목록 표시
- [x] SEO 최적화
- [x] 사이트맵 생성

### 🔧 테스트 필요
- [ ] 관리자 계정 생성 → `admin-setup.html` 파일 사용
- [ ] 회원가입/로그인 테스트
- [ ] 주문 프로세스 테스트
- [ ] 결제 테스트 (테스트 모드)

## 🎯 즉시 해야 할 작업

### 1. 관리자 계정 설정
```
1. 브라우저에서 열기: file:///C:/Users/박시현/sns-marketing-site/admin-setup.html
2. "API 연결 테스트" 클릭
3. "관리자 계정 생성" 클릭
4. "로그인 테스트" 클릭
5. 성공 후 파일 삭제: admin-setup.html
```

### 2. Railway 환경변수 설정
Railway 대시보드 (https://railway.app) → marketgrow 프로젝트 → Variables:

```env
# 필수 설정
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
ADMIN_PASSWORD=StrongAdminPassword123!@#

# SMM Turk (실제 운영 시)
SMM_API_KEY=your-smm-turk-api-key
SMM_API_URL=https://smmturk.com/api/v2
SMM_ENABLED=false  # API 키 구매 후 true로 변경
PRICE_MARGIN=800

# 토스페이먼츠 (사업자등록 후)
TOSS_SECRET_KEY=test_sk_your_secret_key
TOSS_CLIENT_KEY=test_ck_your_client_key
```

## 💼 사업자등록 후 필수 작업

### 1. 통신판매업 신고
- 관할 구청/시청 방문 또는 온라인 신고
- 필요 서류: 사업자등록증, 신분증
- 신고 후 통신판매업 신고번호 받기

### 2. 결제 시스템 정식 등록
**토스페이먼츠**
1. https://tosspayments.com 가맹점 신청
2. 사업자등록증 제출
3. 심사 승인 (1-3일)
4. 실제 API 키 발급
5. Railway 환경변수 업데이트

**추가 결제수단**
- 네이버페이
- 카카오페이
- 페이팔 (해외 결제)

### 3. 웹사이트 정보 업데이트
`privacy.html`, `terms.html`, 모든 footer:
```html
사업자등록번호: 123-45-67890 (실제 번호로 변경)
통신판매업신고: 2025-서울강남-0000 (실제 번호로 변경)
대표: 박성현
주소: 서울특별시 강남구 테헤란로 123
고객센터: 010-1234-5678
이메일: support@marketgrow.com
```

## 🔐 보안 체크리스트

### 필수 보안 설정
- [ ] JWT_SECRET 32자 이상 랜덤 문자열로 변경
- [ ] ADMIN_PASSWORD 강력한 비밀번호로 변경
- [ ] admin-setup.html 파일 삭제
- [ ] 테스트 파일 모두 삭제 확인
- [ ] HTTPS 활성화 확인 (자동)
- [ ] CORS 설정 확인

### 추가 보안 권장사항
- [ ] 2단계 인증 구현
- [ ] 관리자 IP 제한
- [ ] 로그인 시도 제한
- [ ] SQL Injection 방지 (완료)
- [ ] XSS 방지 (완료)

## 📊 SMM Turk 연동

### 1. SMM Turk 계정 생성
1. https://smmturk.com 가입
2. 이메일 인증
3. 최소 금액 충전 ($10-50)

### 2. API 키 발급
1. Dashboard → API 메뉴
2. Create API Key
3. 키 복사 및 안전한 곳에 저장

### 3. Railway 환경변수 설정
```env
SMM_API_KEY=발급받은_API_키
SMM_ENABLED=true
```

### 4. 서비스 매핑 확인
`backend/services/smmPanel.service.js` 파일에서 서비스 ID 매핑 수정

## 🎨 도메인 구매 및 연결

### 1. 도메인 구매
추천 업체:
- 가비아 (https://gabia.com)
- 후이즈 (https://whois.co.kr)
- GoDaddy (https://godaddy.com)

추천 도메인:
- marketgrow.co.kr
- marketgrow.kr
- market-grow.com

### 2. Netlify 연결
1. Netlify → Domain settings
2. Add custom domain
3. DNS 설정 (A 레코드 또는 CNAME)
4. SSL 인증서 자동 발급

### 3. 이메일 설정
Google Workspace 또는 네이버 웍스:
- support@marketgrow.com
- admin@marketgrow.com
- no-reply@marketgrow.com

## 📈 마케팅 도구 설정

### 1. Google Analytics 4
1. https://analytics.google.com
2. 계정 생성 → 속성 생성
3. 추적 코드 받기
4. `js/analytics.js`에 추가

### 2. 네이버 서치어드바이저
1. https://searchadvisor.naver.com
2. 사이트 등록
3. 소유 확인 (HTML 태그)
4. 사이트맵 제출

### 3. Google Search Console
1. https://search.google.com/search-console
2. 속성 추가
3. 소유 확인
4. 사이트맵 제출

## 💰 예상 월 운영비

### 최소 운영 (월 5만원)
- Railway: 무료 ~ $5
- Netlify: 무료
- 도메인: 연 2만원 (월 1,700원)
- SMM Turk: $20-50 (재충전 필요시)

### 권장 운영 (월 10-15만원)
- Railway Pro: $20
- Netlify Pro: $19
- Google Workspace: 월 8,800원
- 마케팅 비용: 월 5만원

### 성장 단계 (월 30만원+)
- AWS/클라우드 전환
- 전담 개발자
- 마케팅 확대
- 고객센터 운영

## 📞 고객 지원 체계

### 1. 카카오톡 채널
1. https://center-pf.kakao.com
2. 채널 개설
3. 자동응답 설정
4. 웹사이트에 링크 추가

### 2. 실시간 채팅
- 채널톡 (https://channel.io)
- 상담톡 (무료)
- Tawk.to (무료)

### 3. 이메일 템플릿
- 회원가입 환영
- 주문 확인
- 서비스 완료
- 문의 답변

## ⚖️ 법적 준비사항

### 필수 문서
- [x] 이용약관
- [x] 개인정보처리방침
- [ ] 환불정책
- [ ] 서비스 이용 가이드

### 보험 검토
- 전자상거래 배상책임보험
- 개인정보보호 배상책임보험

## 🎯 런칭 체크리스트

### D-7 (준비)
- [ ] 모든 기능 테스트
- [ ] 보안 점검
- [ ] 백업 시스템 구축
- [ ] 모니터링 설정

### D-3 (최종 점검)
- [ ] 실제 결제 테스트
- [ ] 고객지원 채널 오픈
- [ ] 마케팅 자료 준비
- [ ] 팀 교육

### D-Day (런칭)
- [ ] 실시간 모니터링
- [ ] 첫 고객 응대
- [ ] 이슈 즉시 대응
- [ ] 피드백 수집

### D+7 (개선)
- [ ] 사용자 피드백 분석
- [ ] 버그 수정
- [ ] 기능 개선
- [ ] 마케팅 전략 수정

## 📱 연락처 및 리소스

### 기술 지원
- Railway: https://discord.gg/railway
- Netlify: https://answers.netlify.com
- MongoDB: https://www.mongodb.com/community/forums

### 결제 시스템
- 토스페이먼츠: 1599-0659
- 네이버페이: 1588-3819
- 카카오페이: 1644-7405

### 마케팅
- SMM Turk: support@smmturk.com
- Google Ads: https://ads.google.com
- 네이버 광고: https://searchad.naver.com

## 💡 성공 팁

1. **단계적 런칭**: 소규모로 시작해서 점진적 확대
2. **고객 피드백**: 초기 고객 의견 적극 반영
3. **품질 우선**: 양보다 질, 신뢰 구축이 우선
4. **투명한 소통**: 문제 발생 시 정직한 대응
5. **지속적 개선**: 매주 업데이트와 개선

---
마지막 업데이트: 2025-08-10
작성자: MarketGrow 개발팀