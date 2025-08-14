// SMS 인증 시스템 - 실제 연동용
const API_URL = 'https://marketgrow-production-c586.up.railway.app/api';

// 실제 SMS 서비스 설정 (알리고 API 사용)
const SMS_CONFIG = {
    serviceId: 'marketgrow',
    apiKey: process.env.ALIGO_API_KEY, // 실제 API 키는 환경변수에서
    userId: process.env.ALIGO_USER_ID,  // 실제 사용자 ID는 환경변수에서
    sender: '010-5772-8658' // 실제 발신번호
};

class SMSVerification {
    constructor() {
        this.phoneNumber = '';
        this.verificationCode = '';
        this.timer = null;
        this.timeRemaining = 180; // 3분
        this.sessionId = '';
    }

    // 전화번호 형식 검증
    validatePhoneNumber(phone) {
        // 한국 휴대폰 번호 형식
        const phoneRegex = /^01[0-9]{1}-?[0-9]{4}-?[0-9]{4}$/;
        return phoneRegex.test(phone.replace(/-/g, ''));
    }

    // 전화번호 포맷팅
    formatPhoneNumber(phone) {
        const cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.length === 11) {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
        }
        return phone;
    }

    // SMS 인증 코드 전송
    async sendSMSCode(phoneNumber, purpose = 'verification') {
        if (!this.validatePhoneNumber(phoneNumber)) {
            return {
                success: false,
                message: '올바른 휴대폰 번호를 입력하세요.'
            };
        }

        this.phoneNumber = this.formatPhoneNumber(phoneNumber);

        try {
            const response = await fetch(`${API_URL}/auth/send-sms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    phoneNumber: this.phoneNumber,
                    purpose: purpose,
                    sender: SMS_CONFIG.sender
                })
            });

            const data = await response.json();

            if (data.success) {
                this.sessionId = data.data.sessionId;
                this.startTimer();
                return {
                    success: true,
                    message: 'SMS 인증 코드가 전송되었습니다.',
                    sessionId: this.sessionId
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'SMS 전송에 실패했습니다.'
                };
            }
        } catch (error) {
            console.error('SMS 전송 오류:', error);
            return {
                success: false,
                message: '서버 연결에 실패했습니다.'
            };
        }
    }

    // 인증 코드 확인
    async verifyCode(code) {
        if (!code || code.length !== 6) {
            return {
                success: false,
                message: '6자리 인증 코드를 입력하세요.'
            };
        }

        try {
            const response = await fetch(`${API_URL}/auth/verify-sms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    phoneNumber: this.phoneNumber,
                    code: code,
                    sessionId: this.sessionId
                })
            });

            const data = await response.json();

            if (data.success) {
                this.stopTimer();
                return {
                    success: true,
                    message: 'SMS 인증이 완료되었습니다.',
                    verified: true
                };
            } else {
                return {
                    success: false,
                    message: data.message || '인증 코드가 올바르지 않습니다.'
                };
            }
        } catch (error) {
            console.error('SMS 인증 오류:', error);
            return {
                success: false,
                message: '인증 확인에 실패했습니다.'
            };
        }
    }

    // 인증 코드 재전송
    async resendCode() {
        if (this.timeRemaining > 120) {
            return {
                success: false,
                message: '1분 후에 재전송할 수 있습니다.'
            };
        }

        return await this.sendSMSCode(this.phoneNumber);
    }

    // 타이머 시작
    startTimer() {
        this.stopTimer();
        this.timeRemaining = 180; // 3분

        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            if (this.timeRemaining <= 0) {
                this.stopTimer();
                this.onTimerExpired();
            }
        }, 1000);
    }

    // 타이머 정지
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    // 타이머 표시 업데이트
    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        const timerElements = document.querySelectorAll('.sms-timer');
        timerElements.forEach(element => {
            element.textContent = display;
        });
    }

    // 타이머 만료 처리
    onTimerExpired() {
        const messageElements = document.querySelectorAll('.sms-message');
        messageElements.forEach(element => {
            element.textContent = '인증 시간이 만료되었습니다.';
            element.classList.add('error');
        });

        const resendButtons = document.querySelectorAll('.resend-sms');
        resendButtons.forEach(button => {
            button.disabled = false;
        });
    }
}

