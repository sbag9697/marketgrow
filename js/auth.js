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

        const response = await api.login(credentials);
        
        if (response.success && response.data) {
            NotificationManager.success('로그인 성공! 환영합니다.');
            
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
            referralCode: formData.get('referralCode')
        };

        const response = await api.register(userData);
        
        if (response.success) {
            NotificationManager.success('회원가입이 완료되었습니다! 환영합니다.');
            
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

// 소셜 로그인 함수들 (임시 구현)
function loginWithKakao() {
    NotificationManager.info('카카오 로그인은 준비 중입니다.');
}

function loginWithGoogle() {
    NotificationManager.info('구글 로그인은 준비 중입니다.');
}

function loginWithNaver() {
    NotificationManager.info('네이버 로그인은 준비 중입니다.');
}

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