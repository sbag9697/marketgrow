const express = require('express');
const router = express.Router();
const { googleAuth, kakaoAuth, naverAuth } = require('../controllers/oauth.controller');
const rateLimit = require('express-rate-limit');

// Rate limiting for OAuth routes
const oauthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: {
        success: false,
        message: '너무 많은 로그인 시도가 발생했습니다. 15분 후 다시 시도해주세요.'
    }
});

// OAuth 로그인 엔드포인트
router.post('/google', oauthLimiter, googleAuth);
router.post('/kakao', oauthLimiter, kakaoAuth);
router.post('/naver', oauthLimiter, naverAuth);

module.exports = router;