// SMS 인증 UI 컴포넌트
class SMSVerificationUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.verification = new SMSVerification();
        this.onSuccess = null;
        this.onError = null;
    }

    // SMS 인증 UI 렌더링
    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="sms-verification-container">
                <div class="sms-step" id="phoneStep">
                    <h3>휴대폰 인증</h3>
                    <p>본인 명의의 휴대폰 번호를 입력하세요.</p>
                    
                    <div class="form-group">
                        <label>휴대폰 번호</label>
                        <div class="phone-input-group">
                            <input type="tel" id="phoneNumber" 
                                   class="form-control" 
                                   placeholder="010-0000-0000"
                                   maxlength="13">
                            <button class="btn btn-primary" id="sendSMSBtn">
                                인증번호 받기
                            </button>
                        </div>
                    </div>
                </div>

                <div class="sms-step" id="codeStep" style="display: none;">
                    <h3>인증번호 확인</h3>
                    <p class="sms-message">
                        <span id="sentPhone"></span>로 전송된 인증번호를 입력하세요.
                    </p>
                    
                    <div class="form-group">
                        <label>인증번호</label>
                        <input type="text" id="smsCode" 
                               class="form-control" 
                               placeholder="인증번호 6자리"
                               maxlength="6">
                    </div>
                    
                    <div class="timer-container">
                        <span class="sms-timer">03:00</span>
                        <button class="btn-link resend-sms" disabled>
                            재전송
                        </button>
                    </div>
                    
                    <button class="btn btn-primary" id="verifySMSBtn">
                        인증 확인
                    </button>
                </div>

                <div class="sms-step" id="successStep" style="display: none;">
                    <div class="success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3>인증 완료</h3>
                    <p>휴대폰 인증이 완료되었습니다.</p>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    // 이벤트 리스너 연결
    attachEventListeners() {
        // 전화번호 입력 자동 포맷팅
        const phoneInput = document.getElementById('phoneNumber');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value.length <= 11) {
                    if (value.length >= 7) {
                        e.target.value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
                    } else if (value.length >= 3) {
                        e.target.value = `${value.slice(0, 3)}-${value.slice(3)}`;
                    }
                }
            });
        }

        // SMS 전송
        const sendBtn = document.getElementById('sendSMSBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.handleSendSMS());
        }

        // 인증 확인
        const verifyBtn = document.getElementById('verifySMSBtn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => this.handleVerifyCode());
        }

        // 재전송
        const resendBtn = document.querySelector('.resend-sms');
        if (resendBtn) {
            resendBtn.addEventListener('click', () => this.handleResendSMS());
        }

        // 숫자만 입력
        const codeInput = document.getElementById('smsCode');
        if (codeInput) {
            codeInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });

            codeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleVerifyCode();
                }
            });
        }
    }

    // SMS 전송 처리
    async handleSendSMS() {
        const phoneInput = document.getElementById('phoneNumber');
        const phoneNumber = phoneInput.value.trim();

        if (!phoneNumber) {
            this.showError('휴대폰 번호를 입력하세요.');
            return;
        }

        const sendBtn = document.getElementById('sendSMSBtn');
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 전송중...';

        const result = await this.verification.sendSMSCode(phoneNumber);

        if (result.success) {
            this.showStep('codeStep');
            document.getElementById('sentPhone').textContent = this.verification.formatPhoneNumber(phoneNumber);
            this.showSuccess(result.message);
        } else {
            this.showError(result.message);
            sendBtn.disabled = false;
            sendBtn.textContent = '인증번호 받기';
        }
    }

    // 인증 코드 확인 처리
    async handleVerifyCode() {
        const codeInput = document.getElementById('smsCode');
        const code = codeInput.value.trim();

        if (!code) {
            this.showError('인증번호를 입력하세요.');
            return;
        }

        const verifyBtn = document.getElementById('verifySMSBtn');
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 확인중...';

        const result = await this.verification.verifyCode(code);

        if (result.success) {
            this.showStep('successStep');
            this.showSuccess(result.message);
            
            if (this.onSuccess) {
                this.onSuccess(result);
            }
        } else {
            this.showError(result.message);
            verifyBtn.disabled = false;
            verifyBtn.textContent = '인증 확인';
        }
    }

    // 재전송 처리
    async handleResendSMS() {
        const resendBtn = document.querySelector('.resend-sms');
        resendBtn.disabled = true;

        const result = await this.verification.resendCode();

        if (result.success) {
            this.showSuccess('인증번호가 재전송되었습니다.');
        } else {
            this.showError(result.message);
        }

        setTimeout(() => {
            resendBtn.disabled = false;
        }, 60000); // 1분 후 재활성화
    }

    // 단계 표시
    showStep(stepId) {
        const steps = document.querySelectorAll('.sms-step');
        steps.forEach(step => {
            step.style.display = 'none';
        });

        const targetStep = document.getElementById(stepId);
        if (targetStep) {
            targetStep.style.display = 'block';
        }
    }

    // 메시지 표시
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
        if (this.onError) {
            this.onError(message);
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// 전역 사용
window.SMSVerification = SMSVerification;
window.SMSVerificationUI = SMSVerificationUI;