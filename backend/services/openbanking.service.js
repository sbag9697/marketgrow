const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');
const User = require('../models/User');
const Deposit = require('../models/Deposit');

class OpenBankingService {
    constructor() {
        // 오픈뱅킹 API 설정
        this.config = {
            baseUrl: process.env.OPENBANKING_BASE_URL || 'https://testapi.openbanking.or.kr',
            clientId: process.env.OPENBANKING_CLIENT_ID,
            clientSecret: process.env.OPENBANKING_CLIENT_SECRET,
            redirectUri: process.env.OPENBANKING_REDIRECT_URI || 'https://marketgrow.kr/api/webhook/openbanking',
            
            // 농협은행 계좌 정보
            bankCode: '011', // 농협은행 코드
            accountNum: process.env.NH_ACCOUNT_NUMBER || '3010373375401', // 하이픈 제거
            accountHolder: process.env.NH_ACCOUNT_HOLDER || '박시현'
        };

        // 액세스 토큰 (메모리 캐시)
        this.accessToken = null;
        this.tokenExpiresAt = null;
    }

    /**
     * 액세스 토큰 발급/갱신
     */
    async getAccessToken() {
        try {
            // 토큰이 유효한 경우 재사용
            if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
                return this.accessToken;
            }

            const response = await axios.post(`${this.config.baseUrl}/oauth/2.0/token`, {
                grant_type: 'client_credentials',
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                scope: 'inquiry transfer'
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiresAt = new Date(Date.now() + (response.data.expires_in * 1000) - 60000); // 1분 여유

            logger.info('OpenBanking access token refreshed');
            return this.accessToken;
        } catch (error) {
            logger.error('Failed to get OpenBanking access token:', error);
            throw new Error('오픈뱅킹 인증 실패');
        }
    }

    /**
     * 거래내역 조회 (입금 확인용)
     */
    async getTransactionHistory(fromDate = null, toDate = null) {
        try {
            const accessToken = await this.getAccessToken();
            
            // 날짜 설정 (기본: 오늘)
            const today = new Date();
            const from = fromDate || new Date(today.setHours(0, 0, 0, 0));
            const to = toDate || new Date();

            // 거래고유번호 생성
            const bankTranId = this.generateBankTranId();

            const params = {
                bank_tran_id: bankTranId,
                fintech_use_num: process.env.NH_FINTECH_USE_NUM, // 핀테크이용번호
                inquiry_type: 'A', // A: 전체, I: 입금, O: 출금
                inquiry_base: 'D', // D: 일자, T: 시간
                from_date: this.formatDate(from),
                to_date: this.formatDate(to),
                sort_order: 'D', // D: 내림차순
                tran_dtime: this.formatDateTime(new Date())
            };

            const response = await axios.get(`${this.config.baseUrl}/v2.0/account/transaction_list/fin_num`, {
                params,
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            return response.data.res_list || [];
        } catch (error) {
            logger.error('Failed to get transaction history:', error);
            throw error;
        }
    }

    /**
     * 잔액 조회
     */
    async getAccountBalance() {
        try {
            const accessToken = await this.getAccessToken();
            const bankTranId = this.generateBankTranId();

            const params = {
                bank_tran_id: bankTranId,
                fintech_use_num: process.env.NH_FINTECH_USE_NUM,
                tran_dtime: this.formatDateTime(new Date())
            };

            const response = await axios.get(`${this.config.baseUrl}/v2.0/account/balance/fin_num`, {
                params,
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            return {
                balance: parseInt(response.data.balance_amt),
                available: parseInt(response.data.available_amt),
                accountHolder: response.data.account_holder_name
            };
        } catch (error) {
            logger.error('Failed to get account balance:', error);
            throw error;
        }
    }

    /**
     * 입금 내역 확인 및 자동 처리
     */
    async checkAndProcessDeposits() {
        try {
            logger.info('Starting deposit check process...');

            // 최근 24시간 거래내역 조회
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const transactions = await this.getTransactionHistory(yesterday);

            // 입금 내역만 필터링
            const deposits = transactions.filter(tx => tx.inout_type === '입금');

            for (const deposit of deposits) {
                await this.processDeposit(deposit);
            }

            logger.info(`Processed ${deposits.length} deposits`);
            return deposits.length;
        } catch (error) {
            logger.error('Deposit check process failed:', error);
            throw error;
        }
    }

    /**
     * 개별 입금 처리
     */
    async processDeposit(transaction) {
        try {
            const amount = parseInt(transaction.tran_amt);
            const depositorName = transaction.print_content; // 입금자명
            const tranDate = transaction.tran_date;
            const tranTime = transaction.tran_time;
            const tranId = `${tranDate}${tranTime}${amount}`; // 고유 식별자

            // 이미 처리된 거래인지 확인
            const existingDeposit = await Deposit.findOne({
                'bankTransfer.transactionId': tranId
            });

            if (existingDeposit) {
                logger.info(`Transaction already processed: ${tranId}`);
                return;
            }

            // 대기 중인 충전 요청 찾기 (금액과 입금자명으로 매칭)
            const pendingDeposit = await Deposit.findOne({
                status: 'pending',
                amount: amount,
                depositorName: depositorName,
                method: 'bank_transfer'
            }).sort({ createdAt: -1 });

            if (pendingDeposit) {
                // 입금 확인 처리
                pendingDeposit.status = 'completed';
                pendingDeposit.completedAt = new Date();
                pendingDeposit.bankTransfer.transactionId = tranId;
                pendingDeposit.bankTransfer.confirmedAmount = amount;
                await pendingDeposit.save();

                // 사용자 예치금 증가
                const user = await User.findById(pendingDeposit.user);
                if (user) {
                    user.depositBalance = (user.depositBalance || 0) + pendingDeposit.finalAmount;
                    await user.save();

                    logger.info(`Auto-confirmed deposit: User ${user.email}, Amount: ${pendingDeposit.finalAmount}`);

                    // 알림 발송 (이메일/SMS)
                    await this.sendDepositNotification(user, pendingDeposit);
                }
            } else {
                // 매칭되지 않은 입금 (수동 확인 필요)
                logger.warn(`Unmatched deposit: Amount ${amount}, Depositor: ${depositorName}`);
                
                // 미확인 입금 기록
                await Deposit.create({
                    amount: amount,
                    depositorName: depositorName,
                    method: 'bank_transfer',
                    status: 'unmatched',
                    bankTransfer: {
                        transactionId: tranId,
                        bank: '농협은행',
                        confirmedAmount: amount,
                        tranDate: tranDate,
                        tranTime: tranTime
                    }
                });
            }
        } catch (error) {
            logger.error('Failed to process deposit:', error);
            throw error;
        }
    }

    /**
     * 입금 완료 알림 발송
     */
    async sendDepositNotification(user, deposit) {
        try {
            // 이메일 발송
            const emailService = require('./email.service');
            const emailClient = new emailService();
            
            await emailClient.sendDepositConfirmation(user.email, {
                name: user.name,
                amount: deposit.amount,
                bonusAmount: deposit.bonusAmount,
                finalAmount: deposit.finalAmount,
                balance: user.depositBalance
            });

            // SMS 발송 (선택)
            if (process.env.SMS_ENABLED === 'true') {
                const smsService = require('./sms.service');
                const smsClient = new smsService();
                
                await smsClient.sendSMS(user.phone, 
                    `[MarketGrow] 예치금 ${deposit.finalAmount.toLocaleString()}원이 충전되었습니다. 잔액: ${user.depositBalance.toLocaleString()}원`
                );
            }
        } catch (error) {
            logger.error('Failed to send deposit notification:', error);
            // 알림 실패는 무시 (입금 처리는 완료)
        }
    }

    /**
     * 거래고유번호 생성
     */
    generateBankTranId() {
        const clientUseCode = this.config.clientId.substring(0, 9);
        const uniqueId = Date.now().toString().substring(3);
        return `${clientUseCode}U${uniqueId}`;
    }

    /**
     * 날짜 포맷 (YYYYMMDD)
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    /**
     * 날짜시간 포맷 (YYYYMMDDHHmmss)
     */
    formatDateTime(date) {
        const dateStr = this.formatDate(date);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${dateStr}${hours}${minutes}${seconds}`;
    }
}

module.exports = OpenBankingService;