const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const BankTransferService = require('../services/bankTransfer.service');
const Deposit = require('../models/Deposit');
const logger = require('../utils/logger');

const bankTransferService = new BankTransferService();

/**
 * 무통장입금 계좌 정보 조회
 * GET /api/deposits/bank-accounts
 */
router.get('/bank-accounts', async (req, res) => {
    try {
        const accounts = bankTransferService.getActiveAccounts();
        
        res.json({
            success: true,
            data: accounts
        });
    } catch (error) {
        logger.error('Get bank accounts error:', error);
        res.status(500).json({
            success: false,
            message: '계좌 정보 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * 무통장입금 요청 생성
 * POST /api/deposits/bank-transfer
 */
router.post('/bank-transfer', auth, async (req, res) => {
    try {
        const { amount, depositorName, selectedBank } = req.body;

        // 유효성 검사
        if (!amount || amount < 10000) {
            return res.status(400).json({
                success: false,
                message: '최소 충전 금액은 10,000원입니다.'
            });
        }

        if (amount > 10000000) {
            return res.status(400).json({
                success: false,
                message: '최대 충전 금액은 10,000,000원입니다.'
            });
        }

        if (!depositorName) {
            return res.status(400).json({
                success: false,
                message: '입금자명을 입력해주세요.'
            });
        }

        // 무통장입금 요청 생성
        const result = await bankTransferService.createBankTransferRequest(
            req.user.id,
            amount,
            depositorName,
            selectedBank
        );

        logger.info(`Bank transfer request created for user ${req.user.email}, amount: ${amount}`);

        res.json({
            success: true,
            message: '무통장입금 요청이 생성되었습니다.',
            data: result.data
        });
    } catch (error) {
        logger.error('Bank transfer request error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '무통장입금 요청 중 오류가 발생했습니다.'
        });
    }
});

/**
 * 예치금 충전 내역 조회
 * GET /api/deposits
 */
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const query = { user: req.user.id };
        if (status) {
            query.status = status;
        }

        const deposits = await Deposit.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Deposit.countDocuments(query);

        res.json({
            success: true,
            data: {
                deposits,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        logger.error('Get deposits error:', error);
        res.status(500).json({
            success: false,
            message: '충전 내역 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * 예치금 충전 상태 확인
 * GET /api/deposits/:depositId/status
 */
router.get('/:depositId/status', auth, async (req, res) => {
    try {
        const deposit = await Deposit.findOne({
            _id: req.params.depositId,
            user: req.user.id
        });

        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: '충전 요청을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: {
                deposit,
                status: deposit.status,
                method: deposit.method,
                amount: deposit.amount,
                bonusAmount: deposit.bonusAmount,
                finalAmount: deposit.finalAmount
            }
        });
    } catch (error) {
        logger.error('Get deposit status error:', error);
        res.status(500).json({
            success: false,
            message: '상태 확인 중 오류가 발생했습니다.'
        });
    }
});

/**
 * 예치금 충전 취소
 * POST /api/deposits/:depositId/cancel
 */
router.post('/:depositId/cancel', auth, async (req, res) => {
    try {
        const { reason } = req.body;
        
        const deposit = await Deposit.findOne({
            _id: req.params.depositId,
            user: req.user.id,
            status: 'pending'
        });

        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: '취소 가능한 충전 요청을 찾을 수 없습니다.'
            });
        }

        const result = await bankTransferService.cancelDeposit(deposit._id, reason || '사용자 요청');

        res.json({
            success: true,
            message: '충전 요청이 취소되었습니다.',
            data: result
        });
    } catch (error) {
        logger.error('Cancel deposit error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '취소 처리 중 오류가 발생했습니다.'
        });
    }
});

/**
 * 관리자용 - 대기 중인 입금 목록 조회
 * GET /api/deposits/admin/pending
 */
router.get('/admin/pending', auth, async (req, res) => {
    try {
        // 관리자 권한 확인
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '관리자 권한이 필요합니다.'
            });
        }

        const deposits = await bankTransferService.getPendingDeposits();

        res.json({
            success: true,
            data: deposits
        });
    } catch (error) {
        logger.error('Get pending deposits error:', error);
        res.status(500).json({
            success: false,
            message: '대기 중인 입금 목록 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * 관리자용 - 입금 확인 처리
 * POST /api/deposits/admin/:depositId/confirm
 */
router.post('/admin/:depositId/confirm', auth, async (req, res) => {
    try {
        // 관리자 권한 확인
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '관리자 권한이 필요합니다.'
            });
        }

        const result = await bankTransferService.confirmDeposit(
            req.params.depositId,
            req.user.id
        );

        logger.info(`Deposit confirmed by admin ${req.user.email}: ${req.params.depositId}`);

        res.json({
            success: true,
            message: '입금이 확인되었습니다.',
            data: result.data
        });
    } catch (error) {
        logger.error('Confirm deposit error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '입금 확인 처리 중 오류가 발생했습니다.'
        });
    }
});

/**
 * 관리자용 - 입금 요청 취소
 * POST /api/deposits/admin/:depositId/cancel
 */
router.post('/admin/:depositId/cancel', auth, async (req, res) => {
    try {
        // 관리자 권한 확인
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '관리자 권한이 필요합니다.'
            });
        }

        const { reason } = req.body;

        const result = await bankTransferService.cancelDeposit(
            req.params.depositId,
            reason || '관리자 취소'
        );

        logger.info(`Deposit cancelled by admin ${req.user.email}: ${req.params.depositId}`);

        res.json({
            success: true,
            message: '충전 요청이 취소되었습니다.',
            data: result
        });
    } catch (error) {
        logger.error('Cancel deposit by admin error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '취소 처리 중 오류가 발생했습니다.'
        });
    }
});

/**
 * 자동 입금 확인 서비스 상태
 * GET /api/deposits/auto-confirm/status
 */
router.get('/auto-confirm/status', auth, async (req, res) => {
    try {
        const autoDepositService = require('../services/autoDeposit.service');
        const status = autoDepositService.getStatus();
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        logger.error('Get auto-confirm status error:', error);
        res.status(500).json({
            success: false,
            message: '상태 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * 테스트용 - 모든 대기 중인 입금 즉시 확인
 * POST /api/deposits/auto-confirm/all
 */
router.post('/auto-confirm/all', auth, async (req, res) => {
    try {
        // 관리자 또는 테스트 모드에서만 허용
        if (req.user.role !== 'admin' && process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                message: '권한이 없습니다.'
            });
        }

        const autoDepositService = require('../services/autoDeposit.service');
        const result = await autoDepositService.confirmAllPending();
        
        res.json({
            success: true,
            message: `${result.confirmed}개의 입금이 자동 확인되었습니다.`,
            data: result
        });
    } catch (error) {
        logger.error('Confirm all deposits error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '처리 중 오류가 발생했습니다.'
        });
    }
});

/**
 * 테스트용 - 입금 시뮬레이션 (개발 환경에서만)
 * POST /api/deposits/:depositId/simulate
 */
router.post('/:depositId/simulate', auth, async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                message: 'This endpoint is only available in development mode'
            });
        }

        const deposit = await Deposit.findOne({
            _id: req.params.depositId,
            user: req.user.id,
            status: 'pending'
        });

        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: '대기 중인 충전 요청을 찾을 수 없습니다.'
            });
        }

        // 입금 확인 처리
        const result = await bankTransferService.confirmDeposit(deposit._id, req.user.id);

        res.json({
            success: true,
            message: '테스트 충전이 완료되었습니다.',
            data: result
        });
    } catch (error) {
        logger.error('Simulate deposit error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;