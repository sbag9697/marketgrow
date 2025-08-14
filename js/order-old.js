// 주문 페이지 JavaScript
let currentStep = 1;
let selectedPlatform = null;
let selectedService = null;
let orderData = {};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Order.js DOMContentLoaded 실행됨');

    // 인증 확인
    checkAuthentication();

    // 초기화
    initOrderPage();

    // URL 파라미터 확인 (서비스 페이지에서 전달된 경우)
    checkUrlParams();

    console.log('전역 함수 확인:', {
        selectPlatform: typeof window.selectPlatform,
        selectService: typeof window.selectService,
        loadPlatforms: typeof window.loadPlatforms
    });
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
        // 특정 서비스로 바로 이동
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
        // 첫 번째 가격 정보 가져오기
        const firstPricing = service.pricing && service.pricing[0] ? service.pricing[0] : { price: 0, quantity: 1000 };
        const price = firstPricing.price || 0;
        const quantity = firstPricing.quantity || 1000;
        const pricePerThousand = quantity > 0 ? Math.round((price / quantity) * 1000) : 0;

        servicesHTML += `
            <div class="service-item ${selectedService?._id === service._id ? 'selected' : ''}" 
                 onclick="selectService('${service._id}')">
                <input type="radio" name="service" value="${service._id}" 
                       ${selectedService?._id === service._id ? 'checked' : ''}>
                <div class="service-info">
                    <h4>${service.name}</h4>
                    <p>${service.description}</p>
                    <div class="service-meta">
                        <span>최소: ${service.minQuantity || 0}개</span>
                        <span>최대: ${service.maxQuantity || 0}개</span>
                        <span>배송: ${service.deliveryTime?.min || 0}-${service.deliveryTime?.max || 0} ${service.deliveryTime?.unit === 'hours' ? '시간' : '일'}</span>
                        <span>보장: ${service.guaranteePeriod || 0}일</span>
                    </div>
                </div>
                <div class="service-price">
                    ₩${pricePerThousand.toLocaleString()}/1000개
                </div>
            </div>
        `;
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
        NotificationManager.error('서비스 정보를 불러올 수 없습니다.');
    }
}

// 특정 서비스 로드 (URL 파라미터에서 전달된 경우)
async function loadSpecificService(serviceId) {
    try {
        const response = await api.getServices();
        if (response.success) {
            const service = response.data.services.find(s => s._id === serviceId);
            if (service) {
                selectedService = service;
                selectedPlatform = service.platform;

                // 2단계로 이동
                goToStep(2);
            }
        }
    } catch (error) {
        console.error('특정 서비스 로드 오류:', error);
    }
}

// 단계 이동
function goToStep(step) {
    if (step === 2 && (!selectedPlatform || !selectedService)) {
        NotificationManager.warning('플랫폼과 서비스를 선택해주세요.');
        return;
    }

    if (step === 3) {
        if (!validateStep2()) return;
        calculateOrderSummary();
    }

    currentStep = step;
    updateStepUI();

    if (step === 2) {
        showSelectedServiceInfo();
        initializeOrderForm();
    }
}

// 단계 UI 업데이트
function updateStepUI() {
    // 단계 표시기 업데이트
    document.querySelectorAll('.step').forEach((stepEl, index) => {
        const stepNumber = index + 1;
        stepEl.classList.remove('active', 'completed');

        if (stepNumber < currentStep) {
            stepEl.classList.add('completed');
        } else if (stepNumber === currentStep) {
            stepEl.classList.add('active');
        }
    });

    // 콘텐츠 표시/숨김
    document.querySelectorAll('.order-step-content').forEach((content, index) => {
        const stepNumber = index + 1;
        content.style.display = stepNumber === currentStep ? 'block' : 'none';
    });
}

// 다음 버튼 상태 업데이트
function updateNextButton() {
    const nextBtn = document.getElementById('step1NextBtn');
    if (nextBtn) {
        nextBtn.disabled = !selectedPlatform || !selectedService;
    }
}

// 선택된 서비스 정보 표시
function showSelectedServiceInfo() {
    const selectedServiceInfo = document.getElementById('selectedServiceInfo');
    if (!selectedServiceInfo || !selectedService) return;

    const platformName = getPlatformName(selectedPlatform);
    const platformIcon = getPlatformIcon(selectedPlatform);

    selectedServiceInfo.innerHTML = `
        <h4>
            <i class="${platformIcon}"></i>
            ${selectedService.name}
        </h4>
        <p><strong>플랫폼:</strong> ${platformName}</p>
        <p><strong>설명:</strong> ${selectedService.description}</p>
        <p><strong>가격:</strong> ₩${selectedService.pricePerThousand.toLocaleString()}/1000개</p>
        <p><strong>최소 수량:</strong> ${selectedService.minQuantity}개</p>
        <p><strong>최대 수량:</strong> ${selectedService.maxQuantity}개</p>
        <p><strong>시작 시간:</strong> ${selectedService.startTime}</p>
        <p><strong>완료 시간:</strong> ${selectedService.completionTime}</p>
    `;
}

