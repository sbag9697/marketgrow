// 비밀번호 찾기 기능
const API_URL = 'https://marketgrow-production-c586.up.railway.app/api';

let currentStep = 1;
let userEmail = '';
let resetToken = '';
let timerInterval = null;
let timeRemaining = 300; // 5분

// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
    setupFormHandlers();
});

// 폼 핸들러 설정
function setupFormHandlers() {
    // Step 1: 이메일 입력
    const emailForm = document.getElementById('emailForm');
    if (emailForm) {
        emailForm.addEventListener('submit', handleEmailSubmit);
    }

    // Step 2: 인증 코드 확인
    const verifyForm = document.getElementById('verifyForm');
    if (verifyForm) {
        verifyForm.addEventListener('submit', handleVerifySubmit);
    }

    // Step 3: 새 비밀번호 설정
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
        resetForm.addEventListener('submit', handleResetSubmit);
        
        // 비밀번호 강도 체크
        const newPassword = document.getElementById('newPassword');
        if (newPassword) {
            newPassword.addEventListener('input', checkPasswordStrength);
        }
    }
}

// Step 1: 이메일 제출 처리
async function handleEmailSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    if (!validateEmail(email)) {
        showError('올바른 이메일 주소를 입력하세요.');
        return;
    }
    
    userEmail = email;
    
    // 버튼 로딩 상태
    setButtonLoading(true);
    
    try {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Step 2로 이동
            showStep(2);
            document.getElementById('userEmail').textContent = email;
            startTimer();
            showSuccess('인증 코드가 전송되었습니다.');
        } else {
            showError(data.message || '이메일 전송에 실패했습니다.');
        }
    } catch (error) {
        console.error('이메일 전송 오류:', error);
        showError('서버 연결에 실패했습니다.');
    } finally {
        setButtonLoading(false);
    }
}

// Step 2: 인증 코드 확인
async function handleVerifySubmit(e) {
    e.preventDefault();
    
    const code = document.getElementById('verificationCode').value;
    if (!code || code.length !== 6) {
        showError('6자리 인증 코드를 입력하세요.');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email: userEmail,
                code: code
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            resetToken = data.data.resetToken;
            stopTimer();
            showStep(3);
            showSuccess('인증이 완료되었습니다.');
        } else {
            showError(data.message || '인증 코드가 올바르지 않습니다.');
        }
    } catch (error) {
        console.error('인증 확인 오류:', error);
        showError('인증 확인에 실패했습니다.');
    }
}

// Step 3: 비밀번호 재설정
async function handleResetSubmit(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // 비밀번호 유효성 검사
    if (!validatePassword(newPassword)) {
        showError('비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showError('비밀번호가 일치하지 않습니다.');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userEmail,
                resetToken: resetToken,
                newPassword: newPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showStep('success');
            showSuccess('비밀번호가 성공적으로 변경되었습니다.');
        } else {
            showError(data.message || '비밀번호 변경에 실패했습니다.');
        }
    } catch (error) {
        console.error('비밀번호 재설정 오류:', error);
        showError('비밀번호 변경에 실패했습니다.');
    }
}

// 인증 코드 재전송
async function resendCode() {
    if (timeRemaining > 240) {
        showError('1분 후에 재전송할 수 있습니다.');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/resend-verification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: userEmail })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 타이머 리셋
            stopTimer();
            timeRemaining = 300;
            startTimer();
            showSuccess('인증 코드가 재전송되었습니다.');
        } else {
            showError(data.message || '재전송에 실패했습니다.');
        }
    } catch (error) {
        console.error('재전송 오류:', error);
        showError('재전송에 실패했습니다.');
    }
}

// 타이머 시작
function startTimer() {
    timerInterval = setInterval(() => {
        timeRemaining--;
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = display;
        }
        
        if (timeRemaining <= 0) {
            stopTimer();
            showError('인증 시간이 만료되었습니다. 다시 시도해주세요.');
            showStep(1);
        }
    }, 1000);
}

// 타이머 정지
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// 비밀번호 강도 체크
function checkPasswordStrength() {
    const password = document.getElementById('newPassword').value;
    const strengthLevel = document.getElementById('strengthLevel');
    const strengthText = document.getElementById('strengthText');
    
    let strength = 0;
    
    // 길이 체크
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // 문자 종류 체크
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    // 강도 표시
    const strengthPercent = (strength / 6) * 100;
    strengthLevel.style.width = strengthPercent + '%';
    
    if (strength <= 2) {
        strengthLevel.className = 'strength-level weak';
        strengthText.textContent = '약함';
    } else if (strength <= 4) {
        strengthLevel.className = 'strength-level medium';
        strengthText.textContent = '보통';
    } else {
        strengthLevel.className = 'strength-level strong';
        strengthText.textContent = '강함';
    }
}

// 비밀번호 표시/숨기기
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        field.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// 단계 표시
function showStep(step) {
    // 모든 단계 숨기기
    document.querySelectorAll('.reset-step').forEach(s => {
        s.style.display = 'none';
    });
    
    // 선택된 단계 표시
    if (step === 'success') {
        document.getElementById('successStep').style.display = 'block';
    } else {
        document.getElementById(`step${step}`).style.display = 'block';
    }
    
    currentStep = step;
}

// 이메일 유효성 검사
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 비밀번호 유효성 검사
function validatePassword(password) {
    // 8자 이상, 영문, 숫자, 특수문자 포함
    const re = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    return re.test(password);
}

// 버튼 로딩 상태
function setButtonLoading(loading) {
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    
    if (btnText && btnLoader) {
        if (loading) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
        } else {
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';
        }
    }
}

// 에러 메시지 표시
function showError(message) {
    showNotification(message, 'error');
}

// 성공 메시지 표시
function showSuccess(message) {
    showNotification(message, 'success');
}

// 알림 표시
function showNotification(message, type) {
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

// 전역 함수 등록
window.togglePassword = togglePassword;
window.resendCode = resendCode;