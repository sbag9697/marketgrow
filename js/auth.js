// 인증 관련 JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // 이미 로그인된 경우 대시보드로 리다이렉트
    if (api.token && window.location.pathname === '/login.html') {
        checkAuthAndRedirect();
    }

    // 로그인 폼 처리
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 회원가입 폼 처리
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        handleSignupForm();
    }

    // 비밀번호 재설정 폼 처리
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
    }
});

// 인증 상태 확인 및 리다이렉트
async function checkAuthAndRedirect() {
    try {
        const response = await api.getProfile();
        if (response.success) {
            // 로그인 성공 - 대시보드로 이동
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        // 토큰이 유효하지 않음 - 토큰 제거
        api.clearToken();
    }
}

// 로그인 처리
async function handleLogin(event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');
    LoadingManager.show(submitBtn);

    try {
        const formData = new FormData(event.target);
        const credentials = {
            login: formData.get('username'),
            password: formData.get('password')
        };

        const response = await api.login(credentials);

        if (response.success && response.data) {
            NotificationManager.success('로그인 성공! 환영합니다.');

            // 사용자 정보 저장
            if (response.data.user) {
                localStorage.setItem('userInfo', JSON.stringify(response.data.user));
            }

            // 로그인 상태 유지 처리
            const rememberCheck = document.getElementById('remember');
            if (rememberCheck && rememberCheck.checked) {
                localStorage.setItem('rememberLogin', 'true');
            }

            // 대시보드로 이동
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
    } catch (error) {
        const message = handleApiError(error, '로그인 중 오류가 발생했습니다.');
        NotificationManager.error(message);
    } finally {
        LoadingManager.hide(submitBtn);
    }
}

// 회원가입 폼 처리
function handleSignupForm() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;

    // 단계별 폼 관리
    let currentStep = 1;
    const totalSteps = 3;

    // 다음 단계 버튼 처리
    const nextButtons = signupForm.querySelectorAll('.next-step');
    nextButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (validateCurrentStep()) {
                goToStep(currentStep + 1);
            }
        });
    });

    // 이전 단계 버튼 처리
    const prevButtons = signupForm.querySelectorAll('.prev-step');
    prevButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            goToStep(currentStep - 1);
        });
    });

    // 회원가입 제출
    signupForm.addEventListener('submit', handleSignup);

    // 단계 이동 함수
    function goToStep(step) {
        if (step < 1 || step > totalSteps) return;

        // 현재 단계 숨기기
        const currentStepEl = signupForm.querySelector(`[data-step="${currentStep}"]`);
        if (currentStepEl) {
            currentStepEl.classList.remove('active');
        }

        // 새 단계 보이기
        const newStepEl = signupForm.querySelector(`[data-step="${step}"]`);
        if (newStepEl) {
            newStepEl.classList.add('active');
        }

        // 단계 인디케이터 업데이트
        updateStepIndicator(step);

        currentStep = step;
    }

    // 단계 인디케이터 업데이트
    function updateStepIndicator(step) {
        const indicators = document.querySelectorAll('.step-indicator .step');
        indicators.forEach((indicator, index) => {
            if (index < step) {
                indicator.classList.add('completed');
                indicator.classList.remove('active');
            } else if (index === step - 1) {
                indicator.classList.add('active');
                indicator.classList.remove('completed');
            } else {
                indicator.classList.remove('active', 'completed');
            }
        });
    }

    // 현재 단계 유효성 검사
    function validateCurrentStep() {
        const currentStepEl = signupForm.querySelector(`[data-step="${currentStep}"]`);
        if (!currentStepEl) return false;

        const requiredFields = currentStepEl.querySelectorAll('input[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });

        // 1단계: 이메일 중복 검사 (실제 구현시)
        if (currentStep === 1) {
            const email = currentStepEl.querySelector('input[name="email"]');
            if (email && !isValidEmail(email.value)) {
                email.classList.add('error');
                NotificationManager.error('유효한 이메일 주소를 입력해주세요.');
                isValid = false;
            }
        }

        // 2단계: 비밀번호 확인
        if (currentStep === 2) {
            const password = currentStepEl.querySelector('input[name="password"]');
            const confirmPassword = currentStepEl.querySelector('input[name="confirmPassword"]');

            if (password && confirmPassword && password.value !== confirmPassword.value) {
                confirmPassword.classList.add('error');
                NotificationManager.error('비밀번호가 일치하지 않습니다.');
                isValid = false;
            }
        }

        return isValid;
    }
}

