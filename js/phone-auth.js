// API 설정
const API_CONFIG = window.API_CONFIG || {
    BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:5001/api'
        : 'https://marketgrow-production.up.railway.app/api'
};

// 전화번호 인증 모듈
class PhoneAuthManager {
    constructor() {
        this.verificationTimer = null;
        this.timeLeft = 300; // 5분 (300초)
        this.phoneVerified = false;
        this.verificationCode = null;
        this.attemptCount = 0;
        this.maxAttempts = 5;
        this.resendCooldown = false;
        
        // 초기화
        this.init();
    }
    
    init() {
        // 이벤트 리스너 바인딩
        this.bindEvents();
        
        // 저장된 인증 상태 확인
        this.checkSavedVerification();
    }
    
    bindEvents() {
        // 전화번호 입력 시 포맷팅
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                this.formatPhoneNumber(e.target);
            });
            
            phoneInput.addEventListener('change', (e) => {
                this.validatePhoneNumber(e.target.value);
            });
        }
        
        // 인증번호 입력 시 자동 확인
        const codeInput = document.getElementById('phoneCode');
        if (codeInput) {
            codeInput.addEventListener('input', (e) => {
                if (e.target.value.length === 6) {
                    this.autoVerifyCode();
                }
            });
        }
    }
    
    // 전화번호 포맷팅 (하이픈 자동 추가)
    formatPhoneNumber(input) {
        let value = input.value.replace(/[^0-9]/g, '');
        let formattedValue = '';
        
        if (value.length <= 3) {
            formattedValue = value;
        } else if (value.length <= 7) {
            formattedValue = value.slice(0, 3) + '-' + value.slice(3);
        } else if (value.length <= 11) {
            formattedValue = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
        } else {
            formattedValue = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
        }
        
        input.value = formattedValue;
    }
    
    // 전화번호 유효성 검사
    validatePhoneNumber(phone) {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const phoneRegex = /^01[0-9]{8,9}$/;
        
        const isValid = phoneRegex.test(cleanPhone);
        const phoneInput = document.getElementById('phone');
        
        if (phoneInput) {
            if (isValid) {
                phoneInput.classList.remove('error');
                phoneInput.classList.add('valid');
                this.showMessage('', 'phone');
            } else if (cleanPhone.length > 0) {
                phoneInput.classList.add('error');
                phoneInput.classList.remove('valid');
                this.showMessage('올바른 전화번호 형식이 아닙니다', 'phone', 'error');
            }
        }
        
        return isValid;
    }
    
    // 인증번호 발송
    async sendVerification(event) {
        const phoneInput = document.getElementById('phone');
        const phone = phoneInput.value.replace(/[^0-9]/g, '');
        const sendBtn = event ? event.target : document.querySelector('[onclick*="verifyPhone"]');
        
        // 재발송 쿨다운 체크
        if (this.resendCooldown) {
            this.showNotification('잠시 후 다시 시도해주세요', 'warning');
            return;
        }
        
        // 유효성 검사
        if (!phone) {
            this.showNotification('전화번호를 입력해주세요', 'error');
            phoneInput.focus();
            return;
        }
        
        if (!this.validatePhoneNumber(phone)) {
            this.showNotification('올바른 전화번호 형식이 아닙니다', 'error');
            phoneInput.focus();
            return;
        }
        
        // 시도 횟수 체크
        if (this.attemptCount >= this.maxAttempts) {
            this.showNotification('인증 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요', 'error');
            return;
        }
        
        // 버튼 상태 변경
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 발송중...';
        }
        
        try {
            console.log('[PhoneAuth] 인증번호 발송 요청:', phone);
            
            // 실제 SMS API 호출
            const response = await fetch(`${API_CONFIG.BASE_URL}/sms/send-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.attemptCount++;
                this.showVerificationUI();
                this.startTimer();
                this.setResendCooldown();
                
                // 성공 메시지
                this.showNotification('인증번호가 SMS로 발송되었습니다', 'success');
                
                // 인증번호 입력 필드로 포커스
                const codeInput = document.getElementById('phoneCode');
                if (codeInput) {
                    codeInput.focus();
                }
                
                // 버튼 텍스트 변경
                if (sendBtn) {
                    sendBtn.innerHTML = '재발송';
                }
            } else {
                // 실패 메시지
                this.showNotification(data.message || 'SMS 발송에 실패했습니다', 'error');
                if (sendBtn) {
                    sendBtn.innerHTML = '인증';
                }
            }
        } catch (error) {
            console.error('[PhoneAuth] 오류:', error);
            this.showNotification(error.message || '인증번호 발송에 실패했습니다', 'error');
        } finally {
            if (sendBtn) {
                sendBtn.disabled = false;
            }
        }
    }
    
    // 인증번호 확인
    async verifyCode() {
        const phoneInput = document.getElementById('phone');
        const codeInput = document.getElementById('phoneCode');
        const phone = phoneInput.value.replace(/[^0-9]/g, '');
        const code = codeInput.value.trim();
        const verifyBtn = document.getElementById('phoneVerifyBtn');
        
        // 유효성 검사
        if (!code) {
            this.showNotification('인증번호를 입력해주세요', 'error');
            codeInput.focus();
            return;
        }
        
        if (code.length !== 6) {
            this.showNotification('인증번호는 6자리입니다', 'error');
            return;
        }
        
        // 타이머 확인
        if (this.timeLeft <= 0) {
            this.showNotification('인증 시간이 만료되었습니다. 다시 발송해주세요', 'error');
            return;
        }
        
        // 버튼 상태 변경
        if (verifyBtn) {
            verifyBtn.disabled = true;
            verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 확인중...';
        }
        
        try {
            console.log('[PhoneAuth] 인증번호 확인:', phone, code);
            
            // 실제 API 호출
            const response = await fetch(`${API_CONFIG.BASE_URL}/sms/verify-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone, code })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.onVerificationSuccess(phone);
            } else {
                this.onVerificationFailed();
                this.showNotification(data.message || '인증번호가 올바르지 않습니다', 'error');
            }
        } catch (error) {
            console.error('[PhoneAuth] 오류:', error);
            this.showNotification('인증 확인 중 오류가 발생했습니다', 'error');
        } finally {
            if (verifyBtn) {
                verifyBtn.disabled = false;
                verifyBtn.innerHTML = '확인';
            }
        }
    }
    
    // 자동 인증 확인 (6자리 입력 시)
    autoVerifyCode() {
        const codeInput = document.getElementById('phoneCode');
        if (codeInput && codeInput.value.length === 6) {
            this.verifyCode();
        }
    }
    
    // 인증 성공 처리
    onVerificationSuccess(phone) {
        this.phoneVerified = true;
        this.stopTimer();
        
        // 인증 정보 저장
        const verificationData = {
            phone: phone,
            verified: true,
            timestamp: Date.now()
        };
        sessionStorage.setItem('phoneVerification', JSON.stringify(verificationData));
        
        // UI 업데이트
        const phoneInput = document.getElementById('phone');
        const sendBtn = document.querySelector('[onclick*="verifyPhone"]');
        const verifyGroup = document.getElementById('phoneVerifyGroup');
        
        if (phoneInput) {
            phoneInput.classList.add('verified');
            phoneInput.style.borderColor = '#28a745';
            phoneInput.readOnly = true;
        }
        
        if (sendBtn) {
            sendBtn.innerHTML = '<i class="fas fa-check"></i> 인증완료';
            sendBtn.disabled = true;
            sendBtn.style.background = '#28a745';
        }
        
        if (verifyGroup) {
            setTimeout(() => {
                verifyGroup.style.display = 'none';
            }, 1000);
        }
        
        this.showNotification('전화번호 인증이 완료되었습니다', 'success');
        
        // 인증 완료 이벤트 발생
        this.dispatchVerificationEvent('success', { phone });
    }
    
    // 인증 실패 처리
    onVerificationFailed() {
        const codeInput = document.getElementById('phoneCode');
        if (codeInput) {
            codeInput.classList.add('error');
            setTimeout(() => {
                codeInput.classList.remove('error');
            }, 2000);
        }
        
        this.showNotification('인증번호가 일치하지 않습니다', 'error');
        
        // 인증 실패 이벤트 발생
        this.dispatchVerificationEvent('failed');
    }
    
    // 인증 UI 표시
    showVerificationUI() {
        const verifyGroup = document.getElementById('phoneVerifyGroup');
        if (verifyGroup) {
            verifyGroup.style.display = 'block';
            
            // 확인 버튼이 없으면 추가
            if (!document.getElementById('phoneVerifyBtn')) {
                const codeInput = document.getElementById('phoneCode');
                if (codeInput && codeInput.parentNode) {
                    const verifyBtn = document.createElement('button');
                    verifyBtn.type = 'button';
                    verifyBtn.id = 'phoneVerifyBtn';
                    verifyBtn.className = 'verify-btn';
                    verifyBtn.innerHTML = '확인';
                    verifyBtn.onclick = () => this.verifyCode();
                    
                    // 타이머 span 앞에 버튼 삽입
                    const timer = codeInput.parentNode.querySelector('.verify-timer');
                    if (timer) {
                        codeInput.parentNode.insertBefore(verifyBtn, timer);
                    } else {
                        codeInput.parentNode.appendChild(verifyBtn);
                    }
                }
            }
        }
    }
    
    // 타이머 시작
    startTimer() {
        this.stopTimer();
        this.timeLeft = 300; // 5분
        
        const updateTimer = () => {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // 모든 타이머 엘리먼트 업데이트
            const timerElements = document.querySelectorAll('.verify-timer');
            timerElements.forEach(el => {
                el.textContent = display;
                
                // 시간에 따른 색상 변경
                if (this.timeLeft <= 30) {
                    el.style.color = '#dc3545'; // 빨간색
                } else if (this.timeLeft <= 60) {
                    el.style.color = '#ffc107'; // 노란색
                } else {
                    el.style.color = '#666'; // 기본색
                }
            });
            
            this.timeLeft--;
            
            if (this.timeLeft < 0) {
                this.stopTimer();
                this.onTimerExpired();
            }
        };
        
        updateTimer(); // 즉시 실행
        this.verificationTimer = setInterval(updateTimer, 1000);
    }
    
    // 타이머 중지
    stopTimer() {
        if (this.verificationTimer) {
            clearInterval(this.verificationTimer);
            this.verificationTimer = null;
        }
    }
    
    // 타이머 만료 처리
    onTimerExpired() {
        const timerElements = document.querySelectorAll('.verify-timer');
        timerElements.forEach(el => {
            el.textContent = '시간 만료';
            el.style.color = '#dc3545';
        });
        
        const codeInput = document.getElementById('phoneCode');
        if (codeInput) {
            codeInput.disabled = true;
            codeInput.placeholder = '인증 시간이 만료되었습니다';
        }
        
        const verifyBtn = document.getElementById('phoneVerifyBtn');
        if (verifyBtn) {
            verifyBtn.disabled = true;
        }
        
        this.showNotification('인증 시간이 만료되었습니다. 다시 발송해주세요', 'warning');
    }
    
    // 재발송 쿨다운
    setResendCooldown() {
        this.resendCooldown = true;
        const sendBtn = document.querySelector('[onclick*="verifyPhone"]');
        
        let cooldownTime = 30; // 30초
        const cooldownInterval = setInterval(() => {
            if (sendBtn && !this.phoneVerified) {
                sendBtn.innerHTML = `재발송 (${cooldownTime}초)`;
                sendBtn.disabled = true;
            }
            
            cooldownTime--;
            
            if (cooldownTime <= 0) {
                clearInterval(cooldownInterval);
                this.resendCooldown = false;
                if (sendBtn && !this.phoneVerified) {
                    sendBtn.innerHTML = '재발송';
                    sendBtn.disabled = false;
                }
            }
        }, 1000);
    }
    
    // 저장된 인증 상태 확인
    checkSavedVerification() {
        const saved = sessionStorage.getItem('phoneVerification');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // 30분 이내의 인증만 유효
                if (data.verified && (Date.now() - data.timestamp) < 30 * 60 * 1000) {
                    const phoneInput = document.getElementById('phone');
                    if (phoneInput && data.phone) {
                        phoneInput.value = this.formatPhoneDisplay(data.phone);
                        this.onVerificationSuccess(data.phone);
                    }
                }
            } catch (error) {
                console.error('[PhoneAuth] 저장된 인증 정보 오류:', error);
            }
        }
    }
    
    // 전화번호 표시 포맷
    formatPhoneDisplay(phone) {
        const clean = phone.replace(/[^0-9]/g, '');
        if (clean.length === 11) {
            return clean.slice(0, 3) + '-' + clean.slice(3, 7) + '-' + clean.slice(7);
        } else if (clean.length === 10) {
            return clean.slice(0, 3) + '-' + clean.slice(3, 6) + '-' + clean.slice(6);
        }
        return phone;
    }
    
    // 메시지 표시
    showMessage(message, target, type = 'info') {
        const targetElement = document.getElementById(target);
        if (!targetElement) return;
        
        // 기존 메시지 제거
        const existingMsg = targetElement.parentNode.querySelector('.field-message');
        if (existingMsg) {
            existingMsg.remove();
        }
        
        if (message) {
            const msgElement = document.createElement('small');
            msgElement.className = `field-message ${type}`;
            msgElement.style.color = type === 'error' ? '#dc3545' : 
                                   type === 'success' ? '#28a745' : '#666';
            msgElement.textContent = message;
            targetElement.parentNode.appendChild(msgElement);
        }
    }
    
    // 알림 표시
    showNotification(message, type = 'info') {
        if (window.NotificationManager) {
            window.NotificationManager[type](message);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    
    // 이벤트 발생
    dispatchVerificationEvent(status, data = {}) {
        const event = new CustomEvent('phoneVerification', {
            detail: {
                status: status,
                ...data
            }
        });
        window.dispatchEvent(event);
    }
    
    // 인증 상태 확인
    isVerified() {
        return this.phoneVerified;
    }
    
    // 인증 초기화
    reset() {
        this.phoneVerified = false;
        this.verificationCode = null;
        this.attemptCount = 0;
        this.stopTimer();
        sessionStorage.removeItem('phoneVerification');
        
        // UI 초기화
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.classList.remove('verified', 'error', 'valid');
            phoneInput.style.borderColor = '';
            phoneInput.readOnly = false;
        }
        
        const verifyGroup = document.getElementById('phoneVerifyGroup');
        if (verifyGroup) {
            verifyGroup.style.display = 'none';
        }
        
        const sendBtn = document.querySelector('[onclick*="verifyPhone"]');
        if (sendBtn) {
            sendBtn.innerHTML = '인증';
            sendBtn.disabled = false;
            sendBtn.style.background = '';
        }
    }
}

