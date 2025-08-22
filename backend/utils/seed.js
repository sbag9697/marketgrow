const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { connectDB } = require('./database');
const User = require('../models/User');
const Service = require('../models/Service');

// Create admin user
const createAdminUser = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@marketgrow.kr';
        const adminExists = await User.findOne({ email: adminEmail });

        if (adminExists) {
            // 기존 계정이 있지만 admin이 아닌 경우 업데이트
            if (adminExists.role !== 'admin') {
                adminExists.role = 'admin';
                adminExists.membershipLevel = 'diamond';
                adminExists.isEmailVerified = true;
                adminExists.isPhoneVerified = true;
                await adminExists.save();
                console.log('Existing user upgraded to admin:', adminEmail);
            } else {
                console.log('Admin user already exists:', adminEmail);
            }
            return;
        }

        const adminUser = new User({
            username: 'admin',
            email: adminEmail,
            password: process.env.ADMIN_PASSWORD || 'Admin123!@#',
            name: '관리자',
            phone: '01012345678',
            role: 'admin',
            membershipLevel: 'diamond',
            businessType: 'corporation',
            isEmailVerified: true,
            isPhoneVerified: true,
            termsAcceptedAt: new Date()
        });

        await adminUser.save();
        console.log('Admin user created successfully:', adminEmail);
        console.log('Admin password:', process.env.ADMIN_PASSWORD || 'Admin123!@#');
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
};

