// 결제 실패 페이지 JavaScript
let errorData = null;

document.addEventListener('DOMContentLoaded', () => {
    // 인증 확인
    checkAuthentication();

    // URL 파라미터 확인
    checkUrlParams();

    // 오류 정보 로드
    loadErrorInfo();

    // FAQ 초기화
    initFAQ();
});

// 인증 확인
async function checkAuthentication() {
    // 결제 실패 페이지는 로그인 없이도 접근 가능하도록 함
    if (api.token) {
        try {
            const response = await api.getProfile();
            if (response.success) {
                // 사용자 정보 업데이트
                const navUserName = document.getElementById('navUserName');
                if (navUserName) {
                    navUserName.textContent = `${response.data.user.name}님`;
                }
            }
        } catch (error) {
            console.error('인증 확인 실패:', error);
            // 결제 실패 페이지에서는 토큰을 제거하지 않음
        }
    }
}

// URL 파라미터 확인
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const errorCode = urlParams.get('errorCode') || urlParams.get('code');
    const errorMessage = urlParams.get('errorMsg') || urlParams.get('message');
    const orderId = urlParams.get('orderId');

    if (errorCode || errorMessage) {
        errorData = {
            errorCode,
            errorMessage: decodeURIComponent(errorMessage || ''),
            orderId,
            timestamp: new Date().toISOString()
        };

        displayErrorInfo(errorData);
    } else {
        loadErrorDataFromStorage();
    }
}

// localStorage에서 오류 데이터 로드
function loadErrorDataFromStorage() {
    const storedError = localStorage.getItem('paymentFailure');
    if (storedError) {
        try {
            errorData = JSON.parse(storedError);
            displayErrorInfo(errorData);
        } catch (error) {
            console.error('오류 데이터 파싱 실패:', error);
            showDefaultError();
        }
    } else {
        showDefaultError();
    }
}

// 오류 정보 로드
function loadErrorInfo() {
    // URL 파라미터나 localStorage에서 이미 처리되었다면 리턴
    if (errorData) return;

    // 기본 오류 표시
    showDefaultError();
}

// 오류 정보 표시
function displayErrorInfo(error) {
    const errorDetails = document.getElementById('errorDetails');
    if (!errorDetails) return;

    const errorTime = new Date(error.timestamp || Date.now());
    const userFriendlyMessage = PaymentUtils.getErrorMessage(error.errorCode) || error.errorMessage || '알 수 없는 오류가 발생했습니다.';

    errorDetails.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">오류 코드</div>
                <div class="detail-value error">${error.errorCode || 'UNKNOWN_ERROR'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">오류 메시지</div>
                <div class="detail-value">${userFriendlyMessage}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">발생 시간</div>
                <div class="detail-value">${errorTime.toLocaleString('ko-KR')}</div>
            </div>
            ${error.orderId
        ? `
                <div class="detail-item">
                    <div class="detail-label">주문 ID</div>
                    <div class="detail-value">${error.orderId}</div>
                </div>
            `
        : ''}
        </div>

        <div class="error-description" style="margin-top: 25px; padding: 20px; background: #fff3cd; border-radius: 10px; border-left: 4px solid #ffc107;">
            <h4 style="margin: 0 0 10px; color: #856404;">오류 상세 설명</h4>
            <p style="margin: 0; color: #856404; line-height: 1.5;">
                ${getDetailedErrorDescription(error.errorCode)}
            </p>
        </div>

        ${error.errorCode && getErrorSolution(error.errorCode)
        ? `
            <div class="error-solution" style="margin-top: 20px; padding: 20px; background: #d1ecf1; border-radius: 10px; border-left: 4px solid #17a2b8;">
                <h4 style="margin: 0 0 10px; color: #0c5460;">해결 방법</h4>
                <p style="margin: 0; color: #0c5460; line-height: 1.5;">
                    ${getErrorSolution(error.errorCode)}
                </p>
            </div>
        `
        : ''}
    `;
}

// 기본 오류 표시
function showDefaultError() {
    const errorDetails = document.getElementById('errorDetails');
    if (!errorDetails) return;

    errorDetails.innerHTML = `
        <div class="default-error" style="text-align: center; padding: 40px 20px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc3545; margin-bottom: 20px;"></i>
            <h3 style="margin: 0 0 15px; color: #333;">결제 처리 중 오류가 발생했습니다</h3>
            <p style="margin: 0 0 25px; color: #666; line-height: 1.5;">
                결제 과정에서 예상치 못한 문제가 발생했습니다.<br>
                잠시 후 다시 시도해주시거나 고객지원에 문의해주세요.
            </p>
            <div class="error-actions">
                <button class="retry-btn" onclick="retryPayment()" style="margin-right: 10px;">결제 다시 시도</button>
                <button class="support-btn" onclick="contactSupport()">고객지원 문의</button>
            </div>
        </div>
    `;

    // 기본 에러 스타일 추가
    if (!document.querySelector('#default-error-styles')) {
        const style = document.createElement('style');
        style.id = 'default-error-styles';
        style.textContent = `
            .retry-btn, .support-btn {
                padding: 12px 25px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                transition: background-color 0.3s;
            }
            
            .retry-btn {
                background: #667eea;
                color: white;
            }
            
            .retry-btn:hover {
                background: #5a67d8;
            }
            
            .support-btn {
                background: #28a745;
                color: white;
            }
            
            .support-btn:hover {
                background: #218838;
            }
        `;
        document.head.appendChild(style);
    }
}

// 상세 오류 설명 반환
function getDetailedErrorDescription(errorCode) {
    const descriptions = {
        PAY_PROCESS_CANCELED: '고객님이 결제 과정에서 취소 버튼을 클릭하여 결제가 중단되었습니다.',
        PAY_PROCESS_ABORTED: '결제 진행 중 시스템 오류가 발생하여 결제가 중단되었습니다.',
        REJECT_CARD_COMPANY: '카드사에서 해당 결제를 거절했습니다. 카드 상태나 한도를 확인해주세요.',
        INSUFFICIENT_FUNDS: '카드 잔액이 부족하거나 신용 한도를 초과했습니다.',
        INVALID_CARD: '입력하신 카드 정보가 올바르지 않습니다. 카드번호, 유효기간, CVC를 다시 확인해주세요.',
        EXPIRED_CARD: '사용하신 카드의 유효기간이 만료되었습니다. 다른 카드를 사용해주세요.',
        NETWORK_ERROR: '네트워크 연결 상태가 불안정하여 결제 처리에 실패했습니다.',
        TIMEOUT_ERROR: '결제 처리 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.',
        AUTHENTICATION_FAILED: '카드 인증에 실패했습니다. 카드 정보를 다시 확인해주세요.',
        LIMIT_EXCEEDED: '일일 결제 한도나 월간 결제 한도를 초과했습니다.'
    };

    return descriptions[errorCode] || '알 수 없는 오류가 발생했습니다. 고객지원에 문의해주세요.';
}

// 오류별 해결 방법 반환
function getErrorSolution(errorCode) {
    const solutions = {
        PAY_PROCESS_CANCELED: '결제를 계속 진행하려면 아래 "결제 다시 시도" 버튼을 클릭해주세요.',
        REJECT_CARD_COMPANY: '1) 카드사에 결제 가능 여부 확인 2) 온라인 결제 차단 해제 3) 다른 카드 사용',
        INSUFFICIENT_FUNDS: '1) 카드 잔액 확인 및 충전 2) 신용 한도 확인 3) 다른 결제 방법 선택',
        INVALID_CARD: '카드번호 16자리, 유효기간 MM/YY, CVC 3자리를 정확히 입력해주세요.',
        EXPIRED_CARD: '유효기간이 지나지 않은 다른 카드를 사용하거나 카드를 재발급 받아주세요.',
        NETWORK_ERROR: '1) 인터넷 연결 확인 2) 브라우저 새로고침 3) 잠시 후 다시 시도',
        AUTHENTICATION_FAILED: '카드 정보를 정확히 입력하거나 카드사에 문의하여 온라인 결제 가능 여부를 확인해주세요.'
    };

    return solutions[errorCode] || null;
}

// FAQ 초기화
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            // 다른 FAQ 아이템들 닫기
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });

            // 현재 아이템 토글
            item.classList.toggle('active');
        });
    });
}

// 결제 다시 시도
function retryPayment(method = null) {
    // 저장된 결제 데이터가 있다면 해당 데이터로 다시 시도
    const savedPaymentData = localStorage.getItem('currentPaymentData');

    if (savedPaymentData) {
        try {
            const paymentData = JSON.parse(savedPaymentData);

            if (method) {
                // 다른 결제 방법으로 시도
                paymentData.orderData.paymentMethod = method;
            }

            // 결제 다시 시도
            paymentManager.requestPayment({
                method: paymentData.orderData.paymentMethod || method || 'card',
                orderData: paymentData.orderData
            }).catch(error => {
                console.error('결제 재시도 오류:', error);
                NotificationManager.error('결제 재시도에 실패했습니다.');
            });
        } catch (error) {
            console.error('저장된 결제 데이터 파싱 오류:', error);
            // 새로운 주문 페이지로 이동
            goToNewOrder();
        }
    } else {
        // 새로운 주문 페이지로 이동
        goToNewOrder();
    }
}

// 장바구니로 돌아가기 (주문 페이지로 이동)
function goToCart() {
    window.location.href = 'order.html';
}

// 새 주문하기
function goToNewOrder() {
    window.location.href = 'services.html';
}

// 고객지원 연결
function contactSupport() {
    // 오류 정보를 포함한 고객지원 연결
    const supportData = {
        type: 'payment_error',
        errorCode: errorData?.errorCode,
        errorMessage: errorData?.errorMessage,
        timestamp: errorData?.timestamp || new Date().toISOString()
    };

    // 고객지원 정보를 localStorage에 저장 (고객지원 페이지에서 사용)
    localStorage.setItem('supportRequest', JSON.stringify(supportData));

    NotificationManager.info('고객지원 팀과 연결됩니다. 오류 정보가 자동으로 전달됩니다.');

    // 고객지원 페이지로 이동 또는 채팅 창 열기
    // window.location.href = 'support.html';

    // 또는 외부 고객지원 시스템 연결
    // window.open('https://support.marketgrow.com', '_blank');
}

// 사용자 메뉴 토글
function toggleUserMenu() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.classList.toggle('show');
    }
}

// 외부 클릭 시 사용자 메뉴 닫기
document.addEventListener('click', (event) => {
    const userMenu = document.querySelector('.user-menu');
    const userDropdown = document.getElementById('userDropdown');

    if (userMenu && !userMenu.contains(event.target)) {
        userDropdown?.classList.remove('show');
    }
});

// 페이지 나갈 때 일부 데이터 정리
window.addEventListener('beforeunload', () => {
    // 오류 정보는 유지하고 필요시에만 정리
    if (performance.navigation.type === 1) { // 새로고침인 경우
        // 새로고침 시에는 오류 정보 유지
        return;
    }

    // 다른 페이지로 이동 시 오류 정보 정리 (5분 후)
    setTimeout(() => {
        localStorage.removeItem('paymentFailure');
    }, 5 * 60 * 1000); // 5분
});
