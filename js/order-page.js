// 주문 페이지 JavaScript - 캐시 문제 해결 버전
let currentStep = 1;
let selectedPlatform = null;
let selectedService = null;
const orderData = {};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Order-page.js DOMContentLoaded 실행됨');

    // 인증 확인
    checkAuthentication();

    // 초기화
    initOrderPage();

    // URL 파라미터 확인
    checkUrlParams();
});

// 인증 확인
async function checkAuthentication() {
    if (!api.token) {
        if (window.NotificationManager) {
            NotificationManager.warning('로그인이 필요한 서비스입니다.');
        }
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await api.getProfile();
        if (!response.success) {
            throw new Error('인증 실패');
        }

        // 사용자 정보 업데이트
        const navUserName = document.getElementById('navUserName');
        if (navUserName) {
            navUserName.textContent = `${response.data.user.name}님`;
        }
    } catch (error) {
        console.error('인증 확인 실패:', error);
        api.clearToken();
        window.location.href = 'login.html';
    }
}

// 주문 페이지 초기화
function initOrderPage() {
    loadPlatforms();
    updateStepUI();
}

// URL 파라미터 확인
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const platform = urlParams.get('platform');
    const serviceId = urlParams.get('service');

    if (platform) {
        selectedPlatform = platform;
        loadServicesForPlatform(platform);
    }

    if (serviceId) {
        loadSpecificService(serviceId);
    }
}

// 플랫폼 목록 로드
async function loadPlatforms() {
    const platformGrid = document.getElementById('platformGrid');
    if (!platformGrid) return;

    try {
        const response = await api.getServices();

        if (response.success) {
            const platforms = groupServicesByPlatform(response.data.services);
            renderPlatforms(platforms);
        }
    } catch (error) {
        console.error('플랫폼 로드 오류:', error);
        platformGrid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>플랫폼 목록을 불러올 수 없습니다.</p>
                <button class="retry-btn" onclick="loadPlatforms()">다시 시도</button>
            </div>
        `;
    }
}

// 서비스를 플랫폼별로 그룹화
function groupServicesByPlatform(services) {
    const platformMap = {};

    services.forEach(service => {
        if (!platformMap[service.platform]) {
            platformMap[service.platform] = {
                name: getPlatformName(service.platform),
                icon: getPlatformIcon(service.platform),
                count: 0,
                services: []
            };
        }
        platformMap[service.platform].count++;
        platformMap[service.platform].services.push(service);
    });

    return platformMap;
}

// 플랫폼 렌더링
function renderPlatforms(platforms) {
    const platformGrid = document.getElementById('platformGrid');

    let platformsHTML = '';
    Object.keys(platforms).forEach(platform => {
        const platformData = platforms[platform];
        platformsHTML += `
            <div class="platform-card ${selectedPlatform === platform ? 'selected' : ''}" 
                 onclick="selectPlatform('${platform}', event)">
                <i class="${platformData.icon}"></i>
                <h4>${platformData.name}</h4>
                <p>${platformData.count}개 서비스</p>
            </div>
        `;
    });

    platformGrid.innerHTML = platformsHTML;
}

// 플랫폼 선택
async function selectPlatform(platform, event) {
    console.log('selectPlatform 호출됨:', platform);
    selectedPlatform = platform;
    selectedService = null;

    // UI 업데이트
    document.querySelectorAll('.platform-card').forEach(card => {
        card.classList.remove('selected');
    });

    // 클릭된 카드 찾기
    const clickedCard = event ? event.currentTarget : document.querySelector(`.platform-card[onclick*="${platform}"]`);
    if (clickedCard) {
        clickedCard.classList.add('selected');
    }

    // 서비스 목록 로드
    await loadServicesForPlatform(platform);

    // 서비스 선택 섹션 표시
    const serviceSelection = document.getElementById('serviceSelection');
    serviceSelection.style.display = 'block';
    serviceSelection.scrollIntoView({ behavior: 'smooth' });

    updateNextButton();
}

// 플랫폼의 서비스 목록 로드
async function loadServicesForPlatform(platform) {
    const serviceList = document.getElementById('serviceList');
    if (!serviceList) return;

    serviceList.innerHTML = `
        <div class="loading-placeholder">
            <i class="fas fa-spinner fa-spin"></i>
            <p>서비스 목록을 불러오는 중...</p>
        </div>
    `;

    try {
        const response = await api.getServices();

        if (response.success && response.data && response.data.services) {
            // 플랫폼별로 필터링
            const filteredServices = response.data.services.filter(service =>
                service.platform === platform
            );
            renderServices(filteredServices);
        }
    } catch (error) {
        console.error('서비스 로드 오류:', error);
        serviceList.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>서비스 목록을 불러올 수 없습니다.</p>
                <button class="retry-btn" onclick="loadServicesForPlatform('${platform}')">다시 시도</button>
            </div>
        `;
    }
}

