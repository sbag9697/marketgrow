const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: '너무 많은 로그인 시도가 있었습니다. 15분 후 다시 시도해주세요.',
        error: 'TOO_MANY_ATTEMPTS'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Validation rules
const registerValidation = [
    body('name')
        .isLength({ min: 2, max: 50 })
        .withMessage('이름은 2-50자 사이여야 합니다')
        .trim(),
    body('email')
        .isEmail()
        .withMessage('올바른 이메일 주소를 입력해주세요')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('비밀번호는 최소 6자 이상이어야 합니다')
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
        .withMessage('비밀번호는 영문과 숫자를 포함해야 합니다'),
    body('phone')
        .optional()
        .matches(/^01[0-9]-\d{4}-\d{4}$/)
        .withMessage('올바른 휴대폰 번호 형식을 입력해주세요 (010-0000-0000)')
];

const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('올바른 이메일 주소를 입력해주세요')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('비밀번호를 입력해주세요')
];

// Register
router.post('/register', registerValidation, async (req, res) => {
    try {
        // Validation check
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '입력 정보를 확인해주세요',
                errors: errors.array()
            });
        }

        const { name, email, password, phone, referralCode } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: '이미 등록된 이메일입니다',
                error: 'EMAIL_ALREADY_EXISTS'
            });
        }

        // Check phone number if provided
        if (phone) {
            const existingPhone = await User.findOne({ phone });
            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: '이미 등록된 휴대폰 번호입니다',
                    error: 'PHONE_ALREADY_EXISTS'
                });
            }
        }

        // Handle referral code
        let referredBy = null;
        if (referralCode) {
            const referrer = await User.findByReferralCode(referralCode);
            if (referrer) {
                referredBy = referrer._id;
            }
        }

        // Create new user
        const user = new User({
            name,
            email,
            password,
            phone,
            referredBy,
            metadata: {
                userAgent: req.get('User-Agent'),
                ipAddress: req.ip
            }
        });

        await user.save();

        // Generate tokens
        const accessToken = user.generateAuthToken();
        const refreshToken = user.generateRefreshToken();

        // Record login
        user.recordLogin(req.ip, req.get('User-Agent'), '', true);
        await user.save();

        // Log registration
        logger.info(`New user registered: ${email}`, {
            userId: user._id,
            email: user.email,
            referralCode: referralCode || null
        });

        res.status(201).json({
            success: true,
            message: '회원가입이 완료되었습니다',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    membershipLevel: user.membershipLevel,
                    points: user.points,
                    referralCode: user.referralCode
                },
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                }
            }
        });

    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: '회원가입 중 오류가 발생했습니다',
            error: 'REGISTRATION_FAILED'
        });
    }
});

