const { neon } = require('@netlify/neon');
const jwt = require('jsonwebtoken');

const sql = neon(process.env.NETLIFY_DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // 토큰 인증
        const user = await authenticateUser(event.headers.authorization);
        if (!user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: '인증이 필요합니다.' })
            };
        }

        switch (event.httpMethod) {
            case 'GET':
                return await handleGetOrders(user, event.queryStringParameters, headers);
            case 'POST':
                return await handleCreateOrder(user, event, headers);
            case 'PUT':
                return await handleUpdateOrder(user, event, headers);
            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', details: error.message })
        };
    }
};

async function authenticateUser(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    const token = authHeader.substring(7);
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const users = await sql`
            SELECT id, username, email, points, membership_level
            FROM users 
            WHERE id = ${decoded.userId} AND is_active = true
        `;
        
        return users[0] || null;
    } catch (error) {
        return null;
    }
}

async function handleGetOrders(user, queryParams, headers) {
    const page = parseInt(queryParams?.page || '1');
    const limit = parseInt(queryParams?.limit || '10');
    const offset = (page - 1) * limit;
    
    // 사용자의 주문 조회
    const orders = await sql`
        SELECT 
            o.*,
            p.method as payment_method,
            p.approved_at as payment_approved_at
        FROM orders o
        LEFT JOIN payments p ON o.payment_key = p.payment_key
        WHERE o.user_id = ${user.id}
        ORDER BY o.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
    `;
    
    // 총 주문 수
    const totalResult = await sql`
        SELECT COUNT(*) as total FROM orders WHERE user_id = ${user.id}
    `;
    const total = parseInt(totalResult[0].total);
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    };
}

async function handleCreateOrder(user, event, headers) {
    const { orderId, serviceType, serviceName, targetUrl, quantity, originalPrice, discountAmount, totalPrice } = JSON.parse(event.body);
    
    try {
        // 주문 생성
        const result = await sql`
            INSERT INTO orders (
                id, user_id, service_type, service_name, target_url, 
                quantity, original_price, discount_amount, total_price, status
            )
            VALUES (
                ${orderId}, ${user.id}, ${serviceType}, ${serviceName}, ${targetUrl},
                ${quantity}, ${originalPrice}, ${discountAmount}, ${totalPrice}, 'pending'
            )
            RETURNING *
        `;
        
        const order = result[0];
        
        // 주문 생성 로그
        await sql`
            INSERT INTO service_logs (order_id, action, details, progress_after)
            VALUES (${orderId}, 'order_created', '주문이 생성되었습니다.', 0)
        `;
        
        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                success: true,
                order
            })
        };
    } catch (error) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: '주문 생성에 실패했습니다.', details: error.message })
        };
    }
}

async function handleUpdateOrder(user, event, headers) {
    const { orderId, status, progress, paymentKey } = JSON.parse(event.body);
    
    try {
        // 기존 주문 조회
        const existingOrders = await sql`
            SELECT * FROM orders WHERE id = ${orderId} AND user_id = ${user.id}
        `;
        
        if (existingOrders.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: '주문을 찾을 수 없습니다.' })
            };
        }
        
        const existingOrder = existingOrders[0];
        
        // 주문 업데이트
        const updateData = {};
        if (status) updateData.status = status;
        if (progress !== undefined) updateData.progress = progress;
        if (paymentKey) updateData.payment_key = paymentKey;
        
        if (status === 'processing' && !existingOrder.started_at) {
            updateData.started_at = new Date().toISOString();
        }
        
        if (status === 'completed' && !existingOrder.completed_at) {
            updateData.completed_at = new Date().toISOString();
            updateData.progress = 100;
        }
        
        // SQL 업데이트 쿼리 동적 생성
        const updateFields = Object.keys(updateData).map(key => `${key} = $${key}`).join(', ');
        const values = Object.values(updateData);
        
        if (updateFields) {
            await sql`UPDATE orders SET ${sql.unsafe(updateFields)} WHERE id = ${orderId}`.bind(updateData);
        }
        
        // 로그 기록
        await sql`
            INSERT INTO service_logs (order_id, action, details, progress_before, progress_after)
            VALUES (${orderId}, 'status_updated', ${`상태가 ${status || '변경'}되었습니다.`}, ${existingOrder.progress}, ${progress || existingOrder.progress})
        `;
        
        // 업데이트된 주문 반환
        const updatedOrders = await sql`
            SELECT * FROM orders WHERE id = ${orderId}
        `;
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                order: updatedOrders[0]
            })
        };
    } catch (error) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: '주문 업데이트에 실패했습니다.', details: error.message })
        };
    }
}