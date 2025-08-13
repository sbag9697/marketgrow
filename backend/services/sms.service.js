// CoolSMS 선택적 로드 (설치 안 되어 있어도 서버 동작)
let CoolSMS = null;
try {
    CoolSMS = require('coolsms-node-sdk').default;
    console.log('CoolSMS module loaded successfully');
} catch (e) {
    console.log('CoolSMS not installed, using dev mode for SMS');
    // CoolSMS가 없어도 서버는 정상 동작
}

const axios = require('axios');

class SMSService {
    constructor() {
        // CoolSMS 설정 (선택적)
        this.coolsms = null;
        if (CoolSMS && process.env.COOLSMS_API_KEY && process.env.COOLSMS_API_SECRET) {
            try {
                this.coolsms = new CoolSMS(
                    process.env.COOLSMS_API_KEY,
                    process.env.COOLSMS_API_SECRET
                );
                this.senderNumber = process.env.COOLSMS_SENDER || '01012345678';
                console.log('CoolSMS configured successfully');
            } catch (error) {
                console.log('CoolSMS configuration failed:', error.message);
                this.coolsms = null;
            }
        } else {
            console.log('CoolSMS not configured - SMS will use dev mode');
        }

        // 또는 한국 SMS 서비스 (네이버 클라우드 플랫폼 SENS)
        this.naverSmsConfig = {
            accessKey: process.env.NAVER_ACCESS_KEY,
            secretKey: process.env.NAVER_SECRET_KEY,
            serviceId: process.env.NAVER_SERVICE_ID,
            sendNumber: process.env.NAVER_SEND_NUMBER || '01012345678' // 발신번호
        };

        // 인증 코드 저장소
        this.verificationCodes = new Map();
    }

    // 6자리 인증 코드 생성
    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // 인증 코드 저장 (3분 유효)
    saveVerificationCode(phoneNumber, code) {
        this.verificationCodes.set(phoneNumber, {
            code,
            createdAt: Date.now(),
            attempts: 0
        });

        // 3분 후 자동 삭제
        setTimeout(() => {
            this.verificationCodes.delete(phoneNumber);
        }, 3 * 60 * 1000);
    }

    // 인증 코드 검증
    verifyCode(phoneNumber, code) {
        const stored = this.verificationCodes.get(phoneNumber);
        
        if (!stored) {
            return { success: false, message: '인증 코드가 만료되었거나 존재하지 않습니다.' };
        }

        // 5회 시도 제한
        if (stored.attempts >= 5) {
            this.verificationCodes.delete(phoneNumber);
            return { success: false, message: '인증 시도 횟수를 초과했습니다. 다시 인증을 요청해주세요.' };
        }

        stored.attempts++;

        // 3분 경과 체크
        if (Date.now() - stored.createdAt > 3 * 60 * 1000) {
            this.verificationCodes.delete(phoneNumber);
            return { success: false, message: '인증 코드가 만료되었습니다.' };
        }

        if (stored.code === code) {
            this.verificationCodes.delete(phoneNumber);
            return { success: true, message: 'SMS 인증이 완료되었습니다.' };
        }

        return { success: false, message: '인증 코드가 일치하지 않습니다.' };
    }

    // 전화번호 포맷 정규화
    formatPhoneNumber(phoneNumber) {
        // 한국 번호 기준
        let cleaned = phoneNumber.replace(/\D/g, '');
        
        // 010-1234-5678 형식
        if (cleaned.startsWith('010')) {
            return cleaned;
        }
        
        // +82 10 1234 5678 형식
        if (cleaned.startsWith('8210')) {
            return '0' + cleaned.slice(2);
        }
        
        // 82 없이 10으로 시작
        if (cleaned.startsWith('10')) {
            return '0' + cleaned;
        }
        
        return cleaned;
    }

    // SMS 발송 (CoolSMS 사용)
    async sendSMSWithCoolSMS(phoneNumber, message) {
        if (!this.coolsms) {
            throw new Error('CoolSMS가 설정되지 않았습니다.');
        }

        try {
            const result = await this.coolsms.sendOne({
                to: phoneNumber,
                from: this.senderNumber,
                text: message,
                type: 'SMS'
            });

            return { success: true, messageId: result.groupId };
        } catch (error) {
            console.error('CoolSMS error:', error);
            throw error;
        }
    }

