const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error(err.stack);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = '리소스를 찾을 수 없습니다.';
        error = { message, statusCode: 404 };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        let message = '중복된 데이터입니다.';
        
        // Extract field name from error
        const field = Object.keys(err.keyValue)[0];
        if (field === 'email') {
            message = '이미 사용 중인 이메일입니다.';
        } else if (field === 'username') {
            message = '이미 사용 중인 아이디입니다.';
        } else if (field === 'phone') {
            message = '이미 사용 중인 전화번호입니다.';
        }
        
        error = { message, statusCode: 400 };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, statusCode: 400 };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = '유효하지 않은 토큰입니다.';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = '토큰이 만료되었습니다.';
        error = { message, statusCode: 401 };
    }

    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = '파일 크기가 너무 큽니다.';
        error = { message, statusCode: 400 };
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        const message = '허용되지 않는 파일 형식입니다.';
        error = { message, statusCode: 400 };
    }

    // Rate limit errors
    if (err.status === 429) {
        const message = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
        error = { message, statusCode: 429 };
    }

    // Database connection errors
    if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
        const message = '데이터베이스 연결 오류입니다.';
        error = { message, statusCode: 500 };
    }

    // Payment errors
    if (err.name === 'PaymentError') {
        error = { message: err.message || '결제 처리 중 오류가 발생했습니다.', statusCode: 400 };
    }

    // Service provider errors
    if (err.name === 'ServiceProviderError') {
        error = { message: '서비스 제공업체 오류입니다.', statusCode: 502 };
    }

    // Default error
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || '서버 내부 오류가 발생했습니다.',
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            error: err 
        })
    });
};

module.exports = errorHandler;