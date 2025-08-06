require('dotenv').config();
const mongoose = require('mongoose');
const smmPanelService = require('./services/smmPanel.service');

// SMM 패널 서비스 ID 매핑 (실제 ID로 변경 필요)
const SERVICE_MAPPING = {
    // Instagram
    '인스타그램 팔로워 늘리기': {
        smmId: 1001,  // 실제 SMM 패널 서비스 ID
        marginPercent: 90  // 90% 마진
    },
    '인스타그램 좋아요 늘리기': {
        smmId: 1002,
        marginPercent: 90
    },
    '인스타그램 댓글 늘리기': {
        smmId: 1003,
        marginPercent: 90
    },
    '인스타그램 조회수 늘리기': {
        smmId: 1004,
        marginPercent: 90
    },
    
    // YouTube
    '유튜브 구독자 늘리기': {
        smmId: 2001,
        marginPercent: 90
    },
    '유튜브 조회수 늘리기': {
        smmId: 2002,
        marginPercent: 90
    },
    '유튜브 좋아요 늘리기': {
        smmId: 2003,
        marginPercent: 90
    },
    
    // TikTok
    '틱톡 팔로워 늘리기': {
        smmId: 3001,
        marginPercent: 90
    },
    '틱톡 좋아요 늘리기': {
        smmId: 3002,
        marginPercent: 90
    },
    
    // Facebook
    '페이스북 페이지 좋아요': {
        smmId: 4001,
        marginPercent: 90
    },
    
    // Twitter
    '트위터 팔로워 늘리기': {
        smmId: 5001,
        marginPercent: 90
    }
};

async function syncServices() {
    try {
        console.log('🔄 SMM 패널 서비스 동기화 시작...\n');
        
        // SMM 패널 API 키 확인
        if (!process.env.SMM_PANEL_API_KEY) {
            console.error('❌ SMM_PANEL_API_KEY가 설정되지 않았습니다.');
            console.log('\n.env 파일에 다음을 추가하세요:');
            console.log('SMM_PANEL_API_KEY=your_api_key');
            console.log('SMM_PANEL_API_URL=https://smmturk.org/api/v2');
            return;
        }

        // 잔액 확인
        console.log('💰 잔액 확인 중...');
        const balance = await smmPanelService.getBalance();
        console.log(`현재 잔액: $${balance}\n`);

        // 서비스 목록 가져오기
        console.log('📋 SMM 패널 서비스 목록 조회 중...');
        const services = await smmPanelService.getServices();
        console.log(`총 ${services.length}개 서비스 발견\n`);

        // 매핑된 서비스 정보 출력
        console.log('🔗 서비스 매핑 정보:');
        console.log('================================');
        
        for (const [serviceName, mapping] of Object.entries(SERVICE_MAPPING)) {
            const smmService = services.find(s => s.service === mapping.smmId);
            
            if (smmService) {
                const originalPrice = parseFloat(smmService.rate);
                const marginAmount = originalPrice * (mapping.marginPercent / 100);
                const finalPrice = originalPrice + marginAmount;
                
                console.log(`\n📦 ${serviceName}`);
                console.log(`   SMM ID: ${smmService.service}`);
                console.log(`   SMM 이름: ${smmService.name}`);
                console.log(`   원가: $${originalPrice.toFixed(2)}/1000`);
                console.log(`   마진: ${mapping.marginPercent}% (+$${marginAmount.toFixed(2)})`);
                console.log(`   판매가: $${finalPrice.toFixed(2)}/1000`);
                console.log(`   최소: ${smmService.min} / 최대: ${smmService.max}`);
                console.log(`   설명: ${smmService.description?.substring(0, 50)}...`);
            } else {
                console.log(`\n❌ ${serviceName}`);
                console.log(`   SMM ID ${mapping.smmId}를 찾을 수 없습니다.`);
            }
        }

        // 카테고리별 서비스 수 출력
        console.log('\n\n📊 카테고리별 서비스 통계:');
        console.log('================================');
        const categories = {};
        services.forEach(service => {
            categories[service.category] = (categories[service.category] || 0) + 1;
        });
        
        Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .forEach(([category, count]) => {
                console.log(`${category}: ${count}개`);
            });

        // 환경 변수 업데이트 제안
        console.log('\n\n⚙️ 환경 변수 설정:');
        console.log('================================');
        console.log('backend/.env 파일에 추가:');
        console.log('```');
        console.log('# SMM Panel Configuration');
        console.log('SMM_PANEL_API_URL=https://smmturk.org/api/v2');
        console.log('SMM_PANEL_API_KEY=your_api_key_here');
        console.log('PRICE_MARGIN=90  # 기본 마진 (%)');
        console.log('```');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ 동기화 오류:', error.message);
        
        if (error.response) {
            console.error('API 응답:', error.response.data);
        }
        
        console.log('\n해결 방법:');
        console.log('1. API 키가 올바른지 확인');
        console.log('2. API URL이 정확한지 확인');
        console.log('3. SMM 패널 계정이 활성화되어 있는지 확인');
        
        process.exit(1);
    }
}

// MongoDB 연결 없이 실행
syncServices();