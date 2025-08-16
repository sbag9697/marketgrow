const User = require('../models/User');
const Deposit = require('../models/Deposit');
const logger = require('../utils/logger');

class BankTransferService {
    constructor() {
        // 무통장입금 계좌 정보 (고정)
        this.bankAccounts = [
            {
                bank: '국민은행',
                accountNumber: '123456-78-901234',
                accountHolder: '마켓그로우(주)',
                active: true
            },
            {
                bank: '신한은행',
                accountNumber: '110-234-567890',
                accountHolder: '마켓그로우(주)',
                active: true
            },
            {
                bank: '우리은행',
                accountNumber: '1002-345-678901',
                accountHolder: '마켓그로우(주)',
                active: true
            },
            {
                bank: '하나은행',
                accountNumber: '234-567890-12345',
                accountHolder: '마켓그로우(주)',
                active: true
            },
            {
                bank: '농협은행',
                accountNumber: '301-2345-6789-01',
                accountHolder: '마켓그로우(주)',
                active: true
            }
        ];
    }

    /**
     * 활성화된 입금 계좌 목록 조회
     */
    getActiveAccounts() {
        return this.bankAccounts.filter(account => account.active);
    }

    /**
     * 무통장입금 요청 생성
     */
    async createBankTransferRequest(userId, amount, depositorName, selectedBank = null) {
        try {
            // 사용자 확인
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }

            // 최소/최대 금액 확인
            if (amount < 10000) {
                throw new Error('최소 충전 금액은 10,000원입니다.');
            }
            if (amount > 10000000) {
                throw new Error('최대 충전 금액은 10,000,000원입니다.');
            }

            // 입금 계좌 선택 (지정하지 않으면 첫 번째 활성 계좌)
            const activeAccounts = this.getActiveAccounts();
            if (activeAccounts.length === 0) {
                throw new Error('사용 가능한 입금 계좌가 없습니다.');
            }

            let bankAccount;
            if (selectedBank) {
                bankAccount = activeAccounts.find(acc => acc.bank === selectedBank);
                if (!bankAccount) {
                    throw new Error('선택한 은행의 계좌를 찾을 수 없습니다.');
                }
            } else {
                bankAccount = activeAccounts[0];
            }

            // 입금 식별 코드 생성 (마지막 4자리)
            const identificationCode = this.generateIdentificationCode();
            
            // 예치금 충전 요청 생성
            const deposit = new Deposit({
                user: userId,
                amount,
                bonusAmount: this.calculateBonus(amount),
                finalAmount: amount + this.calculateBonus(amount),
                depositorName: depositorName || user.name,
                method: 'bank_transfer',
                status: 'pending',
                bankTransfer: {
                    bank: bankAccount.bank,
                    accountNumber: bankAccount.accountNumber,
                    accountHolder: bankAccount.accountHolder,
                    identificationCode,
                    depositorName: depositorName || user.name,
                    requestedAt: new Date(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간 후 만료
                },
                orderId: `BANK_${Date.now()}_${identificationCode}`
            });

            await deposit.save();

            logger.info(`Bank transfer request created: ${deposit._id} for user ${userId}`);

            return {
                success: true,
                data: {
                    depositId: deposit._id,
                    bank: bankAccount.bank,
                    accountNumber: bankAccount.accountNumber,
                    accountHolder: bankAccount.accountHolder,
                    amount,
                    bonusAmount: deposit.bonusAmount,
                    finalAmount: deposit.finalAmount,
                    identificationCode,
                    depositorName: depositorName || user.name,
                    expiresAt: deposit.bankTransfer.expiresAt,
                    notice: `입금 시 입금자명 뒤에 ${identificationCode}를 꼭 입력해주세요. (예: ${depositorName || user.name}${identificationCode})`
                }
            };
        } catch (error) {
            logger.error('Bank transfer request creation failed:', error);
            throw error;
        }
    }

    /**
     * 입금 확인 (관리자용)
     */
    async confirmDeposit(depositId, adminId) {
        try {
            const deposit = await Deposit.findById(depositId);
            if (!deposit) {
                throw new Error('충전 요청을 찾을 수 없습니다.');
            }

            if (deposit.status !== 'pending') {
                throw new Error('이미 처리된 충전 요청입니다.');
            }

            // 입금 확인 처리
            deposit.status = 'completed';
            deposit.completedAt = new Date();
            deposit.confirmedBy = adminId;
            await deposit.save();

            // 사용자 예치금 증가
            const user = await User.findById(deposit.user);
            if (user) {
                user.depositBalance = (user.depositBalance || 0) + deposit.finalAmount;
                await user.save();

                logger.info(`Deposit confirmed: ${deposit._id}, User: ${user.email}, Amount: ${deposit.finalAmount}`);

                // 알림 발송
                await this.sendDepositNotification(user, deposit);
            }

            return {
                success: true,
                message: '입금이 확인되었습니다.',
                data: {
                    depositId: deposit._id,
                    userId: deposit.user,
                    amount: deposit.amount,
                    bonusAmount: deposit.bonusAmount,
                    finalAmount: deposit.finalAmount
                }
            };
        } catch (error) {
            logger.error('Deposit confirmation failed:', error);
            throw error;
        }
    }

