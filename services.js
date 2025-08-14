// 서비스 관리 시스템
class ServiceManager {
    constructor() {
        this.services = {
            // Instagram 서비스
            'instagram-followers': { name: '인스타그램 팔로워 (글로벌)', basePrice: 40, category: 'instagram' },
            'instagram-followers-kr': { name: '인스타그램 팔로워 (한국)', basePrice: 75, category: 'instagram' },
            'instagram-followers-premium': { name: '인스타그램 팔로워 (프리미엄)', basePrice: 110, category: 'instagram' },
            'instagram-likes': { name: '인스타그램 좋아요', basePrice: 2.5, category: 'instagram' },
            'instagram-comments': { name: '인스타그램 댓글', basePrice: 40, category: 'instagram' },
            'instagram-views': { name: '인스타그램 조회수', basePrice: 1, category: 'instagram' },
            'instagram-story-views': { name: '인스타그램 스토리 조회수', basePrice: 1.5, category: 'instagram' },
            'instagram-saves': { name: '인스타그램 저장', basePrice: 7.5, category: 'instagram' },
            'instagram-shares': { name: '인스타그램 공유', basePrice: 12.5, category: 'instagram' },
            'instagram-auto-likes': { name: '인스타그램 자동 좋아요 (30일)', basePrice: 1250, category: 'instagram' },
            'instagram-reel-views': { name: '인스타그램 릴스 조회수', basePrice: 2, category: 'instagram' },
            'instagram-live-viewers': { name: '인스타그램 라이브 시청자', basePrice: 180, category: 'instagram' },
            'instagram-impressions': { name: '인스타그램 노출수', basePrice: 0.8, category: 'instagram' },
            'instagram-reach': { name: '인스타그램 도달률', basePrice: 1.2, category: 'instagram' },
            'instagram-profile-visits': { name: '인스타그램 프로필 방문', basePrice: 3, category: 'instagram' },

            // YouTube 서비스
            'youtube-subscribers': { name: '유튜브 구독자 (글로벌)', basePrice: 60, category: 'youtube' },
            'youtube-subscribers-kr': { name: '유튜브 구독자 (한국)', basePrice: 125, category: 'youtube' },
            'youtube-views': { name: '유튜브 조회수', basePrice: 40, category: 'youtube' },
            'youtube-likes': { name: '유튜브 좋아요', basePrice: 6, category: 'youtube' },
            'youtube-comments': { name: '유튜브 댓글', basePrice: 75, category: 'youtube' },
            'youtube-watch-time': { name: '유튜브 시청시간', basePrice: 60, category: 'youtube' },
            'youtube-long-watch-time': { name: '유튜브 60분+ 동영상 시청시간', basePrice: 120, category: 'youtube' },
            'youtube-shorts-views': { name: '유튜브 쇼츠 조회수', basePrice: 5, category: 'youtube' },
            'youtube-live-viewers': { name: '유튜브 라이브 시청자', basePrice: 140, category: 'youtube' },
            'youtube-premieres': { name: '유튜브 프리미어 대기자', basePrice: 40, category: 'youtube' },
            'youtube-shares': { name: '유튜브 공유', basePrice: 8, category: 'youtube' },
            'youtube-channel-members': { name: '유튜브 채널 멤버십', basePrice: 95, category: 'youtube' },
            'youtube-community-likes': { name: '유튜브 커뮤니티 좋아요', basePrice: 4, category: 'youtube' },
            'youtube-playlist-views': { name: '유튜브 플레이리스트 조회수', basePrice: 15, category: 'youtube' },

            // TikTok 서비스
            'tiktok-followers': { name: '틱톡 팔로워 (글로벌)', basePrice: 30, category: 'tiktok' },
            'tiktok-followers-kr': { name: '틱톡 팔로워 (한국)', basePrice: 90, category: 'tiktok' },
            'tiktok-likes': { name: '틱톡 좋아요', basePrice: 1.5, category: 'tiktok' },
            'tiktok-views': { name: '틱톡 조회수', basePrice: 0.4, category: 'tiktok' },
            'tiktok-comments': { name: '틱톡 댓글', basePrice: 25, category: 'tiktok' },
            'tiktok-shares': { name: '틱톡 공유', basePrice: 7.5, category: 'tiktok' },
            'tiktok-favorites': { name: '틱톡 즐겨찾기', basePrice: 4, category: 'tiktok' },
            'tiktok-live-viewers': { name: '틱톡 라이브 시청자', basePrice: 175, category: 'tiktok' },
            'tiktok-duets': { name: '틱톡 듀엣', basePrice: 12, category: 'tiktok' },
            'tiktok-profile-visits': { name: '틱톡 프로필 방문', basePrice: 2.5, category: 'tiktok' },

            // Facebook 서비스
            'facebook-page-likes': { name: '페이스북 페이지 좋아요', basePrice: 20, category: 'facebook' },
            'facebook-post-likes': { name: '페이스북 게시물 좋아요', basePrice: 3, category: 'facebook' },
            'facebook-followers': { name: '페이스북 팔로워', basePrice: 25, category: 'facebook' },
            'facebook-comments': { name: '페이스북 댓글', basePrice: 40, category: 'facebook' },
            'facebook-shares': { name: '페이스북 공유', basePrice: 12.5, category: 'facebook' },
            'facebook-views': { name: '페이스북 영상 조회수', basePrice: 0.75, category: 'facebook' },
            'facebook-reactions': { name: '페이스북 반응 (좋아요/하트/화남)', basePrice: 4, category: 'facebook' },
            'facebook-check-ins': { name: '페이스북 체크인', basePrice: 15, category: 'facebook' },
            'facebook-group-members': { name: '페이스북 그룹 멤버', basePrice: 35, category: 'facebook' },
            'facebook-event-attendees': { name: '페이스북 이벤트 참석자', basePrice: 18, category: 'facebook' },
            'facebook-story-views': { name: '페이스북 스토리 조회수', basePrice: 2, category: 'facebook' },
            'facebook-live-viewers': { name: '페이스북 라이브 시청자', basePrice: 120, category: 'facebook' },

            // Twitter/X 서비스
            'twitter-followers': { name: '트위터 팔로워 (글로벌)', basePrice: 45, category: 'twitter' },
            'twitter-followers-kr': { name: '트위터 팔로워 (한국)', basePrice: 110, category: 'twitter' },
            'twitter-likes': { name: '트위터 좋아요', basePrice: 2, category: 'twitter' },
            'twitter-retweets': { name: '트위터 리트윗', basePrice: 6, category: 'twitter' },
            'twitter-comments': { name: '트위터 댓글', basePrice: 30, category: 'twitter' },
            'twitter-impressions': { name: '트위터 노출수', basePrice: 0.5, category: 'twitter' },
            'twitter-spaces-listeners': { name: '트위터 스페이스 청취자', basePrice: 75, category: 'twitter' },
            'twitter-bookmarks': { name: '트위터 북마크', basePrice: 4, category: 'twitter' },
            'twitter-video-views': { name: '트위터 영상 조회수', basePrice: 1.5, category: 'twitter' },
            'twitter-poll-votes': { name: '트위터 투표', basePrice: 8, category: 'twitter' },

            // Telegram 서비스
            'telegram-members': { name: '텔레그램 멤버', basePrice: 15, category: 'telegram' },
            'telegram-views': { name: '텔레그램 조회수', basePrice: 0.5, category: 'telegram' },
            'telegram-reactions': { name: '텔레그램 반응', basePrice: 2.5, category: 'telegram' },
            'telegram-comments': { name: '텔레그램 댓글', basePrice: 20, category: 'telegram' },
            'telegram-forwards': { name: '텔레그램 전달', basePrice: 4, category: 'telegram' },
            'telegram-votes': { name: '텔레그램 투표', basePrice: 6, category: 'telegram' },
            'telegram-premium-members': { name: '텔레그램 프리미엄 멤버', basePrice: 55, category: 'telegram' },
            'telegram-auto-views': { name: '텔레그램 자동 조회수 (30일)', basePrice: 450, category: 'telegram' },

            // LinkedIn 서비스
            'linkedin-connections': { name: '링크드인 연결', basePrice: 75, category: 'linkedin' },
            'linkedin-followers': { name: '링크드인 팔로워', basePrice: 90, category: 'linkedin' },
            'linkedin-likes': { name: '링크드인 좋아요', basePrice: 7.5, category: 'linkedin' },
            'linkedin-comments': { name: '링크드인 댓글', basePrice: 125, category: 'linkedin' },
            'linkedin-shares': { name: '링크드인 공유', basePrice: 40, category: 'linkedin' },
            'linkedin-endorsements': { name: '링크드인 스킬 추천', basePrice: 30, category: 'linkedin' },
            'linkedin-page-followers': { name: '링크드인 회사 페이지 팔로워', basePrice: 95, category: 'linkedin' },
            'linkedin-post-views': { name: '링크드인 게시물 조회수', basePrice: 5, category: 'linkedin' },
            'linkedin-video-views': { name: '링크드인 영상 조회수', basePrice: 8, category: 'linkedin' },

            // Threads 서비스
            'threads-followers': { name: 'Threads 팔로워', basePrice: 60, category: 'threads' },
            'threads-likes': { name: 'Threads 좋아요', basePrice: 4, category: 'threads' },
            'threads-reposts': { name: 'Threads 리포스트', basePrice: 9, category: 'threads' },
            'threads-comments': { name: 'Threads 댓글', basePrice: 45, category: 'threads' },
            'threads-views': { name: 'Threads 조회수', basePrice: 1.2, category: 'threads' },
            'threads-mentions': { name: 'Threads 멘션', basePrice: 15, category: 'threads' },

            // Discord 서비스
            'discord-members': { name: '디스코드 멤버', basePrice: 20, category: 'discord' },
            'discord-online-members': { name: '디스코드 온라인 멤버', basePrice: 60, category: 'discord' },
            'discord-reactions': { name: '디스코드 반응', basePrice: 3, category: 'discord' },
            'discord-voice-members': { name: '디스코드 음성 채널 참여자', basePrice: 85, category: 'discord' },
            'discord-server-boosts': { name: '디스코드 서버 부스트', basePrice: 250, category: 'discord' },
            'discord-message-reactions': { name: '디스코드 메시지 반응', basePrice: 5, category: 'discord' },

            // Spotify 서비스
            'spotify-followers': { name: 'Spotify 팔로워', basePrice: 40, category: 'spotify' },
            'spotify-plays': { name: 'Spotify 재생수', basePrice: 20, category: 'spotify' },
            'spotify-saves': { name: 'Spotify 저장', basePrice: 30, category: 'spotify' },
            'spotify-monthly-listeners': { name: 'Spotify 월간 청취자', basePrice: 75, category: 'spotify' },
            'spotify-playlist-followers': { name: 'Spotify 플레이리스트 팔로워', basePrice: 45, category: 'spotify' },
            'spotify-artist-followers': { name: 'Spotify 아티스트 팔로워', basePrice: 65, category: 'spotify' },
            'spotify-track-likes': { name: 'Spotify 트랙 좋아요', basePrice: 25, category: 'spotify' },

            // Twitch 서비스
            'twitch-followers': { name: 'Twitch 팔로워', basePrice: 35, category: 'twitch' },
            'twitch-viewers': { name: 'Twitch 시청자', basePrice: 125, category: 'twitch' },
            'twitch-chatters': { name: 'Twitch 채팅 참여자', basePrice: 190, category: 'twitch' },
            'twitch-subscribers': { name: 'Twitch 구독자', basePrice: 280, category: 'twitch' },
            'twitch-bits': { name: 'Twitch 비트 후원', basePrice: 350, category: 'twitch' },
            'twitch-clip-views': { name: 'Twitch 클립 조회수', basePrice: 12, category: 'twitch' },
            'twitch-channel-points': { name: 'Twitch 채널 포인트 사용', basePrice: 15, category: 'twitch' },

            // WhatsApp Business 서비스
            'whatsapp-status-views': { name: '왓츠앱 상태 조회수', basePrice: 3, category: 'whatsapp' },
            'whatsapp-broadcast-views': { name: '왓츠앱 브로드캐스트 조회수', basePrice: 5, category: 'whatsapp' },
            'whatsapp-group-members': { name: '왓츠앱 그룹 멤버', basePrice: 25, category: 'whatsapp' },

            // Pinterest 서비스
            'pinterest-followers': { name: 'Pinterest 팔로워', basePrice: 35, category: 'pinterest' },
            'pinterest-saves': { name: 'Pinterest 저장', basePrice: 8, category: 'pinterest' },
            'pinterest-likes': { name: 'Pinterest 좋아요', basePrice: 4, category: 'pinterest' },
            'pinterest-comments': { name: 'Pinterest 댓글', basePrice: 30, category: 'pinterest' },
            'pinterest-impressions': { name: 'Pinterest 노출수', basePrice: 1, category: 'pinterest' },
            'pinterest-board-followers': { name: 'Pinterest 보드 팔로워', basePrice: 22, category: 'pinterest' },

            // Reddit 서비스
            'reddit-upvotes': { name: 'Reddit 업보트', basePrice: 6, category: 'reddit' },
            'reddit-downvotes': { name: 'Reddit 다운보트', basePrice: 4, category: 'reddit' },
            'reddit-comments': { name: 'Reddit 댓글', basePrice: 35, category: 'reddit' },
            'reddit-followers': { name: 'Reddit 팔로워', basePrice: 45, category: 'reddit' },
            'reddit-karma': { name: 'Reddit 카르마', basePrice: 12, category: 'reddit' },
            'reddit-awards': { name: 'Reddit 어워드', basePrice: 85, category: 'reddit' },

            // Snapchat 서비스
            'snapchat-followers': { name: 'Snapchat 팔로워', basePrice: 50, category: 'snapchat' },
            'snapchat-story-views': { name: 'Snapchat 스토리 조회수', basePrice: 3.5, category: 'snapchat' },
            'snapchat-snap-views': { name: 'Snapchat 스냅 조회수', basePrice: 2.8, category: 'snapchat' },
            'snapchat-spotlight-views': { name: 'Snapchat 스포트라이트 조회수', basePrice: 6, category: 'snapchat' },

            // 카카오톡 서비스
            'kakaotalk-channel-followers': { name: '카카오톡 채널 친구', basePrice: 95, category: 'kakaotalk' },
            'kakaotalk-story-views': { name: '카카오스토리 조회수', basePrice: 8, category: 'kakaotalk' },
            'kakaotalk-story-likes': { name: '카카오스토리 좋아요', basePrice: 12, category: 'kakaotalk' },
            'kakaotalk-story-comments': { name: '카카오스토리 댓글', basePrice: 45, category: 'kakaotalk' },

            // 네이버 서비스
            'naver-blog-views': { name: '네이버 블로그 조회수', basePrice: 2, category: 'naver' },
            'naver-blog-likes': { name: '네이버 블로그 좋아요', basePrice: 8, category: 'naver' },
            'naver-blog-comments': { name: '네이버 블로그 댓글', basePrice: 35, category: 'naver' },
            'naver-cafe-members': { name: '네이버 카페 가입', basePrice: 28, category: 'naver' },
            'naver-band-members': { name: '네이버 밴드 멤버', basePrice: 32, category: 'naver' },
            'naver-tv-views': { name: '네이버TV 조회수', basePrice: 3, category: 'naver' },
            'naver-tv-likes': { name: '네이버TV 좋아요', basePrice: 6, category: 'naver' },

            // 틱톡 라이브 서비스
            'tiktok-live-gifts': { name: '틱톡 라이브 선물', basePrice: 220, category: 'tiktok' },
            'tiktok-live-comments': { name: '틱톡 라이브 댓글', basePrice: 15, category: 'tiktok' },

            // 유튜브 특화 서비스
            'youtube-subscribers-targeted': { name: '유튜브 타겟팅 구독자', basePrice: 150, category: 'youtube' },
            'youtube-end-screen-clicks': { name: '유튜브 종료화면 클릭', basePrice: 18, category: 'youtube' },
            'youtube-cards-clicks': { name: '유튜브 카드 클릭', basePrice: 20, category: 'youtube' }
        };

        this.orders = JSON.parse(localStorage.getItem('orders') || '[]');
        this.currentService = null;

        this.init();
    }

