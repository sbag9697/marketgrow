// 결제 실패 페이지 관리
class PaymentFailManager {
    constructor() {
        this.failureData = null;
        this.init();
    }

    init() {
        // URL 파라미터에서 실패 정보 가져오기
        this.getFailureInfo();

        // 실패 정보 표시
        this.displayFailureInfo();

        // 실패 로그 저장
        this.logFailure();
    }

    // URL에서 실패 정보 추출
    getFailureInfo() {
        const urlParams = new URLSearchParams(window.location.search);

        this.failureData = {
            code: urlParams.get('code'),
            message: urlParams.get('message'),
            orderId: urlParams.get('orderId')
        };
    }

    // 실패 정보 화면에 표시
    displayFailureInfo() {
        const errorMessage = document.getElementById('errorMessage');
        const errorInfo = document.getElementById('errorInfo');
        const errorCode = document.getElementById('errorCode');
        const errorMsg = document.getElementById('errorMsg');

        if (this.failureData.code && this.failureData.message) {
            // 상세 오류 정보가 있는 경우
            errorInfo.style.display = 'block';
            errorCode.textContent = this.failureData.code;
            errorMsg.textContent = decodeURIComponent(this.failureData.message);

            // 사용자 친화적 메시지로 변환
            const friendlyMessage = this.getFriendlyErrorMessage(this.failureData.code);
            errorMessage.textContent = friendlyMessage;
        } else {
            // 기본 오류 메시지
            errorMessage.textContent = '결제 처리 중 문제가 발생했습니다. 다시 시도해주세요.';
        }
    }

    // 사용자 친화적 오류 메시지 반환
    getFriendlyErrorMessage(errorCode) {
        const errorMessages = {
            PAY_PROCESS_CANCELED: '결제가 취소되었습니다.',
            PAY_PROCESS_ABORTED: '결제가 중단되었습니다.',
            REJECT_CARD_COMPANY: '카드사에서 승인을 거절했습니다.',
            INVALID_CARD_COMPANY: '유효하지 않은 카드입니다.',
            NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_COMPANY: '할부가 지원되지 않는 카드입니다.',
            EXCEED_MAX_DAILY_PAYMENT_COUNT: '일일 결제 한도를 초과했습니다.',
            NOT_SUPPORTED_MONTHLY_INSTALLMENT_PLAN: '월별 할부가 지원되지 않습니다.',
            EXCEED_MAX_PAYMENT_AMOUNT: '결제 한도를 초과했습니다.',
            NOT_FOUND_TERMINAL_ID: '단말기 정보를 찾을 수 없습니다.',
            INVALID_AUTHORIZE_AUTH: '인증 정보가 유효하지 않습니다.',
            INVALID_CARD_EXPIRATION: '카드 유효기간이 잘못되었습니다.',
            INVALID_STOPPED_CARD: '정지된 카드입니다.',
            EXCEED_MAX_AMOUNT: '한도를 초과했습니다.',
            INVALID_CARD_NUMBER: '카드번호가 잘못되었습니다.',
            INVALID_UNREGISTERED_SUBMALL: '등록되지 않은 서브몰입니다.',
            NOT_REGISTERED_BUSINESS: '등록되지 않은 사업자입니다.'
        };

        return errorMessages[errorCode] || '결제 처리 중 오류가 발생했습니다.';
    }

    // 실패 로그 저장
    logFailure() {
        try {
            const failureLog = {
                timestamp: new Date().toISOString(),
                orderId: this.failureData.orderId,
                errorCode: this.failureData.code,
                errorMessage: this.failureData.message,
                userAgent: navigator.userAgent,
                url: window.location.href
            };

            // 로컬 스토리지에 실패 로그 저장 (개발용)
            const failureLogs = JSON.parse(localStorage.getItem('paymentFailureLogs') || '[]');
            failureLogs.push(failureLog);

            // 최근 10개만 유지
            if (failureLogs.length > 10) {
                failureLogs.splice(0, failureLogs.length - 10);
            }

            localStorage.setItem('paymentFailureLogs', JSON.stringify(failureLogs));
        } catch (error) {
            console.error('실패 로그 저장 실패:', error);
        }
    }

    // 결제 재시도를 위한 주문 데이터 복원
    getRetryOrderData() {
        const sessionOrder = sessionStorage.getItem('currentOrder');
        if (sessionOrder) {
            return JSON.parse(sessionOrder);
        }
        return null;
    }
}

// 전역 함수들
function retryPayment() {
    const failManager = new PaymentFailManager();
    const orderData = failManager.getRetryOrderData();

    if (orderData) {
        // 주문 데이터가 있으면 결제 페이지로 리다이렉트
        const orderParam = encodeURIComponent(JSON.stringify(orderData));
        window.location.href = `payment.html?order=${orderParam}`;
    } else {
        // 주문 데이터가 없으면 서비스 선택부터 다시
        alert('주문 정보가 없습니다. 서비스를 다시 선택해주세요.');
        window.location.href = 'services.html';
    }
}

function goToServices() {
    window.location.href = 'services.html';
}

function contactSupport() {
    // 고객센터 연락 방법 모달 표시
    const supportMethods = `
고객센터 연락처:

📞 전화: 1588-1234
📧 이메일: support@socialmarketingpro.com
💬 카카오톡: @socialmarketing
🕐 운영시간: 평일 09:00-18:00

문의시 아래 정보를 함께 알려주세요:
- 주문번호: ${new PaymentFailManager().failureData.orderId || '없음'}
- 오류코드: ${new PaymentFailManager().failureData.code || '없음'}
- 발생시간: ${new Date().toLocaleString()}
    `;

    alert(supportMethods);
}

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', () => {
    new PaymentFailManager();
});
