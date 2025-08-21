const cron = require('node-cron');
const OpenBankingService = require('./openbanking.service');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class DepositScheduler {
    constructor() {
        this.openBankingService = new OpenBankingService();
        this.tasks = [];
        this.isRunning = false;
        this.isChecking = false; // 중복 실행 방지
        this.lastCheckTime = null;
        this.checkStats = {
            total: 0,
            success: 0,
            errors: 0,
            lastError: null
        };
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

        // 1. 실시간 체크 (5분마다) - 멱등성 보장
        const realtimeTask = cron.schedule('*/5 * * * *', async () => {
            await this.safeCheckDeposits('scheduled_5min');
        });

        // 2. 정기 체크 (매시 정각) - 보조 안전망
        const hourlyTask = cron.schedule('0 * * * *', async () => {
            await this.safeCheckDeposits('scheduled_hourly');
        });

        // 3. 일일 정산 (매일 자정)
        const dailyTask = cron.schedule('0 0 * * *', async () => {
            await this.safeDailyReconciliation();
        });

        this.tasks = [realtimeTask, hourlyTask, dailyTask];
        this.isRunning = true;

        // 시작 시 즉시 한 번 실행 (비동기)
        setTimeout(() => this.checkNow(), 1000);

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
     * 안전한 입금 확인 (멱등성 보장)
     */
    async safeCheckDeposits(triggerType = 'manual') {
        const checkId = uuidv4();
        
        try {
            // 이미 실행 중인 경우 스킵
            if (this.isChecking) {
                logger.warn('Deposit check already in progress, skipping', {
                    triggerType: triggerType,
                    checkId: checkId,
                    service: 'depositScheduler',
                    action: 'check_skipped'
                });
                return 0;
            }

            // 최근 1분 이내에 체크한 경우 스킵 (너무 빈번한 실행 방지)
            if (this.lastCheckTime && (Date.now() - this.lastCheckTime) < 60000) {
                logger.info('Recent check detected, skipping', {
                    triggerType: triggerType,
                    checkId: checkId,
                    lastCheck: new Date(this.lastCheckTime),
                    service: 'depositScheduler',
                    action: 'recent_check_skip'
                });
                return 0;
            }

            this.isChecking = true;
            this.lastCheckTime = Date.now();
            this.checkStats.total++;

            logger.info('Starting deposit check', {
                triggerType: triggerType,
                checkId: checkId,
                service: 'depositScheduler',
                action: 'check_start'
            });

            const count = await this.openBankingService.checkAndProcessDeposits();
            this.checkStats.success++;

            logger.info('Deposit check completed', {
                triggerType: triggerType,
                checkId: checkId,
                processedCount: count,
                service: 'depositScheduler',
                action: 'check_success'
            });

            return count;
        } catch (error) {
            this.checkStats.errors++;
            this.checkStats.lastError = {
                message: error.message,
                time: new Date(),
                triggerType: triggerType
            };

            logger.error('Deposit check failed:', {
                error: error.message,
                triggerType: triggerType,
                checkId: checkId,
                service: 'depositScheduler',
                action: 'check_failed'
            });
            
            throw error;
        } finally {
            this.isChecking = false;
        }
    }

    /**
     * 즉시 확인 (수동 트리거)
     */
    async checkNow() {
        return await this.safeCheckDeposits('manual');
    }

    /**
     * 안전한 일일 정산
     */
    async safeDailyReconciliation() {
        const reconciliationId = uuidv4();
        
        try {
            logger.info('Starting daily reconciliation', {
                reconciliationId: reconciliationId,
                service: 'depositScheduler',
                action: 'reconciliation_start'
            });

            await this.reconcileDeposits();

            logger.info('Daily reconciliation completed', {
                reconciliationId: reconciliationId,
                service: 'depositScheduler',
                action: 'reconciliation_success'
            });
        } catch (error) {
            logger.error('Daily reconciliation failed:', {
                error: error.message,
                reconciliationId: reconciliationId,
                service: 'depositScheduler',
                action: 'reconciliation_failed'
            });
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
     * 스케줄러 상태 확인 (상세 정보 포함)
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            isChecking: this.isChecking,
            tasks: this.tasks.length,
            lastCheckTime: this.lastCheckTime ? new Date(this.lastCheckTime) : null,
            nextCheck: this.isRunning ? '5분 이내' : 'N/A',
            statistics: {
                totalChecks: this.checkStats.total,
                successfulChecks: this.checkStats.success,
                errors: this.checkStats.errors,
                successRate: this.checkStats.total > 0 ? 
                    Math.round((this.checkStats.success / this.checkStats.total) * 100) + '%' : 'N/A',
                lastError: this.checkStats.lastError
            },
            health: {
                status: this.isRunning ? 'healthy' : 'stopped',
                lastActivity: this.lastCheckTime ? 
                    Math.round((Date.now() - this.lastCheckTime) / 1000 / 60) + ' minutes ago' : 'never'
            }
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