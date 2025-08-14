const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const logger = require('../utils/logger');
const emailService = require('../services/email.service');
const smsService = require('../services/sms.service');

// Check username availability
const checkUsername = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: '아이디를 입력해주세요.',
                available: false
            });
        }

        // 아이디 형식 검증 (영문, 숫자만 4-16자)
        const usernameRegex = /^[a-zA-Z0-9]{4,16}$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({
                success: false,
                message: '아이디는 영문, 숫자 조합 4-16자여야 합니다.',
                available: false
            });
        }

        // 데이터베이스에서 중복 확인
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.json({
                success: true,
                available: false,
                message: '이미 사용 중인 아이디입니다.'
            });
        }

        return res.json({
            success: true,
            available: true,
            message: '사용 가능한 아이디입니다.'
        });
    } catch (error) {
        logger.error('Username check error:', error);
        return res.status(500).json({
            success: false,
            message: '아이디 중복확인 중 오류가 발생했습니다.',
            available: false
        });
    }
};

// Register new user
const register = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '입력 데이터를 확인해주세요.',
                errors: errors.array()
            });
        }

        const { username, email, password, name, phone, businessType, referralCode } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username },
                { phone }
            ]
        });

        if (existingUser) {
            let message = '이미 사용 중인 정보입니다.';
            if (existingUser.email === email.toLowerCase()) {
                message = '이미 사용 중인 이메일입니다.';
            } else if (existingUser.username === username) {
                message = '이미 사용 중인 아이디입니다.';
            } else if (existingUser.phone === phone) {
                message = '이미 사용 중인 전화번호입니다.';
            }

            return res.status(400).json({
                success: false,
                message
            });
        }

        // Handle referral
        let referrer = null;
        if (referralCode) {
            referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
            if (!referrer) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 추천 코드입니다.'
                });
            }
        }

        // Create new user
        const userData = {
            username,
            email: email.toLowerCase(),
            password,
            name,
            phone,
            businessType: businessType || 'personal',
            termsAcceptedAt: new Date()
        };

        if (referrer) {
            userData.referredBy = referrer._id;
        }

        const user = new User(userData);
        await user.save();

        // Generate email verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = emailVerificationToken;
        user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save();

        // Generate JWT token
        const token = user.generateAuthToken();

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.emailVerificationToken;

        logger.info(`New user registered: ${email}`);

        res.status(201).json({
            success: true,
            message: '회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.',
            data: {
                user: userResponse,
                token,
                emailVerificationRequired: true
            }
        });
    } catch (error) {
        logger.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: '회원가입 중 오류가 발생했습니다.'
        });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '입력 데이터를 확인해주세요.',
                errors: errors.array()
            });
        }

        const { login: loginField, password } = req.body;

        // Find user by email or username
        const user = await User.findOne({
            $or: [
                { email: loginField.toLowerCase() },
                { username: loginField }
            ]
        }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '이메일/아이디 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: '비활성화된 계정입니다. 고객센터에 문의해주세요.'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '이메일/아이디 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        // Update login statistics
        user.lastLoginAt = new Date();
        user.loginCount += 1;
        await user.save();

        // Generate JWT token
        const token = user.generateAuthToken();

        // Remove sensitive data from response
        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.emailVerificationToken;
        delete userResponse.phoneVerificationCode;
        delete userResponse.passwordResetToken;

        logger.info(`User logged in: ${user.email}`);

        res.json({
            success: true,
            message: '로그인이 완료되었습니다.',
            data: {
                user: userResponse,
                token
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: '로그인 중 오류가 발생했습니다.'
        });
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password -emailVerificationToken -phoneVerificationCode -passwordResetToken')
            .populate('referredBy', 'username referralCode');

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: '프로필 조회 중 오류가 발생했습니다.'
        });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '입력 데이터를 확인해주세요.',
                errors: errors.array()
            });
        }

        const allowedFields = ['name', 'phone', 'businessType', 'marketingConsent', 'notifications'];
        const updates = {};

        // Only update allowed fields
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        // Check if phone number is already taken by another user
        if (updates.phone) {
            const existingUser = await User.findOne({
                phone: updates.phone,
                _id: { $ne: req.user.id }
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: '이미 사용 중인 전화번호입니다.'
                });
            }

            // Reset phone verification if phone number changed
            if (updates.phone !== req.user.phone) {
                updates.isPhoneVerified = false;
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password -emailVerificationToken -phoneVerificationCode -passwordResetToken');

        logger.info(`User profile updated: ${user.email}`);

        res.json({
            success: true,
            message: '프로필이 업데이트되었습니다.',
            data: { user }
        });
    } catch (error) {
        logger.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: '프로필 업데이트 중 오류가 발생했습니다.'
        });
    }
};

// Check email availability
const checkEmail = async (req, res) => {
    try {
        const { email } = req.params;

        if (!email || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                message: '올바른 이메일 형식이 아닙니다.',
                available: false
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return res.json({
                success: true,
                available: false,
                message: '이미 사용 중인 이메일입니다.'
            });
        }

        res.json({
            success: true,
            available: true,
            message: '사용 가능한 이메일입니다.'
        });
    } catch (error) {
        logger.error('Check email error:', error);
        res.status(500).json({
            success: false,
            message: '이메일 확인 중 오류가 발생했습니다.'
        });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '입력 데이터를 확인해주세요.',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await User.findById(req.user.id).select('+password');

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: '현재 비밀번호가 올바르지 않습니다.'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        logger.info(`Password changed for user: ${user.email}`);

        res.json({
            success: true,
            message: '비밀번호가 변경되었습니다.'
        });
    } catch (error) {
        logger.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: '비밀번호 변경 중 오류가 발생했습니다.'
        });
    }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Don't reveal if email exists or not
            return res.json({
                success: true,
                message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = resetToken;
        user.passwordResetExpire = Date.now() + 60 * 60 * 1000; // 1 hour
        await user.save();

        // TODO: Send password reset email
        logger.info(`Password reset requested for: ${email}`);

        res.json({
            success: true,
            message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.',
            ...(process.env.NODE_ENV === 'development' && { resetToken })
        });
    } catch (error) {
        logger.error('Request password reset error:', error);
        res.status(500).json({
            success: false,
            message: '비밀번호 재설정 요청 중 오류가 발생했습니다.'
        });
    }
};