// 주문 폼 초기화
function initializeOrderForm() {
    if (!selectedService) return;

    // 수량 제한 설정
    const quantityInput = document.getElementById('quantity');
    const minQuantity = document.getElementById('minQuantity');
    const maxQuantity = document.getElementById('maxQuantity');

    if (quantityInput) {
        quantityInput.min = selectedService.minQuantity;
        quantityInput.max = selectedService.maxQuantity;
        quantityInput.value = selectedService.minQuantity;
    }

    if (minQuantity) minQuantity.textContent = selectedService.minQuantity.toLocaleString();
    if (maxQuantity) maxQuantity.textContent = selectedService.maxQuantity.toLocaleString();

    // 실시간 계산 이벤트 리스너 추가
    addCalculationListeners();
}

// 실시간 계산 이벤트 리스너 추가
function addCalculationListeners() {
    const inputs = ['quantity', 'guaranteeOption', 'priorityOption'];

    inputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('change', updatePricePreview);
            element.addEventListener('input', updatePricePreview);
        }
    });
}

// 가격 미리보기 업데이트
function updatePricePreview() {
    if (!selectedService) return;

    const quantity = parseInt(document.getElementById('quantity').value) || 0;
    const guaranteeOption = document.getElementById('guaranteeOption').checked;
    const priorityOption = document.getElementById('priorityOption').checked;

    const basePrice = (quantity / 1000) * selectedService.pricePerThousand;
    let totalPrice = basePrice;

    if (guaranteeOption) {
        totalPrice += basePrice * 0.2; // 20% 추가
    }

    if (priorityOption) {
        totalPrice += basePrice * 0.1; // 10% 추가
    }

    // 가격 표시 업데이트 (있다면)
    const pricePreview = document.getElementById('pricePreview');
    if (pricePreview) {
        pricePreview.textContent = `₩${Math.round(totalPrice).toLocaleString()}`;
    }
}

// 수량 변경
function changeQuantity(delta) {
    const quantityInput = document.getElementById('quantity');
    if (!quantityInput) return;

    const currentValue = parseInt(quantityInput.value) || 0;
    const newValue = currentValue + delta;
    const min = parseInt(quantityInput.min) || 1;
    const max = parseInt(quantityInput.max) || 10000;

    if (newValue >= min && newValue <= max) {
        quantityInput.value = newValue;
        updatePricePreview();
    }
}

// 2단계 검증
function validateStep2() {
    const targetUrl = document.getElementById('targetUrl').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);

    if (!targetUrl) {
        NotificationManager.warning('대상 URL을 입력해주세요.');
        document.getElementById('targetUrl').focus();
        return false;
    }

    if (!isValidUrl(targetUrl)) {
        NotificationManager.warning('올바른 URL 형식을 입력해주세요.');
        document.getElementById('targetUrl').focus();
        return false;
    }

    if (!quantity || quantity < selectedService.minQuantity || quantity > selectedService.maxQuantity) {
        NotificationManager.warning(`수량은 ${selectedService.minQuantity}개 이상 ${selectedService.maxQuantity}개 이하로 입력해주세요.`);
        document.getElementById('quantity').focus();
        return false;
    }

    return true;
}

// URL 검증
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// 주문 요약 계산
function calculateOrderSummary() {
    if (!selectedService) return;

    const quantity = parseInt(document.getElementById('quantity').value) || 0;
    const speed = document.getElementById('speed').value;
    const guaranteeOption = document.getElementById('guaranteeOption').checked;
    const priorityOption = document.getElementById('priorityOption').checked;
    const targetUrl = document.getElementById('targetUrl').value.trim();
    const notes = document.getElementById('notes').value.trim();

    // 가격 계산
    const basePrice = (quantity / 1000) * selectedService.pricePerThousand;
    let totalPrice = basePrice;
    const additionalOptions = [];

    if (guaranteeOption) {
        const guaranteeFee = basePrice * 0.2;
        totalPrice += guaranteeFee;
        additionalOptions.push({
            name: '품질 보장',
            price: guaranteeFee
        });
    }

    if (priorityOption) {
        const priorityFee = basePrice * 0.1;
        totalPrice += priorityFee;
        additionalOptions.push({
            name: '우선 처리',
            price: priorityFee
        });
    }

    // 주문 데이터 저장
    orderData = {
        service: selectedService,
        platform: selectedPlatform,
        quantity,
        speed,
        targetUrl,
        notes,
        guaranteeOption,
        priorityOption,
        basePrice,
        totalPrice: Math.round(totalPrice),
        additionalOptions
    };

    // 주문 요약 표시
    showOrderSummary();
}

