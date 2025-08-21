const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const TokenStore = require('../models/TokenStore'); // 토큰 영구 저장용

class OpenBankingService {
    constructor() {
        // 오픈뱅킹 API 설정
        this.config = {
            baseUrl: process.env.OPENBANKING_BASE_URL || 'https://testapi.openbanking.or.kr',
            clientId: process.env.OPENBANKING_CLIENT_ID,
            clientSecret: process.env.OPENBANKING_CLIENT_SECRET,
            redirectUri: process.env.OPENBANKING_REDIRECT_URI || 'https://marketgrow.kr/api/openbanking/callback',
            clientUseCode: process.env.OPENBANKING_CLIENT_USE_CODE, // 기관코드
            
            // 농협은행 계좌 정보
            bankCode: '011', // 농협은행 코드
            accountNum: process.env.NH_ACCOUNT_NUMBER || '3010373375401', // 하이픈 제거
            accountHolder: process.env.NH_ACCOUNT_HOLDER || '박시현'
        };

        // 액세스 토큰 (메모리 캐시)
        this.accessToken = null;
        this.tokenExpiresAt = null;
        
        // 중복 처리 방지용 (최근 처리된 거래 ID 캐시)
        this.processedTransactions = new Set();
        this.lastCleanup = Date.now();
    }

