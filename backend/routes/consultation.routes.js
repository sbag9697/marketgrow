const express = require('express');
const { body } = require('express-validator');
const {
    createConsultation,
    getConsultationById,
    getConsultations,
    updateConsultationStatus,
    addFollowUp,
    scheduleCall,
    completeConsultation,
    getConsultationStatistics
} = require('../controllers/consultation.controller');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Consultation validation
const createConsultationValidation = [
    body('name')
        .isLength({ min: 2, max: 50 })
        .withMessage('이름은 2-50자 사이여야 합니다.'),
    body('phone')
        .matches(/^[0-9]{10,11}$/)
        .withMessage('유효한 전화번호를 입력해주세요.'),
    body('email')
        .isEmail()
        .withMessage('유효한 이메일 주소를 입력해주세요.')
        .normalizeEmail(),
    body('company')
        .optional()
        .isLength({ max: 100 })
        .withMessage('회사명은 100자 이하여야 합니다.'),
    body('businessType')
        .isIn(['personal', 'small', 'startup', 'agency', 'corporation', 'other'])
        .withMessage('유효한 비즈니스 유형을 선택해주세요.'),
    body('interestedServices')
        .isArray({ min: 1 })
        .withMessage('관심 서비스를 최소 1개 이상 선택해주세요.'),
    body('budget')
        .isIn(['under_100k', '100k_500k', '500k_1m', '1m_5m', '5m_10m', 'over_10m', 'discuss'])
        .withMessage('유효한 예산 범위를 선택해주세요.'),
    body('timeline')
        .isIn(['immediate', 'within_week', 'within_month', 'within_3months', 'flexible'])
        .withMessage('유효한 시작 시기를 선택해주세요.'),
    body('goals')
        .isLength({ min: 10, max: 500 })
        .withMessage('마케팅 목표는 10-500자 사이여야 합니다.'),
    body('message')
        .isLength({ min: 10, max: 1000 })
        .withMessage('상담 내용은 10-1000자 사이여야 합니다.'),
    body('marketingConsent')
        .isBoolean()
        .withMessage('마케팅 수신 동의를 선택해주세요.'),
    body('privacyConsent')
        .equals('true')
        .withMessage('개인정보 처리방침에 동의해주세요.')
];

const updateStatusValidation = [
    body('status')
        .optional()
        .isIn(['pending', 'contacted', 'in_progress', 'completed', 'cancelled'])
        .withMessage('유효한 상태를 선택해주세요.'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('유효한 우선순위를 선택해주세요.'),
    body('assignedTo')
        .optional()
        .isMongoId()
        .withMessage('유효한 담당자 ID를 입력해주세요.'),
    body('notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('메모는 1000자 이하여야 합니다.')
];

const followUpValidation = [
    body('method')
        .isIn(['phone', 'email', 'meeting', 'video_call'])
        .withMessage('유효한 연락 방법을 선택해주세요.'),
    body('notes')
        .isLength({ min: 1, max: 500 })
        .withMessage('메모는 1-500자 사이여야 합니다.'),
    body('result')
        .isIn(['no_answer', 'scheduled', 'interested', 'not_interested', 'proposal_sent', 'closed'])
        .withMessage('유효한 결과를 선택해주세요.'),
    body('nextAction')
        .optional()
        .isLength({ max: 200 })
        .withMessage('다음 액션은 200자 이하여야 합니다.'),
    body('nextActionDate')
        .optional()
        .isISO8601()
        .withMessage('유효한 날짜를 입력해주세요.')
];

const scheduleCallValidation = [
    body('scheduledDate')
        .isISO8601()
        .withMessage('유효한 날짜를 입력해주세요.')
];

const completeConsultationValidation = [
    body('outcome')
        .isIn(['converted', 'not_converted', 'pending', 'follow_up_needed'])
        .withMessage('유효한 결과를 선택해주세요.'),
    body('conversionValue')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('전환 가치는 0 이상이어야 합니다.'),
    body('notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('메모는 1000자 이하여야 합니다.')
];

// Public routes
router.post('/', createConsultationValidation, createConsultation);

// Admin routes
router.use(auth, adminAuth);

router.get('/', getConsultations);
router.get('/statistics', getConsultationStatistics);
router.get('/:id', getConsultationById);
router.put('/:id/status', updateStatusValidation, updateConsultationStatus);
router.post('/:id/follow-up', followUpValidation, addFollowUp);
router.post('/:id/schedule-call', scheduleCallValidation, scheduleCall);
router.post('/:id/complete', completeConsultationValidation, completeConsultation);

module.exports = router;