// 주문 요약 표시
function showOrderSummary() {
    const orderSummary = document.getElementById('orderSummary');
    if (!orderSummary) return;

    const platformName = getPlatformName(orderData.platform);
    const speedNames = {
        slow: '천천히 (2-7일)',
        normal: '보통 (24-48시간)',
        fast: '빠름 (12-24시간)'
    };

    let summaryHTML = `
        <div class="summary-item">
            <span class="summary-label">서비스</span>
            <span class="summary-value">${orderData.service.name}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">플랫폼</span>
            <span class="summary-value">${platformName}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">수량</span>
            <span class="summary-value">${orderData.quantity.toLocaleString()}개</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">진행 속도</span>
            <span class="summary-value">${speedNames[orderData.speed]}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">기본 금액</span>
            <span class="summary-value">₩${orderData.basePrice.toLocaleString()}</span>
        </div>
    `;

    // 추가 옵션 표시
    orderData.additionalOptions.forEach(option => {
        summaryHTML += `
            <div class="summary-item">
                <span class="summary-label">${option.name}</span>
                <span class="summary-value">+₩${Math.round(option.price).toLocaleString()}</span>
            </div>
        `;
    });

    summaryHTML += `
        <div class="summary-item">
            <span class="summary-label">총 결제 금액</span>
            <span class="summary-value">₩${orderData.totalPrice.toLocaleString()}</span>
        </div>
    `;

    orderSummary.innerHTML = summaryHTML;
}

// 주문 제출
async function submitOrder() {
    const agreeTerms = document.getElementById('agreeTerms').checked;
    if (!agreeTerms) {
        NotificationManager.warning('이용약관 및 개인정보처리방침에 동의해주세요.');
        return;
    }

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    const orderBtn = document.getElementById('orderBtn');
    const originalText = orderBtn.innerHTML;
    orderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 결제 처리 중...';
    orderBtn.disabled = true;

    try {
        // 결제 데이터 준비
        const paymentData = {
            method: paymentMethod,
            orderData: {
                ...orderData,
                customerName: await getCurrentUserName(),
                customerEmail: await getCurrentUserEmail(),
                paymentMethod
            }
        };

        // 결제 처리
        await paymentManager.requestPayment(paymentData);
    } catch (error) {
        console.error('결제 처리 오류:', error);

        // 결제 실패 처리
        const errorMessage = error.message || '결제 처리 중 오류가 발생했습니다.';
        paymentManager.handlePaymentFailure('PAYMENT_ERROR', errorMessage, null);
    } finally {
        orderBtn.innerHTML = originalText;
        orderBtn.disabled = false;
    }
}

// 현재 사용자 이름 가져오기
async function getCurrentUserName() {
    try {
        const response = await api.getProfile();
        return response.success ? response.data.user.name : '고객';
    } catch (error) {
        return '고객';
    }
}

// 현재 사용자 이메일 가져오기
async function getCurrentUserEmail() {
    try {
        const response = await api.getProfile();
        return response.success ? response.data.user.email : 'customer@example.com';
    } catch (error) {
        return 'customer@example.com';
    }
}

// 사용자 메뉴 토글
function toggleUserMenu() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.classList.toggle('show');
    }
}

// 약관 보기
function showTerms() {
    NotificationManager.info('이용약관 페이지는 준비 중입니다.');
}

// 개인정보처리방침 보기
function showPrivacy() {
    NotificationManager.info('개인정보처리방침 페이지는 준비 중입니다.');
}

// 유틸리티 함수들
function getPlatformName(platform) {
    const platformNames = {
        instagram: '인스타그램',
        youtube: '유튜브',
        facebook: '페이스북',
        tiktok: '틱톡',
        twitter: '트위터',
        telegram: '텔레그램',
        threads: '스레드',
        discord: '디스코드',
        spotify: '스포티파이',
        twitch: '트위치',
        whatsapp: '왓츠앱',
        pinterest: '핀터레스트',
        reddit: '레딧',
        snapchat: '스냅챗',
        kakaotalk: '카카오톡',
        naver: '네이버',
        website: '웹사이트'
    };
    return platformNames[platform] || platform;
}

function getPlatformIcon(platform) {
    const platformIcons = {
        instagram: 'fab fa-instagram',
        youtube: 'fab fa-youtube',
        facebook: 'fab fa-facebook-f',
        tiktok: 'fab fa-tiktok',
        twitter: 'fab fa-twitter',
        telegram: 'fab fa-telegram-plane',
        threads: 'fas fa-at',
        discord: 'fab fa-discord',
        spotify: 'fab fa-spotify',
        twitch: 'fab fa-twitch',
        whatsapp: 'fab fa-whatsapp',
        pinterest: 'fab fa-pinterest',
        reddit: 'fab fa-reddit',
        snapchat: 'fab fa-snapchat',
        kakaotalk: 'fas fa-comment',
        naver: 'fas fa-n',
        website: 'fas fa-globe'
    };
    return platformIcons[platform] || 'fas fa-globe';
}

// 외부 클릭 시 사용자 메뉴 닫기
document.addEventListener('click', (event) => {
    const userMenu = document.querySelector('.user-menu');
    const userDropdown = document.getElementById('userDropdown');

    if (userMenu && !userMenu.contains(event.target)) {
        userDropdown?.classList.remove('show');
    }
});

// 전역 함수로 노출
window.selectPlatform = selectPlatform;
window.selectService = selectService;
window.loadPlatforms = loadPlatforms;
window.loadServicesForPlatform = loadServicesForPlatform;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.goToStep = goToStep;
window.processOrder = processOrder;
window.updateQuantityDisplay = updateQuantityDisplay;
window.toggleUserMenu = toggleUserMenu;