// 회원가입 처리
async function handleSignup(event) {
    event.preventDefault();

    // 아이디 중복확인 체크
    if (!usernameChecked || !usernameAvailable) {
        NotificationManager.error('아이디 중복확인을 해주세요.');
        return;
    }

    // 이메일 인증 확인
    if (!emailVerified) {
        NotificationManager.error('이메일 인증을 완료해주세요.');
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    LoadingManager.show(submitBtn);

    try {
        const formData = new FormData(event.target);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            name: formData.get('name'),
            phone: formData.get('phone'),
            businessType: formData.get('businessType'),
            referralCode: formData.get('referralCode'),
            isEmailVerified: emailVerified
        };

        const response = await api.register(userData);

        if (response.success) {
            NotificationManager.success('회원가입이 완료되었습니다! 환영합니다.');

            // 사용자 정보 저장
            if (response.data && response.data.user) {
                localStorage.setItem('userInfo', JSON.stringify(response.data.user));
            }

            // 대시보드로 이동
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
    } catch (error) {
        const message = handleApiError(error, '회원가입 중 오류가 발생했습니다.');
        NotificationManager.error(message);
    } finally {
        LoadingManager.hide(submitBtn);
    }
}

// 비밀번호 재설정 처리
async function handleForgotPassword(event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');
    LoadingManager.show(submitBtn);

    try {
        const formData = new FormData(event.target);
        const email = formData.get('email');

        const response = await api.post('/auth/forgot-password', { email }, { auth: false });

        if (response.success) {
            NotificationManager.success('비밀번호 재설정 링크가 이메일로 전송되었습니다.');
            hideForgotPassword();
        }
    } catch (error) {
        const message = handleApiError(error, '비밀번호 재설정 요청 중 오류가 발생했습니다.');
        NotificationManager.error(message);
    } finally {
        LoadingManager.hide(submitBtn);
    }
}

// 비밀번호 토글
function togglePassword(inputId = 'password') {
    const passwordInput = document.getElementById(inputId);
    const toggleBtn = passwordInput.parentElement.querySelector('.password-toggle i');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
}

// 비밀번호 재설정 모달 표시
function showForgotPassword() {
    let modal = document.getElementById('forgotPasswordModal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'forgotPasswordModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>비밀번호 재설정</h3>
                    <span class="close" onclick="hideForgotPassword()">&times;</span>
                </div>
                <form id="forgotForm">
                    <div class="form-group">
                        <label for="resetEmail">이메일 주소</label>
                        <input type="email" id="resetEmail" name="email" placeholder="가입시 사용한 이메일을 입력하세요" required>
                    </div>
                    <button type="submit" class="auth-btn primary">재설정 링크 전송</button>
                </form>
            </div>
        `;

        // 모달 스타일
        modal.style.cssText = `
            display: none;
            position: fixed;
            z-index: 10000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        `;

        document.body.appendChild(modal);

        // 폼 이벤트 추가
        modal.querySelector('#forgotForm').addEventListener('submit', handleForgotPassword);
    }

    modal.style.display = 'block';
}

// 비밀번호 재설정 모달 숨기기
function hideForgotPassword() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 이메일 인증 관련 함수들
let emailVerified = false;
let verificationTimer = null;

// 이메일 인증 코드 발송
async function verifyEmail() {
    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();

    if (!email) {
        NotificationManager.error('이메일 주소를 입력해주세요.');
        return;
    }

    if (!isValidEmail(email)) {
        NotificationManager.error('올바른 이메일 형식이 아닙니다.');
        return;
    }

    const verifyBtn = document.querySelector('.verify-btn');
    LoadingManager.show(verifyBtn);

    try {
        const response = await api.post('/email/send-verification', {
            email,
            username: document.getElementById('signupUsername')?.value || ''
        }, { auth: false });

        if (response.success) {
            NotificationManager.success('인증 코드가 이메일로 발송되었습니다.');

            // 인증 코드 입력 필드 표시
            const verifyGroup = document.getElementById('emailVerifyGroup');
            if (verifyGroup) {
                verifyGroup.style.display = 'block';
                startVerificationTimer();
            }

            // 버튼 텍스트 변경
            verifyBtn.textContent = '재발송';
        }
    } catch (error) {
        const message = error.response?.data?.message || '이메일 발송에 실패했습니다.';
        NotificationManager.error(message);
    } finally {
        LoadingManager.hide(verifyBtn);
    }
}

// 인증 타이머 시작
function startVerificationTimer() {
    let seconds = 300; // 5분
    const timerElement = document.querySelector('.verify-timer');

    if (verificationTimer) {
        clearInterval(verificationTimer);
    }

    verificationTimer = setInterval(() => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;

        if (seconds <= 0) {
            clearInterval(verificationTimer);
            timerElement.textContent = '만료됨';
            NotificationManager.warning('인증 시간이 만료되었습니다. 다시 요청해주세요.');
        }

        seconds--;
    }, 1000);
}

// 이메일 인증 코드 확인
async function verifyEmailCode() {
    const emailInput = document.getElementById('email');
    const codeInput = document.getElementById('emailCode');

    const email = emailInput.value.trim();
    const code = codeInput.value.trim();

    if (!code || code.length !== 6) {
        NotificationManager.error('6자리 인증 코드를 입력해주세요.');
        return;
    }

    try {
        const response = await api.post('/email/verify-code', {
            email,
            code
        }, { auth: false });

        if (response.success) {
            emailVerified = true;
            NotificationManager.success('이메일 인증이 완료되었습니다.');

            // 인증 완료 표시
            const verifyGroup = document.getElementById('emailVerifyGroup');
            if (verifyGroup) {
                verifyGroup.style.display = 'none';
            }

            // 이메일 입력 필드 비활성화
            emailInput.setAttribute('readonly', true);

            // 인증 버튼 숨기기
            const verifyBtn = emailInput.parentElement.querySelector('.verify-btn');
            if (verifyBtn) {
                verifyBtn.style.display = 'none';
            }

            // 체크 아이콘 표시
            const inputGroup = emailInput.parentElement;
            const checkIcon = document.createElement('i');
            checkIcon.className = 'fas fa-check-circle text-success';
            checkIcon.style.color = '#28a745';
            checkIcon.style.position = 'absolute';
            checkIcon.style.right = '10px';
            checkIcon.style.top = '50%';
            checkIcon.style.transform = 'translateY(-50%)';
            inputGroup.appendChild(checkIcon);

            if (verificationTimer) {
                clearInterval(verificationTimer);
            }
        }
    } catch (error) {
        const message = error.response?.data?.message || '인증 코드 확인에 실패했습니다.';
        NotificationManager.error(message);
    }
}

// 이메일 코드 입력 시 자동 확인
document.addEventListener('DOMContentLoaded', () => {
    const emailCodeInput = document.getElementById('emailCode');
    if (emailCodeInput) {
        emailCodeInput.addEventListener('input', function () {
            if (this.value.length === 6) {
                verifyEmailCode();
            }
        });
    }
});

// 아이디 중복확인 관련 변수
let usernameChecked = false;
let usernameAvailable = false;

// 아이디 중복확인
async function checkUsername() {
    const usernameInput = document.getElementById('signupUsername');
    const username = usernameInput.value.trim();

    if (!username) {
        NotificationManager.error('아이디를 입력해주세요.');
        return;
    }

    if (username.length < 4) {
        NotificationManager.error('아이디는 4자 이상이어야 합니다.');
        return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        NotificationManager.error('아이디는 영문과 숫자만 사용 가능합니다.');
        return;
    }

    const checkBtn = usernameInput.parentElement.querySelector('.verify-btn');
    if (checkBtn) {
        checkBtn.disabled = true;
        checkBtn.textContent = '확인 중...';
    }

    try {
        const response = await api.get(`/auth/check-username/${username}`, { auth: false });

        usernameChecked = true;
        usernameAvailable = response.available;

        if (response.available) {
            NotificationManager.success('사용 가능한 아이디입니다.');

            // 입력 필드에 성공 표시
            usernameInput.style.borderColor = '#28a745';

            // 체크 아이콘 추가
            const existingIcon = usernameInput.parentElement.querySelector('.check-icon');
            if (existingIcon) {
                existingIcon.remove();
            }

            const checkIcon = document.createElement('i');
            checkIcon.className = 'fas fa-check-circle check-icon';
            checkIcon.style.cssText = 'color: #28a745; position: absolute; right: 120px; top: 50%; transform: translateY(-50%);';
            usernameInput.parentElement.style.position = 'relative';
            usernameInput.parentElement.appendChild(checkIcon);

            // 중복확인 버튼 숨기기
            if (checkBtn) {
                checkBtn.style.display = 'none';
            }
        } else {
            NotificationManager.error(response.message || '이미 사용 중인 아이디입니다.');
            usernameInput.style.borderColor = '#dc3545';
            usernameAvailable = false;
        }
    } catch (error) {
        console.error('Username check error:', error);
        NotificationManager.error('아이디 중복확인 중 오류가 발생했습니다.');
    } finally {
        if (checkBtn && !usernameAvailable) {
            checkBtn.disabled = false;
            checkBtn.textContent = '중복확인';
        }
    }
}

// 아이디 입력 변경 시 중복확인 초기화
document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('signupUsername');
    if (usernameInput) {
        usernameInput.addEventListener('input', function () {
            if (usernameChecked) {
                usernameChecked = false;
                usernameAvailable = false;

                // 스타일 초기화
                this.style.borderColor = '';

                // 체크 아이콘 제거
                const checkIcon = this.parentElement.querySelector('.check-icon');
                if (checkIcon) {
                    checkIcon.remove();
                }

                // 중복확인 버튼 다시 표시
                const checkBtn = this.parentElement.querySelector('.verify-btn');
                if (checkBtn) {
                    checkBtn.style.display = '';
                    checkBtn.disabled = false;
                    checkBtn.textContent = '중복확인';
                }
            }
        });
    }
});

// 회원가입 단계 이동
function nextStep(step) {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;

    // 현재 단계 유효성 검사
    const currentStep = signupForm.querySelector('.form-step.active');
    if (currentStep) {
        const currentStepNum = parseInt(currentStep.dataset.step);

        // 현재 단계의 required 필드 검증
        const requiredFields = currentStep.querySelectorAll('input[required]:not([disabled])');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('error');

                // 에러 메시지 표시
                if (!field.nextElementSibling || !field.nextElementSibling.classList.contains('error-message')) {
                    const errorMsg = document.createElement('small');
                    errorMsg.className = 'error-message';
                    errorMsg.style.color = 'red';
                    errorMsg.textContent = '이 필드는 필수입니다.';
                    field.parentNode.appendChild(errorMsg);
                }
            } else {
                field.classList.remove('error');
                const errorMsg = field.parentNode.querySelector('.error-message');
                if (errorMsg) errorMsg.remove();
            }
        });

        if (!isValid) {
            if (window.NotificationManager) {
                window.NotificationManager.error('필수 항목을 모두 입력해주세요.');
            }
            return;
        }
    }

    const currentSteps = signupForm.querySelectorAll('.form-step.active');
    const targetStep = signupForm.querySelector(`.form-step[data-step="${step}"]`);

    // 현재 단계의 required 속성 제거
    currentSteps.forEach(s => {
        s.classList.remove('active');
        // 숨겨지는 단계의 required 필드 비활성화
        s.querySelectorAll('input[required]').forEach(input => {
            input.dataset.wasRequired = 'true';
            input.removeAttribute('required');
        });
    });

    // 새 단계 표시
    if (targetStep) {
        targetStep.classList.add('active');
        // 표시되는 단계의 required 필드 활성화
        targetStep.querySelectorAll('input[data-was-required="true"]').forEach(input => {
            input.setAttribute('required', '');
            delete input.dataset.wasRequired;
        });
    }

    // 프로그레스 업데이트
    const progressSteps = document.querySelectorAll('.signup-progress .step');
    progressSteps.forEach((s, index) => {
        if (index < step) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });
}

function prevStep(step) {
    nextStep(step);
}

// 비밀번호 강도 체크
function checkPasswordStrength(password) {
    let strength = 0;
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');

    if (!strengthBar || !strengthText) return strength;

    // 길이 체크
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // 소문자 체크
    if (/[a-z]/.test(password)) strength++;

    // 대문자 체크
    if (/[A-Z]/.test(password)) strength++;

    // 숫자 체크
    if (/[0-9]/.test(password)) strength++;

    // 특수문자 체크
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    // 강도에 따른 표시
    strengthBar.style.width = `${(strength / 6) * 100}%`;

    if (strength <= 2) {
        strengthBar.style.background = '#dc3545';
        strengthText.textContent = '비밀번호 강도: 약함';
    } else if (strength <= 4) {
        strengthBar.style.background = '#ffc107';
        strengthText.textContent = '비밀번호 강도: 보통';
    } else {
        strengthBar.style.background = '#28a745';
        strengthText.textContent = '비밀번호 강도: 강함';
    }

    return strength;
}

// 비밀번호 토글 (회원가입용)
function toggleSignupPassword() {
    const passwordInput = document.getElementById('signupPassword');
    const toggleBtn = passwordInput.parentElement.querySelector('.password-toggle i');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
}

// 비밀번호 입력 시 강도 체크
document.addEventListener('DOMContentLoaded', () => {
    const signupPasswordInput = document.getElementById('signupPassword');
    if (signupPasswordInput) {
        signupPasswordInput.addEventListener('input', function () {
            checkPasswordStrength(this.value);

            // 비밀번호 확인 필드와 비교
            const confirmPassword = document.getElementById('confirmPassword');
            if (confirmPassword && confirmPassword.value) {
                checkPasswordMatch();
            }
        });
    }

    // 비밀번호 확인 체크
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }
});

// 비밀번호 일치 체크
function checkPasswordMatch() {
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const matchIndicator = document.querySelector('.password-match-indicator');

    if (!confirmPassword) {
        if (matchIndicator) matchIndicator.innerHTML = '';
        return false;
    }

    if (password === confirmPassword) {
        if (matchIndicator) {
            matchIndicator.innerHTML = '<i class="fas fa-check-circle" style="color: #28a745;"></i>';
        }
        return true;
    } else {
        if (matchIndicator) {
            matchIndicator.innerHTML = '<i class="fas fa-times-circle" style="color: #dc3545;"></i>';
        }
        return false;
    }
}

// 약관 전체 동의
function toggleAllTerms() {
    const agreeAll = document.getElementById('agreeAll');
    const allTerms = document.querySelectorAll('.terms-list input[type="checkbox"]');

    allTerms.forEach(checkbox => {
        checkbox.checked = agreeAll.checked;
    });
}

// 약관 보기
function showTerms(type) {
    let content = '';

    if (type === 'service') {
        content = '서비스 이용약관 내용...';
    } else if (type === 'privacy') {
        content = '개인정보처리방침 내용...';
    } else if (type === 'marketing') {
        content = '마케팅 활용 동의 내용...';
    }

    alert(content);
}

// 전화번호 인증 - phone-auth.js에서 처리
/*
async function verifyPhone_OLD(event) {
    const phoneInput = document.getElementById('phone');
    const phone = phoneInput.value.trim();
    const verifyBtn = event ? event.target : null;

    if (!phone) {
        NotificationManager.error('전화번호를 입력해주세요.');
        return;
    }

    if (!isValidPhone(phone)) {
        NotificationManager.error('올바른 전화번호 형식이 아닙니다. (예: 01012345678)');
        return;
    }

    // 버튼 로딩 상태
    if (verifyBtn && LoadingManager) {
        LoadingManager.show(verifyBtn);
    }

    try {
        console.log('전화번호 인증 API 호출:', phone);

        // API 호출하여 인증번호 발송
        const response = await api.post('/sms/send-verification', {
            phone,
            type: 'signup'
        }, { auth: false });

        if (response.success) {
            // 인증 UI 표시
            const verifyGroup = document.getElementById('phoneVerifyGroup');
            if (verifyGroup) {
                verifyGroup.style.display = 'block';

                // 인증번호 입력 필드에 포커스
                const codeInput = document.getElementById('phoneCode');
                if (codeInput) {
                    codeInput.focus();
                }

                // 타이머 시작 (5분)
                startPhoneVerificationTimer();
            }

            NotificationManager.success('인증번호가 발송되었습니다. SMS를 확인해주세요.');

            // 인증 확인 버튼 추가
            if (!document.getElementById('phoneVerifyBtn')) {
                const codeInput = document.getElementById('phoneCode');
                if (codeInput && codeInput.parentNode) {
                    const verifyCodeBtn = document.createElement('button');
                    verifyCodeBtn.type = 'button';
                    verifyCodeBtn.id = 'phoneVerifyBtn';
                    verifyCodeBtn.className = 'verify-btn';
                    verifyCodeBtn.textContent = '확인';
                    verifyCodeBtn.onclick = confirmPhoneVerification;
                    codeInput.parentNode.appendChild(verifyCodeBtn);
                }
            }
        } else {
            NotificationManager.error(response.message || '인증번호 발송에 실패했습니다.');
        }
    } catch (error) {
        console.error('Phone verification error:', error);
        const errorMessage = error.response?.data?.message || error.message || '인증번호 발송 중 오류가 발생했습니다.';
        NotificationManager.error(errorMessage);

        // SMS API 오류 시 실제 오류 메시지만 표시
        if (error.response?.status === 404 || error.response?.status === 500) {
            console.log('SMS API 오류 발생');
            // 테스트 모드 제거 - 실제 SMS만 사용
            NotificationManager.error('SMS 서비스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }

            // 인증 확인 버튼 추가
            if (!document.getElementById('phoneVerifyBtn')) {
                const codeInput = document.getElementById('phoneCode');
                if (codeInput && codeInput.parentNode) {
                    const verifyCodeBtn = document.createElement('button');
                    verifyCodeBtn.type = 'button';
                    verifyCodeBtn.id = 'phoneVerifyBtn';
                    verifyCodeBtn.className = 'verify-btn';
                    verifyCodeBtn.textContent = '확인';
                    verifyCodeBtn.onclick = confirmPhoneVerification;
                    codeInput.parentNode.appendChild(verifyCodeBtn);
                }
            }
        }
    } finally {
        if (verifyBtn && LoadingManager) {
            LoadingManager.hide(verifyBtn);
        }
    }
}

// 전화번호 인증 확인
async function confirmPhoneVerification(event) {
    const phone = document.getElementById('phone').value.trim();
    const code = document.getElementById('phoneCode').value.trim();
    const confirmBtn = event ? event.target : null;

    if (!code) {
        NotificationManager.error('인증번호를 입력해주세요.');
        return;
    }

    if (code.length !== 6) {
        NotificationManager.error('인증번호는 6자리입니다.');
        return;
    }

    if (confirmBtn && LoadingManager) {
        LoadingManager.show(confirmBtn);
    }

    try {
        console.log('전화번호 인증 확인:', phone, code);

        // 테스트 모드 완전 제거 - 실제 API만 사용
        // if (code === '123456') 코드 제거됨

        // 실제 API 호출
        const response = await api.post('/sms/verify-code', {
            phone,
            code
        }, { auth: false });

        if (response.success) {
            NotificationManager.success('전화번호 인증이 완료되었습니다.');

            // 인증 완료 표시
            const phoneInput = document.getElementById('phone');
            if (phoneInput) {
                phoneInput.dataset.verified = 'true';
                phoneInput.style.borderColor = '#28a745';
            }

            // 인증 UI 숨기기
            const verifyGroup = document.getElementById('phoneVerifyGroup');
            if (verifyGroup) {
                verifyGroup.style.display = 'none';
            }

            // 인증 버튼 비활성화
            const verifyBtn = phoneInput.parentNode.querySelector('.verify-btn');
            if (verifyBtn) {
                verifyBtn.textContent = '인증완료';
                verifyBtn.disabled = true;
                verifyBtn.style.background = '#28a745';
            }
        } else {
            NotificationManager.error(response.message || '인증번호가 일치하지 않습니다.');
        }
    } catch (error) {
        console.error('Phone verification confirm error:', error);
        NotificationManager.error('인증 확인 중 오류가 발생했습니다.');
    } finally {
        if (confirmBtn && LoadingManager) {
            LoadingManager.hide(confirmBtn);
        }
    }
}

*/ // verifyPhone 함수 끝

// 전화번호 인증 타이머 - phone-auth.js에서 처리
/*
function startPhoneVerificationTimer_OLD() {
    let timeLeft = 300; // 5분 (300초)
    const timerElement = document.querySelector('#phoneVerifyGroup .verify-timer');

    if (!timerElement) {
        // 타이머 엘리먼트가 없으면 생성
        const verifyGroup = document.getElementById('phoneVerifyGroup');
        if (verifyGroup) {
            const timer = document.createElement('span');
            timer.className = 'verify-timer';
            timer.style.marginLeft = '10px';
            timer.style.color = '#666';
            verifyGroup.appendChild(timer);
        }
    }

    const timer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const timerEl = document.querySelector('#phoneVerifyGroup .verify-timer');
        if (timerEl) {
            timerEl.textContent = display;

            if (timeLeft <= 60) {
                timerEl.style.color = '#dc3545';
            }
        }

        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(timer);
            if (timerEl) {
                timerEl.textContent = '시간 만료';
            }
            NotificationManager.warning('인증 시간이 만료되었습니다. 다시 시도해주세요.');
        }
    }, 1000);
}
*/ // startPhoneVerificationTimer 함수 끝

// 유틸리티 함수들
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/[^0-9]/g, ''));
}

// 로그아웃 함수
async function logout() {
    try {
        await api.logout();
        NotificationManager.success('로그아웃되었습니다.');
        localStorage.removeItem('rememberLogin');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('로그아웃 오류:', error);
        // 로컬 토큰만 제거하고 홈으로 이동
        api.clearToken();
        window.location.href = 'index.html';
    }
}

// 모달 외부 클릭 시 닫기
window.addEventListener('click', (event) => {
    const modal = document.getElementById('forgotPasswordModal');
    if (event.target === modal) {
        hideForgotPassword();
    }
});

// 전역 함수로 노출
window.nextStep = nextStep;
window.prevStep = prevStep;
window.toggleSignupPassword = toggleSignupPassword;
window.checkPasswordStrength = checkPasswordStrength;
window.toggleAllTerms = toggleAllTerms;
window.showTerms = showTerms;
window.checkUsername = checkUsername;
window.verifyEmail = verifyEmail;
// 전화번호 인증 함수 (테스트 모드 제거)
async function verifyPhone(event) {
    const phoneInput = document.getElementById('phone');
    const phone = phoneInput.value.trim();
    const verifyBtn = event ? event.target : null;

    if (!phone) {
        NotificationManager.error('전화번호를 입력해주세요.');
        return;
    }

    // 버튼 로딩 상태
    if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.textContent = '발송 중...';
    }

    try {
        // 실제 SMS 발송 API 호출
        const response = await fetch(`${API_CONFIG.BASE_URL}/sms/send-verification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone })
        });

        const data = await response.json();

        if (data.success) {
            // 인증번호 입력 필드 표시
            document.getElementById('phoneVerifyGroup').style.display = 'block';
            NotificationManager.show('인증번호가 SMS로 발송되었습니다.', 'success');

            // 타이머 시작
            startPhoneTimer();

            // 60초 후 재발송 버튼 활성화
            setTimeout(() => {
                if (verifyBtn) {
                    verifyBtn.disabled = false;
                    verifyBtn.textContent = '재발송';
                }
            }, 60000);
        } else {
            NotificationManager.error(data.message || 'SMS 발송에 실패했습니다.');
            if (verifyBtn) {
                verifyBtn.disabled = false;
                verifyBtn.textContent = '인증';
            }
        }
    } catch (error) {
        console.error('Phone verification error:', error);
        // 백엔드가 준비되지 않은 경우 안내
        NotificationManager.show('SMS 서비스 준비 중입니다. 이메일 인증을 이용해주세요.', 'info');
        if (verifyBtn) {
            verifyBtn.disabled = false;
            verifyBtn.textContent = '인증';
        }
    }
}

// 전화번호 타이머
function startPhoneTimer() {
    let timeLeft = 300; // 5분
    const timerElement = document.querySelector('#phoneVerifyGroup .verify-timer');

    if (!timerElement) return;

    const timer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(timer);
            timerElement.textContent = '시간초과';
            NotificationManager.error('인증 시간이 초과되었습니다.');
        }
    }, 1000);
}

// window 객체에 등록
window.verifyPhone = verifyPhone;
