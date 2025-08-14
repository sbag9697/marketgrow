const express = require('express');
const router = express.Router();
const VirtualAccountService = require('../services/virtualAccount.service');
const logger = require('../utils/logger');

const virtualAccountService = new VirtualAccountService();

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

module.exports = router;