    init() {
        // 카테고리 필터링 이벤트
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterServices(e.target.dataset.category);

                // 활성 탭 업데이트
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // 주문 폼 이벤트
        const orderForm = document.getElementById('orderForm');
        if (orderForm) {
            orderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processOrder();
            });
        }

        // 수량 변경시 가격 업데이트
        const quantitySelect = document.getElementById('quantity');
        if (quantitySelect) {
            quantitySelect.addEventListener('change', () => this.updatePrice());
        }
    }

    // 서비스 필터링
    filterServices(category) {
        const serviceCards = document.querySelectorAll('.service-card');

        serviceCards.forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });

        // 애니메이션 효과
        setTimeout(() => {
            const visibleCards = document.querySelectorAll('.service-card:not(.hidden)');
            visibleCards.forEach((card, index) => {
                card.style.animation = `fadeInUp 0.6s ease ${index * 0.1}s`;
            });
        }, 100);
    }

    // 주문 모달 열기 (새로운 주문 페이지로 리다이렉트)
    openOrderModal(serviceType) {
        // 로그인 확인
        if (!authManager.isAuthenticated()) {
            alert('로그인이 필요한 서비스입니다.');
            this.showAuthModal();
            return;
        }

        const service = this.services[serviceType];
        if (service) {
            // 새로운 주문 페이지로 리다이렉트 (플랫폼별 필터 적용)
            window.location.href = `order.html?platform=${service.category}`;
        } else {
            // 일반 주문 페이지로 이동
            window.location.href = 'order.html';
        }
    }

    // 주문 모달 닫기
    closeOrderModal() {
        document.getElementById('orderModal').style.display = 'none';
        document.getElementById('orderForm').reset();
    }

    // 가격 업데이트
    updatePrice() {
        if (!this.currentService) return;

        const service = this.services[this.currentService];
        const quantity = parseInt(document.getElementById('quantity').value);

        // 품질과 시간 옵션 제거 - 단순화된 가격 계산
        const totalPrice = Math.round(service.basePrice * quantity);

        // 최소 가격 설정 (100원)
        const finalPrice = Math.max(totalPrice, 100);

        document.getElementById('totalPrice').textContent = `₩${finalPrice.toLocaleString()}`;
    }

    // 주문 처리
    processOrder() {
        const orderData = {
            id: `ORDER_${Date.now()}`,
            userId: authManager.getCurrentUser().id,
            serviceType: this.currentService,
            serviceName: this.services[this.currentService].name,
            targetUrl: document.getElementById('targetUrl').value,
            quantity: parseInt(document.getElementById('quantity').value),
            paymentMethod: document.getElementById('paymentMethod').value,
            totalPrice: parseInt(document.getElementById('totalPrice').textContent.replace(/[₩,]/g, '')),
            status: 'pending',
            createdAt: new Date().toISOString(),
            completedAt: null,
            progress: 0
        };

        // 실제 토스페이먼츠 결제로 이동
        this.redirectToPayment(orderData);
    }

    // 토스페이먼츠 결제 페이지로 리다이렉트
    redirectToPayment(orderData) {
        try {
            // 세션 스토리지에 주문 정보 저장
            sessionStorage.setItem('currentOrder', JSON.stringify(orderData));
            sessionStorage.setItem('orderName', orderData.serviceName);

            // 모달 닫기
            this.closeOrderModal();

            // 결제 페이지로 이동
            window.location.href = 'payment.html';
        } catch (error) {
            console.error('결제 페이지 이동 실패:', error);
            alert('결제 페이지로 이동할 수 없습니다. 다시 시도해주세요.');
        }
    }

    // 기존 결제 시뮬레이션 (백업용 - 나중에 제거 예정)
    simulatePayment(orderData) {
        // 결제 중 표시
        const submitBtn = document.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '결제 처리 중...';
        submitBtn.disabled = true;

        // 결제 방법별 처리 시뮬레이션
        const paymentMethod = orderData.paymentMethod;
        let paymentTime = 2000; // 기본 2초

        switch (paymentMethod) {
            case 'card':
                paymentTime = 3000; // 신용카드 3초
                break;
            case 'kakaopay':
                paymentTime = 1500; // 카카오페이 1.5초
                break;
            case 'paypal':
                paymentTime = 4000; // PayPal 4초
                break;
            case 'bank':
                paymentTime = 5000; // 계좌이체 5초
                break;
        }

        setTimeout(() => {
            // 결제 성공 시뮬레이션 (90% 성공률)
            const isSuccess = Math.random() > 0.1;

            if (isSuccess) {
                this.processSuccessfulPayment(orderData, submitBtn, originalText);
            } else {
                this.processFailedPayment(submitBtn, originalText);
            }
        }, paymentTime);
    }

    // 결제 성공 처리
    processSuccessfulPayment(orderData, submitBtn, originalText) {
        // 결제 정보 추가
        orderData.paymentId = `PAY_${Date.now()}`;
        orderData.paidAt = new Date().toISOString();

        this.orders.push(orderData);
        localStorage.setItem('orders', JSON.stringify(this.orders));

        // 사용자 주문 목록에 추가
        const user = authManager.getCurrentUser();
        user.orders.push(orderData.id);

        // 포인트 적립 (결제 금액의 1%)
        const points = Math.floor(orderData.totalPrice * 0.01);
        user.points += points;

        localStorage.setItem('currentUser', JSON.stringify(user));

        // UI 복원
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        this.closeOrderModal();

        // 성공 메시지
        this.showSuccessMessage(orderData, points);

        // 주문 진행 시뮬레이션 시작
        this.startOrderProgress(orderData.id);

        // 결제 영수증 생성
        this.generateReceipt(orderData);
    }

    // 결제 실패 처리
    processFailedPayment(submitBtn, originalText) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        alert(`결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.\n\n오류 코드: PAYMENT_ERROR_${Math.floor(Math.random() * 1000)}`);
    }

    // 성공 메시지 표시
    showSuccessMessage(orderData, points = 0) {
        const message = `
            🎉 주문이 완료되었습니다!
            
            주문번호: ${orderData.id}
            서비스: ${orderData.serviceName}
            수량: ${orderData.quantity.toLocaleString()}개
            결제금액: ₩${orderData.totalPrice.toLocaleString()}
            결제방법: ${this.getPaymentMethodName(orderData.paymentMethod)}
            ${points > 0 ? `적립포인트: ${points}P` : ''}
            
            📊 주문 진행상황은 대시보드에서 확인하실 수 있습니다.
            📧 결제 영수증이 이메일로 발송됩니다.
        `;

        alert(message);
    }

    // 결제 영수증 생성
    generateReceipt(orderData) {
        const receipt = {
            id: `RECEIPT_${Date.now()}`,
            orderId: orderData.id,
            paymentId: orderData.paymentId,
            amount: orderData.totalPrice,
            paymentMethod: orderData.paymentMethod,
            createdAt: orderData.paidAt,
            customerInfo: {
                userId: orderData.userId,
                username: authManager.getCurrentUser().username,
                email: authManager.getCurrentUser().email
            }
        };

        // 영수증 저장 (실제 서비스에서는 서버로 전송)
        const receipts = JSON.parse(localStorage.getItem('receipts') || '[]');
        receipts.push(receipt);
        localStorage.setItem('receipts', JSON.stringify(receipts));

        // 영수증 다운로드 제안
        setTimeout(() => {
            if (confirm('결제 영수증을 다운로드하시겠습니까?')) {
                this.downloadReceipt(receipt);
            }
        }, 1000);
    }

    // 영수증 다운로드
    downloadReceipt(receipt) {
        const receiptContent = `
===========================================
          SOCIAL MARKETING PRO
              결제 영수증
===========================================

영수증 번호: ${receipt.id}
주문 번호: ${receipt.orderId}
결제 번호: ${receipt.paymentId}

고객 정보:
- 아이디: ${receipt.customerInfo.username}
- 이메일: ${receipt.customerInfo.email}

결제 정보:
- 결제 금액: ₩${receipt.amount.toLocaleString()}
- 결제 방법: ${this.getPaymentMethodName(receipt.paymentMethod)}
- 결제 일시: ${new Date(receipt.createdAt).toLocaleString()}

===========================================
문의: support@socialmarketingpro.com
전화: 1588-1234
===========================================
        `;

        const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt_${receipt.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // 결제 방법 이름 반환
    getPaymentMethodName(method) {
        const methodNames = {
            card: '신용카드',
            bank: '계좌이체',
            kakaopay: '카카오페이',
            paypal: 'PayPal'
        };
        return methodNames[method] || method;
    }

    // 주문 진행 시뮬레이션
    startOrderProgress(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        order.status = 'processing';

        // 진행률을 점진적으로 증가
        const progressInterval = setInterval(() => {
            order.progress += Math.random() * 10;

            if (order.progress >= 100) {
                order.progress = 100;
                order.status = 'completed';
                order.completedAt = new Date().toISOString();
                clearInterval(progressInterval);

                // 완료 알림 (실제 서비스에서는 이메일/SMS 등으로)
                if (authManager.getCurrentUser()?.id === order.userId) {
                    setTimeout(() => {
                        alert(`주문 ${orderId}이 완료되었습니다!`);
                    }, 1000);
                }
            }

            localStorage.setItem('orders', JSON.stringify(this.orders));
        }, 5000); // 5초마다 진행률 업데이트
    }

    // 인증 모달 표시
    showAuthModal() {
        // 간단한 로그인 프롬프트
        const username = prompt('아이디를 입력하세요:');
        if (!username) return;

        const password = prompt('비밀번호를 입력하세요:');
        if (!password) return;

        try {
            authManager.login(username, password);
            alert('로그인되었습니다.');
        } catch (error) {
            alert(error.message);

            // 회원가입 제안
            if (confirm('회원가입을 하시겠습니까?')) {
                this.showRegisterModal();
            }
        }
    }

    // 회원가입 모달
    showRegisterModal() {
        const username = prompt('사용하실 아이디를 입력하세요:');
        if (!username) return;

        const email = prompt('이메일을 입력하세요:');
        if (!email) return;

        const password = prompt('비밀번호를 입력하세요 (6자 이상):');
        if (!password) return;

        const confirmPassword = prompt('비밀번호를 다시 입력하세요:');
        if (!confirmPassword) return;

        try {
            authManager.register({ username, email, password, confirmPassword });
            alert('회원가입이 완료되었습니다. 로그인해주세요.');

            // 자동 로그인
            authManager.login(username, password);
        } catch (error) {
            alert(error.message);
        }
    }

    // 사용자 주문 목록 조회
    getUserOrders(userId) {
        return this.orders.filter(order => order.userId === userId);
    }

    // 주문 상태 조회
    getOrderStatus(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        return order || null;
    }
}

// 전역 함수들
function openOrderModal(serviceType) {
    serviceManager.openOrderModal(serviceType);
}

function closeOrderModal() {
    serviceManager.closeOrderModal();
}

function updatePrice() {
    serviceManager.updatePrice();
}

// 대시보드로 이동
function showDashboard() {
    if (!authManager.isAuthenticated()) {
        alert('로그인이 필요합니다.');
        return;
    }

    window.location.href = 'dashboard.html';
}

// 프로필 표시 함수
function showProfile() {
    if (!authManager.isAuthenticated()) {
        alert('로그인이 필요합니다.');
        return;
    }

    const user = authManager.getCurrentUser();
    const profileInfo = `
        사용자 정보:
        
        아이디: ${user.username}
        이메일: ${user.email}
        가입일: ${new Date(user.createdAt).toLocaleDateString()}
        총 주문 수: ${user.orders.length}개
        보유 포인트: ${user.points}P
    `;

    alert(profileInfo);
}

// 서비스 매니저 인스턴스 생성
const serviceManager = new ServiceManager();

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 모달 외부 클릭시 닫기
    window.onclick = function (event) {
        const modal = document.getElementById('orderModal');
        if (event.target === modal) {
            closeOrderModal();
        }
    };
});
