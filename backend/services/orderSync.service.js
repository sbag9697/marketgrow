const Order = require('../models/Order');
const SMMPanelService = require('./smmPanel.service');
const logger = require('../utils/logger');

class OrderSyncService {
    constructor() {
        this.smmPanel = new SMMPanelService();
        this.syncInterval = null;
    }

    /**
     * SMM 패널과 주문 상태 동기화
     */
    async syncOrderStatus(orderId) {
        try {
            const order = await Order.findById(orderId);
            if (!order || !order.providerOrderId) {
                return;
            }

            // SMM 패널에서 상태 조회
            const smmStatus = await this.smmPanel.checkOrderStatus(order.providerOrderId);
            
            // 상태 업데이트
            order.providerStatus = smmStatus.status;
            
            // 진행률 업데이트
            if (smmStatus.startCount !== undefined && smmStatus.remains !== undefined) {
                const delivered = smmStatus.startCount - smmStatus.remains;
                order.progress.current = delivered;
                order.progress.percentage = Math.round((delivered / order.quantity) * 100);
            }

            // MarketGrow 상태 매핑
            switch (smmStatus.status) {
                case 'Completed':
                    order.status = 'completed';
                    order.completedAt = new Date();
                    break;
                case 'In progress':
                case 'Processing':
                    order.status = 'processing';
                    if (!order.startedAt) {
                        order.startedAt = new Date();
                    }
                    break;
                case 'Partial':
                    order.status = 'partial';
                    break;
                case 'Canceled':
                case 'Cancelled':
                    order.status = 'cancelled';
                    order.cancelledAt = new Date();
                    break;
                case 'Pending':
                    order.status = 'pending';
                    break;
            }

            await order.save();
            
            logger.info(`Order ${order.orderNumber} synced: ${order.status} (${order.progress.percentage}%)`);
            
            return order;
        } catch (error) {
            logger.error(`Order sync failed for ${orderId}:`, error);
            throw error;
        }
    }

    /**
     * 모든 진행 중인 주문 동기화
     */
    async syncAllActiveOrders() {
        try {
            // 진행 중인 주문들 조회
            const activeOrders = await Order.find({
                status: { $in: ['pending', 'processing', 'partial'] },
                providerOrderId: { $exists: true, $ne: null }
            });

            logger.info(`Syncing ${activeOrders.length} active orders...`);

            for (const order of activeOrders) {
                try {
                    await this.syncOrderStatus(order._id);
                    // API 제한을 피하기 위해 딜레이
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    logger.error(`Failed to sync order ${order.orderNumber}:`, error);
                }
            }

            logger.info('Order sync completed');
        } catch (error) {
            logger.error('Sync all orders failed:', error);
        }
    }

    /**
     * 자동 동기화 시작 (5분마다)
     */
    startAutoSync() {
        if (this.syncInterval) {
            return;
        }

        // 즉시 한 번 실행
        this.syncAllActiveOrders();

        // 5분마다 실행
        this.syncInterval = setInterval(() => {
            this.syncAllActiveOrders();
        }, 5 * 60 * 1000);

        logger.info('Order auto-sync started (every 5 minutes)');
    }

    /**
     * 자동 동기화 중지
     */
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            logger.info('Order auto-sync stopped');
        }
    }
}

module.exports = OrderSyncService;