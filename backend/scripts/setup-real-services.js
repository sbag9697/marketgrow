/**
 * 실제 서비스 데이터 설정 스크립트
 * 실행: node scripts/setup-real-services.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('../models/Service');
const { connectDB } = require('../utils/database');

// 실제 서비스 데이터 (가격은 원화 기준)
const realServices = [
    // 인스타그램 서비스
    {
        serviceId: 'INSTA_FOLLOWERS_100',
        name: '인스타그램 팔로워 100명',
        platform: 'instagram',
        category: 'followers',
        description: '고품질 한국 팔로워, 프로필 사진 있음, 30일 보장',
        price: 4500,
        minQuantity: 100,
        maxQuantity: 100,
        deliveryTime: '24시간 이내',
        features: ['한국 계정', '프로필 사진', '30일 보장', '자연스러운 증가'],
        isActive: true
    },
    {
        serviceId: 'INSTA_FOLLOWERS_500',
        name: '인스타그램 팔로워 500명',
        platform: 'instagram',
        category: 'followers',
        description: '고품질 한국 팔로워, 프로필 사진 있음, 30일 보장',
        price: 19900,
        minQuantity: 500,
        maxQuantity: 500,
        deliveryTime: '24-48시간',
        features: ['한국 계정', '프로필 사진', '30일 보장', '자연스러운 증가'],
        isActive: true
    },
    {
        serviceId: 'INSTA_FOLLOWERS_1000',
        name: '인스타그램 팔로워 1000명',
        platform: 'instagram',
        category: 'followers',
        description: '고품질 한국 팔로워, 프로필 사진 있음, 60일 보장',
        price: 35000,
        minQuantity: 1000,
        maxQuantity: 1000,
        deliveryTime: '48-72시간',
        features: ['한국 계정', '프로필 사진', '60일 보장', '자연스러운 증가'],
        isActive: true
    },
    {
        serviceId: 'INSTA_LIKES_100',
        name: '인스타그램 좋아요 100개',
        platform: 'instagram',
        category: 'likes',
        description: '게시물 좋아요, 즉시 반영',
        price: 2000,
        minQuantity: 100,
        maxQuantity: 100,
        deliveryTime: '1시간 이내',
        features: ['즉시 반영', '안전한 계정', '영구 유지'],
        isActive: true
    },
    {
        serviceId: 'INSTA_VIEWS_1000',
        name: '인스타그램 릴스 조회수 1000회',
        platform: 'instagram',
        category: 'views',
        description: '릴스/동영상 조회수 증가',
        price: 3000,
        minQuantity: 1000,
        maxQuantity: 1000,
        deliveryTime: '즉시 시작',
        features: ['즉시 시작', '자연스러운 증가', '알고리즘 도움'],
        isActive: true
    },

    // 유튜브 서비스
    {
        serviceId: 'YOUTUBE_SUBS_100',
        name: '유튜브 구독자 100명',
        platform: 'youtube',
        category: 'subscribers',
        description: '고품질 구독자, 30일 보장',
        price: 8000,
        minQuantity: 100,
        maxQuantity: 100,
        deliveryTime: '24-48시간',
        features: ['고품질 계정', '30일 보장', '자연스러운 증가'],
        isActive: true
    },
    {
        serviceId: 'YOUTUBE_SUBS_500',
        name: '유튜브 구독자 500명',
        platform: 'youtube',
        category: 'subscribers',
        description: '고품질 구독자, 60일 보장',
        price: 35000,
        minQuantity: 500,
        maxQuantity: 500,
        deliveryTime: '48-72시간',
        features: ['고품질 계정', '60일 보장', '자연스러운 증가'],
        isActive: true
    },
    {
        serviceId: 'YOUTUBE_VIEWS_1000',
        name: '유튜브 조회수 1000회',
        platform: 'youtube',
        category: 'views',
        description: '고품질 조회수, 시청 지속 시간 포함',
        price: 5000,
        minQuantity: 1000,
        maxQuantity: 1000,
        deliveryTime: '24시간 이내',
        features: ['시청 지속 시간', '자연스러운 증가', '수익 창출 안전'],
        isActive: true
    },
    {
        serviceId: 'YOUTUBE_LIKES_100',
        name: '유튜브 좋아요 100개',
        platform: 'youtube',
        category: 'likes',
        description: '동영상 좋아요 증가',
        price: 4000,
        minQuantity: 100,
        maxQuantity: 100,
        deliveryTime: '12시간 이내',
        features: ['영구 유지', '안전한 계정'],
        isActive: true
    },

    // 틱톡 서비스
    {
        serviceId: 'TIKTOK_FOLLOWERS_100',
        name: '틱톡 팔로워 100명',
        platform: 'tiktok',
        category: 'followers',
        description: '고품질 팔로워, 30일 보장',
        price: 3500,
        minQuantity: 100,
        maxQuantity: 100,
        deliveryTime: '24시간 이내',
        features: ['고품질 계정', '30일 보장', '프로필 사진'],
        isActive: true
    },
    {
        serviceId: 'TIKTOK_FOLLOWERS_1000',
        name: '틱톡 팔로워 1000명',
        platform: 'tiktok',
        category: 'followers',
        description: '고품질 팔로워, 60일 보장',
        price: 25000,
        minQuantity: 1000,
        maxQuantity: 1000,
        deliveryTime: '48시간 이내',
        features: ['고품질 계정', '60일 보장', '프로필 사진'],
        isActive: true
    },
    {
        serviceId: 'TIKTOK_LIKES_500',
        name: '틱톡 좋아요 500개',
        platform: 'tiktok',
        category: 'likes',
        description: '동영상 좋아요 증가',
        price: 4000,
        minQuantity: 500,
        maxQuantity: 500,
        deliveryTime: '6시간 이내',
        features: ['즉시 반영', '영구 유지'],
        isActive: true
    },
    {
        serviceId: 'TIKTOK_VIEWS_10000',
        name: '틱톡 조회수 10000회',
        platform: 'tiktok',
        category: 'views',
        description: '동영상 조회수 증가',
        price: 5000,
        minQuantity: 10000,
        maxQuantity: 10000,
        deliveryTime: '즉시 시작',
        features: ['즉시 시작', '자연스러운 증가', '알고리즘 부스트'],
        isActive: true
    },

    // 페이스북 서비스
    {
        serviceId: 'FB_PAGE_LIKES_100',
        name: '페이스북 페이지 좋아요 100개',
        platform: 'facebook',
        category: 'likes',
        description: '페이지 팔로워 증가',
        price: 6000,
        minQuantity: 100,
        maxQuantity: 100,
        deliveryTime: '24시간 이내',
        features: ['실제 계정', '영구 유지', '30일 보장'],
        isActive: true
    },
    {
        serviceId: 'FB_POST_LIKES_100',
        name: '페이스북 게시물 좋아요 100개',
        platform: 'facebook',
        category: 'likes',
        description: '게시물 좋아요 증가',
        price: 3000,
        minQuantity: 100,
        maxQuantity: 100,
        deliveryTime: '12시간 이내',
        features: ['즉시 반영', '영구 유지'],
        isActive: true
    },

    // 트위터 서비스
    {
        serviceId: 'TWITTER_FOLLOWERS_100',
        name: '트위터 팔로워 100명',
        platform: 'twitter',
        category: 'followers',
        description: '고품질 팔로워',
        price: 5000,
        minQuantity: 100,
        maxQuantity: 100,
        deliveryTime: '24시간 이내',
        features: ['프로필 완성', '30일 보장'],
        isActive: true
    },
    {
        serviceId: 'TWITTER_LIKES_100',
        name: '트위터 좋아요 100개',
        platform: 'twitter',
        category: 'likes',
        description: '트윗 좋아요 증가',
        price: 2500,
        minQuantity: 100,
        maxQuantity: 100,
        deliveryTime: '6시간 이내',
        features: ['즉시 반영', '영구 유지'],
        isActive: true
    },

    // 프리미엄 패키지
    {
        serviceId: 'PREMIUM_INSTA_PACK',
        name: '인스타그램 프리미엄 패키지',
        platform: 'instagram',
        category: 'package',
        description: '팔로워 1000명 + 좋아요 500개 + 조회수 5000회',
        price: 49900,
        minQuantity: 1,
        maxQuantity: 1,
        deliveryTime: '72시간',
        features: ['종합 패키지', '60일 보장', 'VIP 지원', '리포트 제공'],
        isActive: true
    },
    {
        serviceId: 'PREMIUM_YOUTUBE_PACK',
        name: '유튜브 성장 패키지',
        platform: 'youtube',
        category: 'package',
        description: '구독자 500명 + 조회수 5000회 + 좋아요 200개',
        price: 59900,
        minQuantity: 1,
        maxQuantity: 1,
        deliveryTime: '72시간',
        features: ['종합 패키지', '90일 보장', 'VIP 지원', '분석 리포트'],
        isActive: true
    },
    {
        serviceId: 'STARTER_PACK',
        name: '신규 계정 스타터 패키지',
        platform: 'all',
        category: 'package',
        description: '모든 플랫폼 기본 팔로워/구독자 세트',
        price: 99900,
        minQuantity: 1,
        maxQuantity: 1,
        deliveryTime: '5-7일',
        features: ['전 플랫폼', '90일 보장', '전담 매니저', '맞춤 전략'],
        isActive: true
    }
];

async function setupRealServices() {
    try {
        console.log('🔄 실제 서비스 데이터 설정 시작...');
        
        // 데이터베이스 연결
        await connectDB();
        
        // 기존 서비스 삭제 (선택사항)
        const deleteExisting = process.argv.includes('--clean');
        if (deleteExisting) {
            await Service.deleteMany({});
            console.log('🗑️ 기존 서비스 데이터 삭제 완료');
        }
        
        // 서비스 추가 또는 업데이트
        let added = 0;
        let updated = 0;
        
        for (const serviceData of realServices) {
            const existingService = await Service.findOne({ serviceId: serviceData.serviceId });
            
            if (existingService) {
                // 업데이트
                await Service.updateOne(
                    { serviceId: serviceData.serviceId },
                    serviceData
                );
                updated++;
                console.log(`✏️ 업데이트: ${serviceData.name}`);
            } else {
                // 새로 추가
                const service = new Service(serviceData);
                await service.save();
                added++;
                console.log(`✅ 추가: ${serviceData.name}`);
            }
        }
        
        console.log('\n📊 설정 완료:');
        console.log(`- 추가된 서비스: ${added}개`);
        console.log(`- 업데이트된 서비스: ${updated}개`);
        console.log(`- 전체 서비스: ${await Service.countDocuments()}개`);
        
        // 카테고리별 통계
        const stats = await Service.aggregate([
            { $group: { _id: '$platform', count: { $sum: 1 } } }
        ]);
        
        console.log('\n📈 플랫폼별 서비스:');
        stats.forEach(stat => {
            console.log(`- ${stat._id}: ${stat.count}개`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ 오류 발생:', error);
        process.exit(1);
    }
}

// 스크립트 실행
setupRealServices();