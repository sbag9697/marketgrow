// 메인 페이지 JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // 초기화
    checkUserStatus();
    loadServices();
    initHeroLogin();
});

// 사용자 상태 확인
async function checkUserStatus() {
    const loginCard = document.getElementById('loginCard');
    const userCard = document.getElementById('userCard');

    // api 객체가 있고 토큰이 있는 경우만 체크
    if (typeof api !== 'undefined' && api && api.token) {
        try {
            const response = await api.getProfile();
            if (response.success) {
                // 로그인된 상태 - 사용자 정보 표시
                showUserCard(response.data.user);
                return;
            }
        } catch (error) {
            // 토큰이 유효하지 않음 - 토큰 제거
            if (api && api.clearToken) {
                api.clearToken();
            }
        }
    }

    // 로그인되지 않은 상태 - 로그인 폼 표시
    showLoginCard();
}

// 로그인 카드 표시
function showLoginCard() {
    const loginCard = document.getElementById('loginCard');
    const userCard = document.getElementById('userCard');

    if (loginCard) loginCard.style.display = 'block';
    if (userCard) userCard.style.display = 'none';
}

// 사용자 카드 표시
function showUserCard(user) {
    const loginCard = document.getElementById('loginCard');
    const userCard = document.getElementById('userCard');
    const userName = document.getElementById('userName');
    const userLevel = document.getElementById('userLevel');

    if (loginCard) loginCard.style.display = 'none';
    if (userCard) userCard.style.display = 'block';

    if (userName) userName.textContent = `${user.name}님`;
    if (userLevel) {
        const levelNames = {
            bronze: 'Bronze 회원',
            silver: 'Silver 회원',
            gold: 'Gold 회원',
            platinum: 'Platinum 회원',
            diamond: 'Diamond 회원'
        };
        userLevel.textContent = levelNames[user.membershipLevel] || 'Bronze 회원';
    }
}

// 히어로 섹션 로그인 폼 초기화
function initHeroLogin() {
    const heroLoginForm = document.getElementById('heroLoginForm');
    if (heroLoginForm) {
        heroLoginForm.addEventListener('submit', handleHeroLogin);
    }
}

// 히어로 섹션 로그인 처리
async function handleHeroLogin(event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '로그인 중...';
    submitBtn.disabled = true;

    try {
        // api 객체 체크
        if (typeof api === 'undefined' || !api || !api.login) {
            throw new Error('로그인 서비스를 사용할 수 없습니다.');
        }

        const formData = new FormData(event.target);
        const credentials = {
            login: formData.get('username'),
            password: formData.get('password')
        };

        const response = await api.login(credentials);

        if (response.success) {
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.success('로그인 성공! 환영합니다.');
            }

            // 사용자 정보 업데이트
            showUserCard(response.data.user);

            // 폼 리셋
            event.target.reset();
        }
    } catch (error) {
        let message = '로그인 중 오류가 발생했습니다.';
        if (typeof handleApiError !== 'undefined') {
            message = handleApiError(error, message);
        }
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.error(message);
        } else {
            console.error(message);
        }
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 서비스 목록 로드
async function loadServices() {
    const servicesGrid = document.getElementById('servicesGrid');

    if (!servicesGrid) {
        return;
    }

    // Mock 데이터 사용
    const mockServices = [
        { platform: 'instagram', name: '인스타그램', count: 5 },
        { platform: 'youtube', name: '유튜브', count: 5 },
        { platform: 'facebook', name: '페이스북', count: 3 },
        { platform: 'tiktok', name: '틱톡', count: 4 },
        { platform: 'twitter', name: '트위터', count: 3 },
        { platform: 'telegram', name: '텔레그램', count: 2 },
        { platform: 'threads', name: '스레드', count: 1 },
        { platform: 'website', name: '웹사이트 마케팅', count: 1 }
    ];

    renderStaticServices(mockServices);
}

