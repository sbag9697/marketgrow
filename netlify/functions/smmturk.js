const { SMMTurkNetlifyAPI } = require('../../smmturk-api.js');
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
        const smmturkAPI = new SMMTurkNetlifyAPI();
        const { action } = JSON.parse(event.body || '{}');

        switch (action) {
            case 'process-order':
                return await handleProcessOrder(event, headers, smmturkAPI);
            case 'sync-order-status':
                return await handleSyncOrderStatus(event, headers, smmturkAPI);
            case 'get-provider-services':
                return await handleGetProviderServices(event, headers, smmturkAPI);
            case 'check-balance':
                return await handleCheckBalance(event, headers, smmturkAPI);
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid action' })
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

// 주문 처리 (결제 완료 후 자동 실행)
async function handleProcessOrder(event, headers, smmturkAPI) {
    const { orderId, serviceType, targetUrl, quantity } = JSON.parse(event.body);

    try {
        // 1. 주문 정보 조회
        const orders = await sql`
            SELECT * FROM orders WHERE id = ${orderId} AND status = 'processing'
        `;

        if (orders.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: '처리 가능한 주문을 찾을 수 없습니다.' })
            };
        }

        const order = orders[0];

        // 2. SMMTurk에 주문 전송
        const result = await smmturkAPI.createOrder({
            serviceType: serviceType,
            targetUrl: targetUrl,
            quantity: quantity
        });

        if (result.success) {
            // 3. 주문 정보 업데이트
            await sql`
                UPDATE orders 
                SET 
                    provider_order_id = ${result.orderId},
                    provider_name = 'smmturk',
                    started_at = CURRENT_TIMESTAMP,
                    status = 'processing'
                WHERE id = ${orderId}
            `;

            // 4. 서비스 로그 추가
            await sql`
                INSERT INTO service_logs (order_id, action, details, progress_after)
                VALUES (${orderId}, 'order_sent_to_provider', 
                       ${`SMMTurk 주문 전송 완료 (Provider Order ID: ${result.orderId})`}, 10)
            `;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: '주문이 처리 업체로 전송되었습니다.',
                    providerOrderId: result.orderId,
                    estimatedStartTime: '10-30분'
                })
            };
        } else {
            // 5. 주문 실패 처리
            await sql`
                UPDATE orders SET status = 'failed', notes = ${result.error}
                WHERE id = ${orderId}
            `;

            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: '주문 처리 실패: ' + result.error
                })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: '주문 처리 중 오류 발생', details: error.message })
        };
    }
}

// 주문 상태 동기화
async function handleSyncOrderStatus(event, headers, smmturkAPI) {
    const { orderId } = JSON.parse(event.body || '{}');

    try {
        let ordersToSync = [];

        if (orderId) {
            // 특정 주문 동기화
            const orders = await sql`
                SELECT * FROM orders 
                WHERE id = ${orderId} AND provider_order_id IS NOT NULL
            `;
            ordersToSync = orders;
        } else {
            // 진행 중인 모든 주문 동기화
            const orders = await sql`
                SELECT * FROM orders 
                WHERE status IN ('processing') 
                AND provider_order_id IS NOT NULL 
                AND provider_name = 'smmturk'
                ORDER BY created_at DESC
                LIMIT 50
            `;
            ordersToSync = orders;
        }

        const syncResults = [];

        for (const order of ordersToSync) {
            try {
                const statusResult = await smmturkAPI.getOrderStatus({
                    providerOrderId: order.provider_order_id
                });

                if (statusResult.success) {
                    const providerStatus = statusResult.status;
                    const progress = calculateProgress(providerStatus, statusResult.remains, order.quantity);
                    const ourStatus = mapProviderStatus(providerStatus);

                    // 주문 상태 업데이트
                    await sql`
                        UPDATE orders 
                        SET 
                            status = ${ourStatus},
                            progress = ${progress},
                            updated_at = CURRENT_TIMESTAMP,
                            completed_at = ${ourStatus === 'completed' ? 'CURRENT_TIMESTAMP' : null}
                        WHERE id = ${order.id}
                    `;

                    // 상태 변경 로그
                    await sql`
                        INSERT INTO service_logs (order_id, action, details, progress_before, progress_after)
                        VALUES (${order.id}, 'status_synced', 
                               ${`SMMTurk 상태: ${providerStatus}`}, 
                               ${order.progress}, ${progress})
                    `;

                    syncResults.push({
                        orderId: order.id,
                        status: ourStatus,
                        progress: progress,
                        providerStatus: providerStatus
                    });
                }
            } catch (error) {
                console.error(`주문 ${order.id} 동기화 실패:`, error);
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                syncedOrders: syncResults.length,
                results: syncResults
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: '상태 동기화 실패', details: error.message })
        };
    }
}

// 제공업체 서비스 목록 조회
async function handleGetProviderServices(event, headers, smmturkAPI) {
    const { category, limit } = JSON.parse(event.body || '{}');

    try {
        const result = await smmturkAPI.getServices({ category, limit });
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: '서비스 목록 조회 실패', details: error.message })
        };
    }
}

// 계정 잔액 확인
async function handleCheckBalance(event, headers, smmturkAPI) {
    try {
        const result = await smmturkAPI.getBalance();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: '잔액 조회 실패', details: error.message })
        };
    }
}

// 진행률 계산
function calculateProgress(providerStatus, remains, totalQuantity) {
    switch (providerStatus.toLowerCase()) {
        case 'pending':
        case 'in queue':
            return 5;
        case 'in progress':
        case 'processing':
            if (remains && totalQuantity) {
                const delivered = totalQuantity - parseInt(remains);
                return Math.min(95, Math.max(10, Math.round((delivered / totalQuantity) * 100)));
            }
            return 50;
        case 'completed':
        case 'partial':
            return 100;
        case 'canceled':
        case 'cancelled':
            return 0;
        default:
            return 10;
    }
}

// 제공업체 상태를 우리 시스템 상태로 매핑
function mapProviderStatus(providerStatus) {
    switch (providerStatus.toLowerCase()) {
        case 'pending':
        case 'in queue':
            return 'processing';
        case 'in progress':
        case 'processing':
            return 'processing';
        case 'completed':
        case 'partial':
            return 'completed';
        case 'canceled':
        case 'cancelled':
            return 'failed';
        default:
            return 'processing';
    }
}