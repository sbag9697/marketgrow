# 📱 실제 SMS 인증 구현 가이드

## 🎯 현재 상황
- 프론트엔드는 완성됨 (전화번호 인증 UI 및 로직)
- Mock 모드로 테스트 가능 (인증번호: 123456)
- **실제 SMS 발송을 위해서는 SMS API 서비스 필요**

## 📞 SMS 서비스 옵션

### 1. **Twilio (추천 - 가장 쉬움)**
- **장점**: 무료 크레딧 $15, 즉시 시작 가능, 한국 번호 지원
- **가격**: SMS 1건당 약 $0.04 (약 50원)
- **설정 시간**: 10분

#### 빠른 시작:
1. [Twilio 가입](https://www.twilio.com/try-twilio)
2. 무료 체험 크레딧 받기
3. Phone Number 구매 (무료 크레딧으로 가능)
4. 아래 코드 사용

```javascript
// .env 파일
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

// 설치
npm install twilio express cors dotenv
```

### 2. **알리고 (한국 전문)**
- **장점**: 저렴함 (건당 16원), 한국 특화
- **단점**: 사업자등록증 필요, 발신번호 사전등록
- **설정 시간**: 1-2일 (발신번호 승인)

#### 설정 방법:
1. [알리고 가입](https://smartsms.aligo.in)
2. 충전 (최소 1만원)
3. 발신번호 등록 (사업자등록증 필요)
4. API 키 발급

### 3. **네이버 클라우드 SENS**
- **장점**: 월 50건 무료, 안정적
- **단점**: 설정이 복잡함
- **가격**: 50건 이후 건당 9원

## 🚀 즉시 실행 가능한 서버 코드

### backend/sms-server.js
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Twilio 설정 (가장 빠른 방법)
const twilio = require('twilio');
const client = twilio(
    'ACxxxxxx', // Account SID
    'xxxxxx'    // Auth Token
);

// 인증번호 저장
const codes = new Map();

// 인증번호 발송
app.post('/api/sms/send-verification', async (req, res) => {
    const { phone } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 인증번호 저장
    codes.set(phone, code);
    
    try {
        // Twilio SMS 발송
        await client.messages.create({
            body: `[MarketGrow] 인증번호: ${code}`,
            from: '+1234567890', // Twilio 번호
            to: '+82' + phone.substring(1) // 010 -> +8210
        });
        
        res.json({ 
            success: true, 
            message: '인증번호가 발송되었습니다' 
        });
    } catch (error) {
        console.error(error);
        res.json({ 
            success: false, 
            message: 'SMS 발송 실패' 
        });
    }
});

// 인증번호 확인
app.post('/api/sms/verify-code', (req, res) => {
    const { phone, code } = req.body;
    
    if (codes.get(phone) === code) {
        codes.delete(phone);
        res.json({ 
            success: true, 
            message: '인증 완료' 
        });
    } else {
        res.json({ 
            success: false, 
            message: '인증번호 불일치' 
        });
    }
});

app.listen(5001, () => {
    console.log('SMS 서버 실행 중: http://localhost:5001');
});
```

## 💰 무료로 테스트하는 방법

### 옵션 1: Twilio 무료 크레딧
1. Twilio 가입 시 $15 무료 크레딧
2. 약 300건의 SMS 발송 가능
3. 신용카드 등록 불필요

### 옵션 2: 로컬 테스트 (실제 발송 없이)
```javascript
// 개발 중에는 콘솔에만 출력
async function sendSMS(phone, message) {
    console.log(`📱 SMS to ${phone}: ${message}`);
    return { success: true };
}
```

## 🔧 프론트엔드 설정 변경

### js/config.js 수정
```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:5001/api', // 로컬 SMS 서버
    // BASE_URL: 'https://your-server.com/api', // 프로덕션
};
```

## 📝 실행 순서

### 1. 백엔드 서버 실행
```bash
cd backend
npm install express cors twilio dotenv
node sms-server.js
```

### 2. Mock 모드 비활성화
브라우저 콘솔에서:
```javascript
localStorage.removeItem('useMockServer');
```

### 3. 테스트
- signup.html 페이지에서 전화번호 인증 시도
- 실제 SMS가 발송됨

## ⚡ 가장 빠른 방법 (5분)

1. **Twilio 가입** → 무료 크레딧 받기
2. **backend/quick-sms.js** 파일 생성:
```javascript
// 5분 만에 시작하는 SMS 서버
const express = require('express');
const app = express();
app.use(require('cors')());
app.use(express.json());

const CODES = {};

app.post('/api/sms/send-verification', (req, res) => {
    const code = '123456'; // 테스트용 고정 코드
    CODES[req.body.phone] = code;
    console.log(`SMS: ${req.body.phone} → ${code}`);
    res.json({ success: true, testCode: code });
});

app.post('/api/sms/verify-code', (req, res) => {
    const valid = CODES[req.body.phone] === req.body.code;
    res.json({ success: valid });
});

app.listen(5001, () => console.log('http://localhost:5001'));
```

3. **실행**:
```bash
npm install express cors
node quick-sms.js
```

## 🆘 도움이 필요하신가요?

### 문제: "서버 연결 안됨"
- 해결: `http://localhost:5001` 서버가 실행 중인지 확인

### 문제: "SMS가 안와요"
- 해결: Twilio 크레딧 확인, 전화번호 형식 확인 (+8210...)

### 문제: "비용이 부담됩니다"
- 해결: 개발 중에는 테스트 모드 사용, 프로덕션에서만 실제 발송

## 📌 요약

1. **테스트만 하려면**: 현재 Mock 모드 그대로 사용 (인증번호: 123456)
2. **실제 SMS 원하면**: Twilio 가입 → 무료 크레딧 → 5분 설정
3. **한국 전용 원하면**: 알리고 사용 (사업자등록증 필요)

---

**준비되셨나요?** 위 가이드를 따라하시면 5-10분 내에 실제 SMS 인증을 구현할 수 있습니다! 🚀