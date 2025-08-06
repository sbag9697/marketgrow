// 알림 설정 페이지 JavaScript
let userInfo = null;
let currentSettings = null;
let verificationTimer = null;
let verificationTimeLeft = 0;

document.addEventListener('DOMContentLoaded', function() {
    // 인증 확인
    checkAuthentication();
    
    // 설정 로드
    loadNotificationSettings();
    
    // 알림 히스토리 로드
    loadNotificationHistory();
    
    // 이벤트 리스너 초기화
    initEventListeners();
});

// 인증 확인
async function checkAuthentication() {
    if (!api.token) {
        NotificationManager.warning('로그인이 필요한 서비스입니다.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await api.getProfile();
        if (!response.success) {
            throw new Error('인증 실패');
        }
        
        userInfo = response.data.user;
        
        // 사용자 정보 업데이트
        const navUserName = document.getElementById('navUserName');
        if (navUserName) {
            navUserName.textContent = `${userInfo.name}님`;
        }

        // 휴대폰 정보 설정
        if (userInfo.phone) {
            document.getElementById('phoneNumber').value = userInfo.phone;
            if (userInfo.phoneVerified) {
                setPhoneVerified();
            }
        }
    } catch (error) {
        console.error('인증 확인 실패:', error);
        api.clearToken();
        window.location.href = 'login.html';
    }
}

// 알림 설정 로드
async function loadNotificationSettings() {
    try {
        // 로컬 설정 가져오기
        currentSettings = notificationService.getNotificationSettings();
        
        // API에서 사용자 설정 가져오기
        const response = await api.getNotificationSettings();
        if (response.success && response.data) {
            currentSettings = { ...currentSettings, ...response.data };
        }
        
        // UI 업데이트
        updateSettingsUI();
        
    } catch (error) {
        console.error('알림 설정 로드 실패:', error);
        // 기본 설정으로 UI 업데이트
        updateSettingsUI();
    }
}

// 설정 UI 업데이트
function updateSettingsUI() {
    // 메인 토글
    document.getElementById('emailNotifications').checked = currentSettings.emailNotifications;
    document.getElementById('smsNotifications').checked = currentSettings.smsNotifications;
    
    // 이메일 세부 설정
    document.getElementById('emailOrderConfirmation').checked = currentSettings.orderUpdates !== false;
    document.getElementById('emailPaymentNotifications').checked = currentSettings.paymentNotifications !== false;
    document.getElementById('emailOrderUpdates').checked = currentSettings.orderUpdates !== false;
    document.getElementById('emailMarketingNotifications').checked = currentSettings.marketingNotifications === true;
    
    // SMS 세부 설정
    document.getElementById('smsPaymentSuccess').checked = currentSettings.smsPaymentSuccess !== false;
    document.getElementById('smsOrderComplete').checked = currentSettings.smsOrderComplete !== false;
    document.getElementById('smsUrgentNotifications').checked = currentSettings.smsUrgentNotifications !== false;
    
    // 콘텐츠 표시/숨김
    toggleEmailNotifications();
    toggleSMSNotifications();
}

// 이메일 알림 토글
function toggleEmailNotifications() {
    const isEnabled = document.getElementById('emailNotifications').checked;
    const content = document.getElementById('emailSettingsContent');
    
    if (isEnabled) {
        content.classList.add('active');
        content.style.display = 'block';
    } else {
        content.classList.remove('active');
        content.style.display = 'none';
    }
}

// SMS 알림 토글
function toggleSMSNotifications() {
    const isEnabled = document.getElementById('smsNotifications').checked;
    const content = document.getElementById('smsSettingsContent');
    
    if (isEnabled) {
        content.classList.add('active');
        content.style.display = 'block';
        
        // 휴대폰 인증 상태 확인
        if (!userInfo?.phoneVerified) {
            showPhoneVerificationRequirement();
        }
    } else {
        content.classList.remove('active');
        content.style.display = 'none';
    }
}

// 휴대폰 인증 필요 표시
function showPhoneVerificationRequirement() {
    const smsOptions = document.getElementById('smsOptions');
    smsOptions.style.display = 'none';
    
    const verificationStatus = document.getElementById('verificationStatus');
    verificationStatus.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        휴대폰 번호 인증이 필요합니다
    `;
    verificationStatus.className = 'verification-status';
}

// 휴대폰 인증 완료 표시
function setPhoneVerified() {
    const smsOptions = document.getElementById('smsOptions');
    smsOptions.style.display = 'block';
    
    const verificationStatus = document.getElementById('verificationStatus');
    verificationStatus.innerHTML = `
        <i class="fas fa-check-circle"></i>
        휴대폰 번호가 인증되었습니다
    `;
    verificationStatus.className = 'verification-status verified';
    
    const verifyBtn = document.querySelector('.verify-btn');
    verifyBtn.innerHTML = `
        <i class="fas fa-check"></i>
        인증완료
    `;
    verifyBtn.disabled = true;
}

// 휴대폰 번호 인증
function verifyPhoneNumber() {
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    
    if (!phoneNumber) {
        NotificationManager.error('휴대폰 번호를 입력해주세요.');
        return;
    }
    
    if (!isValidPhoneNumber(phoneNumber)) {
        NotificationManager.error('올바른 휴대폰 번호 형식이 아닙니다.');
        return;
    }
    
    // 모달 표시
    document.getElementById('phoneNumberDisplay').textContent = phoneNumber;
    document.getElementById('phoneVerificationModal').style.display = 'block';
}

// 휴대폰 번호 유효성 검사
function isValidPhoneNumber(phone) {
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    return phoneRegex.test(phone);
}

// 인증번호 발송
async function sendVerificationCode() {
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    
    try {
        // API를 통해 인증번호 발송
        const response = await api.sendPhoneVerification(phoneNumber);
        
        if (response.success) {
            // 2단계로 전환
            document.getElementById('verificationStep1').style.display = 'none';
            document.getElementById('verificationStep2').style.display = 'block';
            
            // 타이머 시작
            startVerificationTimer();
            
            NotificationManager.success('인증번호가 발송되었습니다.');
        } else {
            throw new Error(response.message || '인증번호 발송에 실패했습니다.');
        }
    } catch (error) {
        console.error('인증번호 발송 실패:', error);
        NotificationManager.error(error.message);
    }
}

// 인증 타이머 시작
function startVerificationTimer() {
    verificationTimeLeft = 180; // 3분
    updateTimerDisplay();
    
    verificationTimer = setInterval(() => {
        verificationTimeLeft--;
        updateTimerDisplay();
        
        if (verificationTimeLeft <= 0) {
            clearInterval(verificationTimer);
            NotificationManager.warning('인증 시간이 만료되었습니다. 다시 시도해주세요.');
            closePhoneVerificationModal();
        }
    }, 1000);
}

// 타이머 표시 업데이트
function updateTimerDisplay() {
    const minutes = Math.floor(verificationTimeLeft / 60);
    const seconds = verificationTimeLeft % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerElement = document.getElementById('verificationTimer');
    if (timerElement) {
        timerElement.textContent = display;
    }
}

// 인증번호 재발송
function resendVerificationCode() {
    if (verificationTimer) {
        clearInterval(verificationTimer);
    }
    
    sendVerificationCode();
}

// 인증번호 확인
async function confirmVerificationCode() {
    const verificationCode = document.getElementById('verificationCode').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    
    if (!verificationCode || verificationCode.length !== 6) {
        NotificationManager.error('6자리 인증번호를 입력해주세요.');
        return;
    }
    
    try {
        const response = await api.verifyPhoneNumber(phoneNumber, verificationCode);
        
        if (response.success) {
            // 인증 완료
            userInfo.phoneVerified = true;
            setPhoneVerified();
            closePhoneVerificationModal();
            
            NotificationManager.success('휴대폰 인증이 완료되었습니다.');
        } else {
            throw new Error(response.message || '인증번호가 올바르지 않습니다.');
        }
    } catch (error) {
        console.error('휴대폰 인증 실패:', error);
        NotificationManager.error(error.message);
    }
}

// 휴대폰 인증 모달 닫기
function closePhoneVerificationModal() {
    document.getElementById('phoneVerificationModal').style.display = 'none';
    
    // 상태 초기화
    document.getElementById('verificationStep1').style.display = 'block';
    document.getElementById('verificationStep2').style.display = 'none';
    document.getElementById('verificationCode').value = '';
    
    if (verificationTimer) {
        clearInterval(verificationTimer);
        verificationTimer = null;
    }
}

// 테스트 이메일 발송
async function sendTestEmail() {
    if (!userInfo?.email) {
        NotificationManager.error('이메일 주소가 등록되지 않았습니다.');
        return;
    }
    
    try {
        const result = await notificationService.sendTestNotification('email', userInfo);
        
        if (result.success) {
            NotificationManager.success('테스트 이메일이 발송되었습니다.');
            addNotificationToHistory('email', '테스트 이메일 발송', '테스트 목적으로 이메일을 발송했습니다.', true);
        } else {
            NotificationManager.error(result.message);
            addNotificationToHistory('email', '테스트 이메일 발송 실패', result.error, false);
        }
    } catch (error) {
        console.error('테스트 이메일 발송 실패:', error);
        NotificationManager.error('테스트 이메일 발송에 실패했습니다.');
    }
}

// 테스트 SMS 발송
async function sendTestSMS() {
    if (!userInfo?.phone) {
        NotificationManager.error('휴대폰 번호가 등록되지 않았습니다.');
        return;
    }
    
    if (!userInfo?.phoneVerified) {
        NotificationManager.error('휴대폰 인증을 먼저 완료해주세요.');
        return;
    }
    
    try {
        const result = await notificationService.sendTestNotification('sms', userInfo);
        
        if (result.success) {
            NotificationManager.success('테스트 SMS가 발송되었습니다.');
            addNotificationToHistory('sms', '테스트 SMS 발송', '테스트 목적으로 SMS를 발송했습니다.', true);
        } else {
            NotificationManager.error(result.message);
            addNotificationToHistory('sms', '테스트 SMS 발송 실패', result.error, false);
        }
    } catch (error) {
        console.error('테스트 SMS 발송 실패:', error);
        NotificationManager.error('테스트 SMS 발송에 실패했습니다.');
    }
}

// 알림 설정 저장
async function saveNotificationSettings() {
    try {
        // 현재 설정 수집
        const settings = {
            emailNotifications: document.getElementById('emailNotifications').checked,
            smsNotifications: document.getElementById('smsNotifications').checked,
            orderUpdates: document.getElementById('emailOrderConfirmation').checked,
            paymentNotifications: document.getElementById('emailPaymentNotifications').checked,
            marketingNotifications: document.getElementById('emailMarketingNotifications').checked,
            smsPaymentSuccess: document.getElementById('smsPaymentSuccess').checked,
            smsOrderComplete: document.getElementById('smsOrderComplete').checked,
            smsUrgentNotifications: document.getElementById('smsUrgentNotifications').checked
        };
        
        // 휴대폰 번호 업데이트
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        if (phoneNumber && phoneNumber !== userInfo.phone) {
            const updateResponse = await api.updateProfile({
                phone: phoneNumber
            });
            
            if (!updateResponse.success) {
                throw new Error('휴대폰 번호 업데이트에 실패했습니다.');
            }
        }
        
        // 알림 설정 저장
        const result = await notificationService.updateNotificationSettings(userInfo.id, settings);
        
        if (result.success) {
            currentSettings = settings;
            NotificationManager.success('알림 설정이 저장되었습니다.');
            
            // 히스토리에 추가
            addNotificationToHistory('system', '설정 변경', '알림 설정이 업데이트되었습니다.', true);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('설정 저장 실패:', error);
        NotificationManager.error(error.message || '설정 저장에 실패했습니다.');
    }
}

// 기본값으로 복원
function resetToDefaults() {
    if (!confirm('알림 설정을 기본값으로 복원하시겠습니까?')) {
        return;
    }
    
    // 기본 설정으로 복원
    document.getElementById('emailNotifications').checked = true;
    document.getElementById('smsNotifications').checked = false;
    document.getElementById('emailOrderConfirmation').checked = true;
    document.getElementById('emailPaymentNotifications').checked = true;
    document.getElementById('emailOrderUpdates').checked = true;
    document.getElementById('emailMarketingNotifications').checked = false;
    document.getElementById('smsPaymentSuccess').checked = true;
    document.getElementById('smsOrderComplete').checked = true;
    document.getElementById('smsUrgentNotifications').checked = true;
    
    // UI 업데이트
    toggleEmailNotifications();
    toggleSMSNotifications();
    
    NotificationManager.success('설정이 기본값으로 복원되었습니다.');
}

// 알림 히스토리 로드
async function loadNotificationHistory() {
    try {
        const response = await api.getNotificationHistory({ limit: 20 });
        
        if (response.success && response.data?.notifications) {
            renderNotificationHistory(response.data.notifications);
        } else {
            showEmptyHistory();
        }
    } catch (error) {
        console.error('알림 히스토리 로드 실패:', error);
        showEmptyHistory();
    }
}

// 알림 히스토리 렌더링
function renderNotificationHistory(notifications) {
    const historyContainer = document.getElementById('notificationHistory');
    
    if (notifications.length === 0) {
        showEmptyHistory();
        return;
    }
    
    let historyHTML = '';
    notifications.forEach(notification => {
        const statusClass = notification.success ? 'success' : 'failed';
        const iconClass = getNotificationIconClass(notification.type);
        const timeAgo = getTimeAgo(notification.createdAt);
        
        historyHTML += `
            <div class="history-item">
                <div class="history-icon ${notification.type} ${!notification.success ? 'failed' : ''}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="history-content">
                    <h5>${notification.title}</h5>
                    <p>${notification.message}</p>
                </div>
                <div class="history-time">${timeAgo}</div>
                <div class="history-status ${statusClass}">
                    ${notification.success ? '성공' : '실패'}
                </div>
            </div>
        `;
    });
    
    historyContainer.innerHTML = historyHTML;
}

// 빈 히스토리 표시
function showEmptyHistory() {
    const historyContainer = document.getElementById('notificationHistory');
    historyContainer.innerHTML = `
        <div class="loading-placeholder">
            <i class="fas fa-bell-slash"></i>
            <p>알림 내역이 없습니다.</p>
        </div>
    `;
}

// 히스토리에 알림 추가
function addNotificationToHistory(type, title, message, success) {
    const historyContainer = document.getElementById('notificationHistory');
    
    // 로딩 플레이스홀더 제거
    const placeholder = historyContainer.querySelector('.loading-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    
    const statusClass = success ? 'success' : 'failed';
    const iconClass = getNotificationIconClass(type);
    
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
        <div class="history-icon ${type} ${!success ? 'failed' : ''}">
            <i class="${iconClass}"></i>
        </div>
        <div class="history-content">
            <h5>${title}</h5>
            <p>${message}</p>
        </div>
        <div class="history-time">방금 전</div>
        <div class="history-status ${statusClass}">
            ${success ? '성공' : '실패'}
        </div>
    `;
    
    // 맨 위에 추가
    historyContainer.insertBefore(historyItem, historyContainer.firstChild);
    
    // 10개 이상이면 마지막 항목 제거
    const items = historyContainer.querySelectorAll('.history-item');
    if (items.length > 10) {
        items[items.length - 1].remove();
    }
}

// 알림 히스토리 삭제
async function clearNotificationHistory() {
    if (!confirm('알림 내역을 모두 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const response = await api.clearNotificationHistory();
        
        if (response.success) {
            showEmptyHistory();
            NotificationManager.success('알림 내역이 삭제되었습니다.');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('알림 내역 삭제 실패:', error);
        NotificationManager.error('알림 내역 삭제에 실패했습니다.');
    }
}

// 이벤트 리스너 초기화
function initEventListeners() {
    // 휴대폰 번호 입력 포맷팅
    const phoneInput = document.getElementById('phoneNumber');
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/[^\d]/g, '');
        if (value.length >= 3) {
            value = value.substring(0, 3) + '-' + value.substring(3);
        }
        if (value.length >= 8) {
            value = value.substring(0, 8) + '-' + value.substring(8, 12);
        }
        e.target.value = value;
    });
    
    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('phoneVerificationModal');
        if (event.target === modal) {
            closePhoneVerificationModal();
        }
    });
    
    // 키보드 이벤트
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closePhoneVerificationModal();
        }
    });
    
    // 인증번호 입력 시 숫자만 허용
    const verificationCodeInput = document.getElementById('verificationCode');
    verificationCodeInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^\d]/g, '');
    });
    
    // 사용자 메뉴 초기화
    document.addEventListener('click', function(event) {
        const userMenu = document.querySelector('.user-menu');
        const userDropdown = document.getElementById('userDropdown');
        
        if (userMenu && !userMenu.contains(event.target)) {
            userDropdown?.classList.remove('show');
        }
    });
}

// 유틸리티 함수들
function getNotificationIconClass(type) {
    const iconClasses = {
        email: 'fas fa-envelope',
        sms: 'fas fa-sms',
        system: 'fas fa-cog'
    };
    return iconClasses[type] || 'fas fa-bell';
}

function getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}일 전`;
    
    return date.toLocaleDateString('ko-KR');
}

// 사용자 메뉴 토글
function toggleUserMenu() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.classList.toggle('show');
    }
}