// 결제 내역 페이지 JavaScript
let payments = [];
let filteredPayments = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentView = 'list';
let selectedPayment = null;

document.addEventListener('DOMContentLoaded', () => {
    // 인증 확인
    checkAuthentication();

    // 결제 내역 로드
    loadPaymentHistory();

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

// 결제 내역 로드
async function loadPaymentHistory() {
    try {
        const response = await api.getPayments({
            limit: 100, // 충분한 데이터 로드
            sort: '-createdAt'
        });

        if (response.success) {
            payments = response.data.payments || [];
            filteredPayments = [...payments];

            updateStatistics();
            renderPaymentList();
            renderPagination();
        } else {
            showEmptyState('결제 내역을 불러올 수 없습니다.');
        }
    } catch (error) {
        console.error('결제 내역 로드 오류:', error);
        showEmptyState('결제 내역을 불러오는 중 오류가 발생했습니다.');
    }
}

// 통계 업데이트
function updateStatistics() {
    const completedPayments = payments.filter(p => p.status === 'completed');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const failedPayments = payments.filter(p => p.status === 'failed');
    const totalAmount = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // DOM 업데이트
    document.getElementById('completedPayments').textContent = completedPayments.length.toLocaleString();
    document.getElementById('totalAmount').textContent = PaymentUtils.formatAmount(totalAmount);
    document.getElementById('pendingPayments').textContent = pendingPayments.length.toLocaleString();
    document.getElementById('failedPayments').textContent = failedPayments.length.toLocaleString();

    // 애니메이션 효과
    animateCountUp('completedPayments', completedPayments.length);
    animateCountUp('pendingPayments', pendingPayments.length);
    animateCountUp('failedPayments', failedPayments.length);
}

// 카운트 애니메이션
function animateCountUp(elementId, finalValue) {
    const element = document.getElementById(elementId);
    if (!element || finalValue === 0) return;

    let currentValue = 0;
    const increment = Math.ceil(finalValue / 30);

    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= finalValue) {
            currentValue = finalValue;
            clearInterval(timer);
        }

        element.textContent = currentValue.toLocaleString();
    }, 50);
}

// 결제 내역 렌더링
function renderPaymentList() {
    const paymentList = document.getElementById('paymentList');
    if (!paymentList) return;

    // 현재 페이지의 결제 내역 가져오기
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPayments = filteredPayments.slice(startIndex, endIndex);

    if (currentPayments.length === 0) {
        showEmptyState('조건에 맞는 결제 내역이 없습니다.');
        return;
    }

    // 뷰 타입에 따라 렌더링
    if (currentView === 'list') {
        renderListView(currentPayments);
    } else {
        renderGridView(currentPayments);
    }
}

// 리스트 뷰 렌더링
function renderListView(payments) {
    const paymentList = document.getElementById('paymentList');
    paymentList.className = 'payment-list list-view';

    let listHTML = '';
    payments.forEach(payment => {
        const statusClass = getPaymentStatusClass(payment.status);
        const statusText = getPaymentStatusText(payment.status);
        const methodIcon = getPaymentMethodIcon(payment.paymentMethod);
        const methodText = PaymentUtils.getPaymentMethodName(payment.paymentMethod);
        const paymentDate = new Date(payment.createdAt).toLocaleDateString('ko-KR');

        listHTML += `
            <div class="payment-item" onclick="showPaymentDetail('${payment._id}')">
                <div class="payment-main">
                    <div class="payment-id">${payment.paymentId || payment.transactionId}</div>
                    <div class="payment-info">
                        <h4>${payment.orderInfo?.serviceName || '마케팅 서비스'}</h4>
                        <p>${payment.orderInfo?.targetUrl ? formatUrl(payment.orderInfo.targetUrl) : '서비스 주문'}</p>
                    </div>
                    <div class="payment-amount">${PaymentUtils.formatAmount(payment.amount)}</div>
                    <div class="payment-method">
                        <i class="${methodIcon}"></i>
                        ${methodText}
                    </div>
                    <div class="payment-status ${statusClass}">${statusText}</div>
                </div>
                <div class="payment-date">${paymentDate}</div>
            </div>
        `;
    });

    paymentList.innerHTML = listHTML;
}

