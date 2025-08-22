/**
 * 주문 관리 API (MongoDB 버전)
 * GET /orders - 주문 목록 조회
 * POST /orders - 새 주문 생성
 * PUT /orders - 주문 상태 업데이트
 */

const { getDb } = require('./_lib/mongo');
const { authenticateUser } = require('./_lib/auth');
const { ObjectId } = require('mongodb');

exports.handler = async (event, context) => {
    // CORS 헤더
    const headers = {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
        
        const db = await getDb();
        
        // GET: 주문 목록 조회
        if (event.httpMethod === 'GET') {
            const params = event.queryStringParameters || {};
            const page = Math.max(1, parseInt(params.page || '1', 10));
            const limit = Math.min(100, Math.max(1, parseInt(params.limit || '10', 10)));
            const skip = (page - 1) * limit;
            
            // 쿼리 조건
            const query = { userId: user._id };
            
            // 상태 필터
            if (params.status) {
                query.status = params.status;
            }
            
            // 날짜 필터
            if (params.startDate || params.endDate) {
                query.createdAt = {};
                if (params.startDate) {
                    query.createdAt.$gte = new Date(params.startDate);
                }
                if (params.endDate) {
                    query.createdAt.$lte = new Date(params.endDate);
                }
            }
            
            // 병렬로 데이터와 카운트 조회
            const [orders, total] = await Promise.all([
                db.collection('orders')
                    .find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .toArray(),
                db.collection('orders').countDocuments(query)
            ]);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: {
                        orders,
                        pagination: {
                            page,
                            limit,
                            total,
                            totalPages: Math.ceil(total / limit)
                        }
                    }
                })
            };
        }
        
        // POST: 새 주문 생성
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');
            const {
                orderId,
                serviceType,
                serviceName,
                targetUrl,
                quantity,
                originalPrice,
                discountAmount,
                totalPrice,
                couponCode
            } = body;
            
            // 필수 필드 검증
            if (!orderId || !serviceType || !targetUrl || !quantity || !totalPrice) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: '필수 정보가 누락되었습니다'
                    })
                };
            }
            
            // Idempotency 체크
            const idempotencyKey = event.headers['idempotency-key'] || event.headers['Idempotency-Key'];
            if (idempotencyKey) {
                const existing = await db.collection('idempotency_keys').findOne({ 
                    _id: idempotencyKey 
                });
                
                if (existing) {
                    // 이미 처리된 요청
                    const existingOrder = await db.collection('orders').findOne({ 
                        _id: orderId 
                    });
                    
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            success: true,
                            duplicate: true,
                            data: { order: existingOrder }
                        })
                    };
                }
            }
            
            const now = new Date();
            
            // 주문 문서 생성
            const orderDoc = {
                _id: orderId,
                userId: user._id,
                userEmail: user.email,
                userName: user.name,
                
                // 서비스 정보
                serviceType,
                serviceName,
                targetUrl,
                quantity,
                
                // 가격 정보
                originalPrice,
                discountAmount: discountAmount || 0,
                totalPrice,
                couponCode: couponCode || null,
                
                // 상태 정보
                status: 'pending',
                progress: 0,
                
                // 결제 정보
                paymentKey: null,
                paymentMethod: null,
                paidAt: null,
                
                // 외부 서비스 정보
                providerName: 'smmturk',
                providerOrderId: null,
                
                // 타임스탬프
                createdAt: now,
                updatedAt: now,
                startedAt: null,
                completedAt: null
            };
            
            // 트랜잭션으로 처리 (MongoDB 4.0+)
            const session = client.startSession();
            
            try {
                await session.withTransaction(async () => {
                    // 주문 생성
                    await db.collection('orders').insertOne(orderDoc, { session });
                    
                    // 서비스 로그 생성
                    await db.collection('service_logs').insertOne({
                        _id: new ObjectId(),
                        orderId,
                        userId: user._id,
                        action: 'order_created',
                        details: '주문이 생성되었습니다',
                        metadata: {
                            serviceType,
                            quantity,
                            totalPrice
                        },
                        progressBefore: 0,
                        progressAfter: 0,
                        createdAt: now
                    }, { session });
                    
                    // Idempotency key 저장
                    if (idempotencyKey) {
                        await db.collection('idempotency_keys').insertOne({
                            _id: idempotencyKey,
                            orderId,
                            userId: user._id,
                            createdAt: now
                        }, { session });
                    }
                });
                
                return {
                    statusCode: 201,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        data: { order: orderDoc }
                    })
                };
                
            } catch (error) {
                console.error('Transaction error:', error);
                
                // 중복 키 에러 처리
                if (error.code === 11000) {
                    return {
                        statusCode: 409,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            error: '주문 ID가 이미 존재합니다'
                        })
                    };
                }
                
                throw error;
                
            } finally {
                await session.endSession();
            }
        }
        
        // PUT: 주문 상태 업데이트
        if (event.httpMethod === 'PUT') {
            const body = JSON.parse(event.body || '{}');
            const { orderId, status, progress, paymentKey, paymentMethod } = body;
            
            if (!orderId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: '주문 ID가 필요합니다'
                    })
                };
            }
            
            // 기존 주문 조회
            const order = await db.collection('orders').findOne({
                _id: orderId,
                userId: user._id
            });
            
            if (!order) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: '주문을 찾을 수 없습니다'
                    })
                };
            }
            
            // 업데이트 데이터 준비
            const updateData = {
                updatedAt: new Date()
            };
            
            if (status) {
                updateData.status = status;
                
                // 상태별 추가 처리
                if (status === 'paid' && !order.paidAt) {
                    updateData.paidAt = new Date();
                }
                if (status === 'processing' && !order.startedAt) {
                    updateData.startedAt = new Date();
                }
                if (status === 'completed' && !order.completedAt) {
                    updateData.completedAt = new Date();
                    updateData.progress = 100;
                }
            }
            
            if (typeof progress === 'number') {
                updateData.progress = Math.min(100, Math.max(0, progress));
            }
            
            if (paymentKey) {
                updateData.paymentKey = paymentKey;
            }
            
            if (paymentMethod) {
                updateData.paymentMethod = paymentMethod;
            }
            
            // 업데이트 실행
            await db.collection('orders').updateOne(
                { _id: orderId },
                { $set: updateData }
            );
            
            // 서비스 로그 기록
            await db.collection('service_logs').insertOne({
                _id: new ObjectId(),
                orderId,
                userId: user._id,
                action: 'status_updated',
                details: `주문 상태가 ${order.status}에서 ${status || order.status}로 변경되었습니다`,
                metadata: {
                    previousStatus: order.status,
                    newStatus: status || order.status,
                    paymentKey
                },
                progressBefore: order.progress,
                progressAfter: updateData.progress || order.progress,
                createdAt: new Date()
            });
            
            // 업데이트된 주문 조회
            const updatedOrder = await db.collection('orders').findOne({ _id: orderId });
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: { order: updatedOrder }
                })
            };
        }
        
        // 지원하지 않는 메서드
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Method not allowed'
            })
        };
        
    } catch (error) {
        console.error('Orders API error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: '서버 오류가 발생했습니다',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};