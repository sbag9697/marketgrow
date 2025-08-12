const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendEmailVerification,
    checkUsername,
    checkEmail
} = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: '너무 많은 인증 시도가 발생했습니다. 15분 후 다시 시도해주세요.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset requests per hour
    message: {
        success: false,
        message: '비밀번호 재설정 요청이 너무 많습니다. 1시간 후 다시 시도해주세요.'
    }
});

// Validation middleware
const registerValidation = [
    body('username')
        .isLength({ min: 4, max: 16 })
        .withMessage('아이디는 4-16자 사이여야 합니다.')
        .matches(/^[a-zA-Z0-9]+$/)
        .withMessage('아이디는 영문과 숫자만 사용 가능합니다.'),
    body('email')
        .isEmail()
        .withMessage('유효한 이메일 주소를 입력해주세요.')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('비밀번호는 최소 8자 이상이어야 합니다.')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다.'),
    body('name')
        .notEmpty()
        .withMessage('이름은 필수입니다.')
        .isLength({ min: 2, max: 50 })
        .withMessage('이름은 2-50자 사이여야 합니다.'),
    body('phone')
        .matches(/^[0-9]{10,11}$/)
        .withMessage('유효한 전화번호를 입력해주세요.'),
    body('businessType')
        .optional()
        .isIn(['personal', 'small', 'startup', 'agency', 'corporation', 'other'])
        .withMessage('유효한 비즈니스 유형을 선택해주세요.'),
    body('referralCode')
        .optional()
        .isLength({ min: 3, max: 20 })
        .withMessage('유효한 추천 코드를 입력해주세요.')
];

const loginValidation = [
    body('login')
        .notEmpty()
        .withMessage('이메일 또는 아이디를 입력해주세요.'),
    body('password')
        .notEmpty()
        .withMessage('비밀번호를 입력해주세요.')
];

const updateProfileValidation = [
    body('name')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('이름은 2-50자 사이여야 합니다.'),
    body('phone')
        .optional()
        .matches(/^[0-9]{10,11}$/)
        .withMessage('유효한 전화번호를 입력해주세요.'),
    body('businessType')
        .optional()
        .isIn(['personal', 'small', 'startup', 'agency', 'corporation', 'other'])
        .withMessage('유효한 비즈니스 유형을 선택해주세요.'),
    body('marketingConsent')
        .optional()
        .isBoolean()
        .withMessage('마케팅 동의는 true 또는 false여야 합니다.')
];

const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('현재 비밀번호를 입력해주세요.'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('새 비밀번호는 최소 8자 이상이어야 합니다.')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('새 비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다.')
];

const resetPasswordValidation = [
    body('token')
        .notEmpty()
        .withMessage('재설정 토큰이 필요합니다.'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('새 비밀번호는 최소 8자 이상이어야 합니다.')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('새 비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다.')
];

// Public routes
// Check username availability
router.post('/check-username', checkUsername);

// Register new user
router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/forgot-password', passwordResetLimiter, [
    body('email').isEmail().withMessage('유효한 이메일 주소를 입력해주세요.').normalizeEmail()
], requestPasswordReset);
router.post('/reset-password', authLimiter, resetPasswordValidation, resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Check availability routes (중복확인)
router.get('/check-username/:username', checkUsername);
router.get('/check-email/:email', checkEmail);

// Protected routes
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfileValidation, updateProfile);
router.put('/change-password', auth, changePasswordValidation, changePassword);
router.post('/resend-verification', auth, resendEmailVerification);

module.exports = router;