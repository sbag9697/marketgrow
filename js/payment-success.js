// 결제 성공 페이지 JavaScript
let paymentData = null;
let orderData = null;
let userInfo = null;

document.addEventListener('DOMContentLoaded', function() {
    // 인증 확인
    checkAuthentication();
    
    // URL 파라미터 확인
    checkUrlParams();
    
    // 결제 정보 로드
    loadPaymentInfo();
    
    // 알림 설정 이벤트
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
        
        userInfo = response.data.user;
        
        // 사용자 정보 업데이트
        const navUserName = document.getElementById('navUserName');
        if (navUserName) {
            navUserName.textContent = `${userInfo.name}님`;
        }
    } catch (error) {
        console.error('인증 확인 실패:', error);
        api.clearToken();
        window.location.href = 'login.html';
    }
}

// URL 파라미터 확인
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentKey = urlParams.get('paymentKey');
    const orderId = urlParams.get('orderId');
    const amount = urlParams.get('amount');

    if (paymentKey && orderId && amount) {
        // 토스페이먼츠 결제 성공 처리
        handleTossPaymentSuccess(paymentKey, orderId, amount);
    } else {
        // 일반 결제 성공 처리 (localStorage에서 데이터 확인)
        loadPaymentDataFromStorage();
    }
}

// 토스페이먼츠 결제 성공 처리
async function handleTossPaymentSuccess(paymentKey, orderId, amount) {
    try {
        // 결제 승인 및 주문 생성
        const result = await paymentManager.handlePaymentSuccess(paymentKey, orderId, parseInt(amount));
        
        if (result.success && result.data) {
            paymentData = result.data.payment;
            orderData = result.data.order;
            
            // 결제 성공 알림 발송
            await sendPaymentSuccessNotification();
        }
    } catch (error) {
        console.error('토스페이먼츠 결제 성공 처리 오류:', error);
        showPaymentError('결제 승인 처리 중 오류가 발생했습니다.');
    }
}

// localStorage에서 결제 데이터 로드
function loadPaymentDataFromStorage() {
    const storedPayment = localStorage.getItem('completedPayment');
    if (storedPayment) {
        try {
            paymentData = JSON.parse(storedPayment);
            displayPaymentInfo(paymentData);
        } catch (error) {
            console.error('결제 데이터 파싱 오류:', error);
            showPaymentError('결제 정보를 불러올 수 없습니다.');
        }
    } else {
        showPaymentError('결제 정보를 찾을 수 없습니다.');
    }
}

