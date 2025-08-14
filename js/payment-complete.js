// 결제 시스템 완성 기능 - KG이니시스
const API_URL = 'https://marketgrow-production-c586.up.railway.app/api';

// KG이니시스 설정
const INICIS_MID = 'INIpayTest'; // 테스트 상점 ID
const INICIS_SIGN_KEY = 'SU5JTElURV9UUklQTEVERVNfS0VZU1RS'; // 테스트 사인키

// 결제 정보
let orderInfo = null;
let selectedPaymentMethod = 'Card';

// 페이지 초기화
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    loadOrderInfo();
    setupPaymentMethods();
    initInicisPayments();
});

// 인증 확인
function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// 주문 정보 로드
async function loadOrderInfo() {
    // URL 파라미터에서 주문 ID 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order');

    if (!orderId) {
        // 임시 주문 정보 (세션스토리지에서)
        const tempOrder = sessionStorage.getItem('pendingOrder');
        if (tempOrder) {
            orderInfo = JSON.parse(tempOrder);
            displayOrderInfo(orderInfo);
        } else {
            alert('주문 정보가 없습니다.');
            window.location.href = '/services.html';
        }
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            orderInfo = data.data;
            displayOrderInfo(orderInfo);
        } else {
            alert('주문 정보를 불러올 수 없습니다.');
            window.location.href = '/dashboard.html';
        }
    } catch (error) {
        console.error('주문 정보 로드 오류:', error);
        alert('주문 정보를 불러올 수 없습니다.');
    }
}

// 주문 정보 표시
function displayOrderInfo(order) {
    // 서비스명
    const serviceName = document.getElementById('orderServiceName');
    if (serviceName) {
        serviceName.textContent = order.serviceName || '서비스';
    }

    // 수량
    const quantity = document.getElementById('orderQuantity');
    if (quantity) {
        quantity.textContent = `수량: ${(order.quantity || 0).toLocaleString()}개`;
    }

    // URL
    const url = document.getElementById('orderUrl');
    if (url) {
        url.textContent = `대상 URL: ${order.targetUrl || ''}`;
    }

    // 가격 정보
    const serviceAmount = order.price || order.totalPrice || 0;
    const vatAmount = Math.round(serviceAmount * 0.1);
    const finalAmount = serviceAmount + vatAmount;

    document.getElementById('serviceAmount').textContent = `₩${serviceAmount.toLocaleString()}`;
    document.getElementById('vatAmount').textContent = `₩${vatAmount.toLocaleString()}`;
    document.getElementById('finalAmount').textContent = `₩${finalAmount.toLocaleString()}`;
    document.getElementById('orderTotalPrice').textContent = `₩${serviceAmount.toLocaleString()}`;

    // 주문 정보 업데이트
    orderInfo.finalAmount = finalAmount;
}

// 결제 방법 설정
function setupPaymentMethods() {
    const methodItems = document.querySelectorAll('.payment-method-item');

    methodItems.forEach(item => {
        item.addEventListener('click', function () {
            // 모든 아이템에서 selected 클래스 제거
            methodItems.forEach(el => el.classList.remove('selected'));
            // 클릭한 아이템에 selected 클래스 추가
            this.classList.add('selected');
            // 선택된 결제 방법 저장
            selectedPaymentMethod = this.dataset.method;
        });
    });
}

// KG이니시스 초기화
async function initInicisPayments() {
    // KG이니시스 결제 스크립트 동적 로드
    if (!window.INIStdPay) {
        const script = document.createElement('script');
        script.src = 'https://stdpay.inicis.com/stdjs/INIStdPay.js';
        script.charset = 'UTF-8';
        script.onload = () => {
            console.log('KG이니시스 SDK 로드 완료');
        };
        document.head.appendChild(script);
    }
}

