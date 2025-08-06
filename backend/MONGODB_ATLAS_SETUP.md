# MongoDB Atlas 설정 후 .env 파일 수정

## .env 파일에서 MONGODB_URI 수정하기

1. `backend\.env` 파일 열기
2. MONGODB_URI 라인 찾기
3. 아래와 같이 수정:

```
MONGODB_URI=mongodb+srv://marketgrow:marketgrow123!@marketgrow-cluster.xxxxx.mongodb.net/marketgrow?retryWrites=true&w=majority
```

주의사항:
- `<password>` 부분을 실제 비밀번호로 변경
- `xxxxx` 부분은 실제 클러스터 주소로 자동 제공됨
- `/marketgrow` 는 데이터베이스 이름