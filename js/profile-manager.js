// 프로필 관리 시스템
const API_URL = 'https://marketgrow-production.up.railway.app/api';

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.isEditing = false;
        this.originalData = null;
        this.init();
    }

    // 초기화
    init() {
        this.loadUserProfile();
        this.setupEventListeners();
    }

    // 사용자 프로필 로드
    async loadUserProfile() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/users/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = data.data;
                this.displayProfile();
            } else {
                this.showNotification('프로필 로드 실패', 'error');
            }
        } catch (error) {
            console.error('프로필 로드 오류:', error);
            this.showNotification('프로필을 불러올 수 없습니다', 'error');
        }
    }

    // 프로필 표시
    displayProfile() {
        if (!this.currentUser) return;

        // 기본 정보 표시
        this.setFieldValue('profileName', this.currentUser.name);
        this.setFieldValue('profileEmail', this.currentUser.email);
        this.setFieldValue('profilePhone', this.currentUser.phone || '');
        this.setFieldValue('profileUsername', this.currentUser.username);

        // 추가 정보
        this.setFieldValue('profileCompany', this.currentUser.company || '');
        this.setFieldValue('profileWebsite', this.currentUser.website || '');
        this.setFieldValue('profileBio', this.currentUser.bio || '');

        // 마케팅 수신 동의
        this.setCheckboxValue('emailMarketing', this.currentUser.emailMarketing || false);
        this.setCheckboxValue('smsMarketing', this.currentUser.smsMarketing || false);

        // 가입일 표시
        const joinDate = new Date(this.currentUser.createdAt);
        const joinDateElement = document.getElementById('joinDate');
        if (joinDateElement) {
            joinDateElement.textContent = joinDate.toLocaleDateString('ko-KR');
        }

        // 소셜 연동 상태
        this.displaySocialConnections();
    }

    // 소셜 연동 상태 표시
    displaySocialConnections() {
        const connections = this.currentUser.socialConnections || {};

        ['google', 'kakao', 'naver'].forEach(provider => {
            const element = document.getElementById(`${provider}Connected`);
            if (element) {
                if (connections[provider]) {
                    element.innerHTML = `
                        <span class="connected">
                            <i class="fas fa-check-circle"></i> 연결됨
                        </span>
                        <button class="disconnect-btn" onclick="profileManager.disconnectSocial('${provider}')">
                            연결 해제
                        </button>
                    `;
                } else {
                    element.innerHTML = `
                        <button class="connect-btn" onclick="profileManager.connectSocial('${provider}')">
                            <i class="fas fa-link"></i> 연결하기
                        </button>
                    `;
                }
            }
        });
    }

    // 편집 모드 토글
    toggleEditMode() {
        this.isEditing = !this.isEditing;

        const editBtn = document.getElementById('editProfileBtn');
        const saveBtn = document.getElementById('saveProfileBtn');
        const cancelBtn = document.getElementById('cancelEditBtn');
        const inputs = document.querySelectorAll('.profile-input');

        if (this.isEditing) {
            // 편집 모드 활성화
            this.originalData = this.getFormData();

            inputs.forEach(input => {
                input.removeAttribute('readonly');
                input.classList.add('editable');
            });

            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-block';
            cancelBtn.style.display = 'inline-block';
        } else {
            // 편집 모드 비활성화
            inputs.forEach(input => {
                input.setAttribute('readonly', true);
                input.classList.remove('editable');
            });

            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
        }
    }

    // 프로필 저장
    async saveProfile() {
        const formData = this.getFormData();

        // 유효성 검사
        if (!this.validateProfileData(formData)) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = { ...this.currentUser, ...formData };

                // localStorage 업데이트
                const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
                localStorage.setItem('userInfo', JSON.stringify({
                    ...userInfo,
                    ...formData
                }));

                this.toggleEditMode();
                this.showNotification('프로필이 업데이트되었습니다', 'success');
            } else {
                this.showNotification(data.message || '프로필 업데이트 실패', 'error');
            }
        } catch (error) {
            console.error('프로필 저장 오류:', error);
            this.showNotification('프로필 저장 중 오류가 발생했습니다', 'error');
        }
    }

    // 편집 취소
    cancelEdit() {
        if (this.originalData) {
            // 원래 데이터로 복원
            Object.keys(this.originalData).forEach(key => {
                this.setFieldValue(key, this.originalData[key]);
            });
        }
        this.toggleEditMode();
    }

    // 비밀번호 변경
    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // 유효성 검사
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showNotification('모든 비밀번호 필드를 입력해주세요', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification('새 비밀번호가 일치하지 않습니다', 'error');
            return;
        }

        if (!this.validatePassword(newPassword)) {
            this.showNotification('비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/users/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                // 비밀번호 필드 초기화
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';

                this.showNotification('비밀번호가 변경되었습니다', 'success');

                // 보안을 위해 재로그인 유도
                setTimeout(() => {
                    if (confirm('비밀번호가 변경되었습니다. 보안을 위해 다시 로그인해주세요.')) {
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('userInfo');
                        window.location.href = '/login.html';
                    }
                }, 1500);
            } else {
                this.showNotification(data.message || '비밀번호 변경 실패', 'error');
            }
        } catch (error) {
            console.error('비밀번호 변경 오류:', error);
            this.showNotification('비밀번호 변경 중 오류가 발생했습니다', 'error');
        }
    }

    // 계정 삭제
    async deleteAccount() {
        if (!confirm('정말로 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
            return;
        }

        const reason = prompt('계정 삭제 사유를 입력해주세요 (선택사항):');

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/users/delete-account`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ reason })
            });

            const data = await response.json();

            if (data.success) {
                alert('계정이 삭제되었습니다. 그동안 이용해주셔서 감사합니다.');
                localStorage.clear();
                window.location.href = '/';
            } else {
                this.showNotification(data.message || '계정 삭제 실패', 'error');
            }
        } catch (error) {
            console.error('계정 삭제 오류:', error);
            this.showNotification('계정 삭제 중 오류가 발생했습니다', 'error');
        }
    }

    // 프로필 이미지 업로드
    async uploadProfileImage(file) {
        if (!file) return;

        // 파일 크기 체크 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('이미지 크기는 5MB 이하여야 합니다', 'error');
            return;
        }

        // 파일 타입 체크
        if (!file.type.startsWith('image/')) {
            this.showNotification('이미지 파일만 업로드 가능합니다', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('profileImage', file);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/users/profile-image`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                // 프로필 이미지 업데이트
                const profileImg = document.getElementById('profileImage');
                if (profileImg) {
                    profileImg.src = data.data.imageUrl;
                }

                this.showNotification('프로필 이미지가 업데이트되었습니다', 'success');
            } else {
                this.showNotification(data.message || '이미지 업로드 실패', 'error');
            }
        } catch (error) {
            console.error('이미지 업로드 오류:', error);
            this.showNotification('이미지 업로드 중 오류가 발생했습니다', 'error');
        }
    }

    // 소셜 계정 연결
    async connectSocial(provider) {
        window.location.href = `/auth/${provider}/connect`;
    }

    // 소셜 계정 연결 해제
    async disconnectSocial(provider) {
        if (!confirm(`${provider} 계정 연결을 해제하시겠습니까?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/users/disconnect-social/${provider}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser.socialConnections[provider] = false;
                this.displaySocialConnections();
                this.showNotification(`${provider} 계정 연결이 해제되었습니다`, 'success');
            } else {
                this.showNotification(data.message || '연결 해제 실패', 'error');
            }
        } catch (error) {
            console.error('소셜 연결 해제 오류:', error);
            this.showNotification('연결 해제 중 오류가 발생했습니다', 'error');
        }
    }

    // 폼 데이터 가져오기
    getFormData() {
        return {
            name: document.getElementById('profileName')?.value || '',
            phone: document.getElementById('profilePhone')?.value || '',
            company: document.getElementById('profileCompany')?.value || '',
            website: document.getElementById('profileWebsite')?.value || '',
            bio: document.getElementById('profileBio')?.value || '',
            emailMarketing: document.getElementById('emailMarketing')?.checked || false,
            smsMarketing: document.getElementById('smsMarketing')?.checked || false
        };
    }

    // 필드 값 설정
    setFieldValue(fieldId, value) {
        const element = document.getElementById(fieldId);
        if (element) {
            element.value = value;
        }
    }

    // 체크박스 값 설정
    setCheckboxValue(fieldId, value) {
        const element = document.getElementById(fieldId);
        if (element) {
            element.checked = value;
        }
    }

    // 프로필 데이터 유효성 검사
    validateProfileData(data) {
        if (!data.name || data.name.trim().length < 2) {
            this.showNotification('이름은 2자 이상 입력해주세요', 'error');
            return false;
        }

        if (data.phone && !this.validatePhone(data.phone)) {
            this.showNotification('올바른 전화번호 형식이 아닙니다', 'error');
            return false;
        }

        if (data.website && !this.validateURL(data.website)) {
            this.showNotification('올바른 웹사이트 주소가 아닙니다', 'error');
            return false;
        }

        return true;
    }

    // 전화번호 유효성 검사
    validatePhone(phone) {
        const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
        return phoneRegex.test(phone.replace(/-/g, ''));
    }

    // URL 유효성 검사
    validateURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // 비밀번호 유효성 검사
    validatePassword(password) {
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        return passwordRegex.test(password);
    }

    // 알림 표시
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `profile-notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 프로필 이미지 업로드
        const imageInput = document.getElementById('profileImageInput');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.uploadProfileImage(e.target.files[0]);
                }
            });
        }

        // 비밀번호 강도 표시
        const newPasswordInput = document.getElementById('newPassword');
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', (e) => {
                this.checkPasswordStrength(e.target.value);
            });
        }
    }

    // 비밀번호 강도 체크
    checkPasswordStrength(password) {
        const strengthIndicator = document.getElementById('passwordStrength');
        if (!strengthIndicator) return;

        let strength = 0;

        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[@$!%*#?&]/.test(password)) strength++;

        const strengthText = ['매우 약함', '약함', '보통', '강함', '매우 강함'];
        const strengthClass = ['very-weak', 'weak', 'medium', 'strong', 'very-strong'];

        strengthIndicator.textContent = strengthText[strength] || '매우 약함';
        strengthIndicator.className = `strength-indicator ${strengthClass[strength] || 'very-weak'}`;
    }
}

// 전역 인스턴스 생성
const profileManager = new ProfileManager();

// 전역 함수 등록
window.profileManager = profileManager;
