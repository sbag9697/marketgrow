// 주문 완료 페이지 JavaScript
let orderId = null;
let orderData = null;

document.addEventListener('DOMContentLoaded', function() {
    // 인증 확인
    checkAuthentication();
    
    // URL 파라미터에서 주문 ID 추출
    extractOrderId();
    
    // 주문 정보 로드
    if (orderId) {
        loadOrderInfo();
    } else {
        showOrderError();
    }
    
    // 추천 서비스 로드
    loadRecommendedServices();
    
    // 알림 설정 이벤트 리스너
    initNotificationSettings();
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

// URL에서 주문 ID 추출
function extractOrderId() {
    const urlParams = new URLSearchParams(window.location.search);
    orderId = urlParams.get('orderId');
}

// 주문 정보 로드
async function loadOrderInfo() {
    try {
        const response = await api.getOrder(orderId);
        
        if (response.success) {
            orderData = response.data.order;
            displayOrderInfo(orderData);
            updateOrderTime(orderData.createdAt);
        } else {
            throw new Error('주문 정보를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('주문 정보 로드 오류:', error);
        showOrderError();
    }
}

// 주문 정보 표시
function displayOrderInfo(order) {
    const orderDetails = document.getElementById('orderDetails');
    if (!orderDetails) return;

    const platformName = getPlatformName(order.service?.platform);
    const platformIcon = getPlatformIcon(order.service?.platform);
    const statusText = getOrderStatusText(order.status);
    const statusClass = getOrderStatusClass(order.status);

    orderDetails.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">주문 번호</div>
                <div class="detail-value highlight">#${order.orderNumber}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">주문 상태</div>
                <div class="detail-value">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">결제 금액</div>
                <div class="detail-value highlight">₩${order.finalAmount?.toLocaleString()}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">수량</div>
                <div class="detail-value">${order.quantity?.toLocaleString()}개</div>
            </div>
        </div>

        <div class="service-info">
            <div class="service-icon">
                <i class="${platformIcon}"></i>
            </div>
            <div class="service-details">
                <h4>${order.service?.name}</h4>
                <p>${platformName} • ${order.service?.description}</p>
            </div>
        </div>

        <div class="detail-grid" style="margin-top: 25px;">
            <div class="detail-item">
                <div class="detail-label">대상 URL</div>
                <div class="detail-value" style="word-break: break-all; font-size: 0.9rem;">
                    <a href="${order.targetUrl}" target="_blank" style="color: #667eea;">
                        ${order.targetUrl}
                    </a>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">진행 속도</div>
                <div class="detail-value">${getSpeedText(order.speed)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">결제 방법</div>
                <div class="detail-value">${getPaymentMethodText(order.paymentMethod)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">예상 완료</div>
                <div class="detail-value">${getEstimatedCompletion(order)}</div>
            </div>
        </div>

        ${order.notes ? `
            <div class="detail-item" style="margin-top: 20px;">
                <div class="detail-label">특별 요청사항</div>
                <div class="detail-value" style="font-size: 0.95rem; line-height: 1.4;">
                    ${order.notes}
                </div>
            </div>
        ` : ''}

        ${order.options && (order.options.guarantee || order.options.priority) ? `
            <div class="detail-item" style="margin-top: 20px;">
                <div class="detail-label">추가 옵션</div>
                <div class="detail-value">
                    ${order.options.guarantee ? '<span class="option-tag">품질 보장</span>' : ''}
                    ${order.options.priority ? '<span class="option-tag">우선 처리</span>' : ''}
                </div>
            </div>
        ` : ''}
    `;

    // CSS 스타일 추가
    if (!document.querySelector('#order-success-dynamic-styles')) {
        const style = document.createElement('style');
        style.id = 'order-success-dynamic-styles';
        style.textContent = `
            .option-tag {
                display: inline-block;
                padding: 4px 12px;
                background: #e3f2fd;
                color: #1976d2;
                border-radius: 15px;
                font-size: 0.8rem;
                margin-right: 8px;
            }
        `;
        document.head.appendChild(style);
    }
}

// 주문 시간 업데이트
function updateOrderTime(createdAt) {
    const orderTime = document.getElementById('orderTime');
    if (!orderTime) return;

    const orderDate = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now - orderDate) / (1000 * 60));

    let timeText;
    if (diffInMinutes < 1) {
        timeText = '방금 전';
    } else if (diffInMinutes < 60) {
        timeText = `${diffInMinutes}분 전`;
    } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        timeText = `${hours}시간 전`;
    } else {
        timeText = orderDate.toLocaleDateString('ko-KR');
    }

    orderTime.textContent = timeText;
}

// 주문 에러 표시
function showOrderError() {
    const orderDetails = document.getElementById('orderDetails');
    if (!orderDetails) return;

    orderDetails.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>주문 정보를 불러올 수 없습니다</h3>
            <p>주문 번호를 확인하거나 잠시 후 다시 시도해주세요.</p>
            <button class="retry-btn" onclick="location.reload()">새로고침</button>
            <button class="dashboard-btn" onclick="location.href='dashboard.html'">대시보드로 이동</button>
        </div>
    `;

    // 에러 스타일 추가
    if (!document.querySelector('#error-styles')) {
        const style = document.createElement('style');
        style.id = 'error-styles';
        style.textContent = `
            .error-state {
                text-align: center;
                padding: 40px 20px;
                color: #666;
            }
            
            .error-state i {
                font-size: 3rem;
                color: #dc3545;
                margin-bottom: 20px;
            }
            
            .error-state h3 {
                margin: 0 0 15px;
                color: #333;
                font-size: 1.3rem;
            }
            
            .error-state p {
                margin: 0 0 25px;
                color: #666;
                line-height: 1.5;
            }
            
            .retry-btn,
            .dashboard-btn {
                padding: 12px 25px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                margin: 0 10px;
                transition: background-color 0.3s;
            }
            
            .retry-btn {
                background: #667eea;
                color: white;
            }
            
            .retry-btn:hover {
                background: #5a67d8;
            }
            
            .dashboard-btn {
                background: #28a745;
                color: white;
            }
            
            .dashboard-btn:hover {
                background: #218838;
            }
        `;
        document.head.appendChild(style);
    }
}

// 추천 서비스 로드
async function loadRecommendedServices() {
    const recommendedServices = document.getElementById('recommendedServices');
    if (!recommendedServices) return;

    try {
        const response = await api.getServices({ limit: 6, isPopular: 'true' });
        
        if (response.success && response.data.services) {
            renderRecommendedServices(response.data.services);
        }
    } catch (error) {
        console.error('추천 서비스 로드 오류:', error);
        recommendedServices.innerHTML = `
            <div class="error-message">
                <p>추천 서비스를 불러올 수 없습니다.</p>
            </div>
        `;
    }
}

// 추천 서비스 렌더링
function renderRecommendedServices(services) {
    const recommendedServices = document.getElementById('recommendedServices');
    
    let servicesHTML = '';
    services.slice(0, 4).forEach(service => {
        const platformIcon = getPlatformIcon(service.platform);
        const platformColor = getPlatformColor(service.platform);
        
        servicesHTML += `
            <div class="recommended-item" onclick="orderService('${service._id}')">
                <div class="recommended-icon" style="background: ${platformColor};">
                    <i class="${platformIcon}"></i>
                </div>
                <div class="recommended-info">
                    <h4>${service.name}</h4>
                    <p>${service.description}</p>
                    <div class="recommended-price">₩${service.pricePerThousand.toLocaleString()}/1000개</div>
                </div>
            </div>
        `;
    });
    
    recommendedServices.innerHTML = servicesHTML;
}

// 알림 설정 초기화
function initNotificationSettings() {
    const emailNotification = document.getElementById('emailNotification');
    const smsNotification = document.getElementById('smsNotification');
    const pushNotification = document.getElementById('pushNotification');

    // 알림 설정 변경 이벤트
    [emailNotification, smsNotification, pushNotification].forEach(checkbox => {
        if (checkbox) {
            checkbox.addEventListener('change', updateNotificationSettings);
        }
    });
}

// 알림 설정 업데이트
async function updateNotificationSettings() {
    const settings = {
        email: document.getElementById('emailNotification')?.checked || false,
        sms: document.getElementById('smsNotification')?.checked || false,
        push: document.getElementById('pushNotification')?.checked || false
    };

    try {
        // API를 통해 알림 설정 업데이트 (구현 예정)
        console.log('알림 설정 업데이트:', settings);
        NotificationManager.success('알림 설정이 저장되었습니다.');
    } catch (error) {
        console.error('알림 설정 업데이트 오류:', error);
        NotificationManager.error('알림 설정 저장에 실패했습니다.');
    }
}

// 주문 상세보기
function viewOrderDetail() {
    if (orderId) {
        window.location.href = `order-detail.html?id=${orderId}`;
    }
}

// 고객지원 연결
function contactSupport() {
    NotificationManager.info('곧 고객지원 팀과 연결됩니다.');
    // 여기에 고객지원 연결 로직 구현
}

// 서비스 주문
function orderService(serviceId) {
    window.location.href = `order.html?service=${serviceId}`;
}

// 사용자 메뉴 토글
function toggleUserMenu() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.classList.toggle('show');
    }
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

function getPlatformColor(platform) {
    const platformColors = {
        instagram: '#e4405f',
        youtube: '#ff0000',
        facebook: '#1877f2',
        tiktok: '#000000',
        twitter: '#1da1f2',
        telegram: '#0088cc',
        threads: '#000000',
        discord: '#7289da',
        spotify: '#1db954',
        twitch: '#9146ff',
        whatsapp: '#25d366',
        pinterest: '#bd081c',
        reddit: '#ff4500',
        snapchat: '#fffc00',
        kakaotalk: '#fee500',
        naver: '#03c75a',
        website: '#667eea'
    };
    return platformColors[platform] || '#667eea';
}

function getOrderStatusText(status) {
    const statusTexts = {
        pending: '대기중',
        processing: '진행중',
        completed: '완료',
        cancelled: '취소됨',
        refunded: '환불됨'
    };
    return statusTexts[status] || '알 수 없음';
}

function getOrderStatusClass(status) {
    const statusClasses = {
        pending: 'pending',
        processing: 'processing',
        completed: 'completed',
        cancelled: 'cancelled',
        refunded: 'refunded'
    };
    return statusClasses[status] || 'pending';
}

function getSpeedText(speed) {
    const speedTexts = {
        slow: '천천히 (2-7일)',
        normal: '보통 (24-48시간)',
        fast: '빠름 (12-24시간)'
    };
    return speedTexts[speed] || '보통';
}

function getPaymentMethodText(method) {
    const methodTexts = {
        card: '신용카드/체크카드',
        bank: '무통장입금',
        paypal: 'PayPal'
    };
    return methodTexts[method] || '신용카드';
}

function getEstimatedCompletion(order) {
    if (!order.createdAt) return '-';
    
    const createdDate = new Date(order.createdAt);
    const speedHours = {
        fast: 24,
        normal: 48,
        slow: 168 // 7일
    };
    
    const estimatedHours = speedHours[order.speed] || 48;
    const estimatedDate = new Date(createdDate.getTime() + (estimatedHours * 60 * 60 * 1000));
    
    return estimatedDate.toLocaleDateString('ko-KR') + ' ' + estimatedDate.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 외부 클릭 시 사용자 메뉴 닫기
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenu && !userMenu.contains(event.target)) {
        userDropdown?.classList.remove('show');
    }
});