    // SMS 발송 (네이버 클라우드 플랫폼 SENS 사용)
    async sendSMSWithNaver(phoneNumber, message) {
        const { accessKey, secretKey, serviceId, sendNumber } = this.naverSmsConfig;
        
        if (!accessKey || !secretKey || !serviceId) {
            throw new Error('네이버 SMS 설정이 완료되지 않았습니다.');
        }

        const timestamp = Date.now().toString();
        const method = 'POST';
        const uri = `/sms/v2/services/${serviceId}/messages`;
        const signature = this.makeSignature(method, uri, timestamp, secretKey);

        try {
            const response = await axios.post(
                `https://sens.apigw.ntruss.com${uri}`,
                {
                    type: 'SMS',
                    from: sendNumber,
                    content: message,
                    messages: [
                        {
                            to: phoneNumber
                        }
                    ]
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-ncp-apigw-timestamp': timestamp,
                        'x-ncp-iam-access-key': accessKey,
                        'x-ncp-apigw-signature-v2': signature
                    }
                }
            );

            return { success: true, data: response.data };
        } catch (error) {
            console.error('Naver SMS error:', error);
            throw error;
        }
    }

    // 네이버 API 시그니처 생성
    makeSignature(method, uri, timestamp, secretKey) {
        const crypto = require('crypto');
        const space = ' ';
        const newLine = '\n';
        const hmac = crypto.createHmac('sha256', secretKey);
        
        hmac.update(method);
        hmac.update(space);
        hmac.update(uri);
        hmac.update(newLine);
        hmac.update(timestamp);
        hmac.update(newLine);
        hmac.update(process.env.NAVER_ACCESS_KEY);
        
        return hmac.digest('base64');
    }

    // 인증 코드 SMS 발송
    async sendVerificationSMS(phoneNumber) {
        try {
            const formattedNumber = this.formatPhoneNumber(phoneNumber);
            const code = this.generateVerificationCode();
            this.saveVerificationCode(formattedNumber, code);

            const message = `[MarketGrow] 인증번호는 ${code}입니다. 3분 이내에 입력해주세요.`;

            // 환경에 따라 적절한 서비스 사용
            let result;
            if (this.coolsms) {
                // CoolSMS 우선 사용 (가장 간단)
                result = await this.sendSMSWithCoolSMS(formattedNumber, message);
            } else if (this.naverSmsConfig.accessKey) {
                // 네이버 클라우드 플랫폼
                result = await this.sendSMSWithNaver(formattedNumber, message);
            } else {
                // 개발 환경에서는 콘솔에 출력
                console.log(`[DEV MODE] SMS to ${formattedNumber}: ${message}`);
                return {
                    success: true,
                    message: '인증번호가 발송되었습니다.',
                    devMode: true,
                    code: process.env.NODE_ENV === 'development' ? code : undefined
                };
            }

            return {
                success: true,
                message: '인증번호가 발송되었습니다.'
            };
        } catch (error) {
            console.error('SMS sending error:', error);
            return {
                success: false,
                message: 'SMS 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
                error: error.message
            };
        }
    }

    // 마케팅 SMS 발송
    async sendMarketingSMS(phoneNumber, content) {
        try {
            const formattedNumber = this.formatPhoneNumber(phoneNumber);
            const message = `[MarketGrow] ${content}\n\n수신거부: 080-123-4567`;

            // 환경에 따라 적절한 서비스 사용
            if (this.twilioClient) {
                return await this.sendSMSWithTwilio(formattedNumber, message);
            } else if (this.naverSmsConfig.accessKey) {
                return await this.sendSMSWithNaver(formattedNumber, message);
            } else {
                console.log(`[DEV MODE] Marketing SMS to ${formattedNumber}: ${message}`);
                return { success: true, devMode: true };
            }
        } catch (error) {
            console.error('Marketing SMS error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new SMSService();