// Reset password
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않거나 만료된 토큰입니다.'
            });
        }

        // Update password and clear reset token
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpire = undefined;
        await user.save();

        logger.info(`Password reset completed for: ${user.email}`);

        res.json({
            success: true,
            message: '비밀번호가 재설정되었습니다.'
        });
    } catch (error) {
        logger.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: '비밀번호 재설정 중 오류가 발생했습니다.'
        });
    }
};

// Verify email
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않거나 만료된 인증 토큰입니다.'
            });
        }

        // Mark email as verified
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save();

        logger.info(`Email verified for user: ${user.email}`);

        res.json({
            success: true,
            message: '이메일 인증이 완료되었습니다.'
        });
    } catch (error) {
        logger.error('Verify email error:', error);
        res.status(500).json({
            success: false,
            message: '이메일 인증 중 오류가 발생했습니다.'
        });
    }
};

// Resend email verification
const resendEmailVerification = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: '이미 인증된 이메일입니다.'
            });
        }

        // Generate new verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = emailVerificationToken;
        user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save();

        // TODO: Send verification email
        logger.info(`Email verification resent for: ${user.email}`);

        res.json({
            success: true,
            message: '인증 이메일이 재전송되었습니다.',
            ...(process.env.NODE_ENV === 'development' && { verificationToken: emailVerificationToken })
        });
    } catch (error) {
        logger.error('Resend email verification error:', error);
        res.status(500).json({
            success: false,
            message: '이메일 재전송 중 오류가 발생했습니다.'
        });
    }
};

// Send email verification code
const sendEmailVerification = async (req, res) => {
    try {
        const { email, username } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: '이메일을 입력해주세요.'
            });
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: '올바른 이메일 형식이 아닙니다.'
            });
        }

        // 이메일 인증 코드 발송
        const result = await emailService.sendVerificationCode(email, username);

        if (!result.success) {
            logger.error('Email verification send failed:', result.error);
            return res.status(500).json({
                success: false,
                message: result.message || '이메일 발송에 실패했습니다.'
            });
        }

        res.json({
            success: true,
            message: '인증 코드가 이메일로 발송되었습니다. 이메일을 확인해주세요.'
        });
    } catch (error) {
        logger.error('Send email verification error:', error);
        res.status(500).json({
            success: false,
            message: '이메일 발송 중 오류가 발생했습니다.'
        });
    }
};

// Verify email code
const verifyEmailCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: '이메일과 인증 코드를 입력해주세요.'
            });
        }

        // 인증 코드 검증
        const result = emailService.verifyCode(email, code);

        res.json(result);
    } catch (error) {
        logger.error('Verify email code error:', error);
        res.status(500).json({
            success: false,
            message: '인증 코드 확인 중 오류가 발생했습니다.'
        });
    }
};

// Send SMS verification
const sendSMSVerification = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: '전화번호를 입력해주세요.'
            });
        }

        // 전화번호 형식 검증 (한국 번호)
        const phoneRegex = /^01[0-9]{1}[0-9]{3,4}[0-9]{4}$/;
        const cleaned = phoneNumber.replace(/\D/g, '');

        if (!phoneRegex.test(cleaned)) {
            return res.status(400).json({
                success: false,
                message: '올바른 전화번호 형식이 아닙니다. (예: 01012345678)'
            });
        }

        // SMS 인증 코드 발송
        const result = await smsService.sendVerificationSMS(phoneNumber);

        if (!result.success) {
            logger.error('SMS verification send failed:', result.error);
            return res.status(500).json({
                success: false,
                message: result.message || 'SMS 발송에 실패했습니다.'
            });
        }

        res.json({
            success: true,
            message: '인증번호가 발송되었습니다.',
            ...(result.devMode && { code: result.code }) // 개발 모드에서만 코드 반환
        });
    } catch (error) {
        logger.error('Send SMS verification error:', error);
        res.status(500).json({
            success: false,
            message: 'SMS 발송 중 오류가 발생했습니다.'
        });
    }
};

// Verify SMS code
const verifySMSCode = async (req, res) => {
    try {
        const { phoneNumber, code } = req.body;

        if (!phoneNumber || !code) {
            return res.status(400).json({
                success: false,
                message: '전화번호와 인증 코드를 입력해주세요.'
            });
        }

        // 인증 코드 검증
        const result = smsService.verifyCode(phoneNumber, code);

        res.json(result);
    } catch (error) {
        logger.error('Verify SMS code error:', error);
        res.status(500).json({
            success: false,
            message: '인증 코드 확인 중 오류가 발생했습니다.'
        });
    }
};

module.exports = {
    checkUsername,
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendEmailVerification,
    checkEmail,
    sendEmailVerification,
    verifyEmailCode,
    sendSMSVerification,
    verifySMSCode
};
