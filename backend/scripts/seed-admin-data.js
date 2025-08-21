/**
 * 관리자 대시보드 테스트 데이터 생성
 * 사용법: node scripts/seed-admin-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');
const Service = require('../models/Service');
const Deposit = require('../models/Deposit');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');

async function seedData() {
    try {
        // MongoDB 연결
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/marketgrow';
        await mongoose.connect(mongoUri);
        console.log('✅ 데이터베이스 연결 성공');

        // 1. 관리자 계정 생성
        console.log('\n📌 관리자 계정 생성 중...');
        const adminPassword = await bcrypt.hash('Admin123!@#', 10);
        const admin = await User.findOneAndUpdate(
            { email: 'admin@marketgrow.kr' },
            {
                email: 'admin@marketgrow.kr',
                password: adminPassword,
                name: '시스템 관리자',
                phone: '010-1234-5678',
                role: 'admin',
                isActive: true,
                emailVerified: true,
                membershipLevel: 'platinum',
                points: 1000000,
                depositBalance: 5000000
            },
            { upsert: true, new: true }
        );
        console.log('✅ 관리자 계정 생성 완료');

        // 2. 테스트 사용자들 생성
        console.log('\n📌 테스트 사용자 생성 중...');
        const testUsers = [];
        const userPassword = await bcrypt.hash('User123!', 10);
        
        const userNames = [
            { name: '김철수', email: 'kim@test.com', level: 'gold', balance: 500000 },
            { name: '이영희', email: 'lee@test.com', level: 'silver', balance: 300000 },
            { name: '박민수', email: 'park@test.com', level: 'bronze', balance: 100000 },
            { name: '정수진', email: 'jung@test.com', level: 'platinum', balance: 1000000 },
            { name: '최동현', email: 'choi@test.com', level: 'gold', balance: 450000 }
        ];

        for (const userData of userNames) {
            const user = await User.findOneAndUpdate(
                { email: userData.email },
                {
                    email: userData.email,
                    password: userPassword,
                    name: userData.name,
                    phone: `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
                    role: 'user',
                    isActive: true,
                    emailVerified: true,
                    membershipLevel: userData.level,
                    points: Math.floor(Math.random() * 50000),
                    depositBalance: userData.balance,
                    lastActiveAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
                },
                { upsert: true, new: true }
            );
            testUsers.push(user);
        }
        console.log(`✅ ${testUsers.length}명의 테스트 사용자 생성 완료`);

        // 3. 서비스 확인 및 가져오기
        console.log('\n📌 서비스 데이터 확인 중...');
        let services = await Service.find({ isActive: true }).limit(10);
        
        if (services.length === 0) {
            console.log('서비스가 없어 기본 서비스를 생성합니다...');
            const defaultServices = [
                { serviceId: 1001, name: '인스타그램 팔로워', category: 'followers', platform: 'instagram', price: 10000, min: 100, max: 10000 },
                { serviceId: 1002, name: '인스타그램 좋아요', category: 'likes', platform: 'instagram', price: 5000, min: 50, max: 5000 },
                { serviceId: 2001, name: '유튜브 구독자', category: 'subscribers', platform: 'youtube', price: 15000, min: 100, max: 10000 },
                { serviceId: 2002, name: '유튜브 조회수', category: 'views', platform: 'youtube', price: 8000, min: 1000, max: 100000 }
            ];
            
            for (const svc of defaultServices) {
                const service = await Service.create(svc);
                services.push(service);
            }
        }
        console.log(`✅ ${services.length}개의 서비스 확인`);

        // 4. 주문 데이터 생성
        console.log('\n📌 주문 데이터 생성 중...');
        const orders = [];
        const orderStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
        const paymentMethods = ['card', 'deposit', 'points', 'bank_transfer'];
        
        for (let i = 0; i < 50; i++) {
            const user = testUsers[Math.floor(Math.random() * testUsers.length)];
            const service = services[Math.floor(Math.random() * services.length)];
            const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
            const quantity = Math.floor(Math.random() * 1000) + 100;
            const totalAmount = service.price * Math.ceil(quantity / 100);
            
            const order = await Order.create({
                orderNumber: `ORD${Date.now()}${i}`,
                user: user._id,
                service: service._id,
                serviceId: service.serviceId,
                serviceName: service.name,
                quantity,
                totalAmount,
                status,
                paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                targetUrl: `https://instagram.com/user${i}`,
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                processedAt: status === 'completed' ? new Date() : null
            });
            orders.push(order);
        }
        console.log(`✅ ${orders.length}개의 주문 생성 완료`);

        // 5. 예치금 충전 요청 생성
        console.log('\n📌 예치금 충전 요청 생성 중...');
        const deposits = [];
        
        for (let i = 0; i < 10; i++) {
            const user = testUsers[Math.floor(Math.random() * testUsers.length)];
            const amount = (Math.floor(Math.random() * 50) + 1) * 10000;
            const bonusAmount = amount >= 500000 ? amount * 0.1 : 
                               amount >= 300000 ? amount * 0.05 : 
                               amount >= 100000 ? amount * 0.03 : 0;
            
            const deposit = await Deposit.create({
                user: user._id,
                amount,
                bonusAmount,
                finalAmount: amount + bonusAmount,
                depositorName: user.name,
                method: 'bank_transfer',
                status: i < 3 ? 'pending' : 'completed',
                bankTransfer: {
                    bank: '농협은행',
                    accountNumber: '301-0373-3754-01',
                    accountHolder: '박시현',
                    identificationCode: Math.floor(1000 + Math.random() * 9000).toString(),
                    depositorName: user.name,
                    requestedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
                },
                createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            });
            deposits.push(deposit);
        }
        console.log(`✅ ${deposits.length}개의 예치금 충전 요청 생성 완료`);

        // 6. 결제 데이터 생성
        console.log('\n📌 결제 데이터 생성 중...');
        const payments = [];
        
        for (const order of orders.slice(0, 20)) {
            if (order.status === 'completed') {
                const payment = await Payment.create({
                    user: order.user,
                    order: order._id,
                    amount: order.totalAmount,
                    method: order.paymentMethod,
                    status: 'completed',
                    pgProvider: 'tosspayments',
                    pgResponse: {
                        paymentKey: `test_${Date.now()}_${Math.random().toString(36)}`,
                        orderId: order.orderNumber,
                        approvedAt: order.processedAt
                    },
                    completedAt: order.processedAt
                });
                payments.push(payment);
            }
        }
        console.log(`✅ ${payments.length}개의 결제 데이터 생성 완료`);

        // 7. 감사 로그 생성
        console.log('\n📌 감사 로그 생성 중...');
        const logCategories = ['auth', 'order', 'payment', 'user', 'admin', 'system'];
        const logActions = ['login', 'logout', 'create', 'update', 'delete', 'view'];
        
        for (let i = 0; i < 30; i++) {
            await AuditLog.create({
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                level: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
                category: logCategories[Math.floor(Math.random() * logCategories.length)],
                action: logActions[Math.floor(Math.random() * logActions.length)],
                user: testUsers[Math.floor(Math.random() * testUsers.length)]._id,
                message: `테스트 로그 메시지 ${i}`,
                ip: `192.168.1.${Math.floor(Math.random() * 255)}`
            });
        }
        console.log('✅ 30개의 감사 로그 생성 완료');

        // 8. 통계 출력
        console.log('\n=== 생성된 데이터 요약 ===');
        const stats = {
            totalUsers: await User.countDocuments(),
            totalOrders: await Order.countDocuments(),
            pendingOrders: await Order.countDocuments({ status: 'pending' }),
            completedOrders: await Order.countDocuments({ status: 'completed' }),
            totalRevenue: await Order.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            pendingDeposits: await Deposit.countDocuments({ status: 'pending' }),
            totalPayments: await Payment.countDocuments()
        };
        
        console.log(`총 사용자: ${stats.totalUsers}명`);
        console.log(`총 주문: ${stats.totalOrders}건`);
        console.log(`대기중 주문: ${stats.pendingOrders}건`);
        console.log(`완료된 주문: ${stats.completedOrders}건`);
        console.log(`총 매출: ${(stats.totalRevenue[0]?.total || 0).toLocaleString()}원`);
        console.log(`대기중 예치금: ${stats.pendingDeposits}건`);
        console.log(`총 결제: ${stats.totalPayments}건`);
        
        console.log('\n=== 관리자 계정 정보 ===');
        console.log('URL: /admin/');
        console.log('이메일: admin@marketgrow.kr');
        console.log('비밀번호: Admin123!@#');
        
        console.log('\n✅ 모든 테스트 데이터 생성 완료!');

    } catch (error) {
        console.error('❌ 오류 발생:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

// 데이터 초기화 옵션
if (process.argv.includes('--clean')) {
    console.log('⚠️  기존 데이터를 삭제합니다...');
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marketgrow')
        .then(async () => {
            await Order.deleteMany({});
            await Deposit.deleteMany({});
            await Payment.deleteMany({});
            await AuditLog.deleteMany({});
            console.log('✅ 기존 데이터 삭제 완료');
            await seedData();
        });
} else {
    seedData();
}