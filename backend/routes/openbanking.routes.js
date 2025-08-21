const express = require('express');
const router = express.Router();
const OpenBankingService = require('../services/openbanking.service');
const { getInstance: getScheduler } = require('../services/depositScheduler');
const logger = require('../utils/logger');

const openBankingService = new OpenBankingService();

/**
 * 오픈뱅킹 OAuth 콜백 (Redirect URI)
 * GET /api/openbanking/callback
 */
router.get('/callback', async (req, res) => {
    try {
        const { code, state, error, error_description } = req.query;

        logger.info('OpenBanking OAuth callback received', {
            service: 'openbanking',
            action: 'oauth_callback',
            code: code ? 'present' : 'missing',
            state: state,
            error: error,
            queryParams: req.query
        });

        // 에러 처리
        if (error) {
            logger.error('OpenBanking OAuth error', {
                service: 'openbanking',
                action: 'oauth_error',
                error: error,
                errorDescription: error_description
            });

            return res.status(400).json({
                success: false,
                error: error,
                description: error_description
            });
        }

        // Authorization Code가 없는 경우
        if (!code) {
            logger.warn('Missing authorization code in callback');
            return res.status(400).json({
                success: false,
                message: 'Authorization code is required'
            });
        }

        // 상태값 검증 (CSRF 방지)
        if (state && state !== process.env.OPENBANKING_STATE) {
            logger.warn('Invalid state parameter', { receivedState: state });
            return res.status(400).json({
                success: false,
                message: 'Invalid state parameter'
            });
        }

        // Authorization Code를 Access Token으로 교환
        const tokenData = await openBankingService.exchangeCodeForToken(code);

        // 성공 페이지로 리다이렉트 또는 JSON 응답
        if (req.query.format === 'json') {
            res.json({
                success: true,
                message: 'OpenBanking 연동이 완료되었습니다.',
                data: {
                    tokenType: tokenData.token_type,
                    expiresIn: tokenData.expires_in,
                    scope: tokenData.scope
                }
            });
        } else {
            // HTML 페이지로 리다이렉트
            res.redirect('/admin-setup.html?openbanking=success');
        }

    } catch (error) {
        logger.error('OpenBanking callback processing error:', {
            error: error.message,
            service: 'openbanking',
            action: 'callback_processing_failed'
        });

        if (req.query.format === 'json') {
            res.status(500).json({
                success: false,
                message: error.message
            });
        } else {
            res.redirect('/admin-setup.html?openbanking=error');
        }
    }
});

/**
 * 오픈뱅킹 계좌 정보 조회
 * GET /api/openbanking/account/info
 */
router.get('/account/info', async (req, res) => {
    try {
        // 관리자 권한 체크
        const authToken = req.headers.authorization;
        if (!authToken || !authToken.includes(process.env.ADMIN_SECRET)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const balance = await openBankingService.getAccountBalance();

        res.json({
            success: true,
            data: balance
        });
    } catch (error) {
        logger.error('Account info error:', {
            error: error.message,
            service: 'openbanking',
            action: 'account_info_failed'
        });
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * 오픈뱅킹 거래내역 조회
 * GET /api/openbanking/transactions
 */
router.get('/transactions', async (req, res) => {
    try {
        // 관리자 권한 체크
        const authToken = req.headers.authorization;
        if (!authToken || !authToken.includes(process.env.ADMIN_SECRET)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { fromDate, toDate } = req.query;
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;

        const transactions = await openBankingService.getTransactionHistory(from, to);

        res.json({
            success: true,
            data: transactions,
            count: transactions.length
        });
    } catch (error) {
        logger.error('Transaction history error:', {
            error: error.message,
            service: 'openbanking',
            action: 'transaction_history_failed'
        });
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * 수동 입금 확인 트리거 (관리자용)
 * POST /api/openbanking/check-deposits
 */
router.post('/check-deposits', async (req, res) => {
    try {
        // 관리자 권한 체크
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
        logger.error('Manual deposit check error:', {
            error: error.message,
            service: 'openbanking',
            action: 'manual_check_failed'
        });
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * 스케줄러 상태 확인
 * GET /api/openbanking/scheduler-status
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
        logger.error('Scheduler status error:', {
            error: error.message,
            service: 'openbanking',
            action: 'scheduler_status_failed'
        });
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * 오픈뱅킹 연동 테스트
 * GET /api/openbanking/test
 */
router.get('/test', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                message: 'This endpoint is only available in development mode'
            });
        }

        // 토큰 발급 테스트
        const token = await openBankingService.getAccessToken();
        
        // 계좌 잔액 조회 테스트
        const balance = await openBankingService.getAccountBalance();

        res.json({
            success: true,
            message: 'OpenBanking connection test successful',
            data: {
                tokenExists: !!token,
                balance: balance
            }
        });
    } catch (error) {
        logger.error('OpenBanking test error:', {
            error: error.message,
            service: 'openbanking',
            action: 'connection_test_failed'
        });
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * 오픈뱅킹 웹훅 엔드포인트 (실시간 알림용 - 미래 확장)
 * POST /api/openbanking/webhook
 */
router.post('/webhook', async (req, res) => {
    try {
        logger.info('OpenBanking webhook received:', {
            body: req.body,
            headers: req.headers,
            service: 'openbanking',
            action: 'webhook_received'
        });

        // 농협 오픈뱅킹 API 서명 검증
        const signature = req.headers['x-signature'];
        if (process.env.NODE_ENV === 'production' && !signature) {
            logger.warn('Missing webhook signature');
            return res.status(401).json({ success: false, message: 'Missing signature' });
        }

        // 실시간 입금 알림 처리 (농협에서 지원하는 경우)
        const { tran_amt, print_content, tran_date, tran_time, inout_type } = req.body;
        
        if (inout_type === '입금' || inout_type === 'I') {
            await openBankingService.processDeposit({
                tran_amt,
                print_content,
                tran_date,
                tran_time,
                inout_type: '입금'
            });

            logger.info('Webhook deposit processed', {
                amount: tran_amt,
                depositor: print_content,
                service: 'openbanking',
                action: 'webhook_deposit_processed'
            });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        logger.error('OpenBanking webhook error:', {
            error: error.message,
            service: 'openbanking',
            action: 'webhook_processing_failed'
        });
        
        // 재시도 방지를 위해 200 응답
        res.status(200).json({ success: false });
    }
});

module.exports = router;