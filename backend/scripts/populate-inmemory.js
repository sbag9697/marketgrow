const axios = require('axios');

const API_URL = 'http://localhost:5002/api';

async function createTestData() {
    console.log('🔄 Creating test data in running server...');
    
    try {
        // 1. 관리자 계정 생성
        console.log('\n1️⃣ Creating admin account...');
        const signupRes = await axios.post(`${API_URL}/auth/signup`, {
            username: 'admin',
            email: 'admin@marketgrow.kr',
            password: 'Admin123!',
            name: '관리자',
            phone: '01012345678'
        });
        
        if (signupRes.data.success) {
            console.log('✅ Admin account created');
            console.log('Email: admin@marketgrow.kr');
            console.log('Password: Admin123!');
        }
        
        // 2. 관리자로 로그인
        console.log('\n2️⃣ Logging in as admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            login: 'admin@marketgrow.kr',
            password: 'Admin123!'
        });
        
        const token = loginRes.data.data.token;
        console.log('✅ Logged in successfully');
        
        // 3. 일반 사용자 생성
        console.log('\n3️⃣ Creating test users...');
        for (let i = 1; i <= 5; i++) {
            await axios.post(`${API_URL}/auth/signup`, {
                username: `user${i}`,
                email: `user${i}@test.com`,
                password: 'Test123!',
                name: `테스트유저${i}`,
                phone: `010${(10000000 + i).toString()}`
            });
            console.log(`✅ User ${i} created`);
        }
        
        // 4. 서비스 생성 (관리자 권한 필요)
        console.log('\n4️⃣ Creating services...');
        const services = [
            {
                name: '인스타그램 팔로워',
                nameEn: 'Instagram Followers',
                platform: 'instagram',
                category: 'followers',
                description: '고품질 인스타그램 팔로워를 빠르고 안전하게 늘려드립니다',
                pricing: [
                    { quantity: 100, price: 15000 },
                    { quantity: 500, price: 70000 },
                    { quantity: 1000, price: 130000 }
                ],
                minQuantity: 100,
                maxQuantity: 10000,
                deliveryTime: { min: 1, max: 24, unit: 'hours' }
            },
            {
                name: '유튜브 구독자',
                nameEn: 'YouTube Subscribers',
                platform: 'youtube',
                category: 'subscribers',
                description: '유튜브 채널 구독자를 안전하게 늘려드립니다',
                pricing: [
                    { quantity: 100, price: 20000 },
                    { quantity: 500, price: 90000 },
                    { quantity: 1000, price: 170000 }
                ],
                minQuantity: 100,
                maxQuantity: 10000,
                deliveryTime: { min: 1, max: 3, unit: 'days' }
            },
            {
                name: '틱톡 팔로워',
                nameEn: 'TikTok Followers',
                platform: 'tiktok',
                category: 'followers',
                description: '틱톡 팔로워를 빠르게 늘려드립니다',
                pricing: [
                    { quantity: 100, price: 12000 },
                    { quantity: 500, price: 55000 },
                    { quantity: 1000, price: 100000 }
                ],
                minQuantity: 100,
                maxQuantity: 10000,
                deliveryTime: { min: 1, max: 24, unit: 'hours' }
            }
        ];
        
        // 먼저 관리자 role 업데이트가 필요할 수 있음
        console.log('Note: Services creation requires admin role update in DB');
        
        console.log('\n✅ Test data creation completed!');
        console.log('\n📊 Summary:');
        console.log('====================');
        console.log('Admin: admin@marketgrow.kr / Admin123!');
        console.log('Users: 5 test users created');
        console.log('====================');
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// 실행
createTestData();