const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');
const rateLimit = require('express-rate-limit');

// 이메일 발송 제한 (IP당 5분에 3회)
const emailLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 3,
    message: '너무 많은 요청입니다. 5분 후에 다시 시도해주세요.'
});

// 인증 코드 검증 제한 (IP당 분당 10회)
const verifyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: '너무 많은 시도입니다. 잠시 후 다시 시도해주세요.'
});

// 이메일 인증 코드 발송
router.post('/send-verification', emailLimiter, emailController.sendVerificationCode);

// 이메일 인증 코드 검증
router.post('/verify-code', verifyLimiter, emailController.verifyEmailCode);

// 비밀번호 재설정 요청
router.post('/request-password-reset', emailLimiter, emailController.requestPasswordReset);

// 비밀번호 재설정
router.post('/reset-password', emailController.resetPassword);

module.exports = router;
