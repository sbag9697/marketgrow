// MongoDB 초기화 스크립트

// 데이터베이스 선택
db = db.getSiblingDB('marketgrow');

// 관리자 사용자 생성
db.createUser({
    user: 'marketgrow_user',
    pwd: 'marketgrow_password',
    roles: [
        {
            role: 'readWrite',
            db: 'marketgrow'
        }
    ]
});

// 인덱스 생성
print('Creating indexes...');

// Users 컬렉션 인덱스
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'phone': 1 }, { sparse: true });
db.users.createIndex({ 'createdAt': 1 });
db.users.createIndex({ 'role': 1 });
db.users.createIndex({ 'isActive': 1 });

// Services 컬렉션 인덱스
db.services.createIndex({ 'platform': 1, 'category': 1 });
db.services.createIndex({ 'isActive': 1 });
db.services.createIndex({ 'price': 1 });
db.services.createIndex({ 'createdAt': 1 });

// Orders 컬렉션 인덱스
db.orders.createIndex({ 'userId': 1 });
db.orders.createIndex({ 'orderNumber': 1 }, { unique: true });
db.orders.createIndex({ 'status': 1 });
db.orders.createIndex({ 'createdAt': 1 });
db.orders.createIndex({ 'userId': 1, 'createdAt': -1 });

// Payments 컬렉션 인덱스
db.payments.createIndex({ 'paymentId': 1 }, { unique: true });
db.payments.createIndex({ 'userId': 1 });
db.payments.createIndex({ 'orderId': 1 });
db.payments.createIndex({ 'status': 1 });
db.payments.createIndex({ 'createdAt': 1 });

// Notifications 컬렉션 인덱스
db.notifications.createIndex({ 'userId': 1 });
db.notifications.createIndex({ 'type': 1 });
db.notifications.createIndex({ 'isRead': 1 });
db.notifications.createIndex({ 'createdAt': 1 });

print('Indexes created successfully');

// 기본 서비스 데이터 삽입
print('Inserting sample services...');

const sampleServices = [
    {
        platform: 'instagram',
        category: 'followers',
        name: '인스타그램 팔로워 (고품질)',
        description: '실제 활성 사용자들의 팔로워',
        price: 15000,
        originalPrice: 20000,
        minQuantity: 100,
        maxQuantity: 10000,
        deliveryTime: '1-3일',
        isActive: true,
        isFeatured: true,
        createdAt: new Date()
    },
    {
        platform: 'youtube',
        category: 'views',
        name: '유튜브 조회수 (안전)',
        description: '자연스러운 조회수 증가',
        price: 8000,
        originalPrice: 12000,
        minQuantity: 1000,
        maxQuantity: 100000,
        deliveryTime: '12-24시간',
        isActive: true,
        isFeatured: true,
        createdAt: new Date()
    },
    {
        platform: 'tiktok',
        category: 'likes',
        name: '틱톡 좋아요 (빠른 배송)',
        description: '빠른 속도의 좋아요 서비스',
        price: 5000,
        originalPrice: 8000,
        minQuantity: 100,
        maxQuantity: 50000,
        deliveryTime: '즉시-6시간',
        isActive: true,
        isFeatured: false,
        createdAt: new Date()
    }
];

db.services.insertMany(sampleServices);
print(`${sampleServices.length} sample services inserted`);

// 통계 데이터를 위한 컬렉션 생성
db.createCollection('statistics');
db.statistics.insertOne({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lastUpdated: new Date()
});

print('MongoDB initialization completed successfully');