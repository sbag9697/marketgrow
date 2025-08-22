const axios = require('axios');

// API URL 설정
const API_URL = 'http://localhost:5002/api';

async function createAdminAccount() {
    try {
        console.log('🔐 관리자 계정 생성 시작...\n');
        
        // 1. 관리자 계정 생성
        const adminData = {
            username: 'admin',
            email: 'admin@marketgrow.kr',
            password: 'Admin123!@#',
            name: '관리자',
            phone: '01012345678'
        };
        
        console.log('📝 계정 생성 중...');
        console.log('   이메일:', adminData.email);
        console.log('   비밀번호:', adminData.password);
        
        let userId;
        
        try {
            // 회원가입 시도
            const signupResponse = await axios.post(`${API_URL}/auth/signup`, adminData);
            userId = signupResponse.data.data.user._id;
            console.log('✅ 새 계정 생성 완료!');
        } catch (error) {
            if (error.response?.data?.message?.includes('already exists')) {
                console.log('⚠️  계정이 이미 존재합니다. 로그인 시도...');
                
                // 로그인하여 사용자 ID 가져오기
                const loginResponse = await axios.post(`${API_URL}/auth/login`, {
                    login: adminData.email,
                    password: adminData.password
                });
                
                userId = loginResponse.data.data.user._id;
                console.log('✅ 기존 계정 확인 완료!');
            } else {
                throw error;
            }
        }
        
        // 2. MongoDB에서 직접 role 업데이트
        const { connectDB } = require('../utils/database');
        const User = require('../models/User');
        
        await connectDB();
        
        console.log('\n🔧 관리자 권한 설정 중...');
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { 
                role: 'admin',
                isEmailVerified: true,
                isPhoneVerified: true,
                membershipLevel: 'diamond'
            },
            { new: true }
        );
        
        if (updatedUser) {
            console.log('✅ 관리자 권한 설정 완료!');
            console.log('\n========================================');
            console.log('🎉 관리자 계정 생성 완료!');
            console.log('========================================');
            console.log('📧 이메일:', adminData.email);
            console.log('🔑 비밀번호:', adminData.password);
            console.log('👤 역할:', updatedUser.role);
            console.log('💎 등급:', updatedUser.membershipLevel);
            console.log('========================================');
            console.log('\n🌐 관리자 페이지 접속:');
            console.log('   로컬: http://localhost:5002/admin/');
            console.log('   실제: https://marketgrow.kr/admin-standalone.html');
            console.log('========================================\n');
        } else {
            console.error('❌ 사용자를 찾을 수 없습니다.');
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ 오류 발생:', error.response?.data || error.message);
        process.exit(1);
    }
}

// 스크립트 실행
createAdminAccount();