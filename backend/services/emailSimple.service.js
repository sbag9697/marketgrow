const nodemailer = require('nodemailer');

class SimpleEmailService {
    constructor() {
        // 인증 코드 저장소
        this.verificationCodes = new Map();
        
        // Gmail 설정
        this.emailUser = process.env.EMAIL_USER || 'marketgrow.kr@gmail.com';
        this.emailPass = process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS; // 두 환경변수 모두 지원
        
        console.log('📧 Simple Email Service initialized');
    }

    // 6자리 인증 코드 생성
    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // 인증 코드 저장 (5분 유효)
    saveVerificationCode(email, code) {
        this.verificationCodes.set(email, {
            code,
            createdAt: Date.now(),
            attempts: 0
        });

        // 5분 후 자동 삭제
        setTimeout(() => {
            this.verificationCodes.delete(email);
        }, 5 * 60 * 1000);
    }

    // 인증 코드 검증
    verifyCode(email, code) {
        const stored = this.verificationCodes.get(email);

        if (!stored) {
            return { success: false, message: '인증 코드가 만료되었거나 존재하지 않습니다.' };
        }

        // 5회 시도 제한
        if (stored.attempts >= 5) {
            this.verificationCodes.delete(email);
            return { success: false, message: '인증 시도 횟수를 초과했습니다. 다시 인증을 요청해주세요.' };
        }

        stored.attempts++;

        // 5분 경과 체크
        if (Date.now() - stored.createdAt > 5 * 60 * 1000) {
            this.verificationCodes.delete(email);
            return { success: false, message: '인증 코드가 만료되었습니다.' };
        }

        if (stored.code === code) {
            this.verificationCodes.delete(email);
            return { success: true, message: '이메일 인증이 완료되었습니다.' };
        }

        return { success: false, message: '인증 코드가 일치하지 않습니다.' };
    }

    // 간단한 이메일 발송 (각 요청마다 새 transporter 생성)
    async sendVerificationEmail(email, username) {
        try {
            // 인증 코드 생성
            const code = this.generateVerificationCode();
            console.log(`📧 Generated verification code for ${email}: ${code}`);
            this.saveVerificationCode(email, code);

            // 환경 변수 체크
            if (!this.emailPass) {
                console.log('⚠️ Email password not set, using fallback mode');
                // 개발 모드: 콘솔에만 출력
                console.log(`
                ====================================
                이메일 인증 코드 (개발 모드)
                이메일: ${email}
                코드: ${code}
                ====================================
                `);
                return {
                    success: true,
                    message: '인증 코드가 콘솔에 출력되었습니다. (개발 모드)',
                    devMode: true
                };
            }

            // 매번 새로운 transporter 생성 (createTransport 사용)
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true, // 465 포트는 true
                auth: {
                    user: this.emailUser,
                    pass: this.emailPass
                }
            });

            const mailOptions = {
                from: `"MarketGrow" <${this.emailUser}>`,
                to: email,
                subject: '[MarketGrow] 이메일 인증 코드',
                html: `
                    <div style="font-family: 'Noto Sans KR', sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>MarketGrow 이메일 인증</h2>
                        <p>안녕하세요${username ? `, ${username}님` : ''}!</p>
                        <p>아래 인증 코드를 입력해주세요:</p>
                        <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
                            ${code}
                        </div>
                        <p>이 코드는 5분간 유효합니다.</p>
                    </div>
                `,
                text: `MarketGrow 이메일 인증\n\n인증 코드: ${code}\n\n이 코드는 5분간 유효합니다.`
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully:', info.messageId);

            return {
                success: true,
                message: '인증 이메일이 발송되었습니다.',
                messageId: info.messageId
            };
        } catch (error) {
            console.error('❌ Email sending error:', error.message);
            
            // 에러가 발생해도 코드는 저장되어 있으므로 콘솔에 출력
            const stored = this.verificationCodes.get(email);
            if (stored) {
                console.log(`
                ====================================
                이메일 발송 실패 - 대체 인증 코드
                이메일: ${email}
                코드: ${stored.code}
                에러: ${error.message}
                ====================================
                `);
            }
            
            return {
                success: false,
                message: '이메일 발송에 실패했습니다. 관리자에게 문의해주세요.',
                error: error.message
            };
        }
    }
}

module.exports = new SimpleEmailService();