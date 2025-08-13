# 🔧 회원가입 문제 해결 가이드

## 현재 상황

### ✅ 정상 작동:
- **백엔드 API**: 정상 (CURL 테스트 성공)
- **MongoDB**: 연결됨
- **CORS**: 모든 origin 허용 설정

### ❌ 문제:
- 웹사이트에서 회원가입 버튼 클릭 시 작동 안 함

## 🔍 즉시 확인할 사항

### 1. 브라우저 콘솔 확인 (F12)
https://marketgrow.kr/signup.html 접속 후:

1. **F12** 키 누르기
2. **Console** 탭 클릭
3. 회원가입 시도
4. 빨간색 오류 메시지 확인

### 2. 네트워크 탭 확인
1. F12 → **Network** 탭
2. 회원가입 시도
3. `register` 요청 찾기
4. 상태 코드 확인 (200? 400? 500?)

## 🧪 테스트 파일 사용

### test-signup.html 사용:
1. `test-signup.html` 파일을 브라우저에서 열기
2. "랜덤 데이터 생성" 클릭
3. "회원가입 테스트" 클릭
4. 결과 확인

## 🔴 일반적인 문제와 해결법

### 1. "아무 반응이 없어요"
**원인**: JavaScript 오류

**해결**:
```javascript
// 브라우저 콘솔(F12)에서 실행
console.log('API URL:', 'https://marketgrow-production-c586.up.railway.app/api');

// 직접 회원가입 테스트
fetch('https://marketgrow-production-c586.up.railway.app/api/auth/register', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        username: 'test' + Date.now(),
        email: 'test' + Date.now() + '@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        phone: '010' + Math.floor(Math.random() * 100000000)
    })
}).then(r => r.json()).then(console.log);
```

### 2. "이미 사용 중인 전화번호입니다"
**원인**: 중복된 전화번호

**해결**: 다른 전화번호 사용 (예: 01012341234)

### 3. "서버 연결 실패"
**원인**: 네트워크 문제 또는 백엔드 다운

**해결**:
1. https://marketgrow-production-c586.up.railway.app/api/health 접속
2. `{"status":"OK"}` 확인

## 📝 회원가입 필수 조건

### 입력값 검증:
- **아이디**: 4-16자, 영문+숫자
- **이메일**: 유효한 이메일 형식
- **비밀번호**: 8자 이상, 영문+숫자+특수문자
- **이름**: 2자 이상
- **전화번호**: 010으로 시작하는 11자리

### 예시 데이터:
```json
{
    "username": "testuser123",
    "email": "test123@example.com",
    "password": "Test123!@#",
    "name": "테스트",
    "phone": "01012345678"
}
```

## 🚀 빠른 해결책

### 1. 캐시 삭제
- Ctrl + Shift + Delete
- "캐시된 이미지 및 파일" 선택
- 삭제

### 2. 시크릿 모드 사용
- Ctrl + Shift + N (Chrome)
- https://marketgrow.kr/signup.html 접속
- 회원가입 시도

### 3. 다른 브라우저 사용
- Edge, Firefox, Safari 등

## 💡 임시 해결책

### 직접 API 호출로 회원가입:
```bash
# Windows PowerShell에서 실행
$body = @{
    username = "newuser$(Get-Random -Maximum 9999)"
    email = "newuser$(Get-Random -Maximum 9999)@example.com"
    password = "Test123!@#"
    name = "New User"
    phone = "010$(Get-Random -Minimum 10000000 -Maximum 99999999)"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://marketgrow-production-c586.up.railway.app/api/auth/register" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

## 🔍 디버깅 체크리스트

- [ ] 브라우저 콘솔에 오류 메시지 있는가?
- [ ] 네트워크 탭에서 API 요청이 보이는가?
- [ ] API 응답 상태 코드는 무엇인가?
- [ ] 입력값이 모든 조건을 만족하는가?
- [ ] 캐시 삭제 후 재시도했는가?
- [ ] 시크릿 모드에서 시도했는가?

## 📞 추가 지원

정확한 오류 메시지나 콘솔 로그를 제공해주시면 더 구체적인 해결책을 제시할 수 있습니다.

**테스트 계정** (이미 생성됨):
- 아이디: newuser456
- 비밀번호: Test123!@#