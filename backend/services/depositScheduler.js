const cron = require('node-cron');
const OpenBankingService = require('./openbanking.service');
const logger = require('../utils/logger');

class DepositScheduler {
    constructor() {
        this.openBankingService = new OpenBankingService();
        this.tasks = [];
        this.isRunning = false;
    }

    /**
     * 스케줄러 시작
     */
    start() {
        if (this.isRunning) {
            logger.warn('Deposit scheduler is already running');
            return;
        }

        // 오픈뱅킹 API 활성화 체크
        if (!process.env.OPENBANKING_CLIENT_ID || !process.env.NH_FINTECH_USE_NUM) {
            logger.warn('OpenBanking API not configured. Deposit auto-check disabled.');
            return;
        }

        logger.info('Starting deposit scheduler...');

        // 1. 실시간 체크 (5분마다)
        const realtimeTask = cron.schedule('*/5 * * * *', async () => {
            logger.info('Running realtime deposit check...');
            try {
                const count = await this.openBankingService.checkAndProcessDeposits();
                if (count > 0) {
                    logger.info(`Processed ${count} deposits in realtime check`);
                }
            } catch (error) {
                logger.error('Realtime deposit check failed:', error);
            }
        });

        // 2. 정기 체크 (매시 정각)
        const hourlyTask = cron.schedule('0 * * * *', async () => {
            logger.info('Running hourly deposit check...');
            try {
                const count = await this.openBankingService.checkAndProcessDeposits();
                logger.info(`Hourly check completed. Processed ${count} deposits`);
            } catch (error) {
                logger.error('Hourly deposit check failed:', error);
            }
        });

        // 3. 일일 정산 (매일 자정)
        const dailyTask = cron.schedule('0 0 * * *', async () => {
            logger.info('Running daily deposit reconciliation...');
            try {
                await this.reconcileDeposits();
            } catch (error) {
                logger.error('Daily reconciliation failed:', error);
            }
        });

        this.tasks = [realtimeTask, hourlyTask, dailyTask];
        this.isRunning = true;

        // 시작 시 즉시 한 번 실행
        this.checkNow();

        logger.info('Deposit scheduler started successfully');
    }

    /**
     * 스케줄러 중지
     */
    stop() {
        if (!this.isRunning) {
            return;
        }

        logger.info('Stopping deposit scheduler...');
        
        this.tasks.forEach(task => task.stop());
        this.tasks = [];
        this.isRunning = false;

        logger.info('Deposit scheduler stopped');
    }

    /**
     * 즉시 확인 (수동 트리거)
     */
    async checkNow() {
        try {
            logger.info('Manual deposit check triggered');
            const count = await this.openBankingService.checkAndProcessDeposits();
            logger.info(`Manual check completed. Processed ${count} deposits`);
            return count;
        } catch (error) {
            logger.error('Manual deposit check failed:', error);
            throw error;
        }
    }

    /**
     * 일일 정산 (미확인 입금 처리)
     */
    async reconcileDeposits() {
        try {
            const Deposit = require('../models/Deposit');
            
            // 24시간 이상 pending 상태인 요청 확인
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const expiredDeposits = await Deposit.find({
                status: 'pending',
                createdAt: { $lt: yesterday }
            });

            for (const deposit of expiredDeposits) {
                // 만료 처리
                deposit.status = 'expired';
                deposit.expiredAt = new Date();
                await deposit.save();
                
                logger.info(`Expired deposit request: ${deposit._id}`);
            }

            // unmatched 입금 재확인
            const unmatchedDeposits = await Deposit.find({
                status: 'unmatched'
            });

            logger.info(`Daily reconciliation: ${expiredDeposits.length} expired, ${unmatchedDeposits.length} unmatched`);

            // 관리자에게 알림 (unmatched가 있는 경우)
            if (unmatchedDeposits.length > 0) {
                await this.notifyAdmin(unmatchedDeposits);
            }
        } catch (error) {
            logger.error('Reconciliation failed:', error);
            throw error;
        }
    }

    /**
     * 관리자 알림
     */
    async notifyAdmin(unmatchedDeposits) {
        try {
            const emailService = require('./email.service');
            const emailClient = new emailService();
            
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@marketgrow.kr';
            
            const depositList = unmatchedDeposits.map(d => 
                `- ${d.depositorName}: ${d.amount.toLocaleString()}원 (${new Date(d.createdAt).toLocaleDateString()})`
            ).join('\n');

            await emailClient.sendEmail(adminEmail, 
                '[MarketGrow] 미확인 입금 내역 알림',
                `다음 입금 내역이 자동 매칭되지 않았습니다:\n\n${depositList}\n\n관리자 페이지에서 확인해주세요.`
            );

            logger.info('Admin notified about unmatched deposits');
        } catch (error) {
            logger.error('Failed to notify admin:', error);
        }
    }

    /**
     * 스케줄러 상태 확인
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            tasks: this.tasks.length,
            nextCheck: this.isRunning ? '5분 이내' : 'N/A'
        };
    }
}

// 싱글톤 인스턴스
let schedulerInstance = null;

module.exports = {
    getInstance: () => {
        if (!schedulerInstance) {
            schedulerInstance = new DepositScheduler();
        }
        return schedulerInstance;
    },
    DepositScheduler
};