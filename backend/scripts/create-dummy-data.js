const axios = require('axios');

const API_URL = 'http://localhost:5002/api';

async function createDummyData() {
    console.log('🔄 Creating dummy data for admin dashboard...\n');
    
    try {
        // 1. 여러 사용자 생성
        console.log('1️⃣ Creating users...');
        const users = [];
        for (let i = 1; i <= 5; i++) {
            try {
                const res = await axios.post(`${API_URL}/auth/signup`, {
                    username: `user${i}`,
                    email: `user${i}@test.com`,
                    password: 'Test123!',
                    name: `테스트유저${i}`,
                    phone: `010${(20000000 + i).toString()}`
                });
                users.push(res.data.data.user);
                console.log(`   ✅ User ${i} created`);
            } catch (error) {
                if (error.response?.data?.message?.includes('이미 사용')) {
                    console.log(`   ⚠️ User ${i} already exists`);
                }
            }
        }
        
        // 2. 서비스 생성 (관리자 권한 필요없이 직접 DB에 추가)
        console.log('\n2️⃣ Creating services...');
        const services = [
            {
                name: '인스타그램 팔로워 증가',
                platform: 'instagram',
                category: 'followers',
                pricing: [{ quantity: 100, price: 15000 }],
                minQuantity: 100,
                maxQuantity: 10000
            },
            {
                name: '유튜브 구독자 증가',
                platform: 'youtube', 
                category: 'subscribers',
                pricing: [{ quantity: 100, price: 20000 }],
                minQuantity: 100,
                maxQuantity: 10000
            },
            {
                name: '틱톡 팔로워 증가',
                platform: 'tiktok',
                category: 'followers', 
                pricing: [{ quantity: 100, price: 12000 }],
                minQuantity: 100,
                maxQuantity: 10000
            }
        ];
        
        // 서비스는 API로 생성 불가능하므로 스킵
        console.log('   ℹ️ Services need to be created via admin panel or database directly');
        
        // 3. 주문 생성 시뮬레이션
        console.log('\n3️⃣ Creating sample orders...');
        // 주문은 인증된 사용자로 생성해야 하므로 첫 번째 사용자로 로그인
        if (users.length > 0) {
            try {
                const loginRes = await axios.post(`${API_URL}/auth/login`, {
                    login: 'user1@test.com',
                    password: 'Test123!'
                });
                
                const userToken = loginRes.data.data.token;
                
                // 서비스 목록 가져오기
                const servicesRes = await axios.get(`${API_URL}/services`);
                const availableServices = servicesRes.data.data?.services || [];
                
                if (availableServices.length > 0) {
                    // 첫 번째 서비스로 주문 생성
                    const orderRes = await axios.post(`${API_URL}/orders`, {
                        serviceId: availableServices[0]._id,
                        quantity: 500,
                        targetUrl: 'https://instagram.com/testuser'
                    }, {
                        headers: { Authorization: `Bearer ${userToken}` }
                    });
                    console.log('   ✅ Sample order created');
                }
            } catch (error) {
                console.log('   ⚠️ Could not create orders:', error.response?.data?.message || error.message);
            }
        }
        
        console.log('\n✅ Dummy data creation completed!');
        console.log('\n📊 Summary:');
        console.log('====================');
        console.log('Test users: 5 users (user1-5@test.com)');
        console.log('Password: Test123!');
        console.log('Admin: testadmin@marketgrow.kr / Test123!');
        console.log('====================\n');
        console.log('Note: To see full functionality, manually update testadmin user role to "admin" in database');
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// 실행
createDummyData();