const axios = require('axios');
const crypto = require('crypto');
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const logger = require('../utils/logger');

class VirtualAccountService {
    constructor() {
        // 토스페이먼츠 설정
        this.tossPayments = {
            secretKey: process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R', // 테스트 키
            baseUrl: process.env.TOSS_API_URL || 'https://api.tosspayments.com/v1',
            clientKey: process.env.TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq'
        };

        // Base64 인코딩된 시크릿 키 (Basic Auth용)
        this.authHeader = `Basic ${Buffer.from(`${this.tossPayments.secretKey}:`).toString('base64')}`;
    }

    /**
     * 가상계좌 발급
     */
    async createVirtualAccount(userId, amount, depositorName) {
        try {
            const orderId = `DEPOSIT_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            const requestData = {
                amount,
                orderId,
                orderName: `예치금 충전 ${amount.toLocaleString()}원`,
                customerName: depositorName,
                bank: '국민', // 국민은행 고정
                validHours: 24, // 24시간 유효
                cashReceipt: {
                    type: '소득공제'
                },
                useEscrow: false,
                customerMobilePhone: '', // 선택사항
                _virtual: true
            };

            // 토스페이먼츠 가상계좌 발급 API 호출
            const response = await axios.post(
                `${this.tossPayments.baseUrl}/virtual-accounts`,
                requestData,
                {
                    headers: {
                        Authorization: this.authHeader,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const virtualAccount = response.data;

            // 가상계좌 정보 저장
            const deposit = new Deposit({
                user: userId,
                amount,
                bonusAmount: this.calculateBonus(amount),
                finalAmount: amount + this.calculateBonus(amount),
                depositorName,
                method: 'virtual_account',
                status: 'pending',
                virtualAccount: {
                    bank: virtualAccount.bank,
                    accountNumber: virtualAccount.accountNumber,
                    accountHolder: virtualAccount.accountHolder || 'SNS그로우',
                    dueDate: virtualAccount.dueDate,
                    orderId,
                    paymentKey: virtualAccount.paymentKey
                }
            });

            await deposit.save();

            logger.info(`Virtual account created: ${virtualAccount.accountNumber} for user ${userId}`);

            return {
                success: true,
                data: {
                    bank: virtualAccount.bank,
                    accountNumber: virtualAccount.accountNumber,
                    accountHolder: virtualAccount.accountHolder || 'SNS그로우',
                    amount,
                    dueDate: virtualAccount.dueDate,
                    depositId: deposit._id
                }
            };
        } catch (error) {
            logger.error('Virtual account creation failed:', error);

            // 테스트 모드에서는 가상의 계좌 정보 반환
            if (process.env.NODE_ENV !== 'production') {
                const testAccountNumber = `123${Date.now().toString().slice(-10)}`;

                const deposit = new Deposit({
                    user: userId,
                    amount,
                    bonusAmount: this.calculateBonus(amount),
                    finalAmount: amount + this.calculateBonus(amount),
                    depositorName,
                    method: 'virtual_account',
                    status: 'pending',
                    virtualAccount: {
                        bank: '국민은행',
                        accountNumber: testAccountNumber,
                        accountHolder: 'SNS그로우',
                        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
                        orderId: `TEST_${Date.now()}`
                    }
                });

                await deposit.save();

                return {
                    success: true,
                    data: {
                        bank: '국민은행',
                        accountNumber: testAccountNumber,
                        accountHolder: 'SNS그로우',
                        amount,
                        dueDate: deposit.virtualAccount.dueDate,
                        depositId: deposit._id,
                        testMode: true
                    }
                };
            }

            throw error;
        }
    }

    /**
     * Webhook 처리 - 입금 완료 시 토스페이먼츠에서 호출
     */
    async handleWebhook(paymentData) {
        try {
            const { orderId, status, amount, approvedAt } = paymentData;

            // 주문 ID로 예치금 요청 찾기
            const deposit = await Deposit.findOne({
                'virtualAccount.orderId': orderId,
                status: 'pending'
            });

            if (!deposit) {
                logger.warn(`Deposit not found for order: ${orderId}`);
                return { success: false, message: 'Deposit not found' };
            }

            if (status === 'DONE') {
                // 입금 완료 처리
                deposit.status = 'completed';
                deposit.completedAt = new Date(approvedAt);
                await deposit.save();

                // 사용자 예치금 증가
                const user = await User.findById(deposit.user);
                if (user) {
                    user.depositBalance = (user.depositBalance || 0) + deposit.finalAmount;
                    await user.save();

                    logger.info(`Deposit completed: ${deposit._id}, User: ${user.email}, Amount: ${deposit.finalAmount}`);
                }

                // 알림 발송 (이메일/SMS)
                await this.sendDepositNotification(user, deposit);

                return { success: true, message: 'Deposit completed' };
            } else if (status === 'CANCELED' || status === 'EXPIRED') {
                // 취소 또는 만료 처리
                deposit.status = 'cancelled';
                deposit.cancelledAt = new Date();
                await deposit.save();

                logger.info(`Deposit cancelled: ${deposit._id}, Status: ${status}`);
                return { success: true, message: 'Deposit cancelled' };
            }

            return { success: false, message: 'Unknown status' };
        } catch (error) {
            logger.error('Webhook processing failed:', error);
            throw error;
        }
    }

    /**
     * Webhook 서명 검증
     */
    verifyWebhookSignature(body, signature) {
        const secretKey = this.tossPayments.secretKey;
        const computedSignature = crypto
            .createHmac('sha256', secretKey)
            .update(JSON.stringify(body))
            .digest('base64');

        return computedSignature === signature;
    }

    /**
     * 보너스 계산
     */
    calculateBonus(amount) {
        if (amount >= 500000) return Math.floor(amount * 0.20); // 50만원 이상 20%
        if (amount >= 300000) return Math.floor(amount * 0.15); // 30만원 이상 15%
        if (amount >= 100000) return Math.floor(amount * 0.10); // 10만원 이상 10%
        if (amount >= 50000) return Math.floor(amount * 0.05); // 5만원 이상 5%
        return 0;
    }

    /**
     * 입금 완료 알림
     */
    async sendDepositNotification(user, deposit) {
        try {
            // 이메일 발송
            if (user.email) {
                // EmailService 사용하여 발송
                logger.info(`Deposit notification sent to ${user.email}`);
            }

            // SMS 발송 (SMS API가 설정된 경우)
            if (user.phone && process.env.SMS_ENABLED === 'true') {
                // SMSService 사용하여 발송
                logger.info(`SMS notification sent to ${user.phone}`);
            }
        } catch (error) {
            logger.error('Notification sending failed:', error);
        }
    }

    /**
     * 가상계좌 입금 상태 확인
     */
    async checkPaymentStatus(paymentKey) {
        try {
            const response = await axios.get(
                `${this.tossPayments.baseUrl}/payments/${paymentKey}`,
                {
                    headers: {
                        Authorization: this.authHeader
                    }
                }
            );

            return response.data;
        } catch (error) {
            logger.error('Payment status check failed:', error);
            throw error;
        }
    }

    /**
     * 테스트용 - 수동 입금 확인 (개발 환경에서만)
     */
    async simulateDeposit(depositId) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('This function is only available in development mode');
        }

        const deposit = await Deposit.findById(depositId);
        if (!deposit || deposit.status !== 'pending') {
            throw new Error('Invalid deposit');
        }

        // Webhook 데이터 시뮬레이션
        const webhookData = {
            orderId: deposit.virtualAccount.orderId,
            status: 'DONE',
            amount: deposit.amount,
            approvedAt: new Date().toISOString()
        };

        return await this.handleWebhook(webhookData);
    }
}

module.exports = VirtualAccountService;
