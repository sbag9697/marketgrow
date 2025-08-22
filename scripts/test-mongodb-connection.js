#!/usr/bin/env node

/**
 * MongoDB 연결 및 기본 작업 테스트
 * 
 * 사용법:
 * node scripts/test-mongodb-connection.js
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const TEST_RESULTS = {
    passed: [],
    failed: []
};

function log(message, type = 'info') {
    const prefix = {
        info: '📌',
        success: '✅',
        error: '❌',
        warning: '⚠️'
    }[type] || '📌';
    
    console.log(`${prefix} ${message}`);
}

async function testConnection() {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
        log('MONGODB_URI 환경 변수가 설정되지 않았습니다', 'error');
        TEST_RESULTS.failed.push('Environment variable check');
        return false;
    }
    
    log('MongoDB URI가 설정되어 있습니다', 'success');
    TEST_RESULTS.passed.push('Environment variable check');
    
    const client = new MongoClient(uri);
    
    try {
        log('MongoDB 연결 시도 중...');
        await client.connect();
        log('MongoDB 연결 성공!', 'success');
        TEST_RESULTS.passed.push('Connection');
        
        const dbName = process.env.MONGODB_DB || 'marketgrow';
        const db = client.db(dbName);
        log(`데이터베이스 선택: ${dbName}`, 'success');
        
        // 1. 컬렉션 목록 확인
        log('\n=== 컬렉션 목록 확인 ===');
        const collections = await db.listCollections().toArray();
        log(`총 ${collections.length}개의 컬렉션 발견:`);
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });
        TEST_RESULTS.passed.push('List collections');
        
        // 2. 테스트 문서 CRUD
        log('\n=== CRUD 작업 테스트 ===');
        const testCollection = db.collection('test_connection');
        const testId = new ObjectId();
        const testDoc = {
            _id: testId,
            test: true,
            timestamp: new Date(),
            message: 'MongoDB 연결 테스트'
        };
        
        // Create
        log('문서 생성 테스트...');
        await testCollection.insertOne(testDoc);
        log('문서 생성 성공', 'success');
        TEST_RESULTS.passed.push('Create document');
        
        // Read
        log('문서 조회 테스트...');
        const found = await testCollection.findOne({ _id: testId });
        if (found && found.message === testDoc.message) {
            log('문서 조회 성공', 'success');
            TEST_RESULTS.passed.push('Read document');
        } else {
            log('문서 조회 실패', 'error');
            TEST_RESULTS.failed.push('Read document');
        }
        
        // Update
        log('문서 업데이트 테스트...');
        await testCollection.updateOne(
            { _id: testId },
            { $set: { updated: true, updatedAt: new Date() } }
        );
        const updated = await testCollection.findOne({ _id: testId });
        if (updated && updated.updated === true) {
            log('문서 업데이트 성공', 'success');
            TEST_RESULTS.passed.push('Update document');
        } else {
            log('문서 업데이트 실패', 'error');
            TEST_RESULTS.failed.push('Update document');
        }
        
        // Delete
        log('문서 삭제 테스트...');
        await testCollection.deleteOne({ _id: testId });
        const deleted = await testCollection.findOne({ _id: testId });
        if (!deleted) {
            log('문서 삭제 성공', 'success');
            TEST_RESULTS.passed.push('Delete document');
        } else {
            log('문서 삭제 실패', 'error');
            TEST_RESULTS.failed.push('Delete document');
        }
        
        // 3. 인덱스 확인
        log('\n=== 주요 컬렉션 인덱스 확인 ===');
        const importantCollections = ['users', 'orders', 'service_logs'];
        
        for (const colName of importantCollections) {
            const collection = db.collection(colName);
            try {
                const indexes = await collection.indexes();
                log(`${colName}: ${indexes.length}개 인덱스`, 'info');
                indexes.forEach(idx => {
                    if (idx.name !== '_id_') {
                        console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
                    }
                });
            } catch (error) {
                log(`${colName} 컬렉션이 존재하지 않습니다`, 'warning');
            }
        }
        TEST_RESULTS.passed.push('Index check');
        
        // 4. 사용자 수 확인
        log('\n=== 데이터 통계 ===');
        try {
            const userCount = await db.collection('users').countDocuments();
            const orderCount = await db.collection('orders').countDocuments();
            const adminCount = await db.collection('users').countDocuments({ role: 'admin' });
            
            log(`사용자 수: ${userCount}명`);
            log(`주문 수: ${orderCount}건`);
            log(`관리자 수: ${adminCount}명`);
            
            if (adminCount === 0) {
                log('관리자 계정이 없습니다. seed.js 실행이 필요합니다', 'warning');
            }
            
            TEST_RESULTS.passed.push('Statistics');
        } catch (error) {
            log('통계 조회 중 오류 발생', 'warning');
        }
        
        // 5. 연결 상태 확인
        log('\n=== 연결 상태 ===');
        const ping = await db.admin().ping();
        if (ping) {
            log('MongoDB 서버 응답 정상', 'success');
            TEST_RESULTS.passed.push('Server ping');
        }
        
        return true;
        
    } catch (error) {
        log(`연결 실패: ${error.message}`, 'error');
        TEST_RESULTS.failed.push('Connection');
        return false;
        
    } finally {
        await client.close();
        log('\n연결 종료');
    }
}

async function testNetlifyFunctionPath() {
    log('\n=== Netlify Functions 경로 확인 ===');
    const fs = require('fs');
    const path = require('path');
    
    const paths = [
        'netlify/functions/_lib/mongo.js',
        'netlify/functions/_lib/auth.js',
        'netlify/functions/orders-mongo.js'
    ];
    
    for (const filePath of paths) {
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) {
            log(`${filePath} ✅`, 'success');
            TEST_RESULTS.passed.push(`Path: ${filePath}`);
        } else {
            log(`${filePath} ❌ 파일이 없습니다`, 'error');
            TEST_RESULTS.failed.push(`Path: ${filePath}`);
        }
    }
}

async function main() {
    console.log('🔍 MongoDB 마이그레이션 Sanity Check');
    console.log('=====================================\n');
    
    // 경로 확인
    await testNetlifyFunctionPath();
    
    // MongoDB 연결 테스트
    const success = await testConnection();
    
    // 결과 요약
    console.log('\n📊 테스트 결과 요약');
    console.log('===================');
    console.log(`✅ 성공: ${TEST_RESULTS.passed.length}개`);
    TEST_RESULTS.passed.forEach(test => {
        console.log(`   - ${test}`);
    });
    
    if (TEST_RESULTS.failed.length > 0) {
        console.log(`\n❌ 실패: ${TEST_RESULTS.failed.length}개`);
        TEST_RESULTS.failed.forEach(test => {
            console.log(`   - ${test}`);
        });
    }
    
    // 다음 단계 안내
    console.log('\n📝 다음 단계:');
    if (TEST_RESULTS.failed.length === 0) {
        console.log('1. ✅ 모든 테스트 통과!');
        console.log('2. scripts/mongodb-indexes.js 실행하여 인덱스 생성');
        console.log('3. backend/utils/seed.js 실행하여 관리자 계정 생성');
        console.log('4. Netlify와 Railway에 환경 변수 설정');
        console.log('5. Git 커밋 및 배포');
    } else {
        console.log('1. ❌ 실패한 항목 확인 및 수정 필요');
        console.log('2. MONGODB_URI 환경 변수 확인');
        console.log('3. MongoDB 서버 상태 확인');
    }
    
    process.exit(TEST_RESULTS.failed.length > 0 ? 1 : 0);
}

// 실행
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});