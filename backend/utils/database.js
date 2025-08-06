const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const logger = require('./logger');

let mongoServer = null;

const connectDB = async () => {
    try {
        let mongoUri;

        // Try to connect to cloud/local MongoDB first
        if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('localhost')) {
            mongoUri = process.env.MONGODB_URI;
            logger.info('Attempting to connect to cloud MongoDB...');
        } else {
            // If no cloud URI or local connection fails, use in-memory database
            logger.info('Starting in-memory MongoDB server...');
            mongoServer = await MongoMemoryServer.create({
                instance: {
                    dbName: 'marketgrow'
                }
            });
            mongoUri = mongoServer.getUri();
            logger.info('In-memory MongoDB server started');
        }

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        logger.info('MongoDB connected successfully');
        return true;
    } catch (err) {
        logger.error('MongoDB connection error:', err);
        
        // If cloud connection fails, try in-memory database
        if (!mongoServer) {
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