// Sample services data
const sampleServices = [
    // Instagram Services
    {
        name: '인스타그램 팔로워',
        nameEn: 'Instagram Followers',
        platform: 'instagram',
        category: 'followers',
        description: '고품질 인스타그램 팔로워를 제공합니다. 실제 계정으로 구성되어 있으며 안전한 방법으로 전달됩니다.',
        features: ['실제 계정', '30일 보장', '점진적 증가', '안전한 방법'],
        pricing: [
            { quantity: 100, price: 15000, discountRate: 0 },
            { quantity: 500, price: 65000, discountRate: 0.1 },
            { quantity: 1000, price: 120000, discountRate: 0.2 }
        ],
        minQuantity: 50,
        maxQuantity: 10000,
        deliveryTime: { min: 1, max: 24, unit: 'hours' },
        guaranteePeriod: 30,
        isActive: true,
        isPopular: true,
        requirements: ['공개 계정', '유효한 사용자명'],
        tags: ['instagram', 'followers', 'growth']
    },
    {
        name: '인스타그램 좋아요',
        nameEn: 'Instagram Likes',
        platform: 'instagram',
        category: 'likes',
        description: '인스타그램 게시물의 좋아요 수를 빠르게 증가시켜 드립니다.',
        features: ['빠른 전달', '실제 계정', '안전한 방법'],
        pricing: [
            { quantity: 100, price: 8000, discountRate: 0 },
            { quantity: 500, price: 35000, discountRate: 0.1 },
            { quantity: 1000, price: 65000, discountRate: 0.15 }
        ],
        minQuantity: 50,
        maxQuantity: 50000,
        deliveryTime: { min: 30, max: 6, unit: 'hours' },
        guaranteePeriod: 14,
        isActive: true,
        requirements: ['공개 게시물', '게시물 URL'],
        tags: ['instagram', 'likes', 'engagement']
    },

    // YouTube Services
    {
        name: '유튜브 구독자',
        nameEn: 'YouTube Subscribers',
        platform: 'youtube',
        category: 'subscribers',
        description: '유튜브 채널의 구독자 수를 증가시켜 채널 성장을 도와드립니다.',
        features: ['실제 계정', '30일 보장', '점진적 증가', '드롭 방지'],
        pricing: [
            { quantity: 100, price: 25000, discountRate: 0 },
            { quantity: 500, price: 110000, discountRate: 0.1 },
            { quantity: 1000, price: 200000, discountRate: 0.2 }
        ],
        minQuantity: 50,
        maxQuantity: 5000,
        deliveryTime: { min: 2, max: 7, unit: 'days' },
        guaranteePeriod: 30,
        isActive: true,
        isPopular: true,
        requirements: ['공개 채널', '채널 URL'],
        tags: ['youtube', 'subscribers', 'growth']
    },
    {
        name: '유튜브 조회수',
        nameEn: 'YouTube Views',
        platform: 'youtube',
        category: 'views',
        description: '유튜브 동영상의 조회수를 안전하게 증가시켜 드립니다.',
        features: ['빠른 전달', '실제 조회', 'SEO 향상'],
        pricing: [
            { quantity: 1000, price: 12000, discountRate: 0 },
            { quantity: 5000, price: 55000, discountRate: 0.1 },
            { quantity: 10000, price: 100000, discountRate: 0.15 }
        ],
        minQuantity: 500,
        maxQuantity: 100000,
        deliveryTime: { min: 1, max: 48, unit: 'hours' },
        guaranteePeriod: 30,
        isActive: true,
        requirements: ['공개 동영상', '동영상 URL'],
        tags: ['youtube', 'views', 'viral']
    },

    // TikTok Services
    {
        name: '틱톡 팔로워',
        nameEn: 'TikTok Followers',
        platform: 'tiktok',
        category: 'followers',
        description: '틱톡 계정의 팔로워 수를 빠르게 증가시켜 인기 크리에이터가 되어보세요.',
        features: ['빠른 전달', '실제 계정', '점진적 증가'],
        pricing: [
            { quantity: 100, price: 18000, discountRate: 0 },
            { quantity: 500, price: 80000, discountRate: 0.1 },
            { quantity: 1000, price: 150000, discountRate: 0.2 }
        ],
        minQuantity: 50,
        maxQuantity: 10000,
        deliveryTime: { min: 30, max: 12, unit: 'hours' },
        guaranteePeriod: 30,
        isActive: true,
        isPopular: true,
        requirements: ['공개 계정', '사용자명'],
        tags: ['tiktok', 'followers', 'viral']
    },
    {
        name: '틱톡 조회수',
        nameEn: 'TikTok Views',
        platform: 'tiktok',
        category: 'views',
        description: '틱톡 동영상의 조회수를 증가시켜 더 많은 사람들에게 노출시켜 드립니다.',
        features: ['빠른 전달', '바이럴 효과', '알고리즘 부스트'],
        pricing: [
            { quantity: 1000, price: 10000, discountRate: 0 },
            { quantity: 5000, price: 45000, discountRate: 0.1 },
            { quantity: 10000, price: 85000, discountRate: 0.15 }
        ],
        minQuantity: 500,
        maxQuantity: 100000,
        deliveryTime: { min: 15, max: 6, unit: 'hours' },
        guaranteePeriod: 14,
        isActive: true,
        requirements: ['공개 동영상', '동영상 URL'],
        tags: ['tiktok', 'views', 'viral']
    },

    // Facebook Services
    {
        name: '페이스북 페이지 좋아요',
        nameEn: 'Facebook Page Likes',
        platform: 'facebook',
        category: 'likes',
        description: '페이스북 페이지의 좋아요 수를 증가시켜 신뢰도를 높여드립니다.',
        features: ['실제 계정', '30일 보장', '점진적 증가'],
        pricing: [
            { quantity: 100, price: 20000, discountRate: 0 },
            { quantity: 500, price: 90000, discountRate: 0.1 },
            { quantity: 1000, price: 170000, discountRate: 0.15 }
        ],
        minQuantity: 50,
        maxQuantity: 5000,
        deliveryTime: { min: 1, max: 24, unit: 'hours' },
        guaranteePeriod: 30,
        isActive: true,
        requirements: ['공개 페이지', '페이지 URL'],
        tags: ['facebook', 'likes', 'business']
    },

    // Twitter Services
    {
        name: '트위터 팔로워',
        nameEn: 'Twitter Followers',
        platform: 'twitter',
        category: 'followers',
        description: '트위터 계정의 팔로워 수를 증가시켜 영향력을 확대해 드립니다.',
        features: ['실제 계정', '30일 보장', '점진적 증가'],
        pricing: [
            { quantity: 100, price: 22000, discountRate: 0 },
            { quantity: 500, price: 100000, discountRate: 0.1 },
            { quantity: 1000, price: 190000, discountRate: 0.15 }
        ],
        minQuantity: 50,
        maxQuantity: 10000,
        deliveryTime: { min: 2, max: 48, unit: 'hours' },
        guaranteePeriod: 30,
        isActive: true,
        requirements: ['공개 계정', '사용자명'],
        tags: ['twitter', 'followers', 'influence']
    }
];

// Create sample services
const createSampleServices = async () => {
    try {
        const existingServices = await Service.countDocuments();

        if (existingServices > 0) {
            console.log('Services already exist');
            return;
        }

        await Service.insertMany(sampleServices);
        console.log('Sample services created successfully');
    } catch (error) {
        console.error('Error creating sample services:', error);
    }
};

// Main seed function
const seedDatabase = async () => {
    try {
        const connected = await connectDB();
        if (!connected) {
            console.error('Failed to connect to database');
            process.exit(1);
        }

        console.log('Starting database seeding...');

        await createAdminUser();
        await createSampleServices();

        console.log('Database seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Database seeding failed:', error);
        process.exit(1);
    }
};

// Run seeding if this file is executed directly
if (require.main === module) {
    seedDatabase();
}

module.exports = {
    seedDatabase,
    createAdminUser,
    createSampleServices
};
