// A/B 테스팅 시스템
class ABTestingManager {
    constructor() {
        this.experiments = {};
        this.userVariants = {};
        this.userId = this.getUserId();
        this.init();
    }

    // 초기화
    init() {
        if (typeof ENV_CONFIG === 'undefined' || !ENV_CONFIG?.FEATURES?.ENABLE_AB_TESTING) {
            console.log('A/B 테스팅이 비활성화되어 있습니다.');
            return;
        }

        // 실험 설정 로드
        this.loadExperiments();

        // 사용자 변형 할당
        this.assignUserVariants();

        // 변형 적용
        this.applyVariants();

        // 이벤트 추적 설정
        this.setupEventTracking();
    }

    // 사용자 ID 가져오기 또는 생성
    getUserId() {
        let userId = localStorage.getItem('ab_user_id');
        if (!userId) {
            userId = this.generateUserId();
            localStorage.setItem('ab_user_id', userId);
        }
        return userId;
    }

    // 사용자 ID 생성
    generateUserId() {
        return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 실험 설정 로드
    loadExperiments() {
        this.experiments = AB_TEST_CONFIG.EXPERIMENTS;
    }

    // 사용자에게 변형 할당
    assignUserVariants() {
        // 저장된 변형 로드
        const savedVariants = localStorage.getItem('ab_variants');
        if (savedVariants) {
            this.userVariants = JSON.parse(savedVariants);
        }

        // 각 실험에 대해 변형 할당
        Object.keys(this.experiments).forEach(experimentKey => {
            const experiment = this.experiments[experimentKey];

            if (!experiment.enabled) return;

            // 이미 할당된 변형이 있으면 사용
            if (this.userVariants[experimentKey]) return;

            // 새로운 변형 할당
            this.userVariants[experimentKey] = this.selectVariant(experiment);
        });

        // 변형 저장
        localStorage.setItem('ab_variants', JSON.stringify(this.userVariants));
    }

    // 변형 선택 (트래픽 할당 기반)
    selectVariant(experiment) {
        const random = Math.random();
        let cumulativeProbability = 0;

        for (let i = 0; i < experiment.variants.length; i++) {
            cumulativeProbability += experiment.traffic_allocation[i];
            if (random < cumulativeProbability) {
                return {
                    variant: experiment.variants[i],
                    index: i
                };
            }
        }

        // 기본값 (첫 번째 변형)
        return {
            variant: experiment.variants[0],
            index: 0
        };
    }

    // 변형 적용
    applyVariants() {
        // CTA 버튼 색상 테스트
        if (this.userVariants.CTA_COLOR) {
            this.applyCTAColorVariant(this.userVariants.CTA_COLOR.variant);
        }

        // 가격 표시 방식 테스트
        if (this.userVariants.PRICE_DISPLAY) {
            this.applyPriceDisplayVariant(this.userVariants.PRICE_DISPLAY.variant);
        }

        // 헤드라인 테스트
        if (this.userVariants.HEADLINE) {
            this.applyHeadlineVariant(this.userVariants.HEADLINE.variant);
        }
    }

    // CTA 버튼 색상 변형 적용
    applyCTAColorVariant(variant) {
        const colorMap = {
            blue: {
                primary: '#3b82f6',
                hover: '#2563eb',
                text: '#ffffff'
            },
            green: {
                primary: '#10b981',
                hover: '#059669',
                text: '#ffffff'
            },
            orange: {
                primary: '#f59e0b',
                hover: '#d97706',
                text: '#ffffff'
            }
        };

        const colors = colorMap[variant];
        if (!colors) return;

        // CSS 변수 업데이트
        const style = document.createElement('style');
        style.innerHTML = `
            .cta-button, .service-btn, .hero-cta, .payment-btn {
                background: ${colors.primary} !important;
                color: ${colors.text} !important;
            }
            .cta-button:hover, .service-btn:hover, .hero-cta:hover, .payment-btn:hover {
                background: ${colors.hover} !important;
            }
        `;
        document.head.appendChild(style);

        console.log(`A/B Test: CTA 색상 변형 '${variant}' 적용됨`);
    }

    // 가격 표시 방식 변형 적용
    applyPriceDisplayVariant(variant) {
        if (variant === 'discount_emphasis') {
            // 할인 강조 표시
            document.querySelectorAll('.price-display').forEach(el => {
                const price = el.textContent;
                const originalPrice = parseInt(price.replace(/[^0-9]/g, '')) * 1.2;
                el.innerHTML = `
                    <span style="text-decoration: line-through; color: #999;">₩${originalPrice.toLocaleString()}</span>
                    <span style="color: #ef4444; font-weight: bold;">${price}</span>
                    <span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-left: 8px;">20% 할인</span>
                `;
            });
        } else if (variant === 'bundle_offer') {
            // 번들 제안 표시
            document.querySelectorAll('.service-card').forEach((card, index) => {
                if (index % 3 === 0) {
                    const badge = document.createElement('div');
                    badge.className = 'bundle-badge';
                    badge.innerHTML = '🎁 번들 구매시 추가 10% 할인';
                    badge.style.cssText = 'background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px; position: absolute; top: 10px; right: 10px;';
                    card.style.position = 'relative';
                    card.appendChild(badge);
                }
            });
        }

        console.log(`A/B Test: 가격 표시 변형 '${variant}' 적용됨`);
    }

    // 헤드라인 변형 적용
    applyHeadlineVariant(variant) {
        const heroTitle = document.querySelector('.hero h1');
        if (heroTitle) {
            heroTitle.textContent = variant;
        }

        // 페이지 타이틀도 업데이트
        document.title = `${variant} - MarketGrow`;

        console.log(`A/B Test: 헤드라인 변형 '${variant}' 적용됨`);
    }

    // 이벤트 추적 설정
    setupEventTracking() {
        // 클릭 이벤트 추적
        this.trackClicks();

        // 전환 이벤트 추적
        this.trackConversions();

        // 스크롤 깊이 추적
        this.trackScrollDepth();

        // 페이지 체류 시간 추적
        this.trackTimeOnPage();
    }

    // 클릭 추적
    trackClicks() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, a, .cta-button, .service-btn');
            if (!target) return;

            const eventData = {
                event: 'ab_test_click',
                element: target.className || target.tagName,
                text: target.textContent.trim().substring(0, 50),
                experiments: this.userVariants,
                timestamp: Date.now()
            };

            this.sendEvent(eventData);
        });
    }

    // 전환 추적
    trackConversions() {
        // 회원가입 전환
        if (window.location.pathname.includes('signup')) {
            const signupForm = document.getElementById('signupForm');
            if (signupForm) {
                signupForm.addEventListener('submit', () => {
                    this.trackConversion('signup');
                });
            }
        }

        // 결제 전환
        if (window.location.pathname.includes('payment')) {
            window.addEventListener('payment_success', () => {
                this.trackConversion('payment');
            });
        }

        // 서비스 선택 전환
        if (window.location.pathname.includes('services')) {
            document.addEventListener('service_selected', (e) => {
                this.trackConversion('service_selection', e.detail);
            });
        }
    }

    // 전환 이벤트 기록
    trackConversion(type, details = {}) {
        const eventData = {
            event: 'ab_test_conversion',
            conversion_type: type,
            experiments: this.userVariants,
            details,
            timestamp: Date.now()
        };

        this.sendEvent(eventData);

        // 전환율 계산을 위한 로컬 저장
        this.saveConversion(type);
    }

    // 스크롤 깊이 추적
    trackScrollDepth() {
        let maxScroll = 0;
        const scrollCheckpoints = [25, 50, 75, 90, 100];
        const reachedCheckpoints = [];

        window.addEventListener('scroll', () => {
            const scrollPercentage = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );

            if (scrollPercentage > maxScroll) {
                maxScroll = scrollPercentage;

                scrollCheckpoints.forEach(checkpoint => {
                    if (scrollPercentage >= checkpoint && !reachedCheckpoints.includes(checkpoint)) {
                        reachedCheckpoints.push(checkpoint);

                        this.sendEvent({
                            event: 'ab_test_scroll',
                            depth: checkpoint,
                            experiments: this.userVariants,
                            timestamp: Date.now()
                        });
                    }
                });
            }
        });
    }

    // 페이지 체류 시간 추적
    trackTimeOnPage() {
        const startTime = Date.now();

        // 페이지 떠날 때 시간 기록
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Math.round((Date.now() - startTime) / 1000);

            this.sendEvent({
                event: 'ab_test_time_on_page',
                duration: timeOnPage,
                experiments: this.userVariants,
                timestamp: Date.now()
            });
        });

        // 주기적으로 체류 시간 업데이트 (30초마다)
        setInterval(() => {
            const timeOnPage = Math.round((Date.now() - startTime) / 1000);

            if (timeOnPage % 30 === 0) {
                this.sendEvent({
                    event: 'ab_test_engagement',
                    duration: timeOnPage,
                    experiments: this.userVariants,
                    timestamp: Date.now()
                });
            }
        }, 30000);
    }

    // 이벤트 전송
    sendEvent(eventData) {
        // Google Analytics로 전송
        if (typeof gtag !== 'undefined') {
            gtag('event', eventData.event, {
                event_category: 'AB_Testing',
                event_label: JSON.stringify(eventData.experiments),
                value: eventData.value || 0,
                custom_data: JSON.stringify(eventData)
            });
        }

        // 백엔드 API로 전송 (실제 환경)
        if (!API_CONFIG.USE_MOCK) {
            fetch(`${API_CONFIG.BASE_URL}/analytics/ab-test`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify({
                    user_id: this.userId,
                    ...eventData
                })
            }).catch(error => {
                console.error('A/B 테스트 이벤트 전송 실패:', error);
            });
        }

        // 개발 환경 로그
        if (ENV_CONFIG.IS_DEVELOPMENT) {
            console.log('A/B Test Event:', eventData);
        }
    }

    // 전환 저장
    saveConversion(type) {
        const conversions = JSON.parse(localStorage.getItem('ab_conversions') || '{}');

        if (!conversions[type]) {
            conversions[type] = [];
        }

        conversions[type].push({
            experiments: this.userVariants,
            timestamp: Date.now()
        });

        localStorage.setItem('ab_conversions', JSON.stringify(conversions));
    }

    // 실험 결과 가져오기
    getExperimentResults() {
        const conversions = JSON.parse(localStorage.getItem('ab_conversions') || '{}');
        const results = {};

        Object.keys(this.experiments).forEach(experimentKey => {
            if (!this.experiments[experimentKey].enabled) return;

            const variants = this.experiments[experimentKey].variants;
            results[experimentKey] = {};

            variants.forEach(variant => {
                results[experimentKey][variant] = {
                    views: 0,
                    conversions: 0,
                    conversionRate: 0
                };
            });
        });

        // 전환 데이터 집계
        Object.keys(conversions).forEach(conversionType => {
            conversions[conversionType].forEach(conversion => {
                Object.keys(conversion.experiments).forEach(experimentKey => {
                    const variant = conversion.experiments[experimentKey].variant;
                    if (results[experimentKey] && results[experimentKey][variant]) {
                        results[experimentKey][variant].conversions++;
                    }
                });
            });
        });

        return results;
    }

    // 변형 재설정 (테스트용)
    resetVariants() {
        localStorage.removeItem('ab_variants');
        localStorage.removeItem('ab_conversions');
        this.userVariants = {};
        this.assignUserVariants();
        this.applyVariants();
        console.log('A/B 테스트 변형이 재설정되었습니다.');
    }
}

// 전역 인스턴스 생성
window.abTestingManager = new ABTestingManager();

// 전역 함수 export
window.ABTesting = {
    // 현재 사용자의 변형 가져오기
    getUserVariants: () => window.abTestingManager.userVariants,

    // 전환 추적
    trackConversion: (type, details) => window.abTestingManager.trackConversion(type, details),

    // 실험 결과 가져오기
    getResults: () => window.abTestingManager.getExperimentResults(),

    // 변형 재설정
    reset: () => window.abTestingManager.resetVariants()
};
