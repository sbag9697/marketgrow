# Render 환경변수 설정 (CoolSMS)

## Render Dashboard에서 설정하기

### 1. Render 접속
- https://dashboard.render.com
- 로그인

### 2. 서비스 선택
- `marketgrow-backend` 클릭

### 3. Environment Variables 추가
- 좌측 메뉴 **Environment** 클릭
- **Environment Variables** 섹션

### 4. 변수 추가 (Add Environment Variable)

```
COOLSMS_API_KEY = [CoolSMS API Key]
COOLSMS_API_SECRET = [CoolSMS API Secret]  
COOLSMS_SENDER = [발신번호 - 하이픈 없이]
```

### 5. 저장
- **Save Changes** 클릭
- 자동 재배포 (2-3분)

### 6. 확인
- **Logs** 탭에서 확인
- "CoolSMS configured successfully" 메시지 확인

---

## 환경변수 예시

```
COOLSMS_API_KEY = NCS1234567890ABCDEF
COOLSMS_API_SECRET = a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
COOLSMS_SENDER = 01012345678
```

⚠️ **주의**: 실제 값으로 교체하세요!