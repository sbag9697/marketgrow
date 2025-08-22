#!/usr/bin/env node

/**
 * 관리자 계정 초기화 스크립트
 * PostgreSQL 데이터베이스에 관리자 계정을 생성합니다.
 * 
 * 사용법:
 * node scripts/init-admin.js
 * 
 * 환경변수:
 * - DATABASE_URL 또는 POSTGRES_URL: PostgreSQL 연결 문자열
 * - ADMIN_EMAIL: 관리자 이메일 (기본: admin@marketgrow.kr)
 * - ADMIN_PASSWORD: 관리자 비밀번호 (기본: Admin123!@#)
 */

const { runAdminSeed } = require('../backend/utils/seed.pg');

async function init() {
    try {
        console.log('🚀 관리자 계정 초기화 시작...');
        console.log('📧 관리자 이메일:', process.env.ADMIN_EMAIL || 'admin@marketgrow.kr');
        console.log('');
        
        await runAdminSeed();
        
        console.log('\n✅ 관리자 계정 초기화 완료!');
        console.log('');
        console.log('🔐 로그인 정보:');
        console.log('   URL: https://marketgrow.kr/admin-standalone.html');
        console.log('   이메일:', process.env.ADMIN_EMAIL || 'admin@marketgrow.kr');
        console.log('   비밀번호: 환경변수에 설정된 값 사용');
        console.log('');
        console.log('⚠️  보안 권장사항:');
        console.log('   1. 첫 로그인 후 비밀번호를 변경하세요');
        console.log('   2. 2단계 인증을 활성화하세요');
        console.log('   3. 정기적으로 비밀번호를 변경하세요');
        
    } catch (error) {
        console.error('❌ 초기화 실패:', error);
        process.exit(1);
    }
}

// 스크립트 실행
init();