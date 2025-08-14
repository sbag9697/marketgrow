// 주문 상태 자동 동기화 스케줄러
const { SMMTurkNetlifyAPI } = require('./lib/smmturk-api.js');
const { neon } = require('@netlify/neon');

const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST',
        'Content-Type': 'application/json'
    };

    try {
        console.log('주문 상태 동기화 시작...');

        const smmturkAPI = new SMMTurkNetlifyAPI();

        // 진행 중인 주문들 조회
        const activeOrders = await sql`
            SELECT * FROM orders 
            WHERE status IN ('processing') 
            AND provider_order_id IS NOT NULL 
            AND provider_name = 'smmturk'
            AND updated_at > NOW() - INTERVAL '7 days'
            ORDER BY created_at DESC
            LIMIT 100
        `;

        console.log(`${activeOrders.length}개의 진행 중인 주문 발견`);

        let syncedCount = 0;
        let completedCount = 0;

        // 각 주문의 상태 동기화
        for (const order of activeOrders) {
            try {
                const statusResult = await smmturkAPI.handleRequest({
                    body: JSON.stringify({
                        action: 'get-order-status',
                        providerOrderId: order.provider_order_id
                    })
                });

                if (statusResult.success) {
                    const providerStatus = statusResult.status;
                    const progress = calculateProgress(providerStatus, statusResult.remains, order.quantity);
                    const ourStatus = mapProviderStatus(providerStatus);

                    // 상태가 변경된 경우에만 업데이트
                    if (ourStatus !== order.status || progress !== order.progress) {
                        await sql`
                            UPDATE orders 
                            SET 
                                status = ${ourStatus},
                                progress = ${progress},
                                updated_at = CURRENT_TIMESTAMP,
                                completed_at = ${ourStatus === 'completed' ? 'CURRENT_TIMESTAMP' : order.completed_at}
                            WHERE id = ${order.id}
                        `;

                        // 상태 변경 로그
                        await sql`
                            INSERT INTO service_logs (order_id, action, details, progress_before, progress_after)
                            VALUES (${order.id}, 'auto_status_sync', 
                                   ${`자동 동기화: ${order.status} → ${ourStatus} (${providerStatus})`}, 
                                   ${order.progress}, ${progress})
                        `;

                        syncedCount++;

                        if (ourStatus === 'completed' && order.status !== 'completed') {
                            completedCount++;

                            // 완료된 주문에 대해 포인트 적립
                            await addCompletionPoints(order);

                            console.log(`주문 ${order.id} 완료 처리됨`);
                        }
                    }
                }

                // API 호출 제한을 위한 짧은 대기
                await sleep(100);
            } catch (error) {
                console.error(`주문 ${order.id} 동기화 실패:`, error);
            }
        }

        // 통계 업데이트
        await updateSyncStats(syncedCount, completedCount);

        const result = {
            success: true,
            message: '주문 상태 동기화 완료',
            stats: {
                totalOrders: activeOrders.length,
                syncedOrders: syncedCount,
                completedOrders: completedCount,
                timestamp: new Date().toISOString()
            }
        };

        console.log('동기화 결과:', result);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error('동기화 스케줄러 오류:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: '동기화 실패',
                details: error.message
            })
        };
    }
};

// 진행률 계산
function calculateProgress(providerStatus, remains, totalQuantity) {
    switch (providerStatus?.toLowerCase()) {
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
    switch (providerStatus?.toLowerCase()) {
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

// 완료 포인트 적립
async function addCompletionPoints(order) {
    try {
        // 주문 금액의 1% 포인트 적립
        const points = Math.floor(order.total_price * 0.01);

        if (points > 0) {
            // 사용자 포인트 업데이트
            await sql`
                UPDATE users 
                SET points = points + ${points}
                WHERE id = ${order.user_id}
            `;

            // 포인트 내역 추가
            await sql`
                INSERT INTO point_history (user_id, amount, type, description, order_id)
                VALUES (${order.user_id}, ${points}, 'earn', '주문 완료 적립', ${order.id})
            `;
        }
    } catch (error) {
        console.error('완료 포인트 적립 실패:', error);
    }
}

// 동기화 통계 업데이트
async function updateSyncStats(syncedCount, completedCount) {
    try {
        // 간단한 통계 로그 (나중에 대시보드에서 활용)
        await sql`
            INSERT INTO service_logs (order_id, action, details)
            VALUES (NULL, 'sync_stats', 
                   ${`동기화: ${syncedCount}건, 완료: ${completedCount}건`})
        `;
    } catch (error) {
        console.error('통계 업데이트 실패:', error);
    }
}

// 대기 함수
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
