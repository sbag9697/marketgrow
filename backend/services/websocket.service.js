const logger = require('../utils/logger');

class WebSocketService {
    constructor() {
        this.io = null;
        this.userSockets = new Map(); // userId -> socketId mapping
    }

    /**
     * Initialize WebSocket server
     */
    initialize(io) {
        this.io = io;
        
        io.on('connection', (socket) => {
            logger.info(`WebSocket client connected: ${socket.id}`);
            
            // 사용자 인증 및 등록
            socket.on('authenticate', async (data) => {
                try {
                    const { userId, token } = data;
                    
                    // 토큰 검증 (실제로는 JWT 검증 필요)
                    if (userId && token) {
                        // 사용자 소켓 매핑 저장
                        this.userSockets.set(userId, socket.id);
                        socket.userId = userId;
                        
                        // 사용자별 룸 참가
                        socket.join(`user_${userId}`);
                        
                        socket.emit('authenticated', { 
                            success: true,
                            message: '인증 성공'
                        });
                        
                        logger.info(`User ${userId} authenticated on socket ${socket.id}`);
                    } else {
                        socket.emit('authenticated', { 
                            success: false,
                            message: '인증 실패'
                        });
                    }
                } catch (error) {
                    logger.error('WebSocket authentication error:', error);
                    socket.emit('authenticated', { 
                        success: false,
                        message: '인증 오류'
                    });
                }
            });
            
            // 잔액 업데이트 요청
            socket.on('requestBalance', async (data) => {
                try {
                    if (socket.userId) {
                        // 실제 잔액 조회 로직
                        const User = require('../models/User');
                        const user = await User.findById(socket.userId);
                        
                        if (user) {
                            socket.emit('balanceUpdate', {
                                balance: user.depositBalance || 0,
                                timestamp: new Date()
                            });
                        }
                    }
                } catch (error) {
                    logger.error('Balance request error:', error);
                }
            });
            
            // 연결 해제
            socket.on('disconnect', () => {
                if (socket.userId) {
                    this.userSockets.delete(socket.userId);
                    logger.info(`User ${socket.userId} disconnected`);
                }
                logger.info(`WebSocket client disconnected: ${socket.id}`);
            });
        });
    }

    /**
     * 특정 사용자에게 잔액 업데이트 알림
     */
    notifyBalanceUpdate(userId, newBalance) {
        try {
            if (this.io) {
                // 사용자의 모든 연결된 소켓에 알림
                this.io.to(`user_${userId}`).emit('balanceUpdate', {
                    balance: newBalance,
                    timestamp: new Date()
                });
                
                logger.info(`Balance update sent to user ${userId}: ${newBalance}`);
            }
        } catch (error) {
            logger.error('Failed to notify balance update:', error);
        }
    }

    /**
     * 특정 사용자에게 입금 완료 알림
     */
    notifyDepositComplete(userId, depositInfo) {
        try {
            if (this.io) {
                this.io.to(`user_${userId}`).emit('depositComplete', {
                    amount: depositInfo.amount,
                    bonusAmount: depositInfo.bonusAmount,
                    finalAmount: depositInfo.finalAmount,
                    newBalance: depositInfo.newBalance,
                    timestamp: new Date()
                });
                
                logger.info(`Deposit complete notification sent to user ${userId}`);
            }
        } catch (error) {
            logger.error('Failed to notify deposit complete:', error);
        }
    }

    /**
     * 모든 관리자에게 새로운 입금 요청 알림
     */
    notifyAdminsNewDeposit(depositInfo) {
        try {
            if (this.io) {
                this.io.to('admin_room').emit('newDepositRequest', {
                    depositId: depositInfo.depositId,
                    userId: depositInfo.userId,
                    userName: depositInfo.userName,
                    amount: depositInfo.amount,
                    depositorName: depositInfo.depositorName,
                    timestamp: new Date()
                });
                
                logger.info('New deposit request notification sent to admins');
            }
        } catch (error) {
            logger.error('Failed to notify admins:', error);
        }
    }

    /**
     * 연결된 사용자 수 조회
     */
    getConnectedUsersCount() {
        return this.userSockets.size;
    }

    /**
     * 특정 사용자 연결 상태 확인
     */
    isUserConnected(userId) {
        return this.userSockets.has(userId);
    }
}

// 싱글톤 인스턴스
const websocketService = new WebSocketService();

module.exports = websocketService;