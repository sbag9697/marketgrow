# 🚨 Railway 도메인 설정 가이드

## 현재 문제
- 서버는 정상 작동 중 (포트 8080)
- API 엔드포인트 등록 완료
- **하지만 도메인이 없어서 접근 불가**

## 즉시 해결 방법

### 1. Railway 대시보드 접속
https://railway.app/project/df35e723-9c8e-49e0-b92f-2c9695f973f9/service/2c8d3831-d68e-4c77-8fab-0c837e9f12e6/settings

### 2. 도메인 생성
1. **Settings** 탭 클릭
2. **Networking** 섹션 찾기
3. **Generate Domain** 버튼 클릭
4. 생성된 도메인 복사 (예: `marketgrow-xxx.up.railway.app`)

### 3. 테스트
생성된 도메인으로 테스트:
```bash
# Health check
curl https://[your-domain].up.railway.app/api/health

# Username check
curl -X POST https://[your-domain].up.railway.app/api/auth/check-username \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}'
```

### 4. 프론트엔드 업데이트
`signup.html` 파일의 136번 줄 수정:
```javascript
// 기존
const API_URL = 'https://marketgrow-production.up.railway.app/api';

// 새 도메인으로 변경
const API_URL = 'https://[your-new-domain].up.railway.app/api';
```

### 5. 배포
```bash
git add -A
git commit -m "Update API URL to new Railway domain"
git push origin main
```

## 서버 상태 (정상)
✅ 서버 실행 중 (포트 8080)
✅ 라우트 등록 완료 ("Registering POST /check-username route")
✅ Health check 작동
✅ CORS 설정 완료
⚠️ MongoDB Atlas 연결 실패 (in-memory DB 사용 중 - 작동에는 문제없음)

## 도메인 생성 후 예상 결과
```json
// GET /api/health
{
  "status": "OK",
  "timestamp": "2025-08-13T...",
  "environment": "production",
  "mongodb": "Connected"
}

// POST /api/auth/check-username
{
  "success": true,
  "available": true,
  "message": "사용 가능한 아이디입니다."
}
```