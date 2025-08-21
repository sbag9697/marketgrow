const Order = require('../models/Order');
const logger = require('../utils/logger');

// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['pending', 'processing', 'partial', 'completed', 'cancelled', 'refunded'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 상태입니다.'
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: '주문을 찾을 수 없습니다.'
            });
        }

        // Update status
        order.status = status;
        
        // If completed, set completedAt
        if (status === 'completed') {
            order.completedAt = new Date();
        }
        
        await order.save();

        logger.info(`Order ${order.orderNumber} status updated to ${status} by ${req.user.email}`);

        res.json({
            success: true,
            message: '주문 상태가 업데이트되었습니다.',
            data: { order }
        });
    } catch (error) {
        logger.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: '주문 상태 업데이트 중 오류가 발생했습니다.'
        });
    }
};

module.exports = {
    updateOrderStatus
};