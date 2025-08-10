# 보안 설정 가이드

## 환경변수 설정

### 1. Netlify 배포 시
1. Netlify 대시보드에서 Site settings > Environment variables로 이동
2. 다음 변수들을 추가:
   - `TOSS_CLIENT_KEY`: 토스페이먼츠 클라이언트 키
   - `TOSS_SECRET_KEY`: 토스페이먼츠 시크릿 키 (서버용)

### 2. 로컬 개발 시
1. `.env.example` 파일을 `.env`로 복사
2. 실제 API 키 값으로 변경
3. `.env` 파일은 절대 Git에 커밋하지 마세요

### 3. HTML에서 환경변수 사용
```html
<script>
  // Netlify가 빌드 시 주입
  window.TOSS_CLIENT_KEY = '%TOSS_CLIENT_KEY%';
</script>
```

## 보안 체크리스트
- [ ] 모든 API 키가 환경변수로 관리되는지 확인
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 프로덕션과 개발 환경의 키가 분리되어 있는지 확인
- [ ] HTTPS 사용 여부 확인
- [ ] CORS 설정이 적절한지 확인

## 주의사항
- 절대 API 키를 코드에 하드코딩하지 마세요
- 클라이언트 사이드 코드에는 공개 키만 사용하세요
- 시크릿 키는 서버 사이드에서만 사용하세요