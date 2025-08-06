// MongoDB 연결 테스트 스크립트
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
    try {
        console.log('MongoDB 연결 테스트 시작...');
        console.log('연결 URI:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB 연결 성공!');
        
        // 테스트 데이터 생성
        const testCollection = mongoose.connection.collection('test');
        await testCollection.insertOne({ test: true, date: new Date() });
        console.log('✅ 테스트 데이터 생성 성공!');
        
        // 테스트 데이터 조회
        const result = await testCollection.findOne({ test: true });
        console.log('✅ 테스트 데이터 조회 성공:', result);
        
        // 테스트 데이터 삭제
        await testCollection.deleteOne({ test: true });
        console.log('✅ 테스트 데이터 삭제 성공!');
        
        await mongoose.disconnect();
        console.log('✅ 연결 종료 완료!');
        console.log('\n🎉 MongoDB 설정이 정상적으로 완료되었습니다!');
        
    } catch (error) {
        console.error('❌ MongoDB 연결 실패:', error.message);
        console.log('\n해결 방법:');
        console.log('1. MongoDB가 실행중인지 확인');
        console.log('2. .env 파일의 MONGODB_URI 확인');
        console.log('3. 네트워크 연결 확인');
        process.exit(1);
    }
}

testConnection();