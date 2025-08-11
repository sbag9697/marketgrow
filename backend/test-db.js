// 데이터베이스 연결 테스트 스크립트
require('dotenv').config();

const mongoose = require('mongoose');

async function testConnection() {
    console.log('🔧 데이터베이스 연결 테스트 시작...\n');
    
    // 환경변수 확인
    console.log('환경변수 확인:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '설정됨' : '❌ 설정 안됨');
    console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '설정됨' : '❌ 설정 안됨');
    console.log('- PORT:', process.env.PORT || '5000');
    console.log('\n');

    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/marketgrow';
    
    console.log('연결 시도 중:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    
    try {
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ 데이터베이스 연결 성공!\n');
        
        // 컬렉션 목록 확인
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('컬렉션 목록:');
        collections.forEach(col => {
            console.log(`- ${col.name}`);
        });
        
        // users 컬렉션 확인
        const User = require('./models/User');
        const userCount = await User.countDocuments();
        console.log(`\n사용자 수: ${userCount}명`);
        
        // services 컬렉션 확인
        const Service = require('./models/Service');
        const serviceCount = await Service.countDocuments();
        console.log(`서비스 수: ${serviceCount}개`);
        
        // 관리자 계정 확인
        const adminUser = await User.findOne({ email: 'admin@marketgrow.com' });
        if (adminUser) {
            console.log('\n✅ 관리자 계정 존재:', adminUser.username);
        } else {
            console.log('\n⚠️ 관리자 계정이 없습니다. 생성이 필요합니다.');
        }
        
    } catch (error) {
        console.error('❌ 데이터베이스 연결 실패!');
        console.error('오류:', error.message);
        console.error('\n해결 방법:');
        console.error('1. Railway 대시보드에서 MongoDB 서비스 확인');
        console.error('2. DATABASE_URL 또는 MONGODB_URI 환경변수 설정');
        console.error('3. MongoDB 서비스가 실행 중인지 확인');
    } finally {
        await mongoose.disconnect();
        console.log('\n연결 종료');
        process.exit(0);
    }
}

testConnection();