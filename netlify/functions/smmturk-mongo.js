/**
 * SMMTurk API 통합 (MongoDB 버전)
 * SMM 서비스 제공업체 연동 API
 */

const { SMMTurkNetlifyAPI } = require('./lib/smmturk-api.js');
const { getDb } = require('./_lib/mongo');
const { authenticateUser } = require('./_lib/auth');
const { ObjectId } = require('mongodb');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
                    body: JSON.stringify({ 
                        success: false,
                        error: 'Invalid action' 
                    })
                };
        }
    } catch (error) {
        console.error('SMMTurk API error:', error);
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

// 주문 처리 (결제 완료 후 자동 실행)
async function handleProcessOrder(event, headers, smmturkAPI) {
    const { orderId, serviceType, targetUrl, quantity } = JSON.parse(event.body);

    try {
        const db = await getDb();
        
        // 1. 주문 정보 조회
        const order = await db.collection('orders').findOne({
            _id: orderId,
            status: 'processing'
        });

        if (!order) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ 
                    success: false,
                    error: '처리 가능한 주문을 찾을 수 없습니다.' 
                })
            };
        }

        // 2. SMMTurk에 주문 전송
        const result = await smmturkAPI.createOrder({
            serviceType,
            targetUrl,
            quantity
        });

        const now = new Date();

        if (result.success) {
            // 3. 주문 정보 업데이트
            await db.collection('orders').updateOne(
                { _id: orderId },
                {
                    $set: {
                        providerOrderId: result.orderId,
                        providerName: 'smmturk',
                        startedAt: now,
                        status: 'processing',
                        updatedAt: now
                    }
                }
            );

            // 4. 서비스 로그 추가
            await db.collection('service_logs').insertOne({
                _id: new ObjectId(),
                orderId,
                userId: order.userId,
                action: 'order_sent_to_provider',
                details: `SMMTurk 주문 전송 완료 (Provider Order ID: ${result.orderId})`,
                metadata: {
                    providerOrderId: result.orderId,
                    serviceType,
                    quantity
                },
                progressBefore: order.progress || 0,
                progressAfter: 10,
                createdAt: now
            });

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
            await db.collection('orders').updateOne(
                { _id: orderId },
                {
                    $set: {
                        status: 'failed',
                        notes: result.error,
                        updatedAt: now
                    }
                }
            );

            // 실패 로그 추가
            await db.collection('service_logs').insertOne({
                _id: new ObjectId(),
                orderId,
                userId: order.userId,
                action: 'order_failed',
                details: `주문 전송 실패: ${result.error}`,
                metadata: { error: result.error },
                progressBefore: order.progress || 0,
                progressAfter: 0,
                createdAt: now
            });

            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: `주문 처리 실패: ${result.error}`
                })
            };
        }
    } catch (error) {
        console.error('Process order error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: '주문 처리 중 오류 발생', 
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
}

// 주문 상태 동기화
async function handleSyncOrderStatus(event, headers, smmturkAPI) {
    const { orderId } = JSON.parse(event.body || '{}');

    try {
        const db = await getDb();
        let ordersToSync = [];

        if (orderId) {
            // 특정 주문 동기화
            const order = await db.collection('orders').findOne({
                _id: orderId,
                providerOrderId: { $ne: null }
            });
            if (order) ordersToSync = [order];
        } else {
            // 진행 중인 모든 주문 동기화
            ordersToSync = await db.collection('orders')
                .find({
                    status: 'processing',
                    providerOrderId: { $ne: null },
                    providerName: 'smmturk'
                })
                .sort({ createdAt: -1 })
                .limit(50)
                .toArray();
        }

        const syncResults = [];
        const now = new Date();

        for (const order of ordersToSync) {
            try {
                const statusResult = await smmturkAPI.getOrderStatus({
                    providerOrderId: order.providerOrderId
                });

                if (statusResult.success) {
                    const providerStatus = statusResult.status;
                    const progress = calculateProgress(providerStatus, statusResult.remains, order.quantity);
                    const ourStatus = mapProviderStatus(providerStatus);

                    // 상태 변경 체크
                    const statusChanged = order.status !== ourStatus;
                    const progressChanged = order.progress !== progress;

                    if (statusChanged || progressChanged) {
                        // 주문 상태 업데이트
                        const updateData = {
                            status: ourStatus,
                            progress,
                            updatedAt: now
                        };

                        if (ourStatus === 'completed') {
                            updateData.completedAt = now;
                        }

                        await db.collection('orders').updateOne(
                            { _id: order._id },
                            { $set: updateData }
                        );

                        // 상태 변경 로그
                        await db.collection('service_logs').insertOne({
                            _id: new ObjectId(),
                            orderId: order._id,
                            userId: order.userId,
                            action: 'status_synced',
                            details: `SMMTurk 상태: ${providerStatus}`,
                            metadata: {
                                providerStatus,
                                previousStatus: order.status,
                                newStatus: ourStatus,
                                remains: statusResult.remains
                            },
                            progressBefore: order.progress || 0,
                            progressAfter: progress,
                            createdAt: now
                        });
                    }

                    syncResults.push({
                        orderId: order._id,
                        status: ourStatus,
                        progress,
                        providerStatus,
                        updated: statusChanged || progressChanged
                    });
                }
            } catch (error) {
                console.error(`주문 ${order._id} 동기화 실패:`, error);
                syncResults.push({
                    orderId: order._id,
                    error: error.message,
                    updated: false
                });
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                syncedOrders: syncResults.length,
                updatedCount: syncResults.filter(r => r.updated).length,
                results: syncResults
            })
        };
    } catch (error) {
        console.error('Sync order status error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: '상태 동기화 실패', 
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
}

// 제공업체 서비스 목록 조회
async function handleGetProviderServices(event, headers, smmturkAPI) {
    const { category, limit } = JSON.parse(event.body || '{}');

    try {
        const result = await smmturkAPI.getServices({ category, limit });

        // 서비스 정보를 MongoDB에 캐싱 (선택적)
        if (result.success && result.services) {
            const db = await getDb();
            const now = new Date();
            
            // 캐시 업데이트 (upsert)
            for (const service of result.services) {
                await db.collection('provider_services_cache').updateOne(
                    { 
                        providerId: service.service, 
                        provider: 'smmturk' 
                    },
                    {
                        $set: {
                            ...service,
                            provider: 'smmturk',
                            cachedAt: now
                        }
                    },
                    { upsert: true }
                );
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error('Get provider services error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: '서비스 목록 조회 실패', 
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
}

// 계정 잔액 확인
async function handleCheckBalance(event, headers, smmturkAPI) {
    try {
        const result = await smmturkAPI.getBalance();

        // 잔액 정보 로깅 (선택적)
        if (result.success) {
            const db = await getDb();
            await db.collection('provider_balance_logs').insertOne({
                _id: new ObjectId(),
                provider: 'smmturk',
                balance: result.balance,
                currency: result.currency,
                checkedAt: new Date()
            });
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error('Check balance error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: '잔액 조회 실패', 
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
}

// 진행률 계산
function calculateProgress(providerStatus, remains, totalQuantity) {
    const status = providerStatus ? providerStatus.toLowerCase() : '';
    
    switch (status) {
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
    const status = providerStatus ? providerStatus.toLowerCase() : '';
    
    switch (status) {
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