// 결제 정보 로드
async function loadPaymentInfo() {
    // URL 파라미터나 localStorage에서 이미 처리되었다면 리턴
    if (paymentData) return;

    try {
        // 최근 결제 내역 조회 (필요한 경우)
        const response = await api.getPayments({ limit: 1, status: 'completed' });
        
        if (response.success && response.data.payments.length > 0) {
            const recentPayment = response.data.payments[0];
            paymentData = recentPayment;
            displayPaymentInfo(recentPayment);
            
            // 결제 정보 로드 후 알림 발송 (필요한 경우)
            await sendPaymentSuccessNotification();
        } else {
            showPaymentError('결제 정보를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('결제 정보 로드 오류:', error);
        showPaymentError('결제 정보를 불러올 수 없습니다.');
    }
}

// 결제 정보 표시
function displayPaymentInfo(payment) {
    const paymentDetails = document.getElementById('paymentDetails');
    if (!paymentDetails) return;

    paymentData = payment;
    
    const paymentTime = new Date(payment.createdAt || Date.now());
    const paymentMethod = PaymentUtils.getPaymentMethodName(payment.paymentMethod || 'card');

    paymentDetails.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">결제 번호</div>
                <div class="detail-value highlight">${payment.paymentId || payment.transactionId || 'N/A'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">결제 금액</div>
                <div class="detail-value highlight">${PaymentUtils.formatAmount(payment.amount || payment.totalPrice)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">결제 방법</div>
                <div class="detail-value">${paymentMethod}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">결제 시간</div>
                <div class="detail-value">${paymentTime.toLocaleString('ko-KR')}</div>
            </div>
        </div>

        ${payment.cardInfo ? `
            <div class="detail-grid" style="margin-top: 25px;">
                <div class="detail-item">
                    <div class="detail-label">카드사</div>
                    <div class="detail-value">${payment.cardInfo.company}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">카드번호</div>
                    <div class="detail-value">${payment.cardInfo.number}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">할부</div>
                    <div class="detail-value">${payment.cardInfo.installmentPlanMonths}개월</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">승인번호</div>
                    <div class="detail-value">${payment.cardInfo.approveNo}</div>
                </div>
            </div>
        ` : ''}

        ${payment.orderInfo ? `
            <div class="order-info" style="margin-top: 25px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                <h4 style="margin: 0 0 15px; color: #333;">주문 정보</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">서비스명</div>
                        <div class="detail-value">${payment.orderInfo.serviceName}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">수량</div>
                        <div class="detail-value">${payment.orderInfo.quantity?.toLocaleString()}개</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">대상 URL</div>
                        <div class="detail-value" style="word-break: break-all; font-size: 0.9rem;">
                            <a href="${payment.orderInfo.targetUrl}" target="_blank" style="color: #667eea;">
                                ${payment.orderInfo.targetUrl}
                            </a>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">주문 번호</div>
                        <div class="detail-value">${payment.orderInfo.orderNumber}</div>
                    </div>
                </div>
            </div>
        ` : ''}
    `;

    // 영수증 생성
    generateReceipt(payment);
}

// 영수증 생성
function generateReceipt(payment) {
    const receiptContent = document.getElementById('receiptContent');
    if (!receiptContent) return;

    const receiptTime = new Date(payment.createdAt || Date.now());
    
    receiptContent.innerHTML = `
        <div class="receipt-header">
            <h3>MarketGrow</h3>
            <p>SNS 마케팅 서비스</p>
            <p>결제일시: ${receiptTime.toLocaleString('ko-KR')}</p>
        </div>
        
        <div class="receipt-items">
            <div class="receipt-item">
                <span>서비스명</span>
                <span>${payment.orderInfo?.serviceName || '마케팅 서비스'}</span>
            </div>
            <div class="receipt-item">
                <span>수량</span>
                <span>${payment.orderInfo?.quantity?.toLocaleString() || '1'}개</span>
            </div>
            <div class="receipt-item">
                <span>단위가격</span>
                <span>${PaymentUtils.formatAmount((payment.amount || payment.totalPrice) / (payment.orderInfo?.quantity || 1))}</span>
            </div>
            <div class="receipt-item">
                <span>소계</span>
                <span>${PaymentUtils.formatAmount(payment.amount || payment.totalPrice)}</span>
            </div>
            ${payment.discount ? `
                <div class="receipt-item">
                    <span>할인</span>
                    <span>-${PaymentUtils.formatAmount(payment.discount)}</span>
                </div>
            ` : ''}
            <div class="receipt-item">
                <span>총 결제금액</span>
                <span>${PaymentUtils.formatAmount(payment.amount || payment.totalPrice)}</span>
            </div>
        </div>
        
        <div class="receipt-footer" style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #dee2e6;">
            <p style="margin: 5px 0; font-size: 0.9rem;">결제번호: ${payment.paymentId || payment.transactionId || 'N/A'}</p>
            <p style="margin: 5px 0; font-size: 0.9rem;">결제방법: ${PaymentUtils.getPaymentMethodName(payment.paymentMethod || 'card')}</p>
            <p style="margin: 15px 0 5px; font-size: 0.8rem; color: #666;">이용해 주셔서 감사합니다.</p>
        </div>
    `;
}

// 결제 에러 표시
function showPaymentError(message) {
    const paymentDetails = document.getElementById('paymentDetails');
    if (!paymentDetails) return;

    paymentDetails.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>결제 정보 오류</h3>
            <p>${message}</p>
            <button class="retry-btn" onclick="location.reload()">새로고침</button>
            <button class="dashboard-btn" onclick="goToDashboard()">대시보드로 이동</button>
        </div>
    `;

    // 에러 스타일 추가
    if (!document.querySelector('#payment-error-styles')) {
        const style = document.createElement('style');
        style.id = 'payment-error-styles';
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

// 알림 설정 초기화
function initNotificationSettings() {
    const emailNotification = document.getElementById('emailNotification');
    const smsNotification = document.getElementById('smsNotification');

    [emailNotification, smsNotification].forEach(checkbox => {
        if (checkbox) {
            checkbox.addEventListener('change', updateNotificationSettings);
        }
    });
}

// 알림 설정 업데이트
async function updateNotificationSettings() {
    const settings = {
        email: document.getElementById('emailNotification')?.checked || false,
        sms: document.getElementById('smsNotification')?.checked || false
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

// 영수증 출력
function printReceipt() {
    const receiptContent = document.getElementById('receiptContent');
    if (!receiptContent) return;

    // 새 창에서 영수증 출력
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>결제 영수증 - MarketGrow</title>
            <style>
                body { font-family: 'Courier New', monospace; padding: 20px; }
                .receipt-header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #000; padding-bottom: 15px; }
                .receipt-item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #ccc; }
                .receipt-item:last-child { border-bottom: 1px solid #000; font-weight: bold; margin-top: 10px; padding-top: 10px; }
                .receipt-footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #000; }
                @media print {
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            ${receiptContent.innerHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    NotificationManager.success('영수증이 출력됩니다.');
}

// 대시보드로 이동
function goToDashboard() {
    window.location.href = 'dashboard.html';
}

// 새 주문하기
function goToServices() {
    window.location.href = 'services.html';
}

// 고객지원 연결
function contactSupport() {
    NotificationManager.info('곧 고객지원 팀과 연결됩니다.');
    // 여기에 고객지원 연결 로직 구현
}

// 사용자 메뉴 토글
function toggleUserMenu() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.classList.toggle('show');
    }
}

// 외부 클릭 시 사용자 메뉴 닫기
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenu && !userMenu.contains(event.target)) {
        userDropdown?.classList.remove('show');
    }
});

// 결제 성공 알림 발송
async function sendPaymentSuccessNotification() {
    if (!paymentData || !userInfo) {
        console.log('결제 데이터 또는 사용자 정보가 없어 알림을 발송하지 않습니다.');
        return;
    }
    
    // 이미 알림이 발송된 경우 중복 발송 방지
    const notificationSent = localStorage.getItem(`notification_sent_${paymentData.paymentId || paymentData.transactionId}`);
    if (notificationSent) {
        console.log('이미 알림이 발송되었습니다.');
        return;
    }
    
    try {
        // 주문 정보 구성
        const orderInfo = paymentData.orderInfo || {
            serviceName: '마케팅 서비스',
            orderNumber: paymentData.orderId || 'N/A',
            quantity: 1,
            targetUrl: 'N/A'
        };
        
        // 알림 발송
        const notifications = await notificationService.sendPaymentSuccessNotification(
            paymentData,
            orderInfo,
            userInfo
        );
        
        // 발송 결과 처리
        let successCount = 0;
        let failCount = 0;
        
        notifications.forEach(notification => {
            if (notification.success) {
                successCount++;
                console.log(`${notification.type} 알림 발송 성공:`, notification.message);
            } else {
                failCount++;
                console.error(`${notification.type} 알림 발송 실패:`, notification.error);
            }
        });
        
        // 알림 발송 완료 표시
        if (successCount > 0) {
            // 중복 발송 방지를 위해 플래그 설정
            localStorage.setItem(`notification_sent_${paymentData.paymentId || paymentData.transactionId}`, 'true');
            
            // 사용자에게 알림 발송 완료 메시지 표시
            if (successCount === notifications.length) {
                showNotificationSuccess('결제 완료 알림이 발송되었습니다.');
            } else {
                showNotificationWarning(`일부 알림이 발송되지 않았습니다. (성공: ${successCount}, 실패: ${failCount})`);
            }
        } else if (notifications.length > 0) {
            showNotificationError('알림 발송에 실패했습니다.');
        }
        
    } catch (error) {
        console.error('결제 성공 알림 발송 오류:', error);
        showNotificationError('알림 발송 중 오류가 발생했습니다.');
    }
}

// 알림 성공 메시지 표시
function showNotificationSuccess(message) {
    const notificationStatus = document.createElement('div');
    notificationStatus.className = 'notification-status success';
    notificationStatus.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    addNotificationStatusToPage(notificationStatus);
}

// 알림 경고 메시지 표시
function showNotificationWarning(message) {
    const notificationStatus = document.createElement('div');
    notificationStatus.className = 'notification-status warning';
    notificationStatus.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
    `;
    
    addNotificationStatusToPage(notificationStatus);
}

// 알림 오류 메시지 표시
function showNotificationError(message) {
    const notificationStatus = document.createElement('div');
    notificationStatus.className = 'notification-status error';
    notificationStatus.innerHTML = `
        <i class="fas fa-times-circle"></i>
        <span>${message}</span>
    `;
    
    addNotificationStatusToPage(notificationStatus);
}

// 알림 상태를 페이지에 추가
function addNotificationStatusToPage(element) {
    const paymentInfoCard = document.querySelector('.payment-info-card');
    if (paymentInfoCard) {
        paymentInfoCard.appendChild(element);
        
        // 3초 후 자동 제거
        setTimeout(() => {
            element.remove();
        }, 3000);
    }
    
    // 스타일 추가 (한 번만)
    if (!document.querySelector('#notification-status-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-status-styles';
        style.textContent = `
            .notification-status {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 15px 20px;
                margin-top: 20px;
                border-radius: 8px;
                font-size: 0.9rem;
                animation: slideInRight 0.3s ease;
            }
            
            .notification-status.success {
                background: #d4edda;
                color: #155724;
                border-left: 4px solid #28a745;
            }
            
            .notification-status.warning {
                background: #fff3cd;
                color: #856404;
                border-left: 4px solid #ffc107;
            }
            
            .notification-status.error {
                background: #f8d7da;
                color: #721c24;
                border-left: 4px solid #dc3545;
            }
            
            .notification-status i {
                font-size: 1.1rem;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// 페이지 나갈 때 결제 데이터 정리 (알림 플래그는 유지)
window.addEventListener('beforeunload', function() {
    // 완료된 결제 데이터 정리
    localStorage.removeItem('currentPaymentData');
    localStorage.removeItem('completedPayment');
});