// Static 서비스 렌더링
function renderStaticServices(platforms) {
    const servicesGrid = document.getElementById('servicesGrid');

    if (!servicesGrid) {
        return;
    }

    // 플랫폼별 아이콘 매핑
    const platformIcons = {
        instagram: 'fab fa-instagram',
        youtube: 'fab fa-youtube',
        facebook: 'fab fa-facebook-f',
        tiktok: 'fab fa-tiktok',
        twitter: 'fab fa-twitter',
        telegram: 'fab fa-telegram-plane',
        threads: 'fas fa-at',
        website: 'fas fa-globe'
    };

    // 플랫폼별 설명 매핑
    const platformDescriptions = {
        instagram: '팔로워, 좋아요, 댓글<br>스토리 조회수 증가',
        youtube: '구독자, 조회수, 좋아요<br>댓글 및 시청시간 증가',
        facebook: '페이지 좋아요, 게시물<br>참여도 및 공유 증가',
        tiktok: '팔로워, 조회수, 좋아요<br>댓글 및 공유 증가',
        twitter: '팔로워, 리트윗, 좋아요<br>댓글 및 멘션 증가',
        telegram: '채널 구독자, 조회수<br>반응 및 공유 증가',
        threads: '팔로워, 좋아요, 댓글<br>리포스트 및 인용 증가',
        website: 'SEO 최적화, 트래픽<br>전환율 및 순위 향상'
    };

    // 서비스 카드 HTML 생성
    let servicesHTML = '';

    platforms.forEach(platform => {
        const icon = platformIcons[platform.platform] || 'fas fa-globe';
        const description = platformDescriptions[platform.platform] || '다양한 마케팅 서비스';

        servicesHTML += `
            <div class="service-card ${platform.platform}" onclick="goToServices('${platform.platform}')">
                <div class="service-icon">
                    <i class="${icon}"></i>
                </div>
                <h3>${platform.name}</h3>
                <p>${description}</p>
                <button class="service-btn" onclick="event.stopPropagation(); goToServices('${platform.platform}')">
                    시작하기
                </button>
            </div>
        `;
    });

    servicesGrid.innerHTML = servicesHTML;
}

// 서비스 카드 렌더링
function renderServices(services) {
    const servicesGrid = document.getElementById('servicesGrid');
    if (!servicesGrid) return;

    // 플랫폼별 아이콘 매핑
    const platformIcons = {
        instagram: 'fab fa-instagram',
        youtube: 'fab fa-youtube',
        facebook: 'fab fa-facebook-f',
        tiktok: 'fab fa-tiktok',
        twitter: 'fab fa-twitter',
        telegram: 'fab fa-telegram-plane',
        threads: 'fas fa-at',
        discord: 'fab fa-discord',
        spotify: 'fab fa-spotify',
        twitch: 'fab fa-twitch',
        whatsapp: 'fab fa-whatsapp',
        pinterest: 'fab fa-pinterest',
        reddit: 'fab fa-reddit',
        snapchat: 'fab fa-snapchat',
        kakaotalk: 'fas fa-comment',
        naver: 'fas fa-n',
        website: 'fas fa-globe'
    };

    // 플랫폼별 설명 매핑
    const platformDescriptions = {
        instagram: '팔로워, 좋아요, 댓글<br>스토리 조회수 증가',
        youtube: '구독자, 조회수, 좋아요<br>댓글 및 시청시간 증가',
        facebook: '페이지 좋아요, 게시물<br>참여도 및 공유 증가',
        tiktok: '팔로워, 조회수, 좋아요<br>댓글 및 공유 증가',
        twitter: '팔로워, 리트윗, 좋아요<br>댓글 및 멘션 증가',
        telegram: '채널 구독자, 조회수<br>반응 및 공유 증가',
        threads: '팔로워, 좋아요, 댓글<br>리포스트 및 인용 증가',
        discord: '서버 멤버, 메시지<br>반응 및 활동 증가',
        spotify: '팔로워, 재생수<br>좋아요 및 저장 증가',
        twitch: '팔로워, 조회수<br>채팅 및 구독 증가',
        whatsapp: '그룹 멤버, 메시지<br>상태 및 반응 증가',
        pinterest: '팔로워, 저장, 좋아요<br>댓글 및 공유 증가',
        reddit: '업보트, 팔로워<br>댓글 및 공유 증가',
        snapchat: '팔로워, 조회수<br>스냅 및 스토리 증가',
        kakaotalk: '친구, 채팅방<br>메시지 및 반응 증가',
        naver: '카페 멤버, 블로그<br>조회수 및 댓글 증가',
        website: 'SEO 최적화, 트래픽<br>전환율 및 순위 향상'
    };

    // 플랫폼별로 그룹화
    const servicesByPlatform = {};
    services.forEach(service => {
        if (!servicesByPlatform[service.platform]) {
            servicesByPlatform[service.platform] = [];
        }
        servicesByPlatform[service.platform].push(service);
    });

    // 서비스 카드 HTML 생성
    let servicesHTML = '';

    Object.keys(servicesByPlatform).forEach(platform => {
        const platformServices = servicesByPlatform[platform];
        const icon = platformIcons[platform] || 'fas fa-globe';
        const description = platformDescriptions[platform] || '다양한 마케팅 서비스';
        const platformName = getPlatformName(platform);

        servicesHTML += `
            <div class="service-card ${platform}" onclick="goToServices('${platform}')">
                <div class="service-icon">
                    <i class="${icon}"></i>
                </div>
                <h3>${platformName}</h3>
                <p>${description}</p>
                <div class="service-count">${platformServices.length}개 서비스</div>
                <button class="service-btn" onclick="event.stopPropagation(); goToServices('${platform}')">
                    시작하기
                </button>
            </div>
        `;
    });

    servicesGrid.innerHTML = servicesHTML;
}

