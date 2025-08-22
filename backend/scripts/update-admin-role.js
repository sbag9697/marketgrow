const mongoose = require('mongoose');
const User = require('../models/User');

async function updateAdminRole() {
    try {
        // MongoDB 연결
        await mongoose.connect('mongodb://localhost:27017/marketgrow', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('🔗 MongoDB 연결 성공\n');
        
        // 관리자로 설정할 이메일 목록
        const adminEmails = [
            'admin@marketgrow.kr',
            'newadmin@marketgrow.kr',
            'dashtest@test.com',
            'realadmin@test.com'
        ];
        
        console.log('🔧 관리자 권한 업데이트 시작...\n');
        
        for (const email of adminEmails) {
            const user = await User.findOne({ email });
            
            if (user) {
                user.role = 'admin';
                user.isEmailVerified = true;
                user.isPhoneVerified = true;
                user.membershipLevel = 'diamond';
                await user.save();
                
                console.log(`✅ ${email} - 관리자 권한 설정 완료`);
                console.log(`   역할: ${user.role}`);
                console.log(`   등급: ${user.membershipLevel}`);
                console.log('');
            } else {
                console.log(`⚠️  ${email} - 계정을 찾을 수 없음`);
            }
        }
        
        // 모든 관리자 계정 표시
        console.log('\n========================================');
        console.log('📋 현재 관리자 계정 목록:');
        console.log('========================================');
        
        const admins = await User.find({ role: 'admin' });
        
        if (admins.length > 0) {
            admins.forEach((admin, index) => {
                console.log(`\n${index + 1}. ${admin.email}`);
                console.log(`   이름: ${admin.name || '미설정'}`);
                console.log(`   역할: ${admin.role}`);
                console.log(`   등급: ${admin.membershipLevel}`);
                console.log(`   생성일: ${admin.createdAt.toLocaleDateString()}`);
            });
        } else {
            console.log('관리자 계정이 없습니다.');
        }
        
        console.log('\n========================================');
        console.log('✅ 관리자 권한 설정 완료!');
        console.log('========================================\n');
        
        console.log('🌐 관리자 페이지 접속 정보:');
        console.log('   URL: http://localhost:5002/admin/');
        console.log('   또는: http://localhost:5002/admin-standalone.html');
        console.log('\n   위 계정 중 하나로 로그인하세요.');
        console.log('   기본 비밀번호: Admin123!@# 또는 password123');
        console.log('========================================\n');
        
        await mongoose.connection.close();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ 오류 발생:', error);
        process.exit(1);
    }
}

updateAdminRole();