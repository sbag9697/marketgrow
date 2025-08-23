/**
 * MongoDB 연결 유틸리티 (서버리스 환경 최적화)
 * Cold start 시 연결 재사용으로 성능 향상
 */

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
}

// 서버리스 환경에서 연결 재사용을 위한 캐싱
let client = null;
let clientPromise = null;

/**
 * MongoDB 데이터베이스 연결 가져오기
 * @returns {Promise<import('mongodb').Db>} MongoDB 데이터베이스 인스턴스
 */
async function getDb() {
    try {
        if (!client) {
            // 첫 연결 또는 연결이 끊어진 경우
            client = new MongoClient(uri, {
                maxPoolSize: 5, // 서버리스 환경에 적합한 작은 풀 사이즈
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 10000,
                directConnection: true, // Railway 프록시용
            });
            
            clientPromise = client.connect();
        }
        
        // 연결 대기
        await clientPromise;
        
        // 데이터베이스 선택
        const dbName = process.env.MONGODB_DB || 'marketgrow';
        return client.db(dbName);
        
    } catch (error) {
        console.error('MongoDB connection error:', error);
        // 연결 실패 시 리셋
        client = null;
        clientPromise = null;
        throw error;
    }
}

/**
 * 연결 종료 (선택적, 보통 서버리스에서는 호출하지 않음)
 */
async function closeConnection() {
    if (client) {
        await client.close();
        client = null;
        clientPromise = null;
    }
}

module.exports = { 
    getDb,
    closeConnection
};