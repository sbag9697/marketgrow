const mongoose = require('mongoose');
const logger = require('../utils/logger');

// MongoDB 연결 설정
const connectDB = async () => {
    try {
        // 연결 옵션
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10, // 최대 연결 풀 크기
            serverSelectionTimeoutMS: 5000, // 서버 선택 타임아웃
            socketTimeoutMS: 45000, // 소켓 타임아웃
            family: 4, // IPv4 사용
            retryWrites: true,
            w: 'majority'
        };

        // MongoDB 연결
        const conn = await mongoose.connect(process.env.MONGODB_URI, options);

        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
        logger.info(`📊 Database: ${conn.connection.name}`);

        // 연결 이벤트 리스너
        mongoose.connection.on('error', (err) => {
            logger.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('⚠️ MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('🔄 MongoDB reconnected');
        });

        // 개발 환경에서 몽구스 쿼리 로깅
        if (process.env.NODE_ENV === 'development') {
            mongoose.set('debug', true);
        }

        return conn;
    } catch (error) {
        logger.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};

// 데이터베이스 연결 상태 확인
const checkConnection = () => {
    return mongoose.connection.readyState === 1;
};

// 데이터베이스 연결 종료
const closeConnection = async () => {
    try {
        await mongoose.connection.close();
        logger.info('✅ MongoDB connection closed');
    } catch (error) {
        logger.error('❌ Error closing MongoDB connection:', error);
    }
};

// 데이터베이스 통계
const getStats = async () => {
    try {
        const stats = await mongoose.connection.db.stats();
        return {
            database: mongoose.connection.name,
            collections: stats.collections,
            dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
            indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`,
            totalSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
            documents: stats.objects
        };
    } catch (error) {
        logger.error('Error getting database stats:', error);
        return null;
    }
};

// 컬렉션 인덱스 생성
const createIndexes = async () => {
    try {
        const db = mongoose.connection.db;
        
        // Users 컬렉션 인덱스
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ phone: 1 });
        await db.collection('users').createIndex({ createdAt: -1 });
        
        // Orders 컬렉션 인덱스
        await db.collection('orders').createIndex({ userId: 1 });
        await db.collection('orders').createIndex({ orderNumber: 1 }, { unique: true });
        await db.collection('orders').createIndex({ status: 1 });
        await db.collection('orders').createIndex({ createdAt: -1 });
        
        // Payments 컬렉션 인덱스
        await db.collection('payments').createIndex({ paymentId: 1 }, { unique: true });
        await db.collection('payments').createIndex({ userId: 1 });
        await db.collection('payments').createIndex({ orderId: 1 });
        await db.collection('payments').createIndex({ status: 1 });
        await db.collection('payments').createIndex({ createdAt: -1 });
        
        // Services 컬렉션 인덱스
        await db.collection('services').createIndex({ category: 1 });
        await db.collection('services').createIndex({ platform: 1 });
        await db.collection('services').createIndex({ isActive: 1 });
        await db.collection('services').createIndex({ price: 1 });
        
        // Notifications 컬렉션 인덱스
        await db.collection('notifications').createIndex({ userId: 1 });
        await db.collection('notifications').createIndex({ type: 1 });
        await db.collection('notifications').createIndex({ createdAt: -1 });
        
        // TTL 인덱스 (자동 삭제)
        await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        await db.collection('passwordresets').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        await db.collection('verificationcodes').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        
        logger.info('✅ Database indexes created successfully');
    } catch (error) {
        logger.error('❌ Error creating database indexes:', error);
    }
};

// 데이터베이스 백업 (개발용)
const createBackup = async () => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const backup = {};
        
        for (const collection of collections) {
            const collectionName = collection.name;
            const documents = await mongoose.connection.db.collection(collectionName).find({}).toArray();
            backup[collectionName] = documents;
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fs = require('fs');
        const path = require('path');
        
        const backupDir = path.join(__dirname, '../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const backupPath = path.join(backupDir, `backup-${timestamp}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
        
        logger.info(`✅ Database backup created: ${backupPath}`);
        return backupPath;
    } catch (error) {
        logger.error('❌ Error creating database backup:', error);
        return null;
    }
};

module.exports = {
    connectDB,
    checkConnection,
    closeConnection,
    getStats,
    createIndexes,
    createBackup
};