// 플랫폼 이름 변환
function getPlatformName(platform) {
    const platformNames = {
        instagram: '인스타그램',
        youtube: '유튜브',
        facebook: '페이스북',
        tiktok: '틱톡',
        twitter: '트위터',
        telegram: '텔레그램',
        threads: '스레드',
        discord: '디스코드',
        spotify: '스포티파이',
        twitch: '트위치',
        whatsapp: '왓츠앱',
        pinterest: '핀터레스트',
        reddit: '레딧',
        snapchat: '스냅챗',
        kakaotalk: '카카오톡',
        naver: '네이버',
        website: '웹사이트'
    };
    return platformNames[platform] || platform;
}

// 서비스 로드 에러 처리
function renderServicesError() {
    const servicesGrid = document.getElementById('servicesGrid');
    if (!servicesGrid) return;

    servicesGrid.innerHTML = `
        <div class="service-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>서비스 목록을 불러올 수 없습니다.</p>
            <button class="retry-btn" onclick="loadServices()">다시 시도</button>
        </div>
    `;
}

// 서비스 페이지로 이동
function goToServices(platform = null) {
    if (platform) {
        window.location.href = `services.html?platform=${platform}`;
    } else {
        window.location.href = 'services.html';
    }
}

// CSS 스타일 추가
if (!document.querySelector('#main-page-styles')) {
    const style = document.createElement('style');
    style.id = 'main-page-styles';
    style.textContent = `
        .service-loading {
            grid-column: 1 / -1;
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }
        
        .service-loading i {
            font-size: 2rem;
            margin-bottom: 15px;
            color: #007bff;
        }
        
        .service-error {
            grid-column: 1 / -1;
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }
        
        .service-error i {
            font-size: 2rem;
            margin-bottom: 15px;
            color: #dc3545;
        }
        
        .retry-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 15px;
        }
        
        .retry-btn:hover {
            background: #0056b3;
        }
        
        .service-count {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 15px;
        }
        
        .user-card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
            min-width: 280px;
        }
        
        .user-avatar {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            color: white;
            font-size: 1.5rem;
        }
        
        .user-info h4 {
            margin: 0 0 5px;
            color: #333;
            font-size: 1.1rem;
        }
        
        .user-info p {
            margin: 0 0 20px;
            color: #666;
            font-size: 0.9rem;
        }
        
        .dashboard-btn,
        .logout-btn {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            margin-bottom: 10px;
            transition: background-color 0.3s;
        }
        
        .dashboard-btn {
            background: #007bff;
            color: white;
        }
        
        .dashboard-btn:hover {
            background: #0056b3;
        }
        
        .logout-btn {
            background: #f8f9fa;
            color: #666;
            border: 1px solid #dee2e6;
        }
        
        .logout-btn:hover {
            background: #e9ecef;
        }
        
        .service-card {
            cursor: pointer;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .service-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
    `;
    document.head.appendChild(style);
}