// 서비스 목록 렌더링
function renderServices(services) {
    const serviceList = document.getElementById('serviceList');

    if (!services || services.length === 0) {
        serviceList.innerHTML = '<p>이 플랫폼에는 아직 서비스가 없습니다.</p>';
        return;
    }

    let servicesHTML = '';
    services.forEach(service => {
        try {
            // 가격 정보 안전하게 가져오기
            let priceDisplay = '가격 정보 없음';
            if (service.pricing && Array.isArray(service.pricing) && service.pricing.length > 0) {
                const firstPricing = service.pricing[0];
                if (firstPricing && typeof firstPricing.price === 'number' && typeof firstPricing.quantity === 'number') {
                    const price = firstPricing.price;
                    const quantity = firstPricing.quantity;
                    if (quantity > 0) {
                        const pricePerThousand = Math.round((price / quantity) * 1000);
                        priceDisplay = `₩${pricePerThousand.toLocaleString()}/1000개`;
                    }
                }
            }

            servicesHTML += `
                <div class="service-item ${selectedService && selectedService._id === service._id ? 'selected' : ''}" 
                     onclick="selectService('${service._id}')">
                    <input type="radio" name="service" value="${service._id}" 
                           ${selectedService && selectedService._id === service._id ? 'checked' : ''}>
                    <div class="service-info">
                        <h4>${service.name || '서비스명 없음'}</h4>
                        <p>${service.description || '설명 없음'}</p>
                        <div class="service-meta">
                            <span>최소: ${service.minQuantity || 0}개</span>
                            <span>최대: ${service.maxQuantity || 0}개</span>
                            <span>배송: ${service.deliveryTime?.min || 0}-${service.deliveryTime?.max || 0} ${service.deliveryTime?.unit === 'hours' ? '시간' : '일'}</span>
                            <span>보장: ${service.guaranteePeriod || 0}일</span>
                        </div>
                    </div>
                    <div class="service-price">
                        ${priceDisplay}
                    </div>
                </div>
            `;
        } catch (err) {
            console.error('서비스 렌더링 오류:', err, service);
        }
    });

    serviceList.innerHTML = servicesHTML;
}

// 서비스 선택
async function selectService(serviceId) {
    console.log('selectService 호출됨:', serviceId);
    try {
        const response = await api.getServiceById(serviceId);
        if (response.success && response.data) {
            selectedService = response.data.service || response.data;

            // UI 업데이트
            document.querySelectorAll('.service-item').forEach(item => {
                item.classList.remove('selected');
                const radio = item.querySelector('input[type="radio"]');
                if (radio) radio.checked = false;
            });

            const selectedItem = document.querySelector(`.service-item[onclick*="${serviceId}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected');
                const radio = selectedItem.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
            }

            updateNextButton();
        }
    } catch (error) {
        console.error('서비스 선택 오류:', error);
        if (window.NotificationManager) {
            NotificationManager.error('서비스 정보를 불러올 수 없습니다.');
        }
    }
}

// 다음 버튼 상태 업데이트
function updateNextButton() {
    const nextBtn = document.getElementById('step1NextBtn');
    if (nextBtn) {
        nextBtn.disabled = !selectedPlatform || !selectedService;
    }
}

// 단계 이동
function goToStep(step) {
    if (step === 2 && (!selectedPlatform || !selectedService)) {
        if (window.NotificationManager) {
            NotificationManager.warning('플랫폼과 서비스를 선택해주세요.');
        }
        return;
    }

    currentStep = step;
    updateStepUI();
}

// 단계 UI 업데이트
function updateStepUI() {
    // 단계 표시 업데이트
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index + 1 < currentStep) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });

    // 단계별 콘텐츠 표시/숨기기
    document.querySelectorAll('.order-step-content').forEach((content, index) => {
        const stepNumber = index + 1;
        content.style.display = stepNumber === currentStep ? 'block' : 'none';
    });
}

// 플랫폼 이름 변환
function getPlatformName(platform) {
    const platformNames = {
        instagram: '인스타그램',
        youtube: '유튜브',
        facebook: '페이스북',
        twitter: '트위터',
        tiktok: '틱톡',
        telegram: '텔레그램',
        threads: '스레드',
        website: '웹사이트'
    };
    return platformNames[platform] || platform;
}

// 플랫폼 아이콘 클래스
function getPlatformIcon(platform) {
    const platformIcons = {
        instagram: 'fab fa-instagram',
        youtube: 'fab fa-youtube',
        facebook: 'fab fa-facebook',
        twitter: 'fab fa-twitter',
        tiktok: 'fab fa-tiktok',
        telegram: 'fab fa-telegram',
        threads: 'fab fa-threads',
        website: 'fas fa-globe'
    };
    return platformIcons[platform] || 'fas fa-globe';
}

// 전역 함수로 노출
window.selectPlatform = selectPlatform;
window.selectService = selectService;
window.loadPlatforms = loadPlatforms;
window.loadServicesForPlatform = loadServicesForPlatform;
window.goToStep = goToStep;
window.changeQuantity = function (amount) {
    const quantityInput = document.getElementById('quantity');
    if (!quantityInput) return;

    const currentValue = parseInt(quantityInput.value) || 0;
    const newValue = currentValue + amount;
    const minQuantity = parseInt(document.getElementById('minQuantity')?.textContent) || 1;
    const maxQuantity = parseInt(document.getElementById('maxQuantity')?.textContent) || 10000;

    if (newValue >= minQuantity && newValue <= maxQuantity) {
        quantityInput.value = newValue;
    }
};
window.submitOrder = async function () {
    // 주문 제출 로직
    console.log('주문 제출');
};
window.toggleUserMenu = function () {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
};
window.showProfile = function () {
    console.log('프로필 표시');
};
window.showSettings = function () {
    console.log('설정 표시');
};
window.logout = function () {
    api.clearToken();
    window.location.href = 'login.html';
};
window.showTerms = function () {
    console.log('이용약관 표시');
};
window.showPrivacy = function () {
    console.log('개인정보처리방침 표시');
};
