require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const logger = require('./utils/logger');

// MongoDB 연결
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/marketgrow';
        await mongoose.connect(mongoUri);
        console.log('MongoDB 연결 성공');
    } catch (error) {
        console.error('MongoDB 연결 실패:', error);
        process.exit(1);
    }
};

// 테스트 계정 생성
const createTestAccount = async () => {
    try {
        await connectDB();

        // 기존 테스트 계정 확인
        const existingUser = await User.findOne({ 
            $or: [
                { username: 'testuser' },
                { email: 'test@test.com' }
            ]
        });

        if (existingUser) {
            console.log('테스트 계정이 이미 존재합니다.');
            console.log('로그인 정보:');
            console.log('아이디: testuser');
            console.log('이메일: test@test.com');
            console.log('비밀번호: Test1234!');
            process.exit(0);
        }

        // 새 테스트 계정 생성
        const testUser = new User({
            username: 'testuser',
            email: 'test@test.com',
            password: 'Test1234!',
            name: '테스트 사용자',
            phone: '01012345678',
            businessType: 'personal',
            isEmailVerified: true,
            isPhoneVerified: true,
            termsAcceptedAt: new Date(),
            points: 10000,
            role: 'user'
        });

        await testUser.save();

        console.log('✅ 테스트 계정이 생성되었습니다!');
        console.log('');
        console.log('=================================');
        console.log('로그인 정보:');
        console.log('아이디: testuser');
        console.log('이메일: test@test.com');
        console.log('비밀번호: Test1234!');
        console.log('=================================');
        console.log('');
        console.log('위 정보로 로그인할 수 있습니다.');

        // 관리자 계정도 확인/생성
        const adminUser = await User.findOne({ username: 'admin' });
        if (!adminUser) {
            const admin = new User({
                username: 'admin',
                email: 'admin@marketgrow.com',
                password: 'Admin1234!',
                name: '관리자',
                phone: '01098765432',
                businessType: 'corporation',
                isEmailVerified: true,
                isPhoneVerified: true,
                termsAcceptedAt: new Date(),
                role: 'admin'
            });
            await admin.save();
            
            console.log('');
            console.log('✅ 관리자 계정도 생성되었습니다!');
            console.log('관리자 아이디: admin');
            console.log('관리자 비밀번호: Admin1234!');
        }

    } catch (error) {
        console.error('계정 생성 중 오류:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

// 스크립트 실행
createTestAccount();