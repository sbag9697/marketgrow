require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./models/Service');

const priceUpdates = [
    // Instagram
    { name: '인스타그램 팔로워 늘리기', newPrice: 24 }, // ₩24,000/1000개
    { name: '인스타그램 좋아요 늘리기', newPrice: 12 }, // ₩12,000/1000개
    { name: '인스타그램 댓글 늘리기', newPrice: 350 }, // ₩350,000/1000개
    { name: '인스타그램 조회수 늘리기', newPrice: 2 }, // ₩2,000/1000개

    // YouTube
    { name: '유튜브 구독자 늘리기', newPrice: 36 }, // ₩36,000/1000개
    { name: '유튜브 조회수 늘리기', newPrice: 12 }, // ₩12,000/1000개
    { name: '유튜브 좋아요 늘리기', newPrice: 8 }, // ₩8,000/1000개

    // TikTok
    { name: '틱톡 팔로워 늘리기', newPrice: 22 }, // ₩22,000/1000개
    { name: '틱톡 좋아요 늘리기', newPrice: 12 }, // ₩12,000/1000개

    // Facebook
    { name: '페이스북 페이지 좋아요', newPrice: 40 }, // ₩40,000/1000개

    // Twitter
    { name: '트위터 팔로워 늘리기', newPrice: 32 } // ₩32,000/1000개
];

async function updatePrices() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB 연결됨');

        for (const update of priceUpdates) {
            const service = await Service.findOne({ name: update.name });

            if (service) {
                // 기존 pricing 구조를 유지하면서 가격만 업데이트
                const updatedPricing = service.pricing.map(p => {
                    const pricePerUnit = update.newPrice * (p.quantity / 1000);
                    return {
                        quantity: p.quantity,
                        price: Math.round(pricePerUnit * 1000), // 원 단위로 저장
                        discountRate: p.discountRate || 0
                    };
                });

                service.pricing = updatedPricing;
                await service.save();

                console.log(`✅ ${update.name}: ₩${update.newPrice * 1000}/1000개로 업데이트됨`);
                console.log('   가격 구조:', updatedPricing.map(p => `${p.quantity}개 = ₩${p.price.toLocaleString()}`).join(', '));
            } else {
                console.log(`❌ ${update.name} 서비스를 찾을 수 없습니다.`);
            }
        }

        console.log('\n가격 업데이트 완료!');

        // 업데이트된 서비스 확인
        const allServices = await Service.find({});
        console.log('\n=== 전체 서비스 가격 현황 ===');

        for (const service of allServices) {
            const firstPricing = service.pricing[0];
            if (firstPricing) {
                const pricePerThousand = Math.round((firstPricing.price / firstPricing.quantity) * 1000);
                console.log(`${service.name}: ₩${pricePerThousand.toLocaleString()}/1000개`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('가격 업데이트 오류:', error);
        process.exit(1);
    }
}

updatePrices();
