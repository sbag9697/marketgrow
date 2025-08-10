const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marketgrow');
    console.log('Connected to MongoDB');
    
    // 모든 사용자 조회
    const users = await User.find({}).select('username email role isActive');
    console.log('\n모든 사용자 목록:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - Role: ${user.role}, Active: ${user.isActive}`);
    });
    
    // testuser 확인
    const testUser = await User.findOne({ username: 'testuser' }).select('+password');
    if (testUser) {
      console.log('\ntestuser 계정 정보:');
      console.log('Username:', testUser.username);
      console.log('Email:', testUser.email);
      console.log('Password exists:', !!testUser.password);
      console.log('Is Active:', testUser.isActive);
      console.log('Email Verified:', testUser.isEmailVerified);
      
      // 비밀번호 테스트
      const isValid = await testUser.comparePassword('Test1234!');
      console.log('Password Test1234! is valid:', isValid);
    } else {
      console.log('\ntestuser 계정을 찾을 수 없습니다.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();