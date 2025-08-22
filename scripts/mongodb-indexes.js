#!/usr/bin/env node

/**
 * MongoDB 인덱스 초기화 스크립트
 * 성능 최적화를 위한 필수 인덱스 생성
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
}

async function createIndexes() {
    const client = new MongoClient(uri);
    
    try {
        console.log('🔗 Connecting to MongoDB...');
        await client.connect();
        
        const dbName = process.env.MONGODB_DB || 'marketgrow';
        const db = client.db(dbName);
        
        console.log(`📦 Using database: ${dbName}\n`);
        
        // 1. users 컬렉션 인덱스
        console.log('📌 Creating indexes for users collection...');
        await db.collection('users').createIndex(
            { email: 1 }, 
            { unique: true, name: 'email_unique' }
        );
        await db.collection('users').createIndex(
            { username: 1 }, 
            { unique: true, sparse: true, name: 'username_unique' }
        );
        await db.collection('users').createIndex(
            { role: 1, isActive: 1 }, 
            { name: 'role_active' }
        );
        console.log('   ✅ users indexes created');
        
        // 2. orders 컬렉션 인덱스
        console.log('📌 Creating indexes for orders collection...');
        await db.collection('orders').createIndex(
            { userId: 1, createdAt: -1 }, 
            { name: 'user_orders' }
        );
        await db.collection('orders').createIndex(
            { status: 1, updatedAt: -1 }, 
            { name: 'status_updated' }
        );
        await db.collection('orders').createIndex(
            { providerName: 1, providerOrderId: 1 }, 
            { sparse: true, name: 'provider_order' }
        );
        await db.collection('orders').createIndex(
            { paymentKey: 1 }, 
            { sparse: true, name: 'payment_key' }
        );
        console.log('   ✅ orders indexes created');
        
        // 3. service_logs 컬렉션 인덱스
        console.log('📌 Creating indexes for service_logs collection...');
        await db.collection('service_logs').createIndex(
            { orderId: 1, createdAt: -1 }, 
            { name: 'order_logs' }
        );
        await db.collection('service_logs').createIndex(
            { action: 1, createdAt: -1 }, 
            { name: 'action_time' }
        );
        console.log('   ✅ service_logs indexes created');
        
        // 4. support_tickets 컬렉션 인덱스
        console.log('📌 Creating indexes for support_tickets collection...');
        await db.collection('support_tickets').createIndex(
            { userId: 1, createdAt: -1 }, 
            { name: 'user_tickets' }
        );
        await db.collection('support_tickets').createIndex(
            { status: 1, priority: -1, createdAt: -1 }, 
            { name: 'ticket_queue' }
        );
        await db.collection('support_tickets').createIndex(
            { ticketNumber: 1 }, 
            { unique: true, name: 'ticket_number' }
        );
        console.log('   ✅ support_tickets indexes created');
        
        // 5. support_messages 컬렉션 인덱스
        console.log('📌 Creating indexes for support_messages collection...');
        await db.collection('support_messages').createIndex(
            { ticketId: 1, createdAt: 1 }, 
            { name: 'ticket_messages' }
        );
        console.log('   ✅ support_messages indexes created');
        
        // 6. idempotency_keys 컬렉션 인덱스
        console.log('📌 Creating indexes for idempotency_keys collection...');
        await db.collection('idempotency_keys').createIndex(
            { createdAt: 1 }, 
            { 
                expireAfterSeconds: 86400, // 24시간 후 자동 삭제
                name: 'ttl_cleanup' 
            }
        );
        console.log('   ✅ idempotency_keys indexes created');
        
        // 7. services 컬렉션 인덱스
        console.log('📌 Creating indexes for services collection...');
        await db.collection('services').createIndex(
            { platform: 1, category: 1, isActive: 1 }, 
            { name: 'platform_category' }
        );
        await db.collection('services').createIndex(
            { isPopular: -1, orderCount: -1 }, 
            { name: 'popular_services' }
        );
        console.log('   ✅ services indexes created');
        
        // 8. deposits 컬렉션 인덱스
        console.log('📌 Creating indexes for deposits collection...');
        await db.collection('deposits').createIndex(
            { userId: 1, status: 1, createdAt: -1 }, 
            { name: 'user_deposits' }
        );
        await db.collection('deposits').createIndex(
            { status: 1, createdAt: -1 }, 
            { name: 'pending_deposits' }
        );
        console.log('   ✅ deposits indexes created');
        
        // 9. point_history 컬렉션 인덱스
        console.log('📌 Creating indexes for point_history collection...');
        await db.collection('point_history').createIndex(
            { userId: 1, createdAt: -1 }, 
            { name: 'user_points' }
        );
        console.log('   ✅ point_history indexes created');
        
        // 10. sessions 컬렉션 인덱스 (선택적)
        console.log('📌 Creating indexes for sessions collection...');
        await db.collection('sessions').createIndex(
            { userId: 1, expiresAt: 1 }, 
            { name: 'user_sessions' }
        );
        await db.collection('sessions').createIndex(
            { expiresAt: 1 }, 
            { 
                expireAfterSeconds: 0,  // expiresAt 필드 값에 따라 삭제
                name: 'session_ttl' 
            }
        );
        console.log('   ✅ sessions indexes created');
        
        console.log('\n✅ All indexes created successfully!');
        
        // 생성된 인덱스 확인
        console.log('\n📊 Index Statistics:');
        const collections = [
            'users', 'orders', 'service_logs', 'support_tickets', 
            'support_messages', 'services', 'deposits', 'point_history'
        ];
        
        for (const colName of collections) {
            const indexes = await db.collection(colName).indexes();
            console.log(`   ${colName}: ${indexes.length} indexes`);
        }
        
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('\n🔌 Connection closed');
    }
}

// 스크립트 실행
createIndexes()
    .then(() => {
        console.log('\n🎉 Index initialization complete!');
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });