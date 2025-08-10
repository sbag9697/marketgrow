// 인증 관련 JavaScript
document.addEventListener('DOMContentLoaded', function() {
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

        let response;
        
        try {
            response = await api.login(credentials);
        } catch (apiError) {
            console.log('API 로그인 실패, 데모 모드 시도');
            // API 실패 시 데모 모드로 폴백
            if (window.DemoAuth) {
                response = DemoAuth.login(credentials);
                if (response.success) {
                    NotificationManager.info('데모 모드로 로그인했습니다.');
                }
            } else {
                throw apiError;
            }
        }
        
        if (response.success && response.data) {
            if (!window.DemoAuth || !response.data.token.startsWith('demo_')) {
                NotificationManager.success('로그인 성공! 환영합니다.');
            }
            
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
document.addEventListener('DOMContentLoaded', function() {
    const emailCodeInput = document.getElementById('emailCode');
    if (emailCodeInput) {
        emailCodeInput.addEventListener('input', function() {
            if (this.value.length === 6) {
                verifyEmailCode();
            }
        });
    }
});

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
window.addEventListener('click', function(event) {
    const modal = document.getElementById('forgotPasswordModal');
    if (event.target === modal) {
        hideForgotPassword();
    }
});