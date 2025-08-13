# 🔐 소셜 로그인 구현 가이드

## 1. 카카오 로그인

### Step 1: 카카오 개발자 앱 생성
1. https://developers.kakao.com 접속
2. **내 애플리케이션** → **애플리케이션 추가하기**
3. 앱 정보 입력:
   - 앱 이름: MarketGrow
   - 사업자명: (사업자명 입력)
4. **앱 키** 저장:
   - JavaScript 키: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - REST API 키: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: 플랫폼 등록
1. **앱 설정** → **플랫폼**
2. **Web 플랫폼 등록**
3. 사이트 도메인: 
   - `https://marketgrow.kr`
   - `http://localhost:3000` (개발용)

### Step 3: 카카오 로그인 설정
1. **제품 설정** → **카카오 로그인**
2. **활성화 설정**: ON
3. **Redirect URI 등록**:
   - `https://marketgrow.kr/auth/kakao/callback`
   - `https://marketgrow-production-c586.up.railway.app/api/oauth/kakao/callback`

### Step 4: 동의 항목 설정
1. **동의항목** 메뉴
2. 필수 동의:
   - 닉네임
   - 이메일
3. 선택 동의:
   - 프로필 이미지
   - 전화번호

---

## 2. 네이버 로그인

### Step 1: 네이버 개발자 센터
1. https://developers.naver.com 접속
2. **Application** → **애플리케이션 등록**
3. 애플리케이션 정보:
   - 애플리케이션 이름: MarketGrow
   - 사용 API: 네이버 로그인
   - 서비스 환경: PC웹, 모바일웹

### Step 2: 로그인 오픈API 설정
1. **서비스 URL**: https://marketgrow.kr
2. **Callback URL**: 
   - `https://marketgrow.kr/auth/naver/callback`
   - `https://marketgrow-production-c586.up.railway.app/api/oauth/naver/callback`
3. **필수 정보**:
   - 이메일
   - 이름
   - 별명

### Step 3: 키 저장
- Client ID: `xxxxxxxxxxxxxxxxxx`
- Client Secret: `xxxxxxxxxx`

---

## 3. 구글 로그인

### Step 1: Google Cloud Console
1. https://console.cloud.google.com 접속
2. **새 프로젝트 생성**: MarketGrow
3. **API 및 서비스** → **사용자 인증 정보**

### Step 2: OAuth 2.0 클라이언트 ID 생성
1. **사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
2. 애플리케이션 유형: **웹 애플리케이션**
3. 이름: MarketGrow Web Client
4. **승인된 JavaScript 원본**:
   - `https://marketgrow.kr`
   - `http://localhost:3000`
5. **승인된 리디렉션 URI**:
   - `https://marketgrow.kr/auth/google/callback`
   - `https://marketgrow-production-c586.up.railway.app/api/oauth/google/callback`

### Step 3: 키 저장
- Client ID: `xxxxxxxxxxxxx.apps.googleusercontent.com`
- Client Secret: `xxxxxxxxxxxxx`

---

## 4. 프론트엔드 구현

### login.html에 추가할 코드:

```html
<!-- 소셜 로그인 버튼 섹션 -->
<div class="social-login-section">
    <div class="divider">
        <span>또는</span>
    </div>
    
    <div class="social-buttons">
        <!-- 카카오 로그인 -->
        <button type="button" class="social-btn kakao" onclick="loginWithKakao()">
            <img src="https://developers.kakao.com/assets/img/about/logos/kakao/kakao_logo_yellow.png" alt="카카오">
            카카오로 시작하기
        </button>
        
        <!-- 네이버 로그인 -->
        <button type="button" class="social-btn naver" onclick="loginWithNaver()">
            <img src="https://static.nid.naver.com/oauth/small_g_in.PNG" alt="네이버">
            네이버로 시작하기
        </button>
        
        <!-- 구글 로그인 -->
        <button type="button" class="social-btn google" onclick="loginWithGoogle()">
            <img src="https://developers.google.com/identity/images/g-logo.png" alt="구글">
            구글로 시작하기
        </button>
    </div>
</div>

<!-- 카카오 SDK -->
<script src="https://developers.kakao.com/sdk/js/kakao.js"></script>

<!-- 구글 SDK -->
<script src="https://accounts.google.com/gsi/client" async defer></script>

<script>
// 카카오 초기화
Kakao.init('YOUR_KAKAO_JAVASCRIPT_KEY');

// 카카오 로그인
function loginWithKakao() {
    Kakao.Auth.authorize({
        redirectUri: 'https://marketgrow.kr/auth/kakao/callback'
    });
}

// 네이버 로그인
function loginWithNaver() {
    const clientId = 'YOUR_NAVER_CLIENT_ID';
    const redirectUri = encodeURIComponent('https://marketgrow.kr/auth/naver/callback');
    const state = Math.random().toString(36).substring(7);
    const url = `https://nid.naver.com/oauth2.0/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`;
    window.location.href = url;
}

