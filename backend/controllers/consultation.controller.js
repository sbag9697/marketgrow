const Consultation = require('../models/Consultation');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// Create consultation request
const createConsultation = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '입력 데이터를 확인해주세요.',
                errors: errors.array()
            });
        }

        const consultationData = {
            ...req.body,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            source: 'website'
        };

        const consultation = new Consultation(consultationData);
        await consultation.save();

        logger.info(`New consultation request: ${consultation.consultationId} from ${consultation.email}`);

        // TODO: Send notification to admin about new consultation
        // TODO: Send confirmation email to user

        res.status(201).json({
            success: true,
            message: '상담 신청이 완료되었습니다. 빠른 시일 내에 연락드리겠습니다.',
            data: {
                consultationId: consultation.consultationId,
                estimatedResponseTime: '24시간 이내'
            }
        });

    } catch (error) {
        logger.error('Create consultation error:', error);
        res.status(500).json({
            success: false,
            message: '상담 신청 중 오류가 발생했습니다.'
        });
    }
};

// Get consultation by ID
const getConsultationById = async (req, res) => {
    try {
        const consultation = await Consultation.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('followUps.createdBy', 'name email');

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: '상담 요청을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: { consultation }
        });

    } catch (error) {
        logger.error('Get consultation by ID error:', error);
        res.status(500).json({
            success: false,
            message: '상담 조회 중 오류가 발생했습니다.'
        });
    }
};

// Get consultations list (Admin only)
const getConsultations = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            priority,
            assignedTo,
            businessType,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (priority && priority !== 'all') {
            query.priority = priority;
        }

        if (assignedTo && assignedTo !== 'all') {
            query.assignedTo = assignedTo;
        }

        if (businessType && businessType !== 'all') {
            query.businessType = businessType;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { consultationId: { $regex: search, $options: 'i' } }
            ];
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const consultations = await Consultation.find(query)
            .populate('assignedTo', 'name email')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Consultation.countDocuments(query);

        res.json({
            success: true,
            data: {
                consultations,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        logger.error('Get consultations error:', error);
        res.status(500).json({
            success: false,
            message: '상담 목록 조회 중 오류가 발생했습니다.'
        });
    }
};

// Update consultation status
const updateConsultationStatus = async (req, res) => {
    try {
        const { status, priority, assignedTo, notes } = req.body;
        const { id } = req.params;

        const consultation = await Consultation.findById(id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: '상담 요청을 찾을 수 없습니다.'
            });
        }

        // Update fields
        if (status) consultation.status = status;
        if (priority) consultation.priority = priority;
        if (assignedTo) consultation.assignedTo = assignedTo;
        if (notes) consultation.internalNotes = notes;

        // Set contacted timestamp if status changes to contacted
        if (status === 'contacted' && consultation.status === 'pending') {
            consultation.contactedAt = new Date();
        }

        // Set completed timestamp if status changes to completed
        if (status === 'completed' && consultation.status !== 'completed') {
            consultation.completedAt = new Date();
        }

        await consultation.save();

        logger.info(`Consultation ${consultation.consultationId} updated by ${req.user.email}`);

        res.json({
            success: true,
            message: '상담 상태가 업데이트되었습니다.',
            data: { consultation }
        });

    } catch (error) {
        logger.error('Update consultation status error:', error);
        res.status(500).json({
            success: false,
            message: '상담 상태 업데이트 중 오류가 발생했습니다.'
        });
    }
};

// Add follow-up
const addFollowUp = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '입력 데이터를 확인해주세요.',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const followUpData = req.body;

        const consultation = await Consultation.findById(id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: '상담 요청을 찾을 수 없습니다.'
            });
        }

        await consultation.addFollowUp(followUpData, req.user.id);

        logger.info(`Follow-up added to consultation ${consultation.consultationId} by ${req.user.email}`);

        res.json({
            success: true,
            message: '팔로우업이 추가되었습니다.',
            data: { consultation }
        });

    } catch (error) {
        logger.error('Add follow-up error:', error);
        res.status(500).json({
            success: false,
            message: '팔로우업 추가 중 오류가 발생했습니다.'
        });
    }
};

