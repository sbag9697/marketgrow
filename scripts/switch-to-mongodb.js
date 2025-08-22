#!/usr/bin/env node

/**
 * PostgreSQL → MongoDB 전환 스크립트
 * Netlify Functions를 MongoDB 버전으로 교체
 */

const fs = require('fs');
const path = require('path');

const FUNCTIONS_DIR = path.join(process.cwd(), 'netlify', 'functions');

const migrations = [
    {
        name: 'orders',
        old: 'orders.js',
        new: 'orders-mongo.js',
        backup: 'orders-postgres.backup.js'
    },
    {
        name: 'smmturk',
        old: 'smmturk.js', 
        new: 'smmturk-mongo.js',
        backup: 'smmturk-postgres.backup.js'
    }
];

function log(message, type = 'info') {
    const prefix = {
        info: '📌',
        success: '✅',
        error: '❌',
        warning: '⚠️'
    }[type] || '📌';
    
    console.log(`${prefix} ${message}`);
}

async function switchToMongoDB() {
    console.log('🔄 MongoDB 마이그레이션 시작\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const migration of migrations) {
        const oldPath = path.join(FUNCTIONS_DIR, migration.old);
        const newPath = path.join(FUNCTIONS_DIR, migration.new);
        const backupPath = path.join(FUNCTIONS_DIR, migration.backup);
        
        log(`${migration.name} 마이그레이션 시작...`);
        
        try {
            // 1. 새 MongoDB 버전이 있는지 확인
            if (!fs.existsSync(newPath)) {
                log(`${migration.new} 파일이 없습니다. 건너뜁니다.`, 'warning');
                continue;
            }
            
            // 2. 기존 파일 백업
            if (fs.existsSync(oldPath)) {
                fs.copyFileSync(oldPath, backupPath);
                log(`백업 생성: ${migration.backup}`, 'success');
            }
            
            // 3. MongoDB 버전으로 교체
            fs.copyFileSync(newPath, oldPath);
            log(`${migration.old} → MongoDB 버전으로 교체 완료`, 'success');
            
            // 4. MongoDB 버전 파일 삭제 (선택적)
            // fs.unlinkSync(newPath);
            // log(`임시 파일 ${migration.new} 삭제`, 'info');
            
            successCount++;
            
        } catch (error) {
            log(`${migration.name} 마이그레이션 실패: ${error.message}`, 'error');
            errorCount++;
        }
        
        console.log(''); // 빈 줄
    }
    
    // 결과 요약
    console.log('📊 마이그레이션 결과');
    console.log('==================');
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${errorCount}개`);
    
    if (errorCount === 0) {
        console.log('\n✨ 모든 Functions가 MongoDB 버전으로 전환되었습니다!');
        console.log('\n📝 다음 단계:');
        console.log('1. git add -A');
        console.log('2. git commit -m "feat: MongoDB 마이그레이션 완료"');
        console.log('3. git push');
        console.log('4. Netlify 자동 배포 확인');
    } else {
        console.log('\n⚠️ 일부 마이그레이션이 실패했습니다. 수동으로 확인하세요.');
    }
}

async function rollbackToPostgres() {
    console.log('🔄 PostgreSQL로 롤백 시작\n');
    
    for (const migration of migrations) {
        const oldPath = path.join(FUNCTIONS_DIR, migration.old);
        const backupPath = path.join(FUNCTIONS_DIR, migration.backup);
        
        if (fs.existsSync(backupPath)) {
            fs.copyFileSync(backupPath, oldPath);
            log(`${migration.old} 복구 완료`, 'success');
        }
    }
    
    console.log('\n✅ PostgreSQL 버전으로 롤백 완료');
}

// 명령행 인자 처리
const command = process.argv[2];

if (command === 'rollback') {
    rollbackToPostgres().catch(console.error);
} else {
    switchToMongoDB().catch(console.error);
}