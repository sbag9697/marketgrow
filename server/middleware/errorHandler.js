const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error('Error Handler:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        user: req.user ? { id: req.user._id, email: req.user.email } : null
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = '리소스를 찾을 수 없습니다';
        error = {
            message,
            statusCode: 404,
            error: 'RESOURCE_NOT_FOUND'
        };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        let message = '중복된 값입니다';
        
        switch (field) {
            case 'email':
                message = '이미 등록된 이메일입니다';
                break;
            case 'phone':
                message = '이미 등록된 휴대폰 번호입니다';
                break;
            case 'orderNumber':
                message = '중복된 주문번호입니다';
                break;
            case 'paymentId':
                message = '중복된 결제ID입니다';
                break;
            case 'referralCode':
                message = '중복된 추천코드입니다';
                break;
        }
        
        error = {
            message,
            statusCode: 400,
            error: 'DUPLICATE_VALUE',
            field
        };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = {
            message,
            statusCode: 400,
            error: 'VALIDATION_ERROR',
            details: Object.keys(err.errors).reduce((acc, key) => {
                acc[key] = err.errors[key].message;
                return acc;
            }, {})
        };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = {
            message: '유효하지 않은 토큰입니다',
            statusCode: 401,
            error: 'INVALID_TOKEN'
        };
    }

    if (err.name === 'TokenExpiredError') {
        error = {
            message: '토큰이 만료되었습니다',
            statusCode: 401,
            error: 'TOKEN_EXPIRED'
        };
    }

    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        error = {
            message: '파일 크기가 너무 큽니다',
            statusCode: 400,
            error: 'FILE_TOO_LARGE'
        };
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
        error = {
            message: '파일 개수가 제한을 초과했습니다',
            statusCode: 400,
            error: 'TOO_MANY_FILES'
        };
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        error = {
            message: '허용되지 않은 파일 필드입니다',
            statusCode: 400,
            error: 'INVALID_FILE_FIELD'
        };
    }

    // Rate limiting error
    if (err.status === 429) {
        error = {
            message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요',
            statusCode: 429,
            error: 'RATE_LIMIT_EXCEEDED'
        };
    }

    // Payment errors
    if (err.code === 'PAYMENT_FAILED') {
        error = {
            message: err.message || '결제 처리 중 오류가 발생했습니다',
            statusCode: 400,
            error: 'PAYMENT_FAILED',
            details: err.details
        };
    }

    if (err.code === 'INSUFFICIENT_FUNDS') {
        error = {
            message: '잔액이 부족합니다',
            statusCode: 400,
            error: 'INSUFFICIENT_FUNDS'
        };
    }

    // External API errors
    if (err.code === 'EXTERNAL_API_ERROR') {
        error = {
            message: '외부 서비스 연동 중 오류가 발생했습니다',
            statusCode: 502,
            error: 'EXTERNAL_API_ERROR',
            service: err.service
        };
    }

    // Database connection errors
    if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
        error = {
            message: '데이터베이스 연결 오류가 발생했습니다',
            statusCode: 503,
            error: 'DATABASE_CONNECTION_ERROR'
        };
    }

    // Default error response
    const statusCode = error.statusCode || 500;
    const message = error.message || '서버 내부 오류가 발생했습니다';
    const errorCode = error.error || 'INTERNAL_SERVER_ERROR';

    // Prepare error response
    const errorResponse = {
        success: false,
        message,
        error: errorCode
    };

    // Add additional error details in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
        errorResponse.details = error.details;
        if (error.field) errorResponse.field = error.field;
        if (error.service) errorResponse.service = error.service;
    }

    // Add error details for validation errors
    if (error.details && typeof error.details === 'object') {
        errorResponse.details = error.details;
    }

    res.status(statusCode).json(errorResponse);
};

// 404 Not Found handler
const notFound = (req, res, next) => {
    const error = new Error(`요청하신 리소스를 찾을 수 없습니다 - ${req.originalUrl}`);
    error.statusCode = 404;
    error.error = 'NOT_FOUND';
    next(error);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
class AppError extends Error {
    constructor(message, statusCode, errorCode = null, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.error = errorCode || 'APPLICATION_ERROR';
        this.details = details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Specific error classes
class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}

class AuthenticationError extends AppError {
    constructor(message = '인증이 필요합니다') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

class AuthorizationError extends AppError {
    constructor(message = '접근 권한이 없습니다') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

class NotFoundError extends AppError {
    constructor(message = '리소스를 찾을 수 없습니다') {
        super(message, 404, 'NOT_FOUND');
    }
}

class ConflictError extends AppError {
    constructor(message = '충돌이 발생했습니다') {
        super(message, 409, 'CONFLICT');
    }
}

class PaymentError extends AppError {
    constructor(message, details = null) {
        super(message, 400, 'PAYMENT_ERROR', details);
    }
}

class ExternalAPIError extends AppError {
    constructor(message, service = null) {
        super(message, 502, 'EXTERNAL_API_ERROR');
        this.service = service;
    }
}

module.exports = {
    errorHandler,
    notFound,
    asyncHandler,
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    PaymentError,
    ExternalAPIError
};