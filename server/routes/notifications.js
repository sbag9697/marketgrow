const express = require('express');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Get notification settings
router.get('/settings', auth, asyncHandler(async (req, res) => {
    const user = req.user;
    
    res.json({
        success: true,
        data: user.notificationSettings || {
            emailNotifications: true,
            smsNotifications: false,
            orderUpdates: true,
            paymentNotifications: true,
            marketingNotifications: false,
            smsPaymentSuccess: true,
            smsOrderComplete: true,
            smsUrgentNotifications: true
        }
    });
}));

// Update notification settings
router.put('/settings', auth, asyncHandler(async (req, res) => {
    const user = req.user;
    const settings = req.body;
    
    user.notificationSettings = {
        ...user.notificationSettings,
        ...settings
    };
    
    await user.save();
    
    res.json({
        success: true,
        message: '알림 설정이 업데이트되었습니다',
        data: user.notificationSettings
    });
}));

// Get notification history (mock)
router.get('/history', auth, asyncHandler(async (req, res) => {
    // Mock notification history
    const notifications = [
        {
            _id: '1',
            type: 'email',
            title: '결제 완료 알림',
            message: '주문 #MG240101ABC123 결제가 완료되었습니다.',
            success: true,
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1시간 전
        },
        {
            _id: '2',
            type: 'sms',
            title: '주문 상태 변경',
            message: '주문이 처리 중 상태로 변경되었습니다.',
            success: true,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2시간 전
        }
    ];
    
    res.json({
        success: true,
        data: { notifications }
    });
}));

// Send phone verification
router.post('/verify-phone', auth, asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;
    
    // Mock verification code sending
    // In real implementation, integrate with SMS service
    
    res.json({
        success: true,
        message: '인증번호가 발송되었습니다'
    });
}));

// Confirm phone verification
router.post('/confirm-phone', auth, asyncHandler(async (req, res) => {
    const { phoneNumber, verificationCode } = req.body;
    
    // Mock verification - in real implementation, verify the code
    if (verificationCode === '123456') {
        req.user.phone = phoneNumber;
        req.user.phoneVerified = true;
        await req.user.save();
        
        res.json({
            success: true,
            message: '휴대폰 인증이 완료되었습니다'
        });
    } else {
        res.status(400).json({
            success: false,
            message: '인증번호가 올바르지 않습니다'
        });
    }
}));

module.exports = router;