// 결제 처리
async function processPayment() {
    if (!orderInfo) {
        alert('주문 정보가 없습니다.');
        return;
    }

    // 약관 동의 확인
    const agreeTerms = document.getElementById('agreeTerms');
    const agreePrivacy = document.getElementById('agreePrivacy');

    if (!agreeTerms.checked || !agreePrivacy.checked) {
        alert('모든 약관에 동의해주세요.');
        return;
    }

    // 결제 요청 데이터
    const paymentData = {
        orderId: orderInfo._id || generateOrderId(),
        amount: orderInfo.finalAmount,
        orderName: orderInfo.serviceName || '마케팅 서비스',
        customerName: orderInfo.customerName || '고객',
        customerEmail: orderInfo.customerEmail || '',
        paymentMethod: selectedPaymentMethod
    };

    try {
        // 백엔드에 결제 요청
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/payments/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(paymentData)
        });

        const data = await response.json();

        if (data.success) {
            // KG이니시스 결제창 호출
            if (window.INIStdPay) {
                // 결제 요청 폼 생성
                const payForm = document.createElement('form');
                payForm.id = 'inicisPayForm';
                payForm.method = 'POST';
                payForm.acceptCharset = 'UTF-8';

                // 필수 파라미터 설정
                const payParams = {
                    version: '1.0',
                    mid: INICIS_MID,
                    oid: paymentData.orderId,
                    price: paymentData.amount,
                    goodname: paymentData.orderName,
                    buyername: paymentData.customerName,
                    buyeremail: paymentData.customerEmail,
                    buyertel: paymentData.customerPhone || '010-0000-0000',
                    timestamp: new Date().getTime(),
                    signature: data.data.signature || '', // 서버에서 생성한 서명
                    returnUrl: `${window.location.origin}/payment-success.html`,
                    closeUrl: `${window.location.origin}/payment-fail.html`,
                    gopaymethod: convertPaymentMethod(selectedPaymentMethod),
                    acceptmethod: 'CARDPOINT:HPP(1):below1000',
                    currency: 'WON'
                };

                // 폼에 파라미터 추가
                Object.keys(payParams).forEach(key => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = payParams[key];
                    payForm.appendChild(input);
                });

                document.body.appendChild(payForm);

                // KG이니시스 결제창 호출
                INIStdPay.pay('inicisPayForm');
            } else {
                // KG이니시스 SDK가 로드되지 않은 경우 대체 처리
                alert('결제 시스템을 준비중입니다. 잠시 후 다시 시도해주세요.');
                setTimeout(() => initInicisPayments(), 1000);
            }
        } else {
            alert(data.message || '결제 요청 실패');
        }
    } catch (error) {
        console.error('결제 처리 오류:', error);
        alert('결제 처리 중 오류가 발생했습니다.');
    }
}

// 무통장입금 처리
async function processVirtualAccount() {
    if (!orderInfo) {
        alert('주문 정보가 없습니다.');
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/payments/virtual-account`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                orderId: orderInfo._id || generateOrderId(),
                amount: orderInfo.finalAmount,
                customerName: orderInfo.customerName || '고객'
            })
        });

        const data = await response.json();

        if (data.success) {
            // 가상계좌 정보 표시
            displayVirtualAccountInfo(data.data);
        } else {
            alert(data.message || '가상계좌 발급 실패');
        }
    } catch (error) {
        console.error('가상계좌 처리 오류:', error);
        alert('가상계좌 발급 중 오류가 발생했습니다.');
    }
}

// 가상계좌 정보 표시
function displayVirtualAccountInfo(accountInfo) {
    const modal = document.createElement('div');
    modal.className = 'virtual-account-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>가상계좌 입금 안내</h3>
            <div class="account-info">
                <div class="info-row">
                    <label>은행명</label>
                    <span>${accountInfo.bankName || '국민은행'}</span>
                </div>
                <div class="info-row">
                    <label>계좌번호</label>
                    <span>${accountInfo.accountNumber || '1234-5678-9012'}</span>
                </div>
                <div class="info-row">
                    <label>예금주</label>
                    <span>${accountInfo.accountHolder || '마켓그로우'}</span>
                </div>
                <div class="info-row">
                    <label>입금금액</label>
                    <span>₩${orderInfo.finalAmount.toLocaleString()}</span>
                </div>
                <div class="info-row">
                    <label>입금기한</label>
                    <span>${accountInfo.dueDate || '24시간 이내'}</span>
                </div>
            </div>
            <p class="notice">위 계좌로 입금하시면 자동으로 주문이 처리됩니다.</p>
            <button onclick="closeVirtualAccountModal()">확인</button>
        </div>
    `;

    document.body.appendChild(modal);
}

// 가상계좌 모달 닫기
function closeVirtualAccountModal() {
    const modal = document.querySelector('.virtual-account-modal');
    if (modal) {
        modal.remove();
    }
    // 대시보드로 이동
    window.location.href = '/dashboard.html';
}

// 주문 ID 생성
function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `ORDER_${timestamp}_${random}`;
}