    /**
     * 액세스 토큰 발급/갱신 (영구 저장)
     */
    async getAccessToken() {
        try {
            // 메모리 캐시 확인
            if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
                return this.accessToken;
            }

            // DB에서 토큰 확인
            const tokenData = await TokenStore.findOne({ 
                service: 'openbanking',
                type: 'access_token' 
            });

            if (tokenData && tokenData.expiresAt && new Date() < tokenData.expiresAt) {
                this.accessToken = tokenData.token;
                this.tokenExpiresAt = tokenData.expiresAt;
                return this.accessToken;
            }

            // 새 토큰 발급
            const params = new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                scope: 'inquiry transfer'
            });

            const response = await axios.post(`${this.config.baseUrl}/oauth/2.0/token`, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const accessToken = response.data.access_token;
            const expiresIn = response.data.expires_in || 3600;
            const expiresAt = new Date(Date.now() + (expiresIn * 1000) - 60000); // 1분 여유

            // 메모리 캐시 업데이트
            this.accessToken = accessToken;
            this.tokenExpiresAt = expiresAt;

            // DB에 토큰 저장
            await TokenStore.findOneAndUpdate(
                { service: 'openbanking', type: 'access_token' },
                { 
                    token: accessToken,
                    expiresAt: expiresAt,
                    updatedAt: new Date()
                },
                { upsert: true }
            );

            // 보안 로그
            logger.info('OpenBanking access token refreshed', {
                service: 'openbanking',
                action: 'token_refresh',
                clientId: this.config.clientId,
                expiresAt: expiresAt
            });
            
            return this.accessToken;
        } catch (error) {
            logger.error('Failed to get OpenBanking access token:', {
                error: error.message,
                response: error.response?.data,
                service: 'openbanking',
                action: 'token_refresh_failed'
            });
            throw new Error('오픈뱅킹 인증 실패');
        }
    }

    /**
     * Authorization Code를 Access Token으로 교환
     */
    async exchangeCodeForToken(code) {
        try {
            const params = new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                redirect_uri: this.config.redirectUri,
                code: code
            });

            const response = await axios.post(`${this.config.baseUrl}/oauth/2.0/token`, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const tokenData = response.data;
            const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000) - 60000);

            // 메모리 캐시 업데이트
            this.accessToken = tokenData.access_token;
            this.tokenExpiresAt = expiresAt;

            // DB에 토큰 저장
            await TokenStore.findOneAndUpdate(
                { service: 'openbanking', type: 'access_token' },
                { 
                    token: tokenData.access_token,
                    expiresAt: expiresAt,
                    metadata: {
                        refreshToken: tokenData.refresh_token,
                        scope: tokenData.scope,
                        tokenType: tokenData.token_type
                    },
                    updatedAt: new Date()
                },
                { upsert: true }
            );

            logger.info('OpenBanking authorization code exchanged', {
                service: 'openbanking',
                action: 'code_exchange_success',
                scope: tokenData.scope,
                expiresAt: expiresAt
            });

            return tokenData;
        } catch (error) {
            logger.error('Failed to exchange authorization code:', {
                error: error.message,
                response: error.response?.data,
                service: 'openbanking',
                action: 'code_exchange_failed'
            });
            throw new Error('오픈뱅킹 토큰 교환 실패');
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
            const tranDtime = this.formatDateTime(new Date());

            const params = {
                bank_tran_id: bankTranId,
                fintech_use_num: process.env.NH_FINTECH_USE_NUM, // 핀테크이용번호
                inquiry_type: 'I', // I: 입금만 조회
                inquiry_base: 'D', // D: 일자
                from_date: this.formatDate(from),
                to_date: this.formatDate(to),
                sort_order: 'D', // D: 내림차순 (최신순)
                tran_dtime: tranDtime,
                befor_inquiry_trace_info: '', // 이전 조회 추적정보 (페이징용)
                page_index: '1' // 페이지 번호
            };

            // 감사 로그
            logger.info('Requesting transaction history', {
                service: 'openbanking',
                action: 'transaction_inquiry',
                bankTranId: bankTranId,
                fromDate: this.formatDate(from),
                toDate: this.formatDate(to),
                tranDtime: tranDtime
            });

            const response = await axios.get(`${this.config.baseUrl}/v2.0/account/transaction_list/fin_num`, {
                params,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Client-Use-Code': this.config.clientUseCode || this.config.clientId.substring(0, 9)
                }
            });

            const transactions = response.data.res_list || [];
            
            // 응답 로그
            logger.info('Transaction history received', {
                service: 'openbanking',
                action: 'transaction_inquiry_success',
                bankTranId: bankTranId,
                transactionCount: transactions.length,
                apiTranId: response.data.api_tran_id
            });

            return transactions;
        } catch (error) {
            logger.error('Failed to get transaction history:', {
                error: error.message,
                response: error.response?.data,
                service: 'openbanking',
                action: 'transaction_inquiry_failed'
            });
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
            const tranDtime = this.formatDateTime(new Date());

            const params = {
                bank_tran_id: bankTranId,
                fintech_use_num: process.env.NH_FINTECH_USE_NUM,
                tran_dtime: tranDtime
            };

            // 감사 로그
            logger.info('Requesting account balance', {
                service: 'openbanking',
                action: 'balance_inquiry',
                bankTranId: bankTranId,
                tranDtime: tranDtime
            });

            const response = await axios.get(`${this.config.baseUrl}/v2.0/account/balance/fin_num`, {
                params,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Client-Use-Code': this.config.clientUseCode || this.config.clientId.substring(0, 9)
                }
            });

            const result = {
                balance: parseInt(response.data.balance_amt),
                available: parseInt(response.data.available_amt),
                accountHolder: response.data.account_holder_name
            };

            // 응답 로그
            logger.info('Balance inquiry success', {
                service: 'openbanking',
                action: 'balance_inquiry_success',
                bankTranId: bankTranId,
                balance: result.balance,
                apiTranId: response.data.api_tran_id
            });

            return result;
        } catch (error) {
            logger.error('Failed to get account balance:', {
                error: error.message,
                response: error.response?.data,
                service: 'openbanking',
                action: 'balance_inquiry_failed'
            });
            throw error;
        }
    }

    /**
     * 입금 내역 확인 및 자동 처리 (멱등성 보장)
     */
    async checkAndProcessDeposits() {
        const checkId = `check_${Date.now()}`;
        
        try {
            // 중복 처리된 거래 ID 정리 (1시간마다)
            this.cleanupProcessedTransactions();

            logger.info('Starting deposit check process', {
                service: 'openbanking',
                action: 'deposit_check_start',
                checkId: checkId
            });

            // 최근 6시간 거래내역 조회 (5분 폴링을 고려)
            const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
            const transactions = await this.getTransactionHistory(sixHoursAgo);

            // 입금 내역만 필터링 (이미 입금으로 필터됨)
            const deposits = transactions.filter(tx => {
                const tranId = this.generateTransactionId(tx);
                return !this.processedTransactions.has(tranId);
            });

            let processedCount = 0;
            for (const deposit of deposits) {
                try {
                    const tranId = this.generateTransactionId(deposit);
                    
                    // 중복 처리 방지
                    if (this.processedTransactions.has(tranId)) {
                        continue;
                    }

                    await this.processDeposit(deposit);
                    this.processedTransactions.add(tranId);
                    processedCount++;
                } catch (depositError) {
                    logger.error('Failed to process individual deposit:', {
                        error: depositError.message,
                        transaction: deposit,
                        service: 'openbanking',
                        action: 'deposit_process_failed'
                    });
                    // 개별 실패는 전체를 중단하지 않음
                }
            }

            logger.info('Deposit check process completed', {
                service: 'openbanking',
                action: 'deposit_check_complete',
                checkId: checkId,
                totalTransactions: transactions.length,
                newDeposits: deposits.length,
                processedCount: processedCount
            });
            
            return processedCount;
        } catch (error) {
            logger.error('Deposit check process failed:', {
                error: error.message,
                checkId: checkId,
                service: 'openbanking',
                action: 'deposit_check_failed'
            });
            throw error;
        }
    }

    /**
     * 개별 입금 처리 (고도화된 매칭 알고리즘)
     */
    async processDeposit(transaction) {
        const tranId = this.generateTransactionId(transaction);
        
        try {
            const amount = parseInt(transaction.tran_amt);
            const depositorName = this.cleanDepositorName(transaction.print_content); // 입금자명 정제
            const tranDate = transaction.tran_date;
            const tranTime = transaction.tran_time;
            const tranDateTime = new Date(`${tranDate.slice(0,4)}-${tranDate.slice(4,6)}-${tranDate.slice(6,8)} ${tranTime.slice(0,2)}:${tranTime.slice(2,4)}:${tranTime.slice(4,6)}`);

            // 중복 처리 방지
            const existingDeposit = await Deposit.findOne({
                'bankTransfer.transactionId': tranId
            });

            if (existingDeposit) {
                logger.info('Transaction already processed', {
                    transactionId: tranId,
                    service: 'openbanking',
                    action: 'duplicate_transaction_skip'
                });
                return;
            }

            // 고도화된 매칭 알고리즘
            const matchedDeposit = await this.findMatchingDeposit(amount, depositorName, tranDateTime);

            if (matchedDeposit) {
                // 입금 확인 처리
                matchedDeposit.status = 'completed';
                matchedDeposit.completedAt = new Date();
                matchedDeposit.bankTransfer = matchedDeposit.bankTransfer || {};
                matchedDeposit.bankTransfer.transactionId = tranId;
                matchedDeposit.bankTransfer.confirmedAmount = amount;
                matchedDeposit.bankTransfer.bank = '농협은행';
                matchedDeposit.bankTransfer.tranDate = tranDate;
                matchedDeposit.bankTransfer.tranTime = tranTime;
                matchedDeposit.bankTransfer.tranDateTime = tranDateTime;
                await matchedDeposit.save();

                // 사용자 예치금 증가
                const user = await User.findById(matchedDeposit.user);
                if (user) {
                    user.depositBalance = (user.depositBalance || 0) + matchedDeposit.finalAmount;
                    await user.save();

                    logger.info('Auto-confirmed deposit', {
                        userId: user._id,
                        userEmail: user.email,
                        depositId: matchedDeposit._id,
                        amount: matchedDeposit.finalAmount,
                        transactionId: tranId,
                        service: 'openbanking',
                        action: 'deposit_confirmed'
                    });

                    // 알림 발송 (이메일/SMS)
                    await this.sendDepositNotification(user, matchedDeposit);
                }
            } else {
                // 매칭되지 않은 입금 (수동 확인 필요)
                logger.warn('Unmatched deposit detected', {
                    amount: amount,
                    depositorName: depositorName,
                    tranDate: tranDate,
                    tranTime: tranTime,
                    transactionId: tranId,
                    service: 'openbanking',
                    action: 'unmatched_deposit'
                });
                
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
                        tranTime: tranTime,
                        tranDateTime: tranDateTime
                    },
                    createdAt: new Date()
                });
            }
        } catch (error) {
            logger.error('Failed to process deposit:', {
                error: error.message,
                transactionId: tranId,
                transaction: transaction,
                service: 'openbanking',
                action: 'deposit_process_error'
            });
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
     * 고도화된 매칭 알고리즘
     */
    async findMatchingDeposit(amount, depositorName, tranDateTime) {
        // 1차: 정확한 매칭 (금액 + 입금자명)
        let deposit = await Deposit.findOne({
            status: 'pending',
            amount: amount,
            depositorName: depositorName,
            method: 'bank_transfer',
            createdAt: { $gte: new Date(tranDateTime.getTime() - 24 * 60 * 60 * 1000) } // 24시간 이내
        }).sort({ createdAt: -1 });

        if (deposit) return deposit;

        // 2차: 유사한 이름 매칭 (금액 + 유사 이름)
        const similarNameDeposits = await Deposit.find({
            status: 'pending',
            amount: amount,
            method: 'bank_transfer',
            createdAt: { $gte: new Date(tranDateTime.getTime() - 24 * 60 * 60 * 1000) }
        }).sort({ createdAt: -1 });

        for (const dep of similarNameDeposits) {
            if (this.isSimilarName(depositorName, dep.depositorName)) {
                return dep;
            }
        }

        // 3차: 금액만 매칭 (최근 생성된 것 우선)
        deposit = await Deposit.findOne({
            status: 'pending',
            amount: amount,
            method: 'bank_transfer',
            createdAt: { $gte: new Date(tranDateTime.getTime() - 6 * 60 * 60 * 1000) } // 6시간 이내
        }).sort({ createdAt: -1 });

        return deposit;
    }

    /**
     * 입금자명 정제
     */
    cleanDepositorName(name) {
        return name
            .replace(/[^가-힣a-zA-Z0-9]/g, '') // 특수문자 제거
            .trim()
            .toLowerCase();
    }

    /**
     * 이름 유사도 검사
     */
    isSimilarName(name1, name2) {
        const clean1 = this.cleanDepositorName(name1);
        const clean2 = this.cleanDepositorName(name2);
        
        // 정확히 일치
        if (clean1 === clean2) return true;
        
        // 포함 관계 (한 이름이 다른 이름에 포함)
        if (clean1.includes(clean2) || clean2.includes(clean1)) return true;
        
        // 레벤슈타인 거리 (편집 거리) 계산
        const distance = this.levenshteinDistance(clean1, clean2);
        const maxLen = Math.max(clean1.length, clean2.length);
        const similarity = 1 - (distance / maxLen);
        
        // 80% 이상 유사하면 매칭
        return similarity >= 0.8;
    }

    /**
     * 레벤슈타인 거리 계산
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }

    /**
     * 거래 고유 ID 생성
     */
    generateTransactionId(transaction) {
        return `${transaction.tran_date}${transaction.tran_time}${transaction.tran_amt}${transaction.after_balance_amt || ''}`;
    }

    /**
     * 중복 처리된 거래 ID 정리
     */
    cleanupProcessedTransactions() {
        const now = Date.now();
        if (now - this.lastCleanup > 60 * 60 * 1000) { // 1시간마다
            this.processedTransactions.clear();
            this.lastCleanup = now;
        }
    }

    /**
     * 거래고유번호 생성 (은행 API용)
     */
    generateBankTranId() {
        const clientUseCode = this.config.clientUseCode || this.config.clientId.substring(0, 9);
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