// 그리드 뷰 렌더링
function renderGridView(payments) {
    const paymentList = document.getElementById('paymentList');
    paymentList.className = 'payment-list grid-view';

    let gridHTML = '';
    payments.forEach(payment => {
        const statusClass = getPaymentStatusClass(payment.status);
        const statusText = getPaymentStatusText(payment.status);
        const paymentDate = new Date(payment.createdAt).toLocaleDateString('ko-KR');

        gridHTML += `
            <div class="payment-card" onclick="showPaymentDetail('${payment._id}')">
                <div class="payment-card-header">
                    <div class="payment-card-id">${payment.paymentId || payment.transactionId}</div>
                    <div class="payment-status ${statusClass}">${statusText}</div>
                </div>
                <div class="payment-card-body">
                    <h4>${payment.orderInfo?.serviceName || '마케팅 서비스'}</h4>
                    <p>${payment.orderInfo?.targetUrl ? formatUrl(payment.orderInfo.targetUrl) : '서비스 주문'}</p>
                </div>
                <div class="payment-card-footer">
                    <div class="payment-card-amount">${PaymentUtils.formatAmount(payment.amount)}</div>
                    <div class="payment-card-date">${paymentDate}</div>
                </div>
            </div>
        `;
    });

    paymentList.innerHTML = gridHTML;
}

// 페이지네이션 렌더링
function renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = `
        <button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" 
                onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // 페이지 번호 표시 로직
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        paginationHTML += '<button class="page-btn" onclick="changePage(1)">1</button>';
        if (startPage > 2) {
            paginationHTML += '<span class="page-ellipsis">...</span>';
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="page-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="changePage(${i})">${i}</button>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += '<span class="page-ellipsis">...</span>';
        }
        paginationHTML += `<button class="page-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
    }

    paginationHTML += `
        <button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
        <div class="page-info">${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredPayments.length)} / ${filteredPayments.length}개</div>
    `;

    pagination.innerHTML = paginationHTML;
}

