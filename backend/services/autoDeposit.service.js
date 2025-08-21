const Deposit = require('../models/Deposit');
const User = require('../models/User');
const logger = require('../utils/logger');
const websocketService = require('./websocket.service');

class AutoDepositService {
    constructor() {
        this.checkInterval = null;
        this.isRunning = false;
    }

    /**
     * 자동 입금 확인 서비스 시작
     */
    start() {
        if (this.isRunning) {
            logger.info('Auto deposit service is already running');
            return;
        }

        // 개발/테스트 모드에서 자동 입금 확인 활성화
        const autoConfirmEnabled = process.env.AUTO_CONFIRM_DEPOSITS === 'true';
        const checkIntervalMinutes = parseInt(process.env.DEPOSIT_CHECK_INTERVAL) || 1; // 기본 1분

        if (!autoConfirmEnabled) {
            logger.info('Auto deposit confirmation is disabled');
            return;
        }

        logger.info(`Starting auto deposit service (interval: ${checkIntervalMinutes} minutes)`);

        // 주기적으로 체크
        this.checkInterval = setInterval(async () => {
            await this.checkPendingDeposits();
        }, checkIntervalMinutes * 60 * 1000);

        // 시작 시 즉시 한 번 실행
        this.checkPendingDeposits();

        this.isRunning = true;
        logger.info('Auto deposit service started');
    }

    /**
     * 서비스 중지
     */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isRunning = false;
        logger.info('Auto deposit service stopped');
    }

    /**
     * 대기 중인 입금 확인 및 자동 처리
     */
    async checkPendingDeposits() {
        try {
            // 테스트 모드 확인
            const isTestMode = process.env.NODE_ENV !== 'production' || process.env.TEST_MODE === 'true';
            const autoConfirmDelay = parseInt(process.env.AUTO_CONFIRM_DELAY) || 30; // 기본 30초

            // pending 상태인 입금 조회
            const pendingDeposits = await Deposit.find({
                status: 'pending',
                method: 'bank_transfer'
            }).populate('user');

            logger.info(`Found ${pendingDeposits.length} pending deposits`);

            for (const deposit of pendingDeposits) {
                try {
                    // 입금 요청 후 일정 시간이 지났는지 확인
                    const timeSinceRequest = Date.now() - new Date(deposit.createdAt).getTime();
                    const delayMillis = autoConfirmDelay * 1000;

                    if (timeSinceRequest >= delayMillis) {
                        // 자동 승인 처리
                        await this.confirmDeposit(deposit);
                        logger.info(`Auto-confirmed deposit: ${deposit._id} for user ${deposit.user.email}`);
                    } else {
                        const remainingSeconds = Math.floor((delayMillis - timeSinceRequest) / 1000);
                        logger.info(`Deposit ${deposit._id} will be auto-confirmed in ${remainingSeconds} seconds`);
                    }
                } catch (error) {
                    logger.error(`Failed to auto-confirm deposit ${deposit._id}:`, error);
                }
            }
        } catch (error) {
            logger.error('Error checking pending deposits:', error);
        }
    }

    /**
     * 입금 확인 처리
     */
    async confirmDeposit(deposit) {
        try {
            // 이미 처리된 경우 스킵
            if (deposit.status !== 'pending') {
                return;
            }

            // 상태 업데이트
            deposit.status = 'completed';
            deposit.completedAt = new Date();
            deposit.confirmedBy = 'auto_system';
            deposit.confirmNote = '자동 확인 시스템';
            await deposit.save();

            // 사용자 잔액 업데이트
            const user = await User.findById(deposit.user._id || deposit.user);
            if (user) {
                const oldBalance = user.depositBalance || 0;
                const newBalance = oldBalance + deposit.finalAmount;
                
                user.depositBalance = newBalance;
                await user.save();

                logger.info(`Updated balance for user ${user.email}: ${oldBalance} -> ${newBalance}`);

                // WebSocket으로 실시간 알림
                websocketService.notifyDepositComplete(user._id.toString(), {
                    amount: deposit.amount,
                    bonusAmount: deposit.bonusAmount || 0,
                    finalAmount: deposit.finalAmount,
                    newBalance: newBalance
                });

                // 잔액 업데이트 알림
                websocketService.notifyBalanceUpdate(user._id.toString(), newBalance);

                // 이메일 알림 (선택사항)
                await this.sendDepositNotification(user, deposit);
            }

            return {
                success: true,
                message: '입금이 자동으로 확인되었습니다.',
                deposit: deposit
            };
        } catch (error) {
            logger.error('Failed to confirm deposit:', error);
            throw error;
        }
    }

    /**
     * 입금 완료 알림 발송
     */
    async sendDepositNotification(user, deposit) {
        try {
            // 이메일 알림이 활성화된 경우에만
            if (process.env.EMAIL_NOTIFICATIONS === 'true') {
                const emailContent = `
                    안녕하세요 ${user.name || user.username}님,
                    
                    예치금 충전이 완료되었습니다.
                    
                    충전 금액: ${deposit.amount.toLocaleString()}원
                    보너스 금액: ${(deposit.bonusAmount || 0).toLocaleString()}원
                    최종 충전 금액: ${deposit.finalAmount.toLocaleString()}원
                    
                    현재 예치금 잔액: ${user.depositBalance.toLocaleString()}원
                    
                    감사합니다.
                    MarketGrow 팀
                `;
                
                logger.info(`Deposit notification sent to ${user.email}`);
            }
        } catch (error) {
            logger.error('Failed to send deposit notification:', error);
        }
    }

    /**
     * 수동으로 특정 입금 확인
     */
    async manualConfirm(depositId) {
        try {
            const deposit = await Deposit.findById(depositId).populate('user');
            if (!deposit) {
                throw new Error('입금 요청을 찾을 수 없습니다.');
            }

            if (deposit.status !== 'pending') {
                throw new Error('이미 처리된 입금 요청입니다.');
            }

            return await this.confirmDeposit(deposit);
        } catch (error) {
            logger.error('Manual confirm failed:', error);
            throw error;
        }
    }

    /**
     * 테스트용 - 모든 대기 중인 입금 즉시 승인
     */
    async confirmAllPending() {
        if (process.env.NODE_ENV === 'production' && process.env.FORCE_CONFIRM !== 'true') {
            throw new Error('This operation is not allowed in production');
        }

        try {
            const pendingDeposits = await Deposit.find({
                status: 'pending'
            }).populate('user');

            const results = [];
            for (const deposit of pendingDeposits) {
                try {
                    const result = await this.confirmDeposit(deposit);
                    results.push(result);
                } catch (error) {
                    logger.error(`Failed to confirm deposit ${deposit._id}:`, error);
                }
            }

            logger.info(`Confirmed ${results.length} deposits`);
            return {
                success: true,
                confirmed: results.length,
                total: pendingDeposits.length
            };
        } catch (error) {
            logger.error('Confirm all pending failed:', error);
            throw error;
        }
    }

    /**
     * 서비스 상태 확인
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            autoConfirmEnabled: process.env.AUTO_CONFIRM_DEPOSITS === 'true',
            checkInterval: process.env.DEPOSIT_CHECK_INTERVAL || '1',
            autoConfirmDelay: process.env.AUTO_CONFIRM_DELAY || '30',
            testMode: process.env.NODE_ENV !== 'production' || process.env.TEST_MODE === 'true'
        };
    }
}

// 싱글톤 인스턴스
const autoDepositService = new AutoDepositService();

module.exports = autoDepositService;