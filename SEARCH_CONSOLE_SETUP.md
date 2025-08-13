# 🔍 검색엔진 등록 가이드 (네이버 & 구글)

## 1. 네이버 서치어드바이저

### Step 1: 사이트 등록
1. https://searchadvisor.naver.com 접속
2. 네이버 로그인
3. **사이트 등록** 클릭
4. URL 입력: https://marketgrow.kr

### Step 2: 사이트 소유 확인
**HTML 태그 방법 (추천):**
1. **HTML 태그** 선택
2. 메타태그 복사:
```html
<meta name="naver-site-verification" content="abc123..."/>
```
3. index.html의 `<head>`에 추가
4. **소유확인** 클릭

### Step 3: 사이트맵 제출
1. **요청** → **사이트맵 제출**
2. URL: https://marketgrow.kr/sitemap.xml
3. **확인** 클릭

### Step 4: 웹마스터 도구 설정
- **검증** → **robots.txt** 검증
- **검증** → **웹 표준** 검증
- **현황** → **색인 현황** 확인

### Step 5: 검색 최적화
1. **검증** → **웹페이지 최적화**
2. 개선사항 확인 및 수정
3. Open Graph 태그 추가:
```html
<meta property="og:type" content="website">
<meta property="og:title" content="MarketGrow - SNS 마케팅 전문">
<meta property="og:description" content="인스타그램, 유튜브, 페이스북 마케팅 서비스">
<meta property="og:image" content="https://marketgrow.kr/og-image.png">
<meta property="og:url" content="https://marketgrow.kr">
```

---

## 2. 구글 서치콘솔

### Step 1: 속성 추가
1. https://search.google.com/search-console 접속
2. **속성 추가** 클릭
3. **URL 접두어** 선택
4. https://marketgrow.kr 입력

### Step 2: 소유권 확인
**HTML 태그 방법 (추천):**
1. **HTML 태그** 선택
2. 메타태그 복사:
```html
<meta name="google-site-verification" content="xyz789..."/>
```
3. index.html의 `<head>`에 추가
4. **확인** 클릭

### Step 3: 사이트맵 제출
1. **색인** → **Sitemaps**
2. 사이트맵 URL 입력: sitemap.xml
3. **제출** 클릭

### Step 4: 색인 요청
1. **URL 검사** 도구 사용
2. 주요 페이지 URL 입력
3. **색인 요청** 클릭

### Step 5: 성능 모니터링
- **성능** → 검색 트래픽 분석
- **적용 범위** → 색인 오류 확인
- **개선사항** → Core Web Vitals 확인

---

## 3. sitemap.xml 파일 생성

`sitemap.xml` 파일을 루트 디렉토리에 생성:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://marketgrow.kr/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://marketgrow.kr/services.html</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://marketgrow.kr/packages.html</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://marketgrow.kr/blog.html</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://marketgrow.kr/login.html</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://marketgrow.kr/signup.html</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
```

---

## 4. robots.txt 파일 생성

`robots.txt` 파일을 루트 디렉토리에 생성:

```txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: *.json
Disallow: /test/

Sitemap: https://marketgrow.kr/sitemap.xml

# Naver
User-agent: Yeti
Allow: /

# Google
User-agent: Googlebot
Allow: /
```

---

## 5. SEO 메타태그 추가

모든 HTML 파일의 `<head>`에 추가:

```html
<!-- 기본 SEO -->
<meta name="description" content="SNS 마케팅 전문 서비스 - 인스타그램, 유튜브, 페이스북 팔로워 및 좋아요 증가">
<meta name="keywords" content="SNS마케팅, 인스타그램팔로워, 유튜브구독자, 페이스북좋아요, 틱톡팔로워">
<meta name="author" content="MarketGrow">
<link rel="canonical" href="https://marketgrow.kr/">

<!-- Open Graph (Facebook, KakaoTalk) -->
<meta property="og:type" content="website">
<meta property="og:title" content="MarketGrow - SNS 마케팅 전문">
<meta property="og:description" content="24시간 자동 SNS 마케팅 서비스">
<meta property="og:image" content="https://marketgrow.kr/og-image.png">
<meta property="og:url" content="https://marketgrow.kr">
<meta property="og:site_name" content="MarketGrow">
<meta property="og:locale" content="ko_KR">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="MarketGrow - SNS 마케팅">
<meta name="twitter:description" content="SNS 마케팅 자동화 서비스">
<meta name="twitter:image" content="https://marketgrow.kr/twitter-card.png">

<!-- 네이버 -->
<meta name="naver-site-verification" content="여기에_네이버_인증코드"/>

<!-- 구글 -->
<meta name="google-site-verification" content="여기에_구글_인증코드"/>
```

---

## 6. 구조화된 데이터 추가

홈페이지에 JSON-LD 스키마 추가:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "MarketGrow",
  "url": "https://marketgrow.kr",
  "logo": "https://marketgrow.kr/logo.png",
  "description": "SNS 마케팅 전문 서비스",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "KR"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+82-10-1234-5678",
    "contactType": "customer service",
    "availableLanguage": "Korean"
  }
}
</script>
```

---

## 7. 검색엔진 최적화 체크리스트

### 기술적 SEO
- [x] HTTPS 적용
- [x] 모바일 반응형
- [ ] 페이지 로딩 속도 최적화 (3초 이내)
- [ ] 404 페이지 커스터마이징
- [ ] XML 사이트맵
- [ ] robots.txt

### 온페이지 SEO
- [ ] 고유한 타이틀 태그 (각 페이지)
- [ ] 메타 설명 최적화 (155자 이내)
- [ ] H1 태그 (페이지당 1개)
- [ ] 이미지 alt 태그
- [ ] 내부 링크 구조
- [ ] URL 구조 최적화

### 콘텐츠 SEO
- [ ] 블로그 콘텐츠 정기 발행
- [ ] 키워드 연구 및 적용
- [ ] 긴 형식 콘텐츠 (1500자 이상)
- [ ] FAQ 섹션
- [ ] 고객 후기/사례

---

## 8. 모니터링 도구

### 네이버
- 서치어드바이저 웹마스터 도구
- 네이버 애널리틱스

### 구글
- Google Search Console
- Google Analytics
- PageSpeed Insights

### 기타 유용한 도구
- GTmetrix (속도 측정)
- Screaming Frog (SEO 감사)
- Ahrefs/SEMrush (키워드 연구)

---

## 9. 등록 후 할 일

### 1주차
- [ ] 색인 상태 확인
- [ ] 크롤링 오류 수정
- [ ] 주요 페이지 수동 색인 요청

### 2-4주차
- [ ] 검색 성능 모니터링
- [ ] 노출 키워드 분석
- [ ] CTR 개선 (제목/설명 최적화)

### 매월
- [ ] 새 콘텐츠 색인 요청
- [ ] 깨진 링크 확인
- [ ] Core Web Vitals 개선
- [ ] 경쟁사 분석

---

## 문제 해결

### "색인되지 않음" 문제
1. robots.txt 확인
2. 페이지 품질 개선
3. 백링크 구축
4. 수동 색인 요청

### "모바일 사용성" 문제
1. 반응형 디자인 확인
2. 터치 타겟 크기 조정
3. 폰트 크기 최적화
4. 뷰포트 설정 확인

---

**도움말 링크:**
- 네이버 서치어드바이저: https://searchadvisor.naver.com/guide
- 구글 서치콘솔: https://support.google.com/webmasters