// 구글 로그인
function loginWithGoogle() {
    const clientId = 'YOUR_GOOGLE_CLIENT_ID';
    const redirectUri = 'https://marketgrow.kr/auth/google/callback';
    const scope = 'email profile';
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline`;
    window.location.href = url;
}
</script>
```

### CSS 스타일:

```css
.social-login-section {
    margin-top: 30px;
}

.divider {
    text-align: center;
    margin: 20px 0;
    position: relative;
}

.divider::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 100%;
    height: 1px;
    background: #e0e0e0;
}

.divider span {
    background: white;
    padding: 0 15px;
    position: relative;
    color: #999;
}

.social-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.social-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 14px;
    font-weight: 500;
}

.social-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.social-btn img {
    width: 20px;
    height: 20px;
}

.social-btn.kakao {
    background: #FEE500;
    border-color: #FEE500;
    color: #000;
}

.social-btn.naver {
    background: #03C75A;
    border-color: #03C75A;
    color: white;
}

.social-btn.google {
    background: white;
    border-color: #4285F4;
    color: #4285F4;
}
```

---

## 5. 백엔드 OAuth 처리

### Railway 환경변수 추가:
```
# 카카오
KAKAO_CLIENT_ID=your_rest_api_key
KAKAO_CLIENT_SECRET=your_client_secret
KAKAO_REDIRECT_URI=https://marketgrow.kr/auth/kakao/callback

# 네이버
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
NAVER_REDIRECT_URI=https://marketgrow.kr/auth/naver/callback

# 구글
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://marketgrow.kr/auth/google/callback
```

---

## 6. 콜백 페이지 생성

`auth-callback.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>로그인 처리 중...</title>
</head>
<body>
    <div style="text-align: center; margin-top: 100px;">
        <h2>로그인 처리 중입니다...</h2>
        <p>잠시만 기다려주세요.</p>
    </div>
    
    <script>
    // URL에서 provider와 code 추출
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const provider = window.location.pathname.split('/')[2]; // kakao, naver, google
    
    if (code && provider) {
        // 백엔드로 인증 코드 전송
        fetch(`https://marketgrow-production-c586.up.railway.app/api/oauth/${provider}/callback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // 토큰 저장
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                // 대시보드로 이동
                window.location.href = '/dashboard.html';
            } else {
                alert('로그인 실패: ' + data.message);
                window.location.href = '/login.html';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('로그인 처리 중 오류가 발생했습니다.');
            window.location.href = '/login.html';
        });
    }
    </script>
</body>
</html>
```

---

## 7. 체크리스트

### 카카오
- [ ] 앱 생성 완료
- [ ] JavaScript 키 획득
- [ ] 플랫폼 등록
- [ ] Redirect URI 설정
- [ ] 동의 항목 설정

### 네이버
- [ ] 애플리케이션 등록
- [ ] Client ID/Secret 획득
- [ ] Callback URL 설정
- [ ] 필수 정보 설정

### 구글
- [ ] 프로젝트 생성
- [ ] OAuth 2.0 설정
- [ ] Client ID/Secret 획득
- [ ] 승인된 URI 설정

### 코드
- [ ] login.html 수정
- [ ] auth-callback.html 생성
- [ ] CSS 스타일 추가
- [ ] Railway 환경변수 설정

---

## 8. 테스트

1. 각 소셜 로그인 버튼 클릭
2. 해당 플랫폼 로그인
3. 권한 동의
4. MarketGrow로 리다이렉트
5. 대시보드 접속 확인

---

**참고**: 
- 각 플랫폼의 앱 심사가 필요할 수 있습니다
- 개발 모드에서는 테스트 계정만 사용 가능
- 프로덕션 배포 시 앱 검수 필요