// Login
router.post('/login', authLimiter, loginValidation, async (req, res) => {
    try {
        // Validation check
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '입력 정보를 확인해주세요',
                errors: errors.array()
            });
        }

        const { email, password, remember = false } = req.body;

        // Find user and include password field
        const user = await User.findByEmail(email).select('+password');
        if (!user) {
            // Record failed login attempt
            logger.warn(`Failed login attempt for non-existent email: ${email}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            return res.status(401).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다',
                error: 'INVALID_CREDENTIALS'
            });
        }

        // Check account status
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: '계정이 비활성화되었습니다. 고객센터에 문의해주세요',
                error: 'ACCOUNT_INACTIVE'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            // Record failed login attempt
            user.recordLogin(req.ip, req.get('User-Agent'), '', false);
            await user.save();

            logger.warn(`Failed login attempt for user: ${email}`, {
                userId: user._id,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            return res.status(401).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다',
                error: 'INVALID_CREDENTIALS'
            });
        }

        // Generate tokens
        const accessToken = user.generateAuthToken();
        let refreshToken = null;
        
        if (remember) {
            refreshToken = user.generateRefreshToken();
        }

        // Record successful login
        user.recordLogin(req.ip, req.get('User-Agent'), '', true);
        await user.save();

        // Log successful login
        logger.info(`User logged in: ${email}`, {
            userId: user._id,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: '로그인이 완료되었습니다',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    phoneVerified: user.phoneVerified,
                    role: user.role,
                    status: user.status,
                    membershipLevel: user.membershipLevel,
                    points: user.points,
                    totalSpent: user.totalSpent,
                    orderCount: user.orderCount,
                    referralCode: user.referralCode,
                    notificationSettings: user.notificationSettings,
                    preferences: user.preferences,
                    lastLogin: user.lastLogin
                },
                tokens: {
                    accessToken,
                    ...(refreshToken && { refreshToken }),
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                }
            }
        });

    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: '로그인 중 오류가 발생했습니다',
            error: 'LOGIN_FAILED'
        });
    }
});

// Refresh token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: '리프레시 토큰이 필요합니다',
                error: 'REFRESH_TOKEN_REQUIRED'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 리프레시 토큰입니다',
                error: 'INVALID_REFRESH_TOKEN'
            });
        }

        // Generate new access token
        const accessToken = user.generateAuthToken();

        res.json({
            success: true,
            message: '토큰이 갱신되었습니다',
            data: {
                accessToken,
                expiresIn: process.env.JWT_EXPIRES_IN || '24h'
            }
        });

    } catch (error) {
        logger.error('Token refresh error:', error);
        res.status(401).json({
            success: false,
            message: '토큰 갱신에 실패했습니다',
            error: 'TOKEN_REFRESH_FAILED'
        });
    }
});

// Logout
router.post('/logout', auth, async (req, res) => {
    try {
        // In a real application, you might want to blacklist the token
        // For now, we'll just log the logout event
        logger.info(`User logged out: ${req.user.email}`, {
            userId: req.user.id,
            ip: req.ip
        });

        res.json({
            success: true,
            message: '로그아웃이 완료되었습니다'
        });

    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: '로그아웃 중 오류가 발생했습니다',
            error: 'LOGOUT_FAILED'
        });
    }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('referredBy', 'name email referralCode')
            .select('-__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다',
                error: 'USER_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: {
                user
            }
        });

    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: '프로필 조회 중 오류가 발생했습니다',
            error: 'PROFILE_FETCH_FAILED'
        });
    }
});

// Update profile
router.put('/me', auth, [
    body('name')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('이름은 2-50자 사이여야 합니다')
        .trim(),
    body('phone')
        .optional()
        .matches(/^01[0-9]-\d{4}-\d{4}$/)
        .withMessage('올바른 휴대폰 번호 형식을 입력해주세요 (010-0000-0000)')
], async (req, res) => {
    try {
        // Validation check
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '입력 정보를 확인해주세요',
                errors: errors.array()
            });
        }

        const { name, phone, preferences, notificationSettings } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다',
                error: 'USER_NOT_FOUND'
            });
        }

        // Update allowed fields
        if (name) user.name = name;
        if (phone !== undefined) {
            // Check if phone number is already in use by another user
            if (phone && phone !== user.phone) {
                const existingPhone = await User.findOne({ 
                    phone, 
                    _id: { $ne: user._id } 
                });
                if (existingPhone) {
                    return res.status(400).json({
                        success: false,
                        message: '이미 사용 중인 휴대폰 번호입니다',
                        error: 'PHONE_ALREADY_EXISTS'
                    });
                }
                user.phone = phone;
                user.phoneVerified = false; // Reset verification status
            }
        }
        
        if (preferences) {
            user.preferences = { ...user.preferences, ...preferences };
        }
        
        if (notificationSettings) {
            user.notificationSettings = { ...user.notificationSettings, ...notificationSettings };
        }

        await user.save();

        logger.info(`User profile updated: ${user.email}`, {
            userId: user._id,
            changes: { name, phone, preferences, notificationSettings }
        });

        res.json({
            success: true,
            message: '프로필이 업데이트되었습니다',
            data: {
                user
            }
        });

    } catch (error) {
        logger.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: '프로필 업데이트 중 오류가 발생했습니다',
            error: 'PROFILE_UPDATE_FAILED'
        });
    }
});

// Change password
router.put('/change-password', auth, [
    body('currentPassword')
        .notEmpty()
        .withMessage('현재 비밀번호를 입력해주세요'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('새 비밀번호는 최소 6자 이상이어야 합니다')
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
        .withMessage('새 비밀번호는 영문과 숫자를 포함해야 합니다')
], async (req, res) => {
    try {
        // Validation check
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '입력 정보를 확인해주세요',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다',
                error: 'USER_NOT_FOUND'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: '현재 비밀번호가 올바르지 않습니다',
                error: 'INVALID_CURRENT_PASSWORD'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        logger.info(`Password changed for user: ${user.email}`, {
            userId: user._id,
            ip: req.ip
        });

        res.json({
            success: true,
            message: '비밀번호가 성공적으로 변경되었습니다'
        });

    } catch (error) {
        logger.error('Password change error:', error);
        res.status(500).json({
            success: false,
            message: '비밀번호 변경 중 오류가 발생했습니다',
            error: 'PASSWORD_CHANGE_FAILED'
        });
    }
});

// Check email availability
router.post('/check-email', [
    body('email')
        .isEmail()
        .withMessage('올바른 이메일 주소를 입력해주세요')
        .normalizeEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '올바른 이메일 주소를 입력해주세요',
                errors: errors.array()
            });
        }

        const { email } = req.body;
        const existingUser = await User.findByEmail(email);

        res.json({
            success: true,
            data: {
                available: !existingUser,
                message: existingUser ? '이미 사용 중인 이메일입니다' : '사용 가능한 이메일입니다'
            }
        });

    } catch (error) {
        logger.error('Email check error:', error);
        res.status(500).json({
            success: false,
            message: '이메일 확인 중 오류가 발생했습니다',
            error: 'EMAIL_CHECK_FAILED'
        });
    }
});

// Verify referral code
router.post('/verify-referral', [
    body('referralCode')
        .isLength({ min: 6, max: 12 })
        .withMessage('추천 코드는 6-12자 사이여야 합니다')
        .trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '올바른 추천 코드를 입력해주세요',
                errors: errors.array()
            });
        }

        const { referralCode } = req.body;
        const referrer = await User.findByReferralCode(referralCode);

        res.json({
            success: true,
            data: {
                valid: !!referrer,
                referrer: referrer ? {
                    name: referrer.name,
                    membershipLevel: referrer.membershipLevel
                } : null,
                message: referrer ? `${referrer.name}님의 추천 코드입니다` : '존재하지 않는 추천 코드입니다'
            }
        });

    } catch (error) {
        logger.error('Referral code verification error:', error);
        res.status(500).json({
            success: false,
            message: '추천 코드 확인 중 오류가 발생했습니다',
            error: 'REFERRAL_VERIFICATION_FAILED'
        });
    }
});

module.exports = router;