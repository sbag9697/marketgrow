const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');

// PostgreSQL 연결
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

// CORS 헤더
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
};

// 관리자 권한 확인 API
exports.handler = async (event, context) => {
    // CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Authorization 헤더에서 토큰 추출
        const authHeader = event.headers.authorization || event.headers.Authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: '인증 토큰이 필요합니다'
                })
            };
        }

        const token = authHeader.substring(7);
        
        // JWT 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        if (!decoded.userId) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: '유효하지 않은 토큰입니다'
                })
            };
        }

        // 사용자 정보 및 권한 확인
        const userQuery = `
            SELECT id, email, name, role, membership_level, 
                   is_email_verified, is_phone_verified
            FROM users 
            WHERE id = $1
        `;
        
        const userResult = await sql(userQuery, [decoded.userId]);
        
        if (!userResult || userResult.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: '사용자를 찾을 수 없습니다'
                })
            };
        }

        const user = userResult[0];
        
        // 관리자 권한 확인
        if (user.role !== 'admin') {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: '관리자 권한이 필요합니다',
                    user: {
                        email: user.email,
                        role: user.role
                    }
                })
            };
        }

        // 관리자 확인 성공
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: '관리자 권한 확인됨',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        membershipLevel: user.membership_level,
                        isEmailVerified: user.is_email_verified,
                        isPhoneVerified: user.is_phone_verified
                    }
                }
            })
        };

    } catch (error) {
        console.error('Admin check error:', error);
        
        // JWT 만료 또는 유효하지 않은 경우
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: '토큰이 만료되었거나 유효하지 않습니다'
                })
            };
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: '관리자 권한 확인 중 오류가 발생했습니다'
            })
        };
    }
};