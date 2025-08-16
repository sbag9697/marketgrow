const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const logger = require('./logger');

let mongoServer = null;

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        
        // MongoDB URI 확인
        if (!mongoUri) {
            logger.warn('MONGODB_URI is empty. Running without DB.');
            mongoose.set('bufferCommands', false);
            return false;
        }
        
        // 내부 전용 호스트 사용 방지
        if (mongoUri.includes('mongodb.railway.internal')) {
            logger.error('MONGODB_URI is using internal Railway host. Use the PUBLIC external host/port URI.');
            mongoose.set('bufferCommands', false);
            return false;
        }
        
        // 테스트 모드 확인
        if (process.env.USE_TEST_MODE === 'true' || mongoUri.includes('localhost')) {
            logger.info('Test mode enabled - using in-memory database');
            // 아래 in-memory DB 로직으로 이동
        } else {
            // 연결 타입 로그
            if (mongoUri.includes('containers') && mongoUri.includes('railway.app')) {
                logger.info('Using Railway MongoDB (External Connection)');
            } else if (mongoUri.includes('mongodb+srv://')) {
                logger.info('Using MongoDB Atlas (SRV connection)');
            } else {
                logger.info('Using standard MongoDB connection');
            }
            
            logger.info('Attempting to connect to MongoDB...');
            
            // 최신 드라이버 옵션 (useNewUrlParser/useUnifiedTopology 제거)
            const options = {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 20000,
                socketTimeoutMS: 45000,
                family: 4, // IPv4 강제
                retryWrites: true,
                w: 'majority',
                authSource: 'admin'
            };
            
            // TLS 설정 (필요한 경우만)
            if (mongoUri.includes('tls=true') || mongoUri.includes('ssl=true')) {
                options.tls = true;
            }
            
            // 전역 버퍼링 금지
            mongoose.set('bufferCommands', false);
            mongoose.set('strictQuery', true);
            
            try {
                await mongoose.connect(mongoUri, options);
                logger.info('✅ MongoDB connected successfully');
                return true;
            } catch (cloudError) {
                logger.error('MongoDB connection failed:', cloudError);
                
                // 프로덕션 환경에서는 in-memory DB 사용하지 않고 계속 진행
                if (process.env.NODE_ENV === 'production') {
                    logger.warn('Running without database connection in production mode');
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