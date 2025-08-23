# MongoDB URI 설정 가이드

## 현재 테스트할 URI 옵션들

### A) 비TLS 연결 (기본)
```
mongodb://mongo:<PASSWORD>@turntable.proxy.rlwy.net:41740/marketgrow?authSource=admin&directConnection=true&serverSelectionTimeoutMS=5000
```

### B) TLS 강제 연결
```
mongodb://mongo:<PASSWORD>@turntable.proxy.rlwy.net:41740/marketgrow?authSource=admin&directConnection=true&tls=true&tlsAllowInvalidCertificates=true&serverSelectionTimeoutMS=5000
```

## Netlify 환경변수 설정 방법

1. Netlify Dashboard → Site settings → Environment variables
2. `MONGODB_URI` 변수 편집
3. 위 URI 중 하나를 선택하여 붙여넣기
4. `<PASSWORD>`를 실제 비밀번호로 교체
5. Deploy → Clear cache and deploy 클릭

## 진단 테스트

배포 후 다음 명령으로 연결 상태 확인:

```bash
curl -s https://marketgrow.kr/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"diagnose"}' | jq
```

### 성공 응답 예시
```json
{
  "success": true,
  "db": {
    "ok": true
  }
}
```

### 실패 응답 분석

- `MongoServerError: Authentication failed` → 비밀번호 또는 authSource 문제
- `server selection timed out` → 네트워크/포트/directConnection 문제  
- `SSL handshake failed` → TLS 옵션 B 시도 필요

## 로컬 테스트 (mongosh)

```bash
# 비TLS
mongosh "mongodb://mongo:<PASSWORD>@turntable.proxy.rlwy.net:41740/marketgrow?authSource=admin"

# TLS
mongosh "mongodb://mongo:<PASSWORD>@turntable.proxy.rlwy.net:41740/marketgrow?authSource=admin&tls=true&tlsAllowInvalidCertificates=true"
```

## 주의사항

1. 비밀번호에 특수문자가 있으면 URL 인코딩 필요
2. URI 끝에 공백이나 줄바꿈이 없도록 주의
3. Netlify 환경변수는 Production 환경에 설정
4. 변경 후 반드시 재배포 필요