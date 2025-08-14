const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const VirtualAccountService = require('../services/virtualAccount.service');
const Deposit = require('../models/Deposit');
const logger = require('../utils/logger');

const virtualAccountService = new VirtualAccountService();

/**
 * 가상계좌 발급 요청
 * POST /api/deposits/virtual-account
 */
router.post('/virtual-account', auth, async (req, res) => {
    try {
        const { amount, depositorName } = req.body;

        // 유효성 검사
        if (!amount || amount < 10000) {
            return res.status(400).json({
                success: false,
                message: '최소 충전 금액은 10,000원입니다.'
            });
        }

        if (!depositorName) {
            return res.status(400).json({
                success: false,
                message: '입금자명을 입력해주세요.'
            });
        }

        // 가상계좌 발급
        const result = await virtualAccountService.createVirtualAccount(
            req.user.id,
            amount,
            depositorName
        );

        logger.info(`Virtual account created for user ${req.user.email}, amount: ${amount}`);

        res.json({
            success: true,
            message: '가상계좌가 발급되었습니다.',
            data: result.data
        });

    } catch (error) {
        logger.error('Virtual account creation error:', error);
        res.status(500).json({
            success: false,
            message: '가상계좌 발급 중 오류가 발생했습니다.'
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

        // 토스페이먼츠 API로 실시간 상태 확인 (paymentKey가 있는 경우)
        let paymentStatus = null;
        if (deposit.virtualAccount?.paymentKey) {
            try {
                paymentStatus = await virtualAccountService.checkPaymentStatus(
                    deposit.virtualAccount.paymentKey
                );
            } catch (error) {
                logger.error('Payment status check failed:', error);
            }
        }

        res.json({
            success: true,
            data: {
                deposit,
                paymentStatus
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
 * 테스트용 - 예치금 충전 시뮬레이션 (개발 환경에서만)
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

        const result = await virtualAccountService.simulateDeposit(deposit._id);

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