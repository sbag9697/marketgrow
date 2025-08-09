# 커스텀 도메인 설정 가이드

## 1. 도메인 구매

### 1.1 도메인 등록업체 선택
**국내 업체:**
- 가비아 (gabia.com) - 연 15,000원~
- 카페24 (cafe24.com) - 연 12,000원~
- 후이즈 (whois.co.kr) - 연 13,000원~

**해외 업체:**
- Namecheap (namecheap.com) - $8.88/년~
- GoDaddy (godaddy.com) - $11.99/년~
- Google Domains (domains.google) - $12/년

### 1.2 도메인 선택 팁
- **추천 도메인**: marketgrow.com / marketgrow.co.kr / marketgrow.kr
- 짧고 기억하기 쉬운 도메인
- 브랜드와 일치하는 이름
- .com이 가장 신뢰도 높음

## 2. Netlify 도메인 연결

### 2.1 Netlify Dashboard 설정
1. [Netlify Dashboard](https://app.netlify.com) 로그인
2. 사이트 선택 → Domain settings
3. "Add custom domain" 클릭
4. 도메인 입력 (예: marketgrow.com)
5. "Verify" 클릭

### 2.2 DNS 설정 방법 선택

#### 방법 1: Netlify DNS 사용 (권장)
1. "Use Netlify DNS" 선택
2. 네임서버 변경:
   ```
   dns1.p06.nsone.net
   dns2.p06.nsone.net
   dns3.p06.nsone.net
   dns4.p06.nsone.net
   ```
3. 도메인 등록업체에서 네임서버 변경
4. 24-48시간 대기 (전파 시간)

#### 방법 2: 외부 DNS 사용
1. "Configure manually" 선택
2. DNS 레코드 추가:

**A 레코드 (루트 도메인):**
```
Type: A
Name: @ 또는 marketgrow.com
Value: 75.2.60.5
```

**CNAME 레코드 (www 서브도메인):**
```
Type: CNAME
Name: www
Value: resplendent-heliotrope-e5c264.netlify.app
```

### 2.3 SSL 인증서 설정
- Netlify가 자동으로 Let's Encrypt SSL 인증서 발급
- 도메인 연결 후 자동 활성화
- HTTPS 강제 리디렉션 자동 설정

## 3. 도메인 업체별 설정

### 3.1 가비아 (Gabia)
1. My가비아 로그인
2. 도메인 관리 → DNS 관리
3. DNS 레코드 추가:
   - A 레코드: @ → 75.2.60.5
   - CNAME: www → resplendent-heliotrope-e5c264.netlify.app
4. 저장

### 3.2 카페24 (Cafe24)
1. 나의 서비스 관리
2. 도메인 → DNS 관리
3. 레코드 추가
4. 적용

### 3.3 Namecheap
1. Dashboard → Domain List
2. Manage → Advanced DNS
3. Add New Record
4. Save All Changes

## 4. Railway 백엔드 도메인 설정

### 4.1 서브도메인 생성
API용 서브도메인: `api.marketgrow.com`

### 4.2 Railway Custom Domain
1. Railway Dashboard → Settings
2. Networking → Custom Domain
3. Add Domain: api.marketgrow.com
4. CNAME 레코드 추가:
   ```
   Type: CNAME
   Name: api
   Value: marketgrow-production.up.railway.app
   ```

## 5. 도메인 설정 후 업데이트

### 5.1 프론트엔드 코드 업데이트
`js/config.js`:
```javascript
const API_CONFIG = {
    BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:5001/api'
        : 'https://api.marketgrow.com/api',
    // ...
};
```

### 5.2 환경 변수 업데이트
Railway Variables:
```
CORS_ORIGIN=https://marketgrow.com
```

### 5.3 Google Analytics 업데이트
GA4 데이터 스트림에 새 도메인 추가

## 6. 이메일 설정 (선택사항)

### 6.1 비즈니스 이메일
- info@marketgrow.com
- support@marketgrow.com
- admin@marketgrow.com

### 6.2 이메일 서비스
- Google Workspace: $6/월
- Zoho Mail: 무료~$1/월
- 네이버 웍스: 무료

### 6.3 MX 레코드 설정
Google Workspace 예시:
```
MX 1 ASPMX.L.GOOGLE.COM
MX 5 ALT1.ASPMX.L.GOOGLE.COM
MX 5 ALT2.ASPMX.L.GOOGLE.COM
MX 10 ALT3.ASPMX.L.GOOGLE.COM
MX 10 ALT4.ASPMX.L.GOOGLE.COM
```

## 7. 도메인 전파 확인

### 7.1 확인 도구
- [DNS Checker](https://dnschecker.org)
- [What's My DNS](https://www.whatsmydns.net)
- nslookup 명령어

### 7.2 확인 방법
```bash
# Windows/Mac/Linux
nslookup marketgrow.com
nslookup www.marketgrow.com
```

## 8. SEO 설정

### 8.1 리디렉션 설정
Netlify `_redirects` 파일:
```
# www to non-www
https://www.marketgrow.com/* https://marketgrow.com/:splat 301!

# Old domain to new domain
https://resplendent-heliotrope-e5c264.netlify.app/* https://marketgrow.com/:splat 301!
```

### 8.2 Canonical URL 설정
모든 페이지에 추가:
```html
<link rel="canonical" href="https://marketgrow.com/현재페이지">
```

### 8.3 사이트맵 업데이트
`sitemap.xml` 도메인 변경

## 9. 모니터링

### 9.1 도메인 만료 알림
- 자동 갱신 설정
- 만료 30일 전 알림
- 결제 수단 등록

### 9.2 SSL 인증서 모니터링
- Netlify 자동 갱신
- 만료 상태 확인

## 10. 체크리스트

- [ ] 도메인 구매 완료
- [ ] Netlify에 도메인 추가
- [ ] DNS 레코드 설정
- [ ] SSL 인증서 확인
- [ ] API 서브도메인 설정
- [ ] 코드 업데이트
- [ ] 도메인 전파 확인
- [ ] 리디렉션 설정
- [ ] Google Analytics 업데이트
- [ ] 자동 갱신 설정

## 11. 문제 해결

### DNS 전파 지연
- 최대 48시간 소요
- 캐시 클리어: `ipconfig /flushdns` (Windows)

### SSL 인증서 오류
- DNS 설정 재확인
- Netlify Support 문의

### 도메인 연결 실패
- A 레코드 IP 확인
- CNAME 타겟 확인
- 네임서버 설정 확인