// Schedule call
const scheduleCall = async (req, res) => {
    try {
        const { scheduledDate } = req.body;
        const { id } = req.params;

        if (!scheduledDate) {
            return res.status(400).json({
                success: false,
                message: '통화 예정일을 입력해주세요.'
            });
        }

        const consultation = await Consultation.findById(id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: '상담 요청을 찾을 수 없습니다.'
            });
        }

        await consultation.scheduleCall(new Date(scheduledDate));

        logger.info(`Call scheduled for consultation ${consultation.consultationId}`);

        res.json({
            success: true,
            message: '통화가 예약되었습니다.',
            data: { consultation }
        });

    } catch (error) {
        logger.error('Schedule call error:', error);
        res.status(500).json({
            success: false,
            message: '통화 예약 중 오류가 발생했습니다.'
        });
    }
};

// Complete consultation
const completeConsultation = async (req, res) => {
    try {
        const { outcome, conversionValue, notes } = req.body;
        const { id } = req.params;

        const consultation = await Consultation.findById(id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: '상담 요청을 찾을 수 없습니다.'
            });
        }

        await consultation.complete(outcome, conversionValue);

        if (notes) {
            consultation.internalNotes = notes;
            await consultation.save();
        }

        logger.info(`Consultation ${consultation.consultationId} completed with outcome: ${outcome}`);

        res.json({
            success: true,
            message: '상담이 완료되었습니다.',
            data: { consultation }
        });

    } catch (error) {
        logger.error('Complete consultation error:', error);
        res.status(500).json({
            success: false,
            message: '상담 완료 처리 중 오류가 발생했습니다.'
        });
    }
};

// Get consultation statistics
const getConsultationStatistics = async (req, res) => {
    try {
        const [
            totalConsultations,
            pendingConsultations,
            contactedConsultations,
            completedConsultations,
            convertedConsultations,
            totalConversionValue
        ] = await Promise.all([
            Consultation.countDocuments(),
            Consultation.countDocuments({ status: 'pending' }),
            Consultation.countDocuments({ status: 'contacted' }),
            Consultation.countDocuments({ status: 'completed' }),
            Consultation.countDocuments({ outcome: 'converted' }),
            Consultation.aggregate([
                { $match: { outcome: 'converted', conversionValue: { $exists: true } } },
                { $group: { _id: null, total: { $sum: '$conversionValue' } } }
            ])
        ]);

        // Get consultation trends by business type
        const businessTypeStats = await Consultation.aggregate([
            {
                $group: {
                    _id: '$businessType',
                    count: { $sum: 1 },
                    converted: {
                        $sum: { $cond: [{ $eq: ['$outcome', 'converted'] }, 1, 0] }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Get monthly trends
        const monthlyStats = await Consultation.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    converted: {
                        $sum: { $cond: [{ $eq: ['$outcome', 'converted'] }, 1, 0] }
                    }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ]);

        res.json({
            success: true,
            data: {
                totalConsultations,
                pendingConsultations,
                contactedConsultations,
                completedConsultations,
                convertedConsultations,
                totalConversionValue: totalConversionValue[0]?.total || 0,
                conversionRate: completedConsultations > 0 ? 
                    ((convertedConsultations / completedConsultations) * 100).toFixed(2) : 0,
                businessTypeStats,
                monthlyStats
            }
        });

    } catch (error) {
        logger.error('Get consultation statistics error:', error);
        res.status(500).json({
            success: false,
            message: '상담 통계 조회 중 오류가 발생했습니다.'
        });
    }
};

module.exports = {
    createConsultation,
    getConsultationById,
    getConsultations,
    updateConsultationStatus,
    addFollowUp,
    scheduleCall,
    completeConsultation,
    getConsultationStatistics
};