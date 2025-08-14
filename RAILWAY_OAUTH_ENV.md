# 🔐 Railway OAuth 환경변수 설정

## Railway에 추가해야 할 환경변수

### 1. Google OAuth
```
GOOGLE_CLIENT_ID=1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=(Google Cloud Console에서 확인)
```

### 2. Kakao OAuth
```
KAKAO_CLIENT_ID=a7b2ddf2636cdeb3faff0517c5ec6591
KAKAO_CLIENT_SECRET=(Kakao Developers에서 확인)
```

### 3. Naver OAuth (옵션)
```
NAVER_CLIENT_ID=(Naver Developers에서 발급)
NAVER_CLIENT_SECRET=(Naver Developers에서 발급)
```

## Google Client Secret 찾기

1. https://console.cloud.google.com 접속
2. **API 및 서비스** → **사용자 인증 정보**
3. OAuth 2.0 클라이언트 ID 클릭
4. **클라이언트 보안 비밀번호** 확인

## Kakao Client Secret 찾기

1. https://developers.kakao.com 접속
2. 앱 선택
3. **앱 설정** → **앱 키**
4. **REST API 키**: `a7b2ddf2636cdeb3faff0517c5ec6591`
5. **보안** → **Client Secret** 확인 (생성 필요한 경우)

## Railway 설정 방법

1. https://railway.app 로그인
2. **sns-marketing-site** 프로젝트
3. **backend** 서비스 클릭
4. **Variables** 탭
5. 환경변수 추가/수정
6. 자동 재배포 대기

## 현재 백엔드 OAuth 상태

✅ **구현 완료**:
- Google OAuth 컨트롤러
- Kakao OAuth 컨트롤러  
- Naver OAuth 컨트롤러
- JWT 토큰 생성
- 사용자 자동 생성/업데이트

## 테스트 엔드포인트

```bash
# Google OAuth
POST https://marketgrow-production.up.railway.app/api/oauth/google
Body: { "token": "google_id_token" }

# Kakao OAuth
POST https://marketgrow-production.up.railway.app/api/oauth/kakao
Body: { "token": "kakao_access_token" }

# Naver OAuth
POST https://marketgrow-production.up.railway.app/api/oauth/naver
Body: { "token": "naver_access_token" }
```

## 주의사항

- Client Secret은 절대 프론트엔드 코드에 포함하지 마세요
- Railway 환경변수로만 관리하세요
- 백엔드에서만 사용합니다