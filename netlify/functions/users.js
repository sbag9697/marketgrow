/**
 * 사용자 관련 API
 * GET /users/profile - 사용자 프로필 조회
 * GET /users/stats - 사용자 통계 조회
 * PUT /users/profile - 프로필 업데이트
 */

const { getDb } = require('./_lib/mongo');
const { authenticateUser } = require('./_lib/auth');

exports.handler = async (event, context) => {
    // CORS 헤더
    const headers = {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Content-Type': 'application/json'
    };
    
    // OPTIONS 요청 처리
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    try {
        // 사용자 인증
        const user = await authenticateUser(event.headers.authorization || event.headers.Authorization);
        if (!user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: '인증이 필요합니다' 
                })
            };
        }
        
        const path = event.path || event.rawUrl || '';
        
        // GET /users/profile - 프로필 조회
        if (event.httpMethod === 'GET' && path.includes('/profile')) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: {
                        _id: user._id,
                        email: user.email,
                        username: user.username,
                        name: user.name,
                        phone: user.phone,
                        membershipLevel: user.membershipLevel || 'bronze',
                        points: user.points || 0,
                        depositBalance: user.depositBalance || 0,
                        createdAt: user.createdAt,
                        isEmailVerified: user.isEmailVerified,
                        isPhoneVerified: user.isPhoneVerified,
                        referralCode: user.referralCode || generateReferralCode(user._id)
                    }
                })
            };
        }
        
        // GET /users/stats - 통계 조회
        if (event.httpMethod === 'GET' && path.includes('/stats')) {
            const db = await getDb();
            
            // 사용자의 주문 통계 계산
            const orders = await db.collection('orders')
                .find({ userId: user._id })
                .toArray();
            
            const totalOrders = orders.length;
            const totalSpent = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
            const activeOrders = orders.filter(o => o.status === 'processing').length;
            const completedOrders = orders.filter(o => o.status === 'completed').length;
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: {
                        totalOrders,
                        totalSpent,
                        activeOrders,
                        completedOrders,
                        points: user.points || 0,
                        level: user.membershipLevel || 'bronze',
                        depositBalance: user.depositBalance || 0
                    }
                })
            };
        }
        
        // PUT /users/profile - 프로필 업데이트
        if (event.httpMethod === 'PUT' && path.includes('/profile')) {
            const body = JSON.parse(event.body || '{}');
            const { name, phone } = body;
            
            const db = await getDb();
            
            // 업데이트할 필드
            const updateFields = {};
            if (name) updateFields.name = name;
            if (phone) updateFields.phone = phone;
            updateFields.updatedAt = new Date();
            
            // 프로필 업데이트
            await db.collection('users').updateOne(
                { _id: user._id },
                { $set: updateFields }
            );
            
            // 업데이트된 사용자 정보 조회
            const updatedUser = await db.collection('users').findOne({ _id: user._id });
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: {
                        _id: updatedUser._id,
                        email: updatedUser.email,
                        username: updatedUser.username,
                        name: updatedUser.name,
                        phone: updatedUser.phone,
                        membershipLevel: updatedUser.membershipLevel || 'bronze',
                        points: updatedUser.points || 0
                    }
                })
            };
        }
        
        // 404 - 엔드포인트를 찾을 수 없음
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Endpoint not found'
            })
        };
        
    } catch (error) {
        console.error('Users API error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};

// 추천 코드 생성
function generateReferralCode(userId) {
    const str = userId.toString();
    return 'MG' + str.substring(str.length - 6).toUpperCase();
}