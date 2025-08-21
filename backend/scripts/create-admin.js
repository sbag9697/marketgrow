const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function createAdmin() {
    try {
        // In-memory DB 연결
        await mongoose.connect('mongodb://localhost:27017/marketgrow-test', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to database');
        
        // 기존 admin 삭제
        await User.deleteOne({ email: 'admin@test.com' });
        
        // 새 관리자 생성
        const hashedPassword = await bcrypt.hash('Admin123!', 10);
        
        const admin = new User({
            username: 'admin',
            email: 'admin@test.com',
            password: hashedPassword,
            name: '관리자',
            phone: '01012345678',
            role: 'admin',  // 중요: admin role 설정
            isEmailVerified: true,
            isPhoneVerified: true,
            businessType: 'corporation',
            isActive: true,
            termsAcceptedAt: new Date()
        });
        
        await admin.save();
        
        console.log('\n관리자 계정 생성 완료!');
        console.log('=====================================');
        console.log('이메일: admin@test.com');
        console.log('비밀번호: Admin123!');
        console.log('역할: admin');
        console.log('=====================================\n');
        
        await mongoose.connection.close();
        
    } catch (error) {
        console.error('Error:', error);
    }
}

createAdmin();
