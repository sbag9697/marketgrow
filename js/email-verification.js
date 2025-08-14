// 이메일 인증 시스템
const API_URL = 'https://marketgrow-production.up.railway.app/api';

class EmailVerification {
    constructor() {
        this.verificationCode = '';
        this.email = '';
        this.timer = null;
        this.timeRemaining = 300; // 5분
    }

    // 이메일 인증 코드 전송
    async sendVerificationEmail(email, purpose = 'signup') {
        try {
            const response = await fetch(`${API_URL}/auth/send-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    purpose // signup, password-reset, email-change
                })
            });

            const data = await response.json();

            if (data.success) {
                this.email = email;
                this.startTimer();
                return {
                    success: true,
                    message: '인증 코드가 이메일로 전송되었습니다.'
                };
            } else {
                return {
                    success: false,
                    message: data.message || '이메일 전송에 실패했습니다.'
                };
            }
        } catch (error) {
            console.error('이메일 전송 오류:', error);
            return {
                success: false,
                message: '서버 연결에 실패했습니다.'
            };
        }
    }

    // 인증 코드 확인
    async verifyCode(code) {
        try {
            const response = await fetch(`${API_URL}/auth/verify-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: this.email,
                    code
                })
            });

            const data = await response.json();

            if (data.success) {
                this.stopTimer();
                return {
                    success: true,
                    message: '이메일 인증이 완료되었습니다.',
                    token: data.data.verificationToken
                };
            } else {
                return {
                    success: false,
                    message: data.message || '인증 코드가 올바르지 않습니다.'
                };
            }
        } catch (error) {
            console.error('인증 확인 오류:', error);
            return {
                success: false,
                message: '인증 확인에 실패했습니다.'
            };
        }
    }

    // 인증 코드 재전송
    async resendCode() {
        if (this.timeRemaining > 240) {
            return {
                success: false,
                message: '1분 후에 재전송할 수 있습니다.'
            };
        }

        return await this.sendVerificationEmail(this.email);
    }

    // 타이머 시작
    startTimer() {
        this.stopTimer(); // 기존 타이머 정리
        this.timeRemaining = 300; // 5분 리셋

        this.timer = setInterval(() => {
            this.timeRemaining--;

            // 타이머 UI 업데이트
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

        // 타이머 엘리먼트 찾기
        const timerElements = document.querySelectorAll('.verification-timer');
        timerElements.forEach(element => {
            element.textContent = display;
        });
    }

    // 타이머 만료 처리
    onTimerExpired() {
        const expiredMessage = '인증 시간이 만료되었습니다. 다시 시도해주세요.';

        // 만료 메시지 표시
        const messageElements = document.querySelectorAll('.verification-message');
        messageElements.forEach(element => {
            element.textContent = expiredMessage;
            element.classList.add('error');
        });

        // 재전송 버튼 활성화
        const resendButtons = document.querySelectorAll('.resend-verification');
        resendButtons.forEach(button => {
            button.disabled = false;
        });
    }

    // 이메일 형식 검증
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}

// 이메일 인증 UI 컴포넌트
class EmailVerificationUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.verification = new EmailVerification();
        this.onSuccess = null;
        this.onError = null;
    }

    // 인증 UI 렌더링
    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="email-verification-container">
                <div class="verification-step" id="emailStep">
                    <h3>이메일 인증</h3>
                    <p>이메일 주소를 입력하면 인증 코드를 보내드립니다.</p>
                    
                    <div class="form-group">
                        <input type="email" id="verificationEmail" 
                               class="form-control" 
                               placeholder="이메일 주소">
                    </div>
                    
                    <button class="btn btn-primary" id="sendCodeBtn">
                        인증 코드 받기
                    </button>
                </div>

                <div class="verification-step" id="codeStep" style="display: none;">
                    <h3>인증 코드 확인</h3>
                    <p class="verification-message">
                        <span id="sentEmail"></span>로 전송된 6자리 코드를 입력하세요.
                    </p>
                    
                    <div class="form-group">
                        <input type="text" id="verificationCode" 
                               class="form-control" 
                               placeholder="인증 코드 6자리"
                               maxlength="6">
                    </div>
                    
                    <div class="timer-container">
                        <span class="verification-timer">05:00</span>
                        <button class="btn-link resend-verification" disabled>
                            재전송
                        </button>
                    </div>
                    
                    <button class="btn btn-primary" id="verifyCodeBtn">
                        인증 확인
                    </button>
                </div>

                <div class="verification-step" id="successStep" style="display: none;">
                    <div class="success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3>인증 완료</h3>
                    <p>이메일 인증이 성공적으로 완료되었습니다.</p>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    // 이벤트 리스너 연결
    attachEventListeners() {
        // 인증 코드 전송
        const sendBtn = document.getElementById('sendCodeBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.handleSendCode());
        }

        // 인증 코드 확인
        const verifyBtn = document.getElementById('verifyCodeBtn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => this.handleVerifyCode());
        }

        // 재전송
        const resendBtn = document.querySelector('.resend-verification');
        if (resendBtn) {
            resendBtn.addEventListener('click', () => this.handleResendCode());
        }

        // 엔터키 처리
        const codeInput = document.getElementById('verificationCode');
        if (codeInput) {
            codeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleVerifyCode();
                }
            });
        }
    }

    // 인증 코드 전송 처리
    async handleSendCode() {
        const emailInput = document.getElementById('verificationEmail');
        const email = emailInput.value.trim();

        if (!this.verification.validateEmail(email)) {
            this.showError('올바른 이메일 주소를 입력하세요.');
            return;
        }

        // 버튼 비활성화
        const sendBtn = document.getElementById('sendCodeBtn');
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 전송중...';

        const result = await this.verification.sendVerificationEmail(email);

        if (result.success) {
            // 코드 입력 단계로 이동
            this.showStep('codeStep');
            document.getElementById('sentEmail').textContent = email;
            this.showSuccess(result.message);
        } else {
            this.showError(result.message);
            sendBtn.disabled = false;
            sendBtn.textContent = '인증 코드 받기';
        }
    }

    // 인증 코드 확인 처리
    async handleVerifyCode() {
        const codeInput = document.getElementById('verificationCode');
        const code = codeInput.value.trim();

        if (!code || code.length !== 6) {
            this.showError('6자리 인증 코드를 입력하세요.');
            return;
        }

        // 버튼 비활성화
        const verifyBtn = document.getElementById('verifyCodeBtn');
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 확인중...';

        const result = await this.verification.verifyCode(code);

        if (result.success) {
            this.showStep('successStep');
            this.showSuccess(result.message);

            // 성공 콜백 실행
            if (this.onSuccess) {
                this.onSuccess(result.token);
            }
        } else {
            this.showError(result.message);
            verifyBtn.disabled = false;
            verifyBtn.textContent = '인증 확인';
        }
    }

    // 재전송 처리
    async handleResendCode() {
        const resendBtn = document.querySelector('.resend-verification');
        resendBtn.disabled = true;

        const result = await this.verification.resendCode();

        if (result.success) {
            this.showSuccess('인증 코드가 재전송되었습니다.');
        } else {
            this.showError(result.message);
        }

        setTimeout(() => {
            resendBtn.disabled = false;
        }, 60000); // 1분 후 재활성화
    }

    // 단계 표시
    showStep(stepId) {
        const steps = document.querySelectorAll('.verification-step');
        steps.forEach(step => {
            step.style.display = 'none';
        });

        const targetStep = document.getElementById(stepId);
        if (targetStep) {
            targetStep.style.display = 'block';
        }
    }

    // 성공 메시지 표시
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // 에러 메시지 표시
    showError(message) {
        this.showNotification(message, 'error');
        if (this.onError) {
            this.onError(message);
        }
    }

    // 알림 표시
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

// 전역 사용 가능하도록 export
window.EmailVerification = EmailVerification;
window.EmailVerificationUI = EmailVerificationUI;