// 빈 상태 표시
function showEmptyState(message = '결제 내역이 없습니다.') {
    const paymentList = document.getElementById('paymentList');
    const pagination = document.getElementById('pagination');

    paymentList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-credit-card"></i>
            <h3>결제 내역이 없습니다</h3>
            <p>${message}</p>
            <button class="primary-btn" onclick="location.href='services.html'">
                <i class="fas fa-plus"></i>
                첫 주문하기
            </button>
        </div>
    `;

    pagination.innerHTML = '';
}

// 필터 적용
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const methodFilter = document.getElementById('methodFilter').value;
    const dateRange = document.getElementById('dateRange').value;
    const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();

    filteredPayments = payments.filter(payment => {
        // 상태 필터
        if (statusFilter && payment.status !== statusFilter) {
            return false;
        }

        // 결제 방법 필터
        if (methodFilter && payment.paymentMethod !== methodFilter) {
            return false;
        }

        // 날짜 범위 필터
        if (dateRange !== 'all' && !isInDateRange(payment.createdAt, dateRange)) {
            return false;
        }

        // 검색 필터
        if (searchQuery) {
            const searchFields = [
                payment.paymentId,
                payment.transactionId,
                payment.orderInfo?.orderNumber,
                payment.orderInfo?.serviceName
            ].filter(Boolean).join(' ').toLowerCase();

            if (!searchFields.includes(searchQuery)) {
                return false;
            }
        }

        return true;
    });

    currentPage = 1;
    renderPaymentList();
    renderPagination();
}

// 날짜 범위 확인
function isInDateRange(dateString, range) {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (range) {
        case 'today':
            return date >= today;
        case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return date >= weekAgo;
        case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return date >= monthAgo;
        case '3months':
            const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
            return date >= threeMonthsAgo;
        case 'year':
            const yearStart = new Date(now.getFullYear(), 0, 1);
            return date >= yearStart;
        default:
            return true;
    }
}

// 필터 초기화
function resetFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('methodFilter').value = '';
    document.getElementById('dateRange').value = 'all';
    document.getElementById('searchInput').value = '';

    filteredPayments = [...payments];
    currentPage = 1;
    renderPaymentList();
    renderPagination();
}

// 검색 처리
function handleSearch(event) {
    if (event.key === 'Enter') {
        applyFilters();
    }
}

// 뷰 전환
function switchView(view) {
    currentView = view;

    // 버튼 상태 업데이트
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');

    // 리스트 다시 렌더링
    renderPaymentList();
}

// 페이지 변경
function changePage(page) {
    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

    if (page < 1 || page > totalPages) return;

    currentPage = page;
    renderPaymentList();
    renderPagination();

    // 스크롤을 상단으로
    document.querySelector('.payment-list-card').scrollIntoView({ behavior: 'smooth' });
}

// 결제 상세 표시
async function showPaymentDetail(paymentId) {
    try {
        selectedPayment = payments.find(p => p._id === paymentId);
        if (!selectedPayment) {
            NotificationManager.error('결제 정보를 찾을 수 없습니다.');
            return;
        }

        // 모달 콘텐츠 생성
        const modalContent = generatePaymentDetailContent(selectedPayment);
        document.getElementById('paymentDetailContent').innerHTML = modalContent;

        // 모달 표시
        document.getElementById('paymentDetailModal').style.display = 'block';
    } catch (error) {
        console.error('결제 상세 정보 로드 오류:', error);
        NotificationManager.error('결제 상세 정보를 불러올 수 없습니다.');
    }
}

// 결제 상세 콘텐츠 생성
function generatePaymentDetailContent(payment) {
    const statusClass = getPaymentStatusClass(payment.status);
    const statusText = getPaymentStatusText(payment.status);
    const methodText = PaymentUtils.getPaymentMethodName(payment.paymentMethod);
    const paymentDate = new Date(payment.createdAt).toLocaleString('ko-KR');

    return `
        <div class="payment-detail">
            <div class="detail-header">
                <h4>결제 정보</h4>
                <div class="payment-status ${statusClass}">${statusText}</div>
            </div>
            
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">결제 번호</div>
                    <div class="detail-value">${payment.paymentId || payment.transactionId}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">결제 금액</div>
                    <div class="detail-value highlight">${PaymentUtils.formatAmount(payment.amount)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">결제 방법</div>
                    <div class="detail-value">${methodText}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">결제 일시</div>
                    <div class="detail-value">${paymentDate}</div>
                </div>
            </div>

            ${payment.cardInfo
        ? `
                <div class="detail-section">
                    <h4>카드 정보</h4>
                    <div class="detail-grid">
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
                </div>
            `
        : ''}

            ${payment.orderInfo
        ? `
                <div class="detail-section">
                    <h4>주문 정보</h4>
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
                            <div class="detail-value" style="word-break: break-all;">
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
            `
        : ''}

            ${payment.failureReason
        ? `
                <div class="detail-section failure">
                    <h4>실패 정보</h4>
                    <div class="detail-item">
                        <div class="detail-label">실패 사유</div>
                        <div class="detail-value error">${payment.failureReason}</div>
                    </div>
                </div>
            `
        : ''}
        </div>
    `;
}

// 모달 닫기
function closePaymentDetailModal() {
    document.getElementById('paymentDetailModal').style.display = 'none';
    selectedPayment = null;
}

// 영수증 출력
function printPaymentReceipt() {
    if (!selectedPayment) return;

    const receiptContent = generateReceiptContent(selectedPayment);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>결제 영수증 - MarketGrow</title>
            <style>
                body { font-family: 'Courier New', monospace; padding: 20px; }
                .receipt-header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #000; padding-bottom: 15px; }
                .detail-item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #ccc; }
                .detail-item:last-child { border-bottom: 1px solid #000; font-weight: bold; margin-top: 10px; padding-top: 10px; }
                .receipt-footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #000; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            ${receiptContent}
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    NotificationManager.success('영수증이 출력됩니다.');
}

// 영수증 콘텐츠 생성
function generateReceiptContent(payment) {
    const paymentDate = new Date(payment.createdAt).toLocaleString('ko-KR');

    return `
        <div class="receipt-header">
            <h3>MarketGrow</h3>
            <p>SNS 마케팅 서비스</p>
            <p>결제일시: ${paymentDate}</p>
        </div>
        
        <div class="receipt-items">
            <div class="detail-item">
                <span>서비스명</span>
                <span>${payment.orderInfo?.serviceName || '마케팅 서비스'}</span>
            </div>
            <div class="detail-item">
                <span>수량</span>
                <span>${payment.orderInfo?.quantity?.toLocaleString() || '1'}개</span>
            </div>
            <div class="detail-item">
                <span>결제방법</span>
                <span>${PaymentUtils.getPaymentMethodName(payment.paymentMethod)}</span>
            </div>
            <div class="detail-item">
                <span>총 결제금액</span>
                <span>${PaymentUtils.formatAmount(payment.amount)}</span>
            </div>
        </div>
        
        <div class="receipt-footer">
            <p>결제번호: ${payment.paymentId || payment.transactionId}</p>
            <p>이용해 주셔서 감사합니다.</p>
        </div>
    `;
}

// 결제 내역 내보내기
function exportPaymentHistory() {
    if (filteredPayments.length === 0) {
        NotificationManager.warning('내보낼 결제 내역이 없습니다.');
        return;
    }

    // CSV 데이터 생성
    const csvData = generateCSVData(filteredPayments);

    // 파일 다운로드
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `결제내역_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    NotificationManager.success('결제 내역이 다운로드됩니다.');
}

// CSV 데이터 생성
function generateCSVData(payments) {
    const headers = ['결제번호', '서비스명', '결제금액', '결제방법', '상태', '결제일시'];
    const rows = payments.map(payment => [
        payment.paymentId || payment.transactionId,
        payment.orderInfo?.serviceName || '마케팅 서비스',
        payment.amount,
        PaymentUtils.getPaymentMethodName(payment.paymentMethod),
        getPaymentStatusText(payment.status),
        new Date(payment.createdAt).toLocaleString('ko-KR')
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

    return `\ufeff${csvContent}`; // UTF-8 BOM 추가
}

// 이벤트 리스너 초기화
function initEventListeners() {
    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('paymentDetailModal');
        if (event.target === modal) {
            closePaymentDetailModal();
        }
    });

    // 키보드 이벤트
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closePaymentDetailModal();
        }
    });

    // 사용자 메뉴 초기화
    document.addEventListener('click', (event) => {
        const userMenu = document.querySelector('.user-menu');
        const userDropdown = document.getElementById('userDropdown');

        if (userMenu && !userMenu.contains(event.target)) {
            userDropdown?.classList.remove('show');
        }
    });
}

// 유틸리티 함수들
function getPaymentStatusClass(status) {
    const statusClasses = {
        completed: 'completed',
        pending: 'pending',
        failed: 'failed',
        cancelled: 'cancelled',
        refunded: 'refunded'
    };
    return statusClasses[status] || 'pending';
}

function getPaymentStatusText(status) {
    const statusTexts = {
        completed: '완료',
        pending: '대기중',
        failed: '실패',
        cancelled: '취소됨',
        refunded: '환불됨'
    };
    return statusTexts[status] || '알 수 없음';
}

function getPaymentMethodIcon(method) {
    const methodIcons = {
        card: 'fas fa-credit-card',
        bank: 'fas fa-university',
        paypal: 'fab fa-paypal',
        kakaopay: 'fas fa-comment',
        naverpay: 'fas fa-n'
    };
    return methodIcons[method] || 'fas fa-credit-card';
}

function formatUrl(url) {
    if (url.length > 40) {
        return `${url.substring(0, 40)}...`;
    }
    return url;
}

// 사용자 메뉴 토글
function toggleUserMenu() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.classList.toggle('show');
    }
}
