const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Atlas 연결 테스트
async function testConnection() {
    console.log('🔍 MongoDB 연결 테스트 시작...\n');
    
    // 환경변수 확인
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
        console.error('❌ MONGODB_URI 환경변수가 설정되지 않았습니다.');
        console.log('💡 .env 파일에 다음과 같이 추가하세요:');
        console.log('MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/marketgrow?retryWrites=true&w=majority\n');
        return;
    }
    
    // URI 정보 출력 (비밀번호는 가림)
    const uriDisplay = mongoUri.replace(/:([^@]+)@/, ':****@');
    console.log('📍 연결 시도 URI:', uriDisplay);
    console.log('');
    
    try {
        // MongoDB 연결 시도
        console.log('⏳ MongoDB 연결 중...');
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        
        console.log('✅ MongoDB Atlas 연결 성공!\n');
        
        // 연결 정보 출력
        const connection = mongoose.connection;
        console.log('📊 연결 정보:');
        console.log('- 호스트:', connection.host);
        console.log('- 포트:', connection.port);
        console.log('- 데이터베이스:', connection.name);
        console.log('- 상태:', connection.readyState === 1 ? '연결됨' : '연결 안됨');
        
        // 테스트 데이터 생성
        console.log('\n📝 테스트 데이터 생성 중...');
        const TestSchema = new mongoose.Schema({
            message: String,
            timestamp: Date
        });
        const Test = mongoose.model('Test', TestSchema);
        
        const testDoc = await Test.create({
            message: 'MongoDB Atlas 연결 테스트 성공!',
            timestamp: new Date()
        });
        
        console.log('✅ 테스트 데이터 생성 완료:', testDoc.message);
        
        // 데이터 조회
        const count = await Test.countDocuments();
        console.log('📈 총 문서 수:', count);
        
        // 정리
        await Test.deleteMany({});
        console.log('🧹 테스트 데이터 정리 완료\n');
        
        console.log('🎉 모든 테스트 통과! MongoDB Atlas가 정상적으로 작동합니다.');
        
    } catch (error) {
        console.error('❌ MongoDB 연결 실패:\n');
        console.error('오류 메시지:', error.message);
        
        // 오류 유형별 해결 방법
        if (error.message.includes('querySrv ENOTFOUND')) {
            console.log('\n💡 해결 방법:');
            console.log('1. MongoDB Atlas에서 정확한 클러스터 주소 확인');
            console.log('2. Connection String의 cluster0.xxxxx 부분이 올바른지 확인');
            console.log('3. 예시: cluster0.abcde.mongodb.net (ot3kp가 아닌 실제 값)');
        } else if (error.message.includes('Authentication failed')) {
            console.log('\n💡 해결 방법:');
            console.log('1. MongoDB Atlas 사용자명과 비밀번호 확인');
            console.log('2. 비밀번호에 특수문자가 있으면 URL 인코딩 필요');
            console.log('3. 새 사용자 생성 시도');
        } else if (error.message.includes('connect ETIMEDOUT')) {
            console.log('\n💡 해결 방법:');
            console.log('1. MongoDB Atlas Network Access에서 IP 화이트리스트 확인');
            console.log('2. "0.0.0.0/0" (Allow from anywhere) 추가');
            console.log('3. 방화벽 설정 확인');
        }
        
        console.log('\n📚 전체 가이드: MONGODB_ATLAS_SETUP.md 파일 참조');
    } finally {
        // 연결 종료
        await mongoose.disconnect();
        console.log('\n👋 연결 종료');
        process.exit(0);
    }
}

// 테스트 실행
testConnection();