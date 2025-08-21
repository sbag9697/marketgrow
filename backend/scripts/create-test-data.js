const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Models
const User = require('../models/User');
const Service = require('../models/Service');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Deposit = require('../models/Deposit');

// Connect to database
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/marketgrow-test', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to test database');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
};

// Create test data
const createTestData = async () => {
    try {
        console.log('🔄 Creating test data...');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Service.deleteMany({}),
            Order.deleteMany({}),
            Payment.deleteMany({}),
            Deposit.deleteMany({})
        ]);

        // Create admin user
        const adminUser = await User.create({
            username: 'admin',
            email: 'admin@marketgrow.kr',
            password: 'Admin123!',
            name: '관리자',
            phone: '01012345678',
            role: 'admin',
            isEmailVerified: true,
            isPhoneVerified: true,
            businessType: 'corporation',
            termsAcceptedAt: new Date()
        });
        console.log('✅ Admin user created');

        // Create test users
        const users = [];
        for (let i = 1; i <= 10; i++) {
            const user = await User.create({
                username: `user${i}`,
                email: `user${i}@test.com`,
                password: 'Test123!',
                name: `테스트유저${i}`,
                phone: `010${(10000000 + i).toString()}`,
                role: 'user',
                isEmailVerified: true,
                isPhoneVerified: Math.random() > 0.3,
                businessType: ['personal', 'small', 'startup', 'agency'][Math.floor(Math.random() * 4)],
                points: Math.floor(Math.random() * 10000),
                depositBalance: Math.floor(Math.random() * 500000),
                totalSpent: Math.floor(Math.random() * 1000000),
                membershipLevel: ['bronze', 'silver', 'gold', 'platinum'][Math.floor(Math.random() * 4)],
                termsAcceptedAt: new Date(),
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
            });
            users.push(user);
        }
        console.log(`✅ ${users.length} test users created`);

        // Create services
        const services = [
            {
                serviceId: 'IG001',
                name: '인스타그램 팔로워 (한국)',
                nameEn: 'Instagram Followers (Korea)',
                platform: 'instagram',
                category: 'followers',
                description: '고품질 한국 인스타그램 팔로워',
                pricing: [
                    { quantity: 100, price: 15000 },
                    { quantity: 500, price: 70000 },
                    { quantity: 1000, price: 130000 }
                ],
                minQuantity: 100,
                maxQuantity: 10000,
                isActive: true,
                deliveryTime: { min: 1, max: 24, unit: 'hours' },
                totalOrders: Math.floor(Math.random() * 1000),
                totalRevenue: Math.floor(Math.random() * 10000000)
            },
            {
                serviceId: 'IG002',
                name: '인스타그램 좋아요',
                nameEn: 'Instagram Likes',
                platform: 'instagram',
                category: 'likes',
                description: '실제 계정 인스타그램 좋아요',
                pricing: [
                    { quantity: 50, price: 8000 },
                    { quantity: 200, price: 30000 },
                    { quantity: 500, price: 70000 }
                ],
                minQuantity: 50,
                maxQuantity: 5000,
                isActive: true,
                deliveryTime: { min: 0, max: 1, unit: 'hours' },
                totalOrders: Math.floor(Math.random() * 1000),
                totalRevenue: Math.floor(Math.random() * 10000000)
            },
            {
                serviceId: 'YT001',
                name: '유튜브 구독자',
                nameEn: 'YouTube Subscribers',
                platform: 'youtube',
                category: 'subscribers',
                description: '고품질 유튜브 구독자',
                pricing: [
                    { quantity: 100, price: 20000 },
                    { quantity: 500, price: 90000 },
                    { quantity: 1000, price: 170000 }
                ],
                minQuantity: 100,
                maxQuantity: 10000,
                isActive: true,
                deliveryTime: { min: 1, max: 3, unit: 'days' },
                totalOrders: Math.floor(Math.random() * 1000),
                totalRevenue: Math.floor(Math.random() * 10000000)
            },
            {
                serviceId: 'YT002',
                name: '유튜브 조회수',
                nameEn: 'YouTube Views',
                platform: 'youtube',
                category: 'views',
                description: '유튜브 동영상 조회수',
                pricing: [
                    { quantity: 1000, price: 5000 },
                    { quantity: 5000, price: 20000 },
                    { quantity: 10000, price: 35000 }
                ],
                minQuantity: 1000,
                maxQuantity: 100000,
                isActive: true,
                deliveryTime: { min: 0, max: 1, unit: 'hours' },
                totalOrders: Math.floor(Math.random() * 1000),
                totalRevenue: Math.floor(Math.random() * 10000000)
            },
            {
                serviceId: 'TT001',
                name: '틱톡 팔로워',
                nameEn: 'TikTok Followers',
                platform: 'tiktok',
                category: 'followers',
                description: '틱톡 팔로워 증가',
                pricing: [
                    { quantity: 100, price: 12000 },
                    { quantity: 500, price: 55000 },
                    { quantity: 1000, price: 100000 }
                ],
                minQuantity: 100,
                maxQuantity: 10000,
                isActive: true,
                deliveryTime: { min: 1, max: 24, unit: 'hours' },
                totalOrders: Math.floor(Math.random() * 1000),
                totalRevenue: Math.floor(Math.random() * 10000000)
            }
        ];

        const createdServices = await Service.insertMany(services);
        console.log(`✅ ${createdServices.length} services created`);

        // Create orders
        const orders = [];
        const orderStatuses = ['pending', 'processing', 'partial', 'completed', 'cancelled', 'refunded'];
        
        for (let i = 1; i <= 50; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const service = createdServices[Math.floor(Math.random() * createdServices.length)];
            const quantity = Math.floor(Math.random() * 900) + 100;
            const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
            
            const unitPrice = service.pricing[0].price;
            const baseAmount = unitPrice * quantity / 1000;
            const discountAmount = Math.floor(Math.random() * 5000);
            const finalAmount = Math.max(baseAmount - discountAmount, 1000);
            
            const order = await Order.create({
                orderNumber: `ORD${Date.now()}${i}`,
                user: user._id,
                service: service._id,
                quantity: quantity,
                targetUrl: `https://instagram.com/testuser${i}`,
                unitPrice: unitPrice,
                totalAmount: baseAmount,
                baseAmount: baseAmount,
                discountAmount: discountAmount,
                finalAmount: finalAmount,
                status: status,
                paymentMethod: ['card', 'bank', 'deposit'][Math.floor(Math.random() * 3)],
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                completedAt: status === 'completed' ? new Date() : null
            });
            orders.push(order);

            // Create payment for completed orders
            if (status === 'completed' || status === 'processing') {
                const paymentMethod = order.paymentMethod || 'card';
                await Payment.create({
                    paymentId: `PAY${Date.now()}${i}`,
                    user: user._id,
                    order: order._id,
                    amount: order.finalAmount,
                    method: paymentMethod,
                    provider: paymentMethod === 'card' ? 'toss' : 'kakao',
                    status: 'completed',
                    providerTransactionId: `TXN${Date.now()}${i}`,
                    createdAt: order.createdAt
                });
            }
        }
        console.log(`✅ ${orders.length} orders created`);

        // Create deposit requests
        const deposits = [];
        for (let i = 1; i <= 10; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const amount = [50000, 100000, 200000, 500000][Math.floor(Math.random() * 4)];
            
            const bonusAmount = amount * 0.1; // 10% bonus
            const deposit = await Deposit.create({
                user: user._id,
                amount: amount,
                bonusAmount: bonusAmount,
                finalAmount: amount + bonusAmount,
                depositorName: user.name,
                status: ['pending', 'completed', 'cancelled'][Math.floor(Math.random() * 3)],
                requestedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            });
            deposits.push(deposit);
        }
        console.log(`✅ ${deposits.length} deposit requests created`);

        // Summary
        console.log('\n📊 Test Data Summary:');
        console.log('========================');
        console.log(`Admin User: admin@marketgrow.kr / Admin123!`);
        console.log(`Test Users: ${users.length}`);
        console.log(`Services: ${createdServices.length}`);
        console.log(`Orders: ${orders.length}`);
        console.log(`Deposits: ${deposits.length}`);
        console.log('========================\n');

        console.log('✅ All test data created successfully!');
        
    } catch (error) {
        console.error('❌ Error creating test data:', error);
    }
};

// Run the script
const run = async () => {
    await connectDB();
    await createTestData();
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
};

run();