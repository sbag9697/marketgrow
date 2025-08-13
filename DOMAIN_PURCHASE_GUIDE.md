# 🌐 도메인 구매 및 연결 가이드

## 1. 도메인 구매처 추천

### 🥇 **가비아** (한국 - 추천)
- https://www.gabia.com
- **.com**: 19,800원/년
- **.co.kr**: 11,000원/년
- **장점**: 한국어 지원, 빠른 CS, 간편한 관리

### 🥈 **Namecheap** (해외 - 저렴)
- https://www.namecheap.com
- **.com**: $9.58/년 (약 12,000원)
- **장점**: 저렴, WhoisGuard 무료

### 🥉 **후이즈** (한국)
- https://whois.co.kr
- **.com**: 22,000원/년
- **.kr**: 9,900원/년

## 2. 추천 도메인명

```
✅ marketgrow.co.kr (한국 타겟)
✅ marketgrow.com (글로벌)
✅ marketgrow.kr (짧고 간단)
✅ market-grow.com (대안)
```

## 3. 도메인 구매 단계

### Step 1: 도메인 검색
1. 가비아 접속 → 도메인 검색
2. `marketgrow` 입력
3. 사용 가능한 도메인 확인

### Step 2: 구매
1. 장바구니 담기
2. 1년 or 2년 선택 (2년이 더 저렴)
3. 개인정보보호 서비스 추가 (선택)
4. 결제

### Step 3: 소유자 정보 입력
```
도메인 소유자: [사업자명 or 개인명]
이메일: sbag9697@gmail.com
전화번호: [연락처]
주소: [사업장 주소]
```

## 4. Netlify에 도메인 연결

### 🎯 방법 1: Netlify DNS 사용 (쉬움)

1. **Netlify 대시보드**
   - https://app.netlify.com
   - Sites → melodious-banoffee-c450ea → Domain settings
   
2. **Add custom domain 클릭**
   - 구매한 도메인 입력 (예: marketgrow.com)
   - Verify 클릭

3. **네임서버 변경 (가비아에서)**
   ```
   dns1.p01.nsone.net
   dns2.p01.nsone.net
   dns3.p01.nsone.net
   dns4.p01.nsone.net
   ```

### 🎯 방법 2: A 레코드 직접 설정

1. **가비아 DNS 관리**에서:
   ```
   Type: A
   Host: @
   Value: 75.2.60.5
   TTL: 3600
   
   Type: CNAME
   Host: www
   Value: melodious-banoffee-c450ea.netlify.app
   TTL: 3600
   ```

2. **Netlify에서 도메인 추가**
   - Custom domain에 도메인 입력
   - DNS configuration 확인

## 5. Railway 백엔드 서브도메인 설정

### API 서브도메인 만들기
```
api.marketgrow.com → Railway 백엔드
```

1. **Railway 대시보드**
   - Settings → Domains
   - Add Domain: `api.marketgrow.com`

2. **가비아 DNS 추가**
   ```
   Type: CNAME
   Host: api
   Value: marketgrow-production-9802.up.railway.app
   TTL: 3600
   ```

## 6. SSL 인증서 (HTTPS)

### Netlify
- **자동 설정됨** ✅
- Let's Encrypt 무료 SSL
- Domain settings → HTTPS → Verify DNS configuration

### Railway
- **자동 설정됨** ✅
- 도메인 추가 시 자동 SSL

## 7. 프론트엔드 코드 업데이트

```javascript
// config.js 수정
// 기존
const API_URL = 'https://marketgrow-production-9802.up.railway.app/api';

// 변경 후
const API_URL = 'https://api.marketgrow.com/api';
```

## 8. 최종 구조

```
🌐 marketgrow.com (메인 사이트 - Netlify)
   ├── www.marketgrow.com (자동 리다이렉트)
   └── api.marketgrow.com (백엔드 API - Railway)
```

## 9. DNS 전파 시간

- **국내**: 10분 ~ 1시간
- **해외**: 최대 48시간
- 확인: https://dnschecker.org

## 10. 체크리스트

### 도메인 구매
- [ ] 도메인 검색 및 선택
- [ ] 1-2년 구매
- [ ] 소유자 정보 입력
- [ ] 개인정보보호 설정

### Netlify 연결
- [ ] Custom domain 추가
- [ ] 네임서버 or A 레코드 설정
- [ ] SSL 인증서 확인
- [ ] www 리다이렉트 설정

### Railway 연결
- [ ] api 서브도메인 추가
- [ ] CNAME 레코드 설정
- [ ] SSL 인증서 확인

### 코드 업데이트
- [ ] API_URL 변경
- [ ] 테스트
- [ ] 배포

## 💰 예상 비용

| 항목 | 비용 | 기간 |
|------|------|------|
| .com 도메인 | 19,800원 | 1년 |
| .co.kr 도메인 | 11,000원 | 1년 |
| 개인정보보호 | 5,500원 | 1년 |
| **총 비용** | **25,300원** | **1년** |

## 🚀 추가 팁

1. **2년 구매 시 할인** (보통 10-20%)
2. **자동 갱신 설정** (도메인 만료 방지)
3. **여러 도메인 구매** (.com, .co.kr 둘 다)
4. **이메일 포워딩 설정** (info@marketgrow.com → Gmail)

## 📞 고객센터

- **가비아**: 1544-4370
- **Netlify Support**: support@netlify.com
- **Railway Support**: Discord 커뮤니티

---

도메인 구매 후 DNS 설정까지 약 1시간이면 완료됩니다! 🎉