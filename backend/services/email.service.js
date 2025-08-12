const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
    constructor() {
        // Gmail SMTP 설정 (환경변수로 관리)
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'your-email@gmail.com',
                pass: process.env.EMAIL_APP_PASSWORD || 'your-app-password'
            }
        });

        // 인증 코드 저장소 (Redis가 있다면 Redis 사용 권장)
        this.verificationCodes = new Map();
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

    // 회원가입 인증 링크 발송
    async sendVerificationEmail(email, username, verificationUrl) {
        try {
            const mailOptions = {
                from: `"MarketGrow" <${process.env.EMAIL_USER || 'noreply@marketgrow.com'}>`,
                to: email,
                subject: '[MarketGrow] 이메일 인증을 완료해주세요',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                            .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                            .warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>MarketGrow</h1>
                                <p>이메일 인증</p>
                            </div>
                            <div class="content">
                                <h2>안녕하세요, ${username}님!</h2>
                                <p>MarketGrow에 가입해 주셔서 감사합니다.</p>
                                <p>아래 버튼을 클릭하여 이메일 인증을 완료해주세요.</p>
                                
                                <div style="text-align: center;">
                                    <a href="${verificationUrl}" class="button">이메일 인증하기</a>
                                </div>
                                
                                <div class="warning">
                                    <strong>⏰ 이 링크는 24시간 동안 유효합니다.</strong>
                                </div>
                                
                                <p>만약 버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
                                <p style="word-break: break-all; color: #667eea; font-size: 12px;">${verificationUrl}</p>
                                
                                <div class="footer">
                                    <p>본인이 가입하지 않으셨다면 이 메일을 무시하셔도 됩니다.</p>
                                    <p>© 2024 MarketGrow. All rights reserved.</p>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
                text: `MarketGrow 이메일 인증\n\n안녕하세요, ${username}님!\n\n아래 링크를 클릭하여 이메일 인증을 완료해주세요:\n${verificationUrl}\n\n이 링크는 24시간 동안 유효합니다.\n\n본인이 가입하지 않으셨다면 이 메일을 무시하셔도 됩니다.`
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Verification email sent:', info.messageId);
            
            return { 
                success: true, 
                message: '인증 이메일이 발송되었습니다.',
                messageId: info.messageId 
            };
        } catch (error) {
            console.error('Email sending error:', error);
            return { 
                success: false, 
                message: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
                error: error.message 
            };
        }
    }

    // 이메일 인증 코드 발송 (6자리 코드)
    async sendVerificationCode(email, username) {
        try {
            const code = this.generateVerificationCode();
            this.saveVerificationCode(email, code);

            const mailOptions = {
                from: `"MarketGrow" <${process.env.EMAIL_USER || 'noreply@marketgrow.com'}>`,
                to: email,
                subject: '[MarketGrow] 이메일 인증 코드',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                            .code-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
                            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>MarketGrow</h1>
                                <p>이메일 인증</p>
                            </div>
                            <div class="content">
                                <h2>안녕하세요, ${username || ''}님!</h2>
                                <p>MarketGrow 회원가입을 위한 이메일 인증 코드입니다.</p>
                                
                                <div class="code-box">
                                    <p>인증 코드</p>
                                    <div class="code">${code}</div>
                                </div>
                                
                                <p>위 6자리 코드를 회원가입 페이지에 입력해주세요.</p>
                                <p><strong>⏰ 이 코드는 5분간 유효합니다.</strong></p>
                                
                                <div class="footer">
                                    <p>본인이 요청하지 않으셨다면 이 메일을 무시하셔도 됩니다.</p>
                                    <p>© 2024 MarketGrow. All rights reserved.</p>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
                text: `MarketGrow 이메일 인증 코드: ${code}\n\n이 코드는 5분간 유효합니다.`
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Verification email sent:', info.messageId);
            
            return { 
                success: true, 
                message: '인증 코드가 이메일로 발송되었습니다.',
                messageId: info.messageId 
            };
        } catch (error) {
            console.error('Email sending error:', error);
            return { 
                success: false, 
                message: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
                error: error.message 
            };
        }
    }

    // 비밀번호 재설정 이메일
    async sendPasswordResetEmail(email, resetToken) {
        try {
            const resetUrl = `${process.env.FRONTEND_URL || 'https://melodious-banoffee-c450ea.netlify.app'}/reset-password.html?token=${resetToken}`;

            const mailOptions = {
                from: `"MarketGrow" <${process.env.EMAIL_USER || 'noreply@marketgrow.com'}>`,
                to: email,
                subject: '[MarketGrow] 비밀번호 재설정',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                            .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>MarketGrow</h1>
                                <p>비밀번호 재설정</p>
                            </div>
                            <div class="content">
                                <h2>비밀번호 재설정 요청</h2>
                                <p>비밀번호를 재설정하려면 아래 버튼을 클릭하세요.</p>
                                
                                <div style="text-align: center;">
                                    <a href="${resetUrl}" class="button">비밀번호 재설정</a>
                                </div>
                                
                                <p>이 링크는 1시간 동안 유효합니다.</p>
                                <p>만약 버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
                                <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
                                
                                <div class="footer">
                                    <p>본인이 요청하지 않으셨다면 이 메일을 무시하셔도 됩니다.</p>
                                    <p>© 2024 MarketGrow. All rights reserved.</p>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Password reset email error:', error);
            return { success: false, error: error.message };
        }
    }

    // 주문 확인 이메일
    async sendOrderConfirmationEmail(email, orderDetails) {
        try {
            const mailOptions = {
                from: `"MarketGrow" <${process.env.EMAIL_USER || 'noreply@marketgrow.com'}>`,
                to: email,
                subject: '[MarketGrow] 주문이 접수되었습니다',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                            .order-info { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; }
                            .order-item { border-bottom: 1px solid #eee; padding: 10px 0; }
                            .total { font-size: 20px; font-weight: bold; color: #667eea; text-align: right; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>MarketGrow</h1>
                                <p>주문 확인</p>
                            </div>
                            <div class="content">
                                <h2>주문이 성공적으로 접수되었습니다!</h2>
                                <p>주문 번호: <strong>${orderDetails.orderId}</strong></p>
                                
                                <div class="order-info">
                                    <h3>주문 내역</h3>
                                    <div class="order-item">
                                        <strong>${orderDetails.serviceName}</strong><br>
                                        URL: ${orderDetails.targetUrl}<br>
                                        수량: ${orderDetails.quantity}
                                    </div>
                                    <div class="total">
                                        총 결제 금액: ₩${orderDetails.totalPrice.toLocaleString()}
                                    </div>
                                </div>
                                
                                <p>서비스 처리가 시작되면 알림을 보내드리겠습니다.</p>
                                <p>대시보드에서 실시간 진행 상황을 확인하실 수 있습니다.</p>
                                
                                <div style="text-align: center; margin-top: 30px;">
                                    <a href="${process.env.FRONTEND_URL || 'https://melodious-banoffee-c450ea.netlify.app'}/dashboard.html" 
                                       style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">
                                        대시보드로 이동
                                    </a>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Order confirmation email error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();