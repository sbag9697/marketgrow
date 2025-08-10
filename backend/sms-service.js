// SMS 발송 서비스 - 실제 SMS 발송을 위한 백엔드 코드

// ==========================================
// 옵션 1: Twilio (국제 서비스, 한국 지원)
// ==========================================
const twilioExample = {
    // 1. Twilio 가입: https://www.twilio.com
    // 2. 무료 크레딧 $15 제공 (테스트 가능)
    // 3. 한국 번호로 SMS 발송 가능
    
    setup: `
    npm install twilio
    `,
    
    code: `
    const twilio = require('twilio');
    
    // Twilio 계정 정보 (https://console.twilio.com)
    const accountSid = 'YOUR_ACCOUNT_SID';
    const authToken = 'YOUR_AUTH_TOKEN';
    const twilioPhoneNumber = '+1234567890'; // Twilio에서 구매한 번호
    
    const client = twilio(accountSid, authToken);
    
    async function sendSMS(to, message) {
        try {
            const result = await client.messages.create({
                body: message,
                from: twilioPhoneNumber,
                to: '+82' + to.substring(1) // 010 -> +8210
            });
            
            console.log('SMS 발송 성공:', result.sid);
            return { success: true, messageId: result.sid };
        } catch (error) {
            console.error('SMS 발송 실패:', error);
            return { success: false, error: error.message };
        }
    }
    `
};

// ==========================================
// 옵션 2: 알리고 (한국 전문 서비스)
// ==========================================
const aligoExample = {
    // 1. 알리고 가입: https://smartsms.aligo.in
    // 2. 충전 후 사용 (건당 약 16원)
    // 3. 한국 번호 전용
    
    setup: `
    npm install axios form-data
    `,
    
    code: `
    const axios = require('axios');
    const FormData = require('form-data');
    
    // 알리고 API 정보
    const ALIGO_API_KEY = 'YOUR_API_KEY';
    const ALIGO_USER_ID = 'YOUR_USER_ID';
    const ALIGO_SENDER = '01012345678'; // 발신번호 (사전등록 필요)
    
    async function sendSMS(to, message) {
        const form = new FormData();
        form.append('key', ALIGO_API_KEY);
        form.append('user_id', ALIGO_USER_ID);
        form.append('sender', ALIGO_SENDER);
        form.append('receiver', to);
        form.append('msg', message);
        form.append('msg_type', 'SMS');
        
        try {
            const response = await axios.post(
                'https://apis.aligo.in/send/',
                form,
                { headers: form.getHeaders() }
            );
            
            if (response.data.result_code === '1') {
                console.log('SMS 발송 성공');
                return { success: true, data: response.data };
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error('SMS 발송 실패:', error);
            return { success: false, error: error.message };
        }
    }
    `
};

// ==========================================
// 옵션 3: 네이버 클라우드 플랫폼 SENS
// ==========================================
const naverCloudExample = {
    // 1. 네이버 클라우드 플랫폼 가입: https://www.ncloud.com
    // 2. SENS (Simple & Easy Notification Service) 활성화
    // 3. 월 50건 무료
    
    setup: `
    npm install crypto-js axios
    `,
    
    code: `
    const CryptoJS = require('crypto-js');
    const axios = require('axios');
    
    // 네이버 클라우드 플랫폼 인증 정보
    const NCP_SERVICE_ID = 'YOUR_SERVICE_ID';
    const NCP_ACCESS_KEY = 'YOUR_ACCESS_KEY';
    const NCP_SECRET_KEY = 'YOUR_SECRET_KEY';
    const NCP_FROM_NUMBER = '01012345678'; // 발신번호
    
    function makeSignature(method, url, timestamp, accessKey, secretKey) {
        const space = " ";
        const newLine = "\\n";
        const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
        
        hmac.update(method);
        hmac.update(space);
        hmac.update(url);
        hmac.update(newLine);
        hmac.update(timestamp);
        hmac.update(newLine);
        hmac.update(accessKey);
        
        const hash = hmac.finalize();
        return hash.toString(CryptoJS.enc.Base64);
    }
    
    async function sendSMS(to, message) {
        const timestamp = Date.now().toString();
        const url = \`/sms/v2/services/\${NCP_SERVICE_ID}/messages\`;
        const signature = makeSignature('POST', url, timestamp, NCP_ACCESS_KEY, NCP_SECRET_KEY);
        
        const body = {
            type: 'SMS',
            from: NCP_FROM_NUMBER,
            content: message,
            messages: [{ to: to }]
        };
        
        try {
            const response = await axios.post(
                \`https://sens.apigw.ntruss.com\${url}\`,
                body,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-ncp-apigw-timestamp': timestamp,
                        'x-ncp-iam-access-key': NCP_ACCESS_KEY,
                        'x-ncp-apigw-signature-v2': signature
                    }
                }
            );
            
            console.log('SMS 발송 성공:', response.data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('SMS 발송 실패:', error);
            return { success: false, error: error.message };
        }
    }
    `
};

// ==========================================
// Express 서버 통합 코드
// ==========================================
const expressIntegration = `
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 인증번호 저장소 (실제로는 Redis 등 사용 권장)
const verificationCodes = new Map();

// 6자리 랜덤 인증번호 생성
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// SMS 발송 엔드포인트
app.post('/api/sms/send-verification', async (req, res) => {
    const { phone, type } = req.body;
    
    if (!phone) {
        return res.status(400).json({
            success: false,
            message: '전화번호를 입력해주세요'
        });
    }
    
    // 인증번호 생성
    const code = generateCode();
    const message = \`[MarketGrow] 인증번호: \${code}\`;
    
    // 인증번호 저장 (5분 후 만료)
    verificationCodes.set(phone, {
        code: code,
        timestamp: Date.now(),
        type: type
    });
    
    // 5분 후 자동 삭제
    setTimeout(() => {
        verificationCodes.delete(phone);
    }, 5 * 60 * 1000);
    
    // SMS 발송 (위의 서비스 중 선택)
    const result = await sendSMS(phone, message);
    
    if (result.success) {
        res.json({
            success: true,
            message: '인증번호가 발송되었습니다',
            expiresIn: 300 // 5분
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'SMS 발송에 실패했습니다'
        });
    }
});

// 인증번호 확인 엔드포인트
app.post('/api/sms/verify-code', (req, res) => {
    const { phone, code } = req.body;
    
    const saved = verificationCodes.get(phone);
    
    if (!saved) {
        return res.status(400).json({
            success: false,
            message: '인증번호를 먼저 요청해주세요'
        });
    }
    
    // 시간 만료 체크 (5분)
    if (Date.now() - saved.timestamp > 5 * 60 * 1000) {
        verificationCodes.delete(phone);
        return res.status(400).json({
            success: false,
            message: '인증 시간이 만료되었습니다'
        });
    }
    
    // 인증번호 확인
    if (saved.code === code) {
        verificationCodes.delete(phone);
        return res.json({
            success: true,
            message: '인증이 완료되었습니다',
            verified: true
        });
    } else {
        return res.status(400).json({
            success: false,
            message: '인증번호가 일치하지 않습니다'
        });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(\`SMS 서버가 포트 \${PORT}에서 실행 중입니다\`);
});
`;

module.exports = {
    twilioExample,
    aligoExample,
    naverCloudExample,
    expressIntegration
};