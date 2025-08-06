#!/usr/bin/env node

const { createIndexes } = require('../config/database');
const logger = require('../utils/logger');

// 서버 시작 전 초기화 작업
async function initializeServer() {
    try {
        logger.info('🚀 Initializing MarketGrow Server...');
        
        // 데이터베이스 인덱스 생성
        await createIndexes();
        
        // 환경 변수 검증
        const requiredEnvVars = [
            'MONGODB_URI',
            'JWT_SECRET',
            'JWT_REFRESH_SECRET'
        ];
        
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
            process.exit(1);
        }
        
        logger.info('✅ Server initialization completed');
        
        // 메인 서버 시작
        require('../server');
        
    } catch (error) {
        logger.error('❌ Server initialization failed:', error);
        process.exit(1);
    }
}

// 스크립트가 직접 실행되는 경우에만 초기화 실행
if (require.main === module) {
    initializeServer();
}

module.exports = initializeServer;