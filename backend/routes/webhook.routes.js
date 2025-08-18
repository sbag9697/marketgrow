const express = require('express');
const router = express.Router();
const VirtualAccountService = require('../services/virtualAccount.service');
const OpenBankingService = require('../services/openbanking.service');
const { getInstance: getScheduler } = require('../services/depositScheduler');
const logger = require('../utils/logger');

const virtualAccountService = new VirtualAccountService();
const openBankingService = new OpenBankingService();

/**
 * 토스페이먼츠 Webhook 엔드포인트
 * POST /api/webhook/toss-payments
 */
router.post('/toss-payments', async (req, res) => {
    try {
        logger.info('Toss Payments webhook received:', req.body);

        // 서명 검증 (프로덕션에서 필수)
        if (process.env.NODE_ENV === 'production') {
            const signature = req.headers['toss-signature'];
            if (!signature || !virtualAccountService.verifyWebhookSignature(req.body, signature)) {
                logger.warn('Invalid webhook signature');
                return res.status(401).json({ success: false, message: 'Invalid signature' });
            }
        }

        // Webhook 데이터 처리
        const result = await virtualAccountService.handleWebhook(req.body);

        // 토스페이먼츠는 200 OK를 기대
        res.status(200).json(result);
    } catch (error) {
        logger.error('Webhook processing error:', error);
        // 에러가 발생해도 200을 반환하여 재시도 방지
        res.status(200).json({ success: false, error: error.message });
    }
});

/**
 * 테스트용 - 수동 입금 확인 (개발 환경에서만)
 * POST /api/webhook/test-deposit/:depositId
 */
router.post('/test-deposit/:depositId', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                message: 'This endpoint is only available in development mode'
            });
        }

        const result = await virtualAccountService.simulateDeposit(req.params.depositId);

        res.json({
            success: true,
            message: 'Test deposit completed',
            data: result
        });
    } catch (error) {
        logger.error('Test deposit error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * 오픈뱅킹 입금 알림 Webhook
 * POST /api/webhook/openbanking
 */
router.post('/openbanking', async (req, res) => {
    try {
        logger.info('OpenBanking webhook received:', req.body);

        // 농협 오픈뱅킹 API 서명 검증
        const signature = req.headers['x-signature'];
        if (process.env.NODE_ENV === 'production' && !signature) {
            return res.status(401).json({ success: false, message: 'Missing signature' });
        }

        // 입금 처리
        const { tran_amt, print_content, tran_date, tran_time } = req.body;
        
        if (req.body.inout_type === '입금') {
            await openBankingService.processDeposit({
                tran_amt,
                print_content,
                tran_date,
                tran_time,
                inout_type: '입금'
            });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        logger.error('OpenBanking webhook error:', error);
        res.status(200).json({ success: false }); // 재시도 방지
    }
});

/**
 * 수동 입금 확인 트리거 (관리자용)
 * POST /api/webhook/check-deposits
 */
router.post('/check-deposits', async (req, res) => {
    try {
        // 관리자 권한 체크 (선택)
        const authToken = req.headers.authorization;
        if (!authToken || !authToken.includes(process.env.ADMIN_SECRET)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const scheduler = getScheduler();
        const count = await scheduler.checkNow();

        res.json({
            success: true,
            message: `입금 확인 완료: ${count}건 처리`,
            processed: count
        });
    } catch (error) {
        logger.error('Manual deposit check error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * 스케줄러 상태 확인
 * GET /api/webhook/scheduler-status
 */
router.get('/scheduler-status', async (req, res) => {
    try {
        const scheduler = getScheduler();
        const status = scheduler.getStatus();
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        logger.error('Scheduler status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