    /**
     * 입금 요청 취소
     */
    async cancelDeposit(depositId, reason = '') {
        try {
            const deposit = await Deposit.findById(depositId);
            if (!deposit) {
                throw new Error('충전 요청을 찾을 수 없습니다.');
            }

            if (deposit.status !== 'pending') {
                throw new Error('대기 중인 충전 요청만 취소할 수 있습니다.');
            }

            deposit.status = 'cancelled';
            deposit.cancelledAt = new Date();
            deposit.cancelReason = reason;
            await deposit.save();

            logger.info(`Deposit cancelled: ${deposit._id}, Reason: ${reason}`);

            return {
                success: true,
                message: '충전 요청이 취소되었습니다.'
            };
        } catch (error) {
            logger.error('Deposit cancellation failed:', error);
            throw error;
        }
    }

    /**
     * 대기 중인 입금 목록 조회 (관리자용)
     */
    async getPendingDeposits() {
        try {
            const deposits = await Deposit.find({
                method: 'bank_transfer',
                status: 'pending'
            })
            .populate('user', 'email name phone')
            .sort({ createdAt: -1 });

            return deposits.map(deposit => ({
                id: deposit._id,
                user: {
                    id: deposit.user._id,
                    email: deposit.user.email,
                    name: deposit.user.name,
                    phone: deposit.user.phone
                },
                amount: deposit.amount,
                bonusAmount: deposit.bonusAmount,
                finalAmount: deposit.finalAmount,
                depositorName: deposit.depositorName,
                bank: deposit.bankTransfer.bank,
                accountNumber: deposit.bankTransfer.accountNumber,
                identificationCode: deposit.bankTransfer.identificationCode,
                requestedAt: deposit.createdAt,
                expiresAt: deposit.bankTransfer.expiresAt
            }));
        } catch (error) {
            logger.error('Failed to get pending deposits:', error);
            throw error;
        }
    }

    /**
     * 사용자 입금 내역 조회
     */
    async getUserDepositHistory(userId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            
            const deposits = await Deposit.find({
                user: userId,
                method: 'bank_transfer'
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

            const total = await Deposit.countDocuments({
                user: userId,
                method: 'bank_transfer'
            });

            return {
                deposits,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total,
                    limit
                }
            };
        } catch (error) {
            logger.error('Failed to get user deposit history:', error);
            throw error;
        }
    }

    /**
     * 입금 식별 코드 생성 (4자리)
     */
    generateIdentificationCode() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    /**
     * 보너스 계산
     */
    calculateBonus(amount) {
        if (amount >= 1000000) return Math.floor(amount * 0.20); // 100만원 이상 20%
        if (amount >= 500000) return Math.floor(amount * 0.15); // 50만원 이상 15%
        if (amount >= 300000) return Math.floor(amount * 0.10); // 30만원 이상 10%
        if (amount >= 100000) return Math.floor(amount * 0.05); // 10만원 이상 5%
        if (amount >= 50000) return Math.floor(amount * 0.03); // 5만원 이상 3%
        return 0;
    }

    /**
     * 입금 완료 알림
     */
    async sendDepositNotification(user, deposit) {
        try {
            // 이메일 발송
            if (user.email) {
                const emailContent = `
                    안녕하세요 ${user.name}님,
                    
                    예치금 충전이 완료되었습니다.
                    
                    충전 금액: ${deposit.amount.toLocaleString()}원
                    보너스 금액: ${deposit.bonusAmount.toLocaleString()}원
                    최종 충전 금액: ${deposit.finalAmount.toLocaleString()}원
                    
                    현재 예치금 잔액: ${user.depositBalance.toLocaleString()}원
                    
                    감사합니다.
                    MarketGrow 팀
                `;
                
                // EmailService 사용하여 발송
                logger.info(`Deposit notification email sent to ${user.email}`);
            }

            // SMS 발송 (설정된 경우)
            if (user.phone && process.env.SMS_ENABLED === 'true') {
                const smsContent = `[MarketGrow] 예치금 ${deposit.finalAmount.toLocaleString()}원 충전 완료. 잔액: ${user.depositBalance.toLocaleString()}원`;
                
                // SMSService 사용하여 발송
                logger.info(`SMS notification sent to ${user.phone}`);
            }
        } catch (error) {
            logger.error('Failed to send deposit notification:', error);
        }
    }

    /**
     * 만료된 입금 요청 정리
     */
    async cleanupExpiredDeposits() {
        try {
            const expiredDeposits = await Deposit.find({
                method: 'bank_transfer',
                status: 'pending',
                'bankTransfer.expiresAt': { $lt: new Date() }
            });

            for (const deposit of expiredDeposits) {
                deposit.status = 'expired';
                deposit.expiredAt = new Date();
                await deposit.save();
                logger.info(`Expired deposit cleaned up: ${deposit._id}`);
            }

            return {
                success: true,
                count: expiredDeposits.length
            };
        } catch (error) {
            logger.error('Failed to cleanup expired deposits:', error);
            throw error;
        }
    }
}

module.exports = BankTransferService;