// 쿠폰 적용
async function applyCoupon() {
    const couponCode = document.getElementById('couponCode').value;
    if (!couponCode) {
        alert('쿠폰 코드를 입력해주세요.');
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/coupons/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                code: couponCode,
                amount: orderInfo.finalAmount
            })
        });

        const data = await response.json();

        if (data.success) {
            // 할인 적용
            const discount = data.data.discount;
            const newAmount = orderInfo.finalAmount - discount;

            // UI 업데이트
            const discountRow = document.createElement('div');
            discountRow.className = 'total-row discount';
            discountRow.innerHTML = `
                <span>쿠폰 할인</span>
                <span class="discount-amount">-₩${discount.toLocaleString()}</span>
            `;

            const finalTotalRow = document.querySelector('.final-total');
            finalTotalRow.parentNode.insertBefore(discountRow, finalTotalRow);

            // 최종 금액 업데이트
            orderInfo.finalAmount = newAmount;
            document.getElementById('finalAmount').textContent = `₩${newAmount.toLocaleString()}`;

            alert('쿠폰이 적용되었습니다!');
        } else {
            alert(data.message || '유효하지 않은 쿠폰입니다.');
        }
    } catch (error) {
        console.error('쿠폰 적용 오류:', error);
        alert('쿠폰 적용 중 오류가 발생했습니다.');
    }
}

// 포인트 사용
async function usePoints() {
    const pointsInput = document.getElementById('usePoints');
    const points = parseInt(pointsInput.value) || 0;

    if (points <= 0) {
        alert('사용할 포인트를 입력해주세요.');
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/users/points/check`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            const availablePoints = data.data.points;

            if (points > availablePoints) {
                alert(`사용 가능한 포인트는 ${availablePoints}포인트입니다.`);
                return;
            }

            // 포인트 적용
            const newAmount = Math.max(0, orderInfo.finalAmount - points);

            // UI 업데이트
            const pointsRow = document.createElement('div');
            pointsRow.className = 'total-row points';
            pointsRow.innerHTML = `
                <span>포인트 사용</span>
                <span class="points-amount">-₩${points.toLocaleString()}</span>
            `;

            const finalTotalRow = document.querySelector('.final-total');
            finalTotalRow.parentNode.insertBefore(pointsRow, finalTotalRow);

            // 최종 금액 업데이트
            orderInfo.finalAmount = newAmount;
            orderInfo.usedPoints = points;
            document.getElementById('finalAmount').textContent = `₩${newAmount.toLocaleString()}`;

            alert('포인트가 적용되었습니다!');
        }
    } catch (error) {
        console.error('포인트 사용 오류:', error);
        alert('포인트 사용 중 오류가 발생했습니다.');
    }
}

// 결제 방법 변환 (KG이니시스 형식)
function convertPaymentMethod(method) {
    const methodMap = {
        Card: 'Card', // 신용카드
        DirectBank: 'DirectBank', // 실시간계좌이체
        VBank: 'VBank', // 가상계좌
        HPP: 'HPP', // 휴대폰
        KAKAOPAY: 'onlykakaopay', // 카카오페이
        PAYCO: 'onlypayco', // 페이코
        SSGPAY: 'onlyssp' // SSG페이
    };
    return methodMap[method] || 'Card';
}

// KG이니시스 결제 결과 처리
function handleInicisResult(result) {
    if (result.resultCode === '00') {
        // 결제 성공
        window.location.href = `/payment-success.html?tid=${result.tid}&oid=${result.oid}`;
    } else {
        // 결제 실패
        alert(`결제 실패: ${result.resultMsg}`);
        window.location.href = `/payment-fail.html?code=${result.resultCode}&msg=${result.resultMsg}`;
    }
}

// 모바일 결제 처리
function processMobilePayment() {
    if (!orderInfo) {
        alert('주문 정보가 없습니다.');
        return;
    }

    // 모바일 웹 결제는 리다이렉트 방식 사용
    const paymentData = {
        mid: INICIS_MID,
        oid: orderInfo._id || generateOrderId(),
        amt: orderInfo.finalAmount,
        goodname: orderInfo.serviceName || '마케팅 서비스',
        buyername: orderInfo.customerName || '고객',
        buyeremail: orderInfo.customerEmail || '',
        buyertel: orderInfo.customerPhone || '010-0000-0000',
        returnurl: `${window.location.origin}/payment-success.html`,
        paymethod: selectedPaymentMethod
    };

    // 모바일 결제 페이지로 이동
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://mobile.inicis.com/smart/payment/';

    Object.keys(paymentData).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = paymentData[key];
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
}

// 전역 함수 등록
window.handleInicisResult = handleInicisResult;
window.processMobilePayment = processMobilePayment;
window.processPayment = processPayment;
window.processVirtualAccount = processVirtualAccount;
window.closeVirtualAccountModal = closeVirtualAccountModal;
window.applyCoupon = applyCoupon;
window.usePoints = usePoints;
