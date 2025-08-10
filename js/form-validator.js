// 폼 유효성 검사 및 단계별 필드 관리
class FormValidator {
    constructor() {
        this.currentStep = 1;
        this.init();
    }
    
    init() {
        // 폼 요소 찾기
        this.form = document.getElementById('signupForm');
        if (!this.form) return;
        
        // novalidate 속성 확인
        if (!this.form.hasAttribute('novalidate')) {
            this.form.setAttribute('novalidate', true);
        }
        
        // 초기 설정
        this.setupStepFields();
        
        // 폼 제출 이벤트 처리
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(e);
        });
    }
    
    // 단계별 필드 설정
    setupStepFields() {
        const allSteps = document.querySelectorAll('.form-step');
        
        allSteps.forEach((step) => {
            const stepNum = parseInt(step.dataset.step);
            const isActive = step.classList.contains('active');
            
            // 각 단계의 required 필드 처리
            const requiredFields = step.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                if (isActive) {
                    // 현재 단계의 필드는 required 유지
                    field.dataset.originalRequired = 'true';
                } else {
                    // 다른 단계의 필드는 required 제거
                    field.dataset.originalRequired = 'true';
                    field.removeAttribute('required');
                }
            });
        });
    }
    
    // 단계 이동 시 필드 업데이트
    updateStepFields(newStep) {
        const allSteps = document.querySelectorAll('.form-step');
        
        allSteps.forEach((step) => {
            const stepNum = parseInt(step.dataset.step);
            const fields = step.querySelectorAll('[data-original-required="true"]');
            
            fields.forEach(field => {
                if (stepNum === newStep) {
                    // 새 단계의 필드는 required 복원
                    field.setAttribute('required', '');
                } else {
                    // 다른 단계의 필드는 required 제거
                    field.removeAttribute('required');
                }
            });
        });
        
        this.currentStep = newStep;
    }
    
    // 현재 단계 유효성 검사
    validateCurrentStep() {
        const currentStepEl = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        if (!currentStepEl) return true;
        
        const requiredFields = currentStepEl.querySelectorAll('[required], [data-original-required="true"]');
        let isValid = true;
        let firstInvalidField = null;
        
        requiredFields.forEach(field => {
            // 체크박스 처리
            if (field.type === 'checkbox') {
                if (!field.checked) {
                    isValid = false;
                    this.showFieldError(field, '이 항목은 필수입니다');
                    if (!firstInvalidField) firstInvalidField = field;
                } else {
                    this.clearFieldError(field);
                }
            } 
            // 일반 필드 처리
            else {
                const value = field.value.trim();
                if (!value) {
                    isValid = false;
                    this.showFieldError(field, '이 필드는 필수입니다');
                    if (!firstInvalidField) firstInvalidField = field;
                } else {
                    // 추가 유효성 검사
                    if (field.type === 'email' && !this.isValidEmail(value)) {
                        isValid = false;
                        this.showFieldError(field, '올바른 이메일 형식이 아닙니다');
                        if (!firstInvalidField) firstInvalidField = field;
                    } else if (field.type === 'tel' && !this.isValidPhone(value)) {
                        isValid = false;
                        this.showFieldError(field, '올바른 전화번호 형식이 아닙니다');
                        if (!firstInvalidField) firstInvalidField = field;
                    } else {
                        this.clearFieldError(field);
                    }
                }
            }
        });
        
        // 첫 번째 오류 필드로 포커스
        if (!isValid && firstInvalidField) {
            firstInvalidField.focus();
            
            // 체크박스의 경우 스크롤
            if (firstInvalidField.type === 'checkbox') {
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        return isValid;
    }
    
    // 필드 오류 표시
    showFieldError(field, message) {
        field.classList.add('error');
        
        // 기존 오류 메시지 제거
        const existingError = field.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // 새 오류 메시지 추가
        const errorEl = document.createElement('small');
        errorEl.className = 'error-message';
        errorEl.style.color = '#dc3545';
        errorEl.style.display = 'block';
        errorEl.style.marginTop = '5px';
        errorEl.textContent = message;
        
        // 체크박스의 경우 라벨 뒤에 추가
        if (field.type === 'checkbox') {
            const label = field.parentElement;
            label.parentElement.appendChild(errorEl);
        } else {
            field.parentElement.appendChild(errorEl);
        }
    }
    
    // 필드 오류 제거
    clearFieldError(field) {
        field.classList.remove('error');
        
        const errorEl = field.parentElement.querySelector('.error-message');
        if (errorEl) {
            errorEl.remove();
        }
        
        // 체크박스의 경우
        if (field.type === 'checkbox') {
            const errorEl = field.parentElement.parentElement.querySelector('.error-message');
            if (errorEl) {
                errorEl.remove();
            }
        }
    }
    
    // 이메일 유효성 검사
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // 전화번호 유효성 검사
    isValidPhone(phone) {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const phoneRegex = /^01[0-9]{8,9}$/;
        return phoneRegex.test(cleanPhone);
    }
    
    // 폼 제출 처리
    handleSubmit(e) {
        e.preventDefault();
        
        // 마지막 단계인 경우
        if (this.currentStep === 3) {
            if (this.validateCurrentStep()) {
                // 실제 회원가입 처리
                this.processSignup();
            }
        }
    }
    
    // 회원가입 처리
    async processSignup() {
        const formData = new FormData(this.form);
        const userData = {};
        
        for (let [key, value] of formData.entries()) {
            userData[key] = value;
        }
        
        console.log('회원가입 데이터:', userData);
        
        // 여기에 실제 회원가입 API 호출 코드 추가
        if (window.api && window.api.register) {
            try {
                const response = await window.api.register(userData);
                if (response.success) {
                    if (window.NotificationManager) {
                        window.NotificationManager.success('회원가입이 완료되었습니다!');
                    }
                    // 로그인 페이지로 이동
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                }
            } catch (error) {
                console.error('회원가입 오류:', error);
                if (window.NotificationManager) {
                    window.NotificationManager.error('회원가입 중 오류가 발생했습니다');
                }
            }
        }
    }
}

// 전역 인스턴스 생성
window.formValidator = new FormValidator();

// nextStep 함수 오버라이드
const originalNextStep = window.nextStep;
window.nextStep = function(step) {
    // 현재 단계 유효성 검사
    if (window.formValidator && !window.formValidator.validateCurrentStep()) {
        if (window.NotificationManager) {
            window.NotificationManager.error('필수 항목을 모두 입력해주세요');
        }
        return false;
    }
    
    // 필드 업데이트
    if (window.formValidator) {
        window.formValidator.updateStepFields(step);
    }
    
    // 원래 함수 호출
    if (originalNextStep) {
        originalNextStep(step);
    }
};

console.log('📋 폼 유효성 검사 모듈 로드 완료');