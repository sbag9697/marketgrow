const emailService = require('../services/email.service');
const User = require('../models/User');

// 이메일 인증 코드 발송
exports.sendVerificationCode = async (req, res) => {
    try {
        const { email, username } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: '이메일 주소를 입력해주세요.'
            });
        }

        // 이메일 중복 체크 (DB 연결 시에만)
        if (req.app.locals.dbReady) {
            try {
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: '이미 등록된 이메일입니다.'
                    });
                }
            } catch (dbError) {
                console.log('DB query error (non-critical):', dbError.message);
                // DB 에러는 무시하고 계속 진행 (이메일 발송은 가능)
            }
        }

        // 인증 코드 발송
        const result = await emailService.sendVerificationEmail(email, username);

        if (result.success) {
            res.json({
                success: true,
                message: '인증 코드가 이메일로 발송되었습니다. 5분 이내에 입력해주세요.'
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.message || '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.'
            });
        }
    } catch (error) {
        console.error('Send verification code error:', error);
        res.status(500).json({
            success: false,
            message: '인증 코드 발송 중 오류가 발생했습니다.'
        });
    }
};

// 이메일 인증 코드 검증
exports.verifyEmailCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: '이메일과 인증 코드를 모두 입력해주세요.'
            });
        }

        // 인증 코드 검증
        const result = emailService.verifyCode(email, code);

        if (result.success) {
            res.json({
                success: true,
                message: '이메일 인증이 완료되었습니다.',
                verified: true
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message,
                verified: false
            });
        }
    } catch (error) {
        console.error('Verify email code error:', error);
        res.status(500).json({
            success: false,
            message: '인증 코드 검증 중 오류가 발생했습니다.'
        });
    }
};

// 비밀번호 재설정 요청
exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: '이메일 주소를 입력해주세요.'
            });
        }

        // 사용자 확인
        const user = await User.findOne({ email });
        if (!user) {
            // 보안상 사용자가 존재하지 않아도 성공 메시지 반환
            return res.json({
                success: true,
                message: '이메일이 등록되어 있다면 비밀번호 재설정 링크가 발송됩니다.'
            });
        }

        // 재설정 토큰 생성
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1시간 유효

        // 사용자 정보 업데이트
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiry = resetTokenExpiry;
        await user.save();

        // 이메일 발송
        const result = await emailService.sendPasswordResetEmail(email, resetToken);

        res.json({
            success: true,
            message: '이메일이 등록되어 있다면 비밀번호 재설정 링크가 발송됩니다.'
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({
            success: false,
            message: '비밀번호 재설정 요청 중 오류가 발생했습니다.'
        });
    }
};

// 비밀번호 재설정
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: '토큰과 새 비밀번호를 입력해주세요.'
            });
        }

        // 토큰으로 사용자 찾기
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않거나 만료된 토큰입니다.'
            });
        }

        // 비밀번호 업데이트
        user.password = newPassword; // User 모델의 pre-save 훅이 자동으로 해싱
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();

        res.json({
            success: true,
            message: '비밀번호가 성공적으로 변경되었습니다.'
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: '비밀번호 재설정 중 오류가 발생했습니다.'
        });
    }
};