// Mock 모드 비활성화 - 실제 SMS API 사용
// localStorage.setItem('useMockServer', 'true');
// console.log('📱 전화번호 인증 Mock 모드 활성화');

// 전역 인스턴스 생성
window.phoneAuthManager = new PhoneAuthManager();

// 전역 함수 오버라이드 (기존 코드와의 호환성)
window.verifyPhone = function(event) {
    if (event) event.preventDefault();
    console.log('[전화번호 인증] verifyPhone 호출됨');
    window.phoneAuthManager.sendVerification(event);
    return false;
};

window.confirmPhoneVerification = function(event) {
    if (event) event.preventDefault();
    window.phoneAuthManager.verifyCode();
};

// CSS 스타일 추가
if (!document.getElementById('phone-auth-styles')) {
    const style = document.createElement('style');
    style.id = 'phone-auth-styles';
    style.textContent = `
        input.verified {
            border-color: #28a745 !important;
            background-color: #f0fff4;
        }
        
        input.error {
            border-color: #dc3545 !important;
            animation: shake 0.5s;
        }
        
        input.valid {
            border-color: #28a745 !important;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .field-message {
            display: block;
            margin-top: 5px;
            font-size: 12px;
        }
        
        .verify-timer {
            font-weight: bold;
            font-family: 'Courier New', monospace;
        }
        
        button.verify-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        #phoneVerifyGroup {
            animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

console.log('📱 전화번호 인증 모듈 로드 완료');