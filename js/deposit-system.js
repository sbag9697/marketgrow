// 예치금 시스템
const API_URL = 'https://marketgrow-production.up.railway.app/api';

class DepositSystem {
    constructor() {
        this.balance = 0;
        this.transactions = [];
        this.bonusRates = {
            50000: 0.05, // 5% 보너스
            100000: 0.10, // 10% 보너스
            300000: 0.15, // 15% 보너스
            500000: 0.20 // 20% 보너스
        };
        this.init();
    }

    // 초기화
    async init() {
        await this.loadBalance();
        await this.loadTransactions();
    }

    // 잔액 조회
    async loadBalance() {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/users/balance`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.balance = data.balance || 0;
                this.updateBalanceDisplay();
            }
        } catch (error) {
            console.error('잔액 조회 오류:', error);
            // 로컬 스토리지에서 로드
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            this.balance = userInfo.balance || 0;
            this.updateBalanceDisplay();
        }
    }

    // 거래 내역 조회
    async loadTransactions() {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/transactions`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.transactions = data.transactions || [];
                this.updateTransactionDisplay();
            }
        } catch (error) {
            console.error('거래 내역 조회 오류:', error);
            // 로컬 스토리지에서 로드
            this.transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            this.updateTransactionDisplay();
        }
    }

    // 충전 요청
    async requestDeposit(amount, method) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('로그인이 필요합니다.');
            window.location.href = '/login.html';
            return;
        }

        // 보너스 계산
        const bonus = this.calculateBonus(amount);
        const totalAmount = amount + bonus;

        const depositData = {
            amount,
            bonusAmount: bonus,
            totalAmount,
            method,
            status: method === 'bank' ? 'pending' : 'processing'
        };

        try {
            const response = await fetch(`${API_URL}/deposits/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(depositData)
            });

            const data = await response.json();

            if (data.success) {
                if (method === 'bank') {
                    // 무통장 입금 안내
                    this.showBankTransferInfo(data.depositInfo);
                } else if (method === 'card' || method === 'transfer') {
                    // 결제창 호출
                    this.processPayment(data.paymentData);
                }
                return data;
            } else {
                throw new Error(data.message || '충전 요청 실패');
            }
        } catch (error) {
            console.error('충전 요청 오류:', error);

            // 임시 처리 (백엔드 없을 때)
            if (method === 'bank') {
                this.showBankTransferInfo({
                    amount,
                    bonus,
                    total: totalAmount,
                    bankName: '국민은행',
                    accountNumber: '123-456-789012',
                    accountHolder: 'SNS그로우(박시현)',
                    depositId: `DEP${Date.now()}`
                });
            } else {
                alert('온라인 결제는 준비중입니다.\n무통장 입금을 이용해주세요.');
            }
        }
    }

    // 보너스 계산
    calculateBonus(amount) {
        let bonusRate = 0;

        for (const [threshold, rate] of Object.entries(this.bonusRates).reverse()) {
            if (amount >= parseInt(threshold)) {
                bonusRate = rate;
                break;
            }
        }

        return Math.floor(amount * bonusRate);
    }

    // 무통장 입금 정보 표시
    showBankTransferInfo(info) {
        const message = `
무통장 입금 신청이 완료되었습니다.

【입금 정보】
은행: ${info.bankName}
계좌번호: ${info.accountNumber}
예금주: ${info.accountHolder}
입금액: ₩${info.amount.toLocaleString()}
${info.bonus > 0 ? `보너스: +₩${info.bonus.toLocaleString()}` : ''}
총 충전액: ₩${info.total.toLocaleString()}

입금 확인 후 자동으로 충전됩니다.
(영업시간 기준 10분 이내)
        `;

        alert(message);

        // 거래 내역에 추가
        this.addTransaction({
            id: info.depositId,
            type: 'deposit',
            amount: info.amount,
            bonus: info.bonus,
            total: info.total,
            method: 'bank',
            status: 'pending',
            createdAt: new Date().toISOString()
        });
    }

    // 결제 처리 (KG이니시스)
    async processPayment(paymentData) {
        // KG이니시스 결제창 호출
        if (typeof INIStdPay !== 'undefined') {
            INIStdPay.pay({
                mid: paymentData.mid,
                orderNumber: paymentData.orderNumber,
                price: paymentData.price,
                goodsName: '예치금 충전',
                buyerName: paymentData.buyerName,
                buyerTel: paymentData.buyerTel,
                buyerEmail: paymentData.buyerEmail,
                returnUrl: `${window.location.origin}/deposit-complete.html`,
                closeUrl: `${window.location.origin}/deposit.html`
            });
        } else {
            alert('결제 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.');
        }
    }

    // 예치금 사용
    async useDeposit(amount, orderId, description) {
        if (this.balance < amount) {
            throw new Error('잔액이 부족합니다.');
        }

        const token = localStorage.getItem('authToken');

        try {
            const response = await fetch(`${API_URL}/deposits/use`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount,
                    orderId,
                    description
                })
            });

            const data = await response.json();

            if (data.success) {
                this.balance = data.newBalance;
                this.updateBalanceDisplay();

                // 거래 내역 추가
                this.addTransaction({
                    type: 'use',
                    amount,
                    orderId,
                    description,
                    balance: data.newBalance,
                    status: 'completed',
                    createdAt: new Date().toISOString()
                });

                return data;
            } else {
                throw new Error(data.message || '예치금 사용 실패');
            }
        } catch (error) {
            console.error('예치금 사용 오류:', error);
            throw error;
        }
    }

    // 거래 내역 추가
    addTransaction(transaction) {
        this.transactions.unshift(transaction);

        // 로컬 스토리지 업데이트
        localStorage.setItem('transactions', JSON.stringify(this.transactions));

        // 화면 업데이트
        this.updateTransactionDisplay();
    }

    // 잔액 표시 업데이트
    updateBalanceDisplay() {
        const elements = {
            currentBalance: document.getElementById('currentBalance'),
            depositBalance: document.getElementById('depositBalance'),
            userBalance: document.querySelector('.user-balance')
        };

        Object.values(elements).forEach(el => {
            if (el) {
                el.textContent = `₩${this.balance.toLocaleString()}`;
            }
        });

        // 사용자 정보 업데이트
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        userInfo.balance = this.balance;
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
    }

    // 거래 내역 표시 업데이트
    updateTransactionDisplay() {
        const tbody = document.getElementById('transactionHistory');
        if (!tbody) return;

        if (this.transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #94a3b8;">
                        거래 내역이 없습니다
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.transactions.map(tx => `
            <tr>
                <td>${new Date(tx.createdAt).toLocaleString()}</td>
                <td>${this.getTransactionTypeName(tx.type)}</td>
                <td class="${tx.type === 'deposit' ? 'amount-plus' : 'amount-minus'}">
                    ${tx.type === 'deposit' ? '+' : '-'}₩${tx.amount.toLocaleString()}
                    ${tx.bonus ? `<small>(+${tx.bonus.toLocaleString()})</small>` : ''}
                </td>
                <td>${this.getPaymentMethodName(tx.method)}</td>
                <td>
                    <span class="status-badge status-${tx.status}">
                        ${this.getStatusName(tx.status)}
                    </span>
                </td>
                <td>₩${(tx.balance || 0).toLocaleString()}</td>
            </tr>
        `).join('');
    }

    // 거래 유형 이름
    getTransactionTypeName(type) {
        const types = {
            deposit: '충전',
            use: '사용',
            refund: '환불',
            bonus: '보너스'
        };
        return types[type] || type;
    }

    // 결제 방법 이름
    getPaymentMethodName(method) {
        const methods = {
            bank: '무통장입금',
            card: '카드',
            transfer: '계좌이체',
            deposit: '예치금',
            point: '포인트'
        };
        return methods[method] || method;
    }

    // 상태 이름
    getStatusName(status) {
        const statuses = {
            completed: '완료',
            pending: '대기중',
            processing: '처리중',
            failed: '실패',
            cancelled: '취소'
        };
        return statuses[status] || status;
    }

    // 자동 충전 확인 (무통장 입금)
    async checkPendingDeposits() {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/deposits/check-pending`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();

                if (data.completed && data.completed.length > 0) {
                    data.completed.forEach(deposit => {
                        // 충전 완료 알림
                        this.showDepositCompleteNotification(deposit);

                        // 잔액 업데이트
                        this.balance = deposit.newBalance;
                        this.updateBalanceDisplay();
                    });

                    // 거래 내역 새로고침
                    await this.loadTransactions();
                }
            }
        } catch (error) {
            console.error('충전 확인 오류:', error);
        }
    }

    // 충전 완료 알림
    showDepositCompleteNotification(deposit) {
        const notification = new Notification('충전 완료', {
            body: `₩${deposit.totalAmount.toLocaleString()}이 충전되었습니다.`,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png'
        });

        notification.onclick = () => {
            window.focus();
            window.location.href = '/deposit.html';
        };
    }

    // 정기적으로 충전 확인 (30초마다)
    startAutoCheck() {
        setInterval(() => {
            this.checkPendingDeposits();
        }, 30000);
    }
}

// 전역 인스턴스 생성
const depositSystem = new DepositSystem();

// 자동 확인 시작
depositSystem.startAutoCheck();

// 전역 함수 등록
window.depositSystem = depositSystem;
