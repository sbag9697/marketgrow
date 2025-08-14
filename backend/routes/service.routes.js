const express = require('express');
const { body } = require('express-validator');
const {
    getServices,
    getServiceById,
    getServicesByPlatform,
    calculatePrice,
    getPlatformStats
} = require('../controllers/service.controller');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', optionalAuth, getServices);
router.get('/stats', getPlatformStats);
router.get('/platform/:platform', getServicesByPlatform);
router.get('/:id', getServiceById);

// Price calculation (requires user context for accurate pricing)
router.post('/:serviceId/calculate-price', optionalAuth, [
    body('quantity')
        .isInt({ min: 1 })
        .withMessage('수량은 1 이상의 정수여야 합니다.')
], calculatePrice);

module.exports = router;
