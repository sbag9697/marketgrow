/**
 * 인증 공통 유틸리티 (JWT + MongoDB)
 */

const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDb } = require('./mongo');

// JWT 시크릿 키 (일반 사용자용과 관리자용 분리)
const JWT_SECRET_USER = process.env.JWT_SECRET || 'replace-with-secure-secret';
const JWT_SECRET_ADMIN = process.env.JWT_SECRET_ADMIN || 'replace-with-secure-admin-secret';

/**
 * 일반 사용자 인증
 * @param {string} authorization - Authorization 헤더 값
 * @returns {Promise<Object|null>} 사용자 정보 또는 null
 */
async function authenticateUser(authorization) {
    try {
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return null;
        }
        
        const token = authorization.slice(7);
        
        // JWT 검증
        let payload;
        try {
            payload = jwt.verify(token, JWT_SECRET_USER);
        } catch (error) {
            console.log('JWT verification failed:', error.message);
            return null;
        }
        
        // 사용자 ID 확인
        if (!payload.userId) {
            return null;
        }
        
        // MongoDB에서 사용자 조회
        const db = await getDb();
        
        // ObjectId 처리
        let userId;
        try {
            userId = ObjectId.isValid(payload.userId) 
                ? new ObjectId(payload.userId) 
                : payload.userId;
        } catch {
            userId = payload.userId;
        }
        
        const user = await db.collection('users').findOne(
            { 
                _id: userId,
                isActive: { $ne: false }
            },
            { 
                projection: { 
                    password: 0,  // 비밀번호 제외
                    __v: 0
                } 
            }
        );
        
        return user || null;
        
    } catch (error) {
        console.error('Authentication error:', error);
        return null;
    }
}

/**
 * 관리자 인증
 * @param {string} authorization - Authorization 헤더 값
 * @returns {Promise<Object|null>} 관리자 정보 또는 null
 */
async function authenticateAdmin(authorization) {
    try {
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return null;
        }
        
        const token = authorization.slice(7);
        
        // JWT 검증 (관리자용 시크릿)
        let payload;
        try {
            payload = jwt.verify(token, JWT_SECRET_ADMIN);
        } catch {
            // 일반 사용자 시크릿으로도 시도 (호환성)
            try {
                payload = jwt.verify(token, JWT_SECRET_USER);
            } catch {
                return null;
            }
        }
        
        // 관리자 권한 확인
        if (payload.iss !== 'admin' && !['admin', 'staff'].includes(payload.role)) {
            // payload에 role이 없으면 DB에서 확인
            if (!payload.userId) return null;
        }
        
        // MongoDB에서 관리자 조회
        const db = await getDb();
        
        // ObjectId 처리
        let userId;
        try {
            userId = ObjectId.isValid(payload.userId) 
                ? new ObjectId(payload.userId) 
                : payload.userId;
        } catch {
            userId = payload.userId;
        }
        
        const admin = await db.collection('users').findOne(
            { 
                _id: userId,
                role: { $in: ['admin', 'staff'] }
            },
            { 
                projection: { 
                    password: 0,
                    __v: 0
                } 
            }
        );
        
        return admin || null;
        
    } catch (error) {
        console.error('Admin authentication error:', error);
        return null;
    }
}

/**
 * JWT 토큰 생성 (일반 사용자용)
 * @param {Object} user - 사용자 정보
 * @returns {string} JWT 토큰
 */
function generateUserToken(user) {
    return jwt.sign(
        {
            userId: user._id.toString(),
            email: user.email,
            role: user.role || 'user'
        },
        JWT_SECRET_USER,
        { 
            expiresIn: '7d',
            issuer: 'marketgrow'
        }
    );
}

/**
 * JWT 토큰 생성 (관리자용)
 * @param {Object} admin - 관리자 정보
 * @returns {string} JWT 토큰
 */
function generateAdminToken(admin) {
    return jwt.sign(
        {
            userId: admin._id.toString(),
            email: admin.email,
            role: admin.role,
            iss: 'admin'
        },
        JWT_SECRET_ADMIN,
        { 
            expiresIn: '24h',  // 관리자는 보안상 짧게
            issuer: 'marketgrow-admin'
        }
    );
}

module.exports = {
    authenticateUser,
    authenticateAdmin,
    generateUserToken,
    generateAdminToken
};