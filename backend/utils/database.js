const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const logger = require('./logger');

let mongoServer = null;

const connectDB = async () => {
    try {
        let mongoUri;

        // MongoDB URI 환경변수 확인
        if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('localhost')) {
            mongoUri = process.env.MONGODB_URI;
            
            // DNS 문제 해결: mongodb+srv를 mongodb로 변경하고 직접 호스트 지정
            // MongoDB Atlas 클러스터의 실제 호스트를 사용
            if (mongoUri.includes('mongodb+srv://')) {
                // SRV 레코드 대신 직접 연결 방식 사용
                mongoUri = 'mongodb://marketgrow:JXcmH4vNz26QKjEo@' +
                          'cluster0-shard-00-00.c586sbu.mongodb.net:27017,' +
                          'cluster0-shard-00-01.c586sbu.mongodb.net:27017,' +
                          'cluster0-shard-00-02.c586sbu.mongodb.net:27017/' +
                          'marketgrow?ssl=true&replicaSet=atlas-13qgzv-shard-0&authSource=admin&retryWrites=true&w=majority';
                logger.info('Using direct connection string for MongoDB Atlas');
            }
            
            logger.info('Attempting to connect to cloud MongoDB...');
            
            // DNS 문제 해결을 위한 연결 옵션
            const options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 30000, // 30초로 증가
                socketTimeoutMS: 45000,
                family: 4, // IPv4 강제 사용
                retryWrites: true,
                w: 'majority',
                // DNS 관련 추가 옵션
                directConnection: false,
                ssl: true,
                sslValidate: true,
                authSource: 'admin'
            };
            
            try {
                await mongoose.connect(mongoUri, options);
                logger.info('MongoDB Atlas connected successfully');
                return true;
            } catch (cloudError) {
                logger.error('Cloud MongoDB connection failed:', cloudError);
                
                // 프로덕션 환경에서는 in-memory DB 사용하지 않고 계속 진행
                if (process.env.NODE_ENV === 'production') {
                    logger.warn('Running without database connection in production mode');
                    // Mongoose buffering 비활성화
                    mongoose.set('bufferCommands', false);
                    mongoose.set('autoCreate', false);
                    return false;
                }
                
                // 개발 환경에서는 in-memory DB로 폴백
                throw cloudError;
            }
        }
        
        // In-memory MongoDB 사용 (개발 환경)
        logger.info('Starting in-memory MongoDB server...');
        mongoServer = await MongoMemoryServer.create({
            instance: {
                dbName: 'marketgrow'
            }
        });
        mongoUri = mongoServer.getUri();
        logger.info('In-memory MongoDB server started');
        
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        logger.info('In-memory MongoDB connected successfully');
        return true;
        
    } catch (err) {
        logger.error('MongoDB connection error:', err);

        // 연결 실패 시 in-memory database 시도
        if (!mongoServer && process.env.NODE_ENV !== 'production') {
            try {
                logger.info('Falling back to in-memory MongoDB server...');
                mongoServer = await MongoMemoryServer.create({
                    instance: {
                        dbName: 'marketgrow'
                    }
                });
                const mongoUri = mongoServer.getUri();

                await mongoose.connect(mongoUri, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                });

                logger.info('In-memory MongoDB connected successfully');
                return true;
            } catch (memErr) {
                logger.error('In-memory MongoDB connection error:', memErr);
                return false;
            }
        }
        
        // 프로덕션에서는 DB 없이도 서버 실행
        if (process.env.NODE_ENV === 'production') {
            logger.warn('Server running without database connection');
            return false;
        }
        
        return false;
    }
};

const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        if (mongoServer) {
            await mongoServer.stop();
            mongoServer = null;
        }
        logger.info('MongoDB disconnected');
    } catch (err) {
        logger.error('Error disconnecting from MongoDB:', err);
    }
};

// Mongoose 이벤트 리스너
mongoose.connection.on('connected', () => {
    logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    logger.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    logger.info('Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await disconnectDB();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await disconnectDB();
    process.exit(0);
});

module.exports = {
    connectDB,
    disconnectDB
};