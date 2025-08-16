# Railway MongoDB 긴급 마이그레이션 가이드

## 🚨 즉시 실행 (10분 소요)

### 1. Railway MongoDB 배포 (3분)
1. [Railway](https://railway.app) 로그인
2. **New Project** 클릭
3. **Deploy from Template** → **MongoDB** 선택
4. 프로젝트 이름 설정 (예: marketgrow-db)
5. **Deploy** 클릭

### 2. MongoDB 연결 정보 가져오기 (1분)
1. 배포된 MongoDB 서비스 클릭
2. **Variables** 탭 이동
3. **MONGO_URL** 값 복사 (mongodb://mongo:xxx@xxx.railway.app:xxx 형태)

### 3. Render 환경 변수 업데이트 (3분)
1. [Render Dashboard](https://dashboard.render.com) 접속
2. `marketgrow` 서비스 선택
3. **Environment** 탭 클릭
4. 다음 환경 변수 수정/추가:

```bash
# MongoDB 설정 (Railway URL로 교체)
MONGODB_URI=<Railway에서 복사한 MONGO_URL>

# SMM 동기화 비활성화
SMM_ENABLED=false

# 프로덕션 모드
NODE_ENV=production

# Trust Proxy 보안 설정
TRUST_PROXY_HOPS=1

# 테스트 모드 비활성화
USE_TEST_MODE=false
```

5. **Save Changes** 클릭
6. 자동 재배포 시작

### 4. 배포 확인 (3분)
1. Render Logs에서 확인:
   - "Using Railway MongoDB" 메시지
   - "MongoDB connected successfully" 메시지
   - "SMM order sync service disabled" 메시지

2. 헬스체크:
   ```
   https://marketgrow.onrender.com/api/health
   ```
   응답에서 `mongodb: "Connected"` 확인

3. 회원가입 테스트:
   ```
   https://marketgrow-snsmarketing.netlify.app/signup.html
   ```

## 🔒 보안 강화 필수 작업

### MongoDB Atlas 크레덴셜 즉시 변경
⚠️ **레포지토리에 크레덴셜이 노출됨!**

1. MongoDB Atlas 접속
2. Database Access → 기존 사용자 삭제
3. 새 사용자 생성 (새 비밀번호)
4. 단, Railway를 사용하므로 당장은 불필요

### Git 히스토리 정리
```bash
# .env 파일에서 민감 정보 제거
echo "MONGODB_URI=REDACTED" > backend/.env.example
git rm --cached backend/.env
echo "backend/.env" >> .gitignore
git add .
git commit -m "Remove sensitive credentials"
git push
```

## ✅ 완료 체크리스트

- [ ] Railway MongoDB 배포 완료
- [ ] MONGO_URL 복사
- [ ] Render 환경 변수 업데이트
- [ ] 재배포 시작
- [ ] MongoDB 연결 성공 확인
- [ ] 헬스체크 정상 응답
- [ ] 회원가입 테스트 성공
- [ ] Atlas 크레덴셜 변경/삭제

## 🎯 예상 결과

1. **DNS 문제 해결**: Railway는 일반 mongodb:// 프로토콜 사용
2. **안정적인 연결**: Render ↔ Railway 간 직접 연결
3. **SMM 동기화 오류 해결**: 프로덕션에서 자동 비활성화
4. **Rate Limit 보안 강화**: Trust proxy 1 hop 제한

## 📊 모니터링

Railway Dashboard:
- MongoDB 메모리 사용량
- 연결 수
- 쿼리 성능

Render Logs:
- 에러 로그 없음
- 정상 API 요청/응답

## 🆘 문제 발생 시

1. **Railway MongoDB 연결 실패**
   - Railway 서비스 재시작
   - 연결 문자열 형식 확인
   
2. **Render 재배포 실패**
   - 환경 변수 형식 확인
   - Manual Deploy 시도

3. **여전히 DNS 에러**
   - USE_TEST_MODE=true로 임시 전환
   - Railway 지원팀 문의

## 📝 향후 계획

1. **1주일 후**: Railway MongoDB 안정성 평가
2. **필요시**: MongoDB Atlas 재시도 또는 유료 플랜 고려
3. **장기**: 자체 MongoDB 인스턴스 운영 검토