# 📊 MarketGrow 서비스 모니터링 가이드

## 🔍 실시간 상태 확인

### 1. 서비스 상태 체크 URL

#### 프론트엔드 (Netlify)
- **사이트**: https://marketgrow.kr
- **상태 확인**: 브라우저에서 직접 접속
- **Netlify 대시보드**: https://app.netlify.com

#### 백엔드 (Railway)
- **헬스체크**: https://marketgrow-production-c586.up.railway.app/api/health
- **예상 응답**:
```json
{
  "status": "OK",
  "timestamp": "2024-01-13T12:00:00.000Z",
  "environment": "production",
  "mongodb": "Connected"
}
```

### 2. Railway 모니터링

#### 실시간 로그 보기
1. https://railway.app 로그인
2. **sns-marketing-site** 프로젝트
3. **backend** 서비스 클릭
4. **Logs** 탭

#### 주요 로그 메시지
✅ **정상 상태**:
```
MongoDB connected successfully
Database initialized with seed data
🚀 Server is running on port 5000
```

⚠️ **주의 필요**:
```
In-memory MongoDB connected successfully  // MongoDB 연결 실패, 임시 DB 사용
Rate limit exceeded  // 너무 많은 요청
```

❌ **에러 상태**:
```
MongoDB connection error  // DB 연결 실패
Authentication failed  // 인증 오류
Server error  // 서버 오류
```

### 3. 메트릭 모니터링

#### Railway 메트릭
- **CPU 사용률**: < 80% 유지
- **메모리 사용량**: < 512MB
- **응답 시간**: < 500ms
- **에러율**: < 1%

## 📱 API 엔드포인트 테스트

### 인증 관련
```bash
# 헬스체크
curl https://marketgrow-production-c586.up.railway.app/api/health

# 로그인 테스트
curl -X POST https://marketgrow-production-c586.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 서비스 조회
```bash
# 서비스 목록
curl https://marketgrow-production-c586.up.railway.app/api/services

# 키워드 트렌드
curl https://marketgrow-production-c586.up.railway.app/api/keywords/trending
```

## 🚨 알림 설정

### Railway 알림
1. Railway 대시보드 → **Settings**
2. **Notifications** 설정
3. 이메일/슬랙 연동

### 모니터링 체크리스트
- [ ] 5분마다 헬스체크 API 호출
- [ ] 응답 시간 > 1초 시 알림
- [ ] 에러율 > 5% 시 알림
- [ ] MongoDB 연결 실패 시 알림

## 📈 성능 최적화 지표

### 프론트엔드
- **페이지 로드 시간**: < 3초
- **First Contentful Paint**: < 1.5초
- **Time to Interactive**: < 3.5초
- **Lighthouse 점수**: > 80

### 백엔드
- **API 응답 시간**: < 200ms (평균)
- **데이터베이스 쿼리**: < 100ms
- **동시 접속자**: 100명 이상 처리

## 🔧 문제 해결 가이드

### MongoDB 연결 실패
```bash
# Railway 환경변수 확인
MONGODB_URI=mongodb+srv://sbag9697:nUHawo7w3RKDqO8i@cluster0.17qmchk.mongodb.net/marketgrow?retryWrites=true&w=majority&appName=Cluster0
```

### 높은 응답 시간
1. Railway 로그 확인
2. MongoDB Atlas 성능 확인
3. 캐시 구현 검토

### 503 Service Unavailable
1. Railway 서비스 상태 확인
2. 재배포 시도
3. 환경변수 확인

## 📊 일일 체크리스트

### 오전 체크 (09:00)
- [ ] 헬스체크 API 응답 확인
- [ ] Railway 로그 에러 확인
- [ ] MongoDB 연결 상태 확인
- [ ] 프론트엔드 접속 테스트

### 오후 체크 (18:00)
- [ ] 일일 사용자 수 확인
- [ ] API 응답 시간 확인
- [ ] 에러 로그 분석
- [ ] 리소스 사용량 확인

## 🔍 디버깅 명령어

### 브라우저 콘솔 (F12)
```javascript
// API 상태 확인
fetch('https://marketgrow-production-c586.up.railway.app/api/health')
  .then(r => r.json())
  .then(console.log)

// 로컬 스토리지 확인
console.log('Token:', localStorage.getItem('authToken'))
console.log('User:', localStorage.getItem('userInfo'))

// 소셜 로그인 상태
window.debugGoogleAuth()
```

### Railway CLI
```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 로그 보기
railway logs

# 환경변수 보기
railway variables
```

## 📞 긴급 연락처

### 서비스 장애 시
- **담당자**: 박시현
- **이메일**: marketgrow.kr@gmail.com
- **전화**: 010-5772-8658

### 외부 서비스 지원
- **Railway**: https://railway.app/help
- **Netlify**: https://www.netlify.com/support
- **MongoDB Atlas**: https://www.mongodb.com/support

## 📝 로그 수집 및 분석

### 중요 로그 패턴
```
SUCCESS: "로그인 성공|회원가입 완료|결제 성공"
WARNING: "Rate limit|Slow query|High memory"
ERROR: "Connection failed|Authentication error|Payment failed"
```

### 주간 리포트 항목
1. 총 사용자 수
2. 신규 가입자
3. 주문 건수
4. 에러 발생 횟수
5. 평균 응답 시간
6. 서버 가동률

---

**마지막 업데이트**: 2024-01-13
**다음 검토일**: 2024-01-20