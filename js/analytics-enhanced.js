// 고급 Google Analytics 4 및 모니터링 시스템
class EnhancedAnalytics {
    constructor() {
        this.initialized = false;
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.pageLoadTime = Date.now();
        this.events = [];
        this.performanceData = {};
        this.init();
    }

    // 초기화
    async init() {
        if (!ENV_CONFIG.FEATURES.ENABLE_ANALYTICS) {
            console.log('Analytics가 비활성화되어 있습니다.');
            return;
        }

        // Google Analytics 4 초기화
        this.initGA4();

        // Google Tag Manager 초기화
        this.initGTM();

        // 성능 모니터링 설정
        this.setupPerformanceMonitoring();

        // 이벤트 추적 설정
        this.setupEventTracking();

        // 사용자 행동 추적
        this.setupUserBehaviorTracking();

        // 에러 추적 설정
        this.setupErrorTracking();

        // 전자상거래 추적
        this.setupEcommerceTracking();

        this.initialized = true;
        console.log('Enhanced Analytics 초기화 완료');
    }

    // 세션 ID 생성
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 사용자 ID 가져오기
    getUserId() {
        const storageKey = (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.USER_INFO) || 'userInfo';
        const userInfo = JSON.parse(localStorage.getItem(storageKey) || '{}');
        return userInfo.id || localStorage.getItem('anonymous_user_id') || this.createAnonymousUserId();
    }

    // 익명 사용자 ID 생성
    createAnonymousUserId() {
        const id = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('anonymous_user_id', id);
        return id;
    }

    // Google Analytics 4 초기화
    initGA4() {
        // GA4 스크립트 동적 로드
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.GA_MEASUREMENT_ID}`;
        document.head.appendChild(script);

        // gtag 초기화
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () {
            window.dataLayer.push(arguments);
        };

        gtag('js', new Date());

        // 기본 설정
        gtag('config', ANALYTICS_CONFIG.GA_MEASUREMENT_ID, {
            user_id: this.userId,
            'custom_map.dimension1': 'user_type',
            'custom_map.dimension2': 'session_id',
            'custom_map.dimension3': 'ab_test_variants',
            send_page_view: false // 수동으로 페이지뷰 전송
        });

        // 향상된 측정 설정
        gtag('set', {
            user_properties: {
                user_type: this.getUserType(),
                registration_date: this.getRegistrationDate()
            }
        });

        // 초기 페이지뷰 전송
        this.trackPageView();
    }

    // Google Tag Manager 초기화
    initGTM() {
        if (!ANALYTICS_CONFIG.GTM_ID) return;

        // GTM 스크립트 삽입
        const gtmScript = document.createElement('script');
        gtmScript.innerHTML = `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${ANALYTICS_CONFIG.GTM_ID}');
        `;
        document.head.appendChild(gtmScript);

        // GTM noscript 태그
        const gtmNoscript = document.createElement('noscript');
        gtmNoscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${ANALYTICS_CONFIG.GTM_ID}"
            height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
        document.body.insertBefore(gtmNoscript, document.body.firstChild);
    }

    // 성능 모니터링 설정
    setupPerformanceMonitoring() {
        // Web Vitals 측정
        this.measureWebVitals();

        // 리소스 타이밍 측정
        this.measureResourceTiming();

        // 네비게이션 타이밍 측정
        this.measureNavigationTiming();

        // 주기적 성능 체크 (5분마다)
        setInterval(() => {
            this.checkPerformanceThresholds();
        }, 300000);
    }

    // Web Vitals 측정
    measureWebVitals() {
        // FCP (First Contentful Paint)
        const paintObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    this.performanceData.fcp = entry.startTime;
                    this.trackPerformance('FCP', entry.startTime);
                }
            }
        });
        paintObserver.observe({ entryTypes: ['paint'] });

        // LCP (Largest Contentful Paint)
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.performanceData.lcp = lastEntry.renderTime || lastEntry.loadTime;
            this.trackPerformance('LCP', this.performanceData.lcp);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // FID (First Input Delay)
        const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.performanceData.fid = entry.processingStart - entry.startTime;
                this.trackPerformance('FID', this.performanceData.fid);
            }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // CLS (Cumulative Layout Shift)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    this.performanceData.cls = clsValue;
                }
            }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // TTI (Time to Interactive)
        if ('PerformanceLongTaskTiming' in window) {
            const ttiObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                // TTI 계산 로직
                const tti = this.calculateTTI(entries);
                if (tti) {
                    this.performanceData.tti = tti;
                    this.trackPerformance('TTI', tti);
                }
            });
            ttiObserver.observe({ entryTypes: ['longtask'] });
        }
    }

    // TTI 계산
    calculateTTI(longTasks) {
        // 간단한 TTI 계산 (실제로는 더 복잡함)
        const fcp = this.performanceData.fcp || 0;
        const lastLongTask = longTasks[longTasks.length - 1];
        if (lastLongTask) {
            return lastLongTask.startTime + lastLongTask.duration;
        }
        return fcp + 5000; // 기본값
    }

    // 리소스 타이밍 측정
    measureResourceTiming() {
        window.addEventListener('load', () => {
            const resources = performance.getEntriesByType('resource');

            // 리소스별 로딩 시간 집계
            const resourceStats = {
                scripts: [],
                styles: [],
                images: [],
                fonts: [],
                xhr: [],
                total: 0
            };

            resources.forEach(resource => {
                const duration = resource.responseEnd - resource.startTime;
                resourceStats.total += duration;

                if (resource.initiatorType === 'script') {
                    resourceStats.scripts.push({ name: resource.name, duration });
                } else if (resource.initiatorType === 'css' || resource.initiatorType === 'link') {
                    resourceStats.styles.push({ name: resource.name, duration });
                } else if (resource.initiatorType === 'img') {
                    resourceStats.images.push({ name: resource.name, duration });
                } else if (resource.initiatorType === 'xmlhttprequest' || resource.initiatorType === 'fetch') {
                    resourceStats.xhr.push({ name: resource.name, duration });
                }
            });

            this.performanceData.resources = resourceStats;

            // 느린 리소스 보고
            this.reportSlowResources(resourceStats);
        });
    }

    // 네비게이션 타이밍 측정
    measureNavigationTiming() {
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];

            if (navigation) {
                this.performanceData.navigation = {
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                    domInteractive: navigation.domInteractive,
                    pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
                    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
                    tcp: navigation.connectEnd - navigation.connectStart,
                    request: navigation.responseStart - navigation.requestStart,
                    response: navigation.responseEnd - navigation.responseStart,
                    domParsing: navigation.domInteractive - navigation.responseEnd,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                    totalTime: navigation.loadEventEnd - navigation.fetchStart
                };

                // GA4로 전송
                this.trackPerformance('page_load_time', this.performanceData.navigation.totalTime);
            }
        });
    }

    // 성능 임계값 체크
    checkPerformanceThresholds() {
        const thresholds = MONITORING_CONFIG.THRESHOLDS;
        const violations = [];

        if (this.performanceData.fcp > thresholds.FCP) {
            violations.push({ metric: 'FCP', value: this.performanceData.fcp, threshold: thresholds.FCP });
        }
        if (this.performanceData.lcp > thresholds.LCP) {
            violations.push({ metric: 'LCP', value: this.performanceData.lcp, threshold: thresholds.LCP });
        }
        if (this.performanceData.fid > thresholds.FID) {
            violations.push({ metric: 'FID', value: this.performanceData.fid, threshold: thresholds.FID });
        }
        if (this.performanceData.cls > thresholds.CLS) {
            violations.push({ metric: 'CLS', value: this.performanceData.cls, threshold: thresholds.CLS });
        }

        if (violations.length > 0) {
            this.reportPerformanceViolations(violations);
        }
    }

    // 이벤트 추적 설정
    setupEventTracking() {
        // 클릭 이벤트
        if (ANALYTICS_CONFIG.TRACK_EVENTS.BUTTON_CLICK) {
            this.trackClickEvents();
        }

        // 폼 제출
        if (ANALYTICS_CONFIG.TRACK_EVENTS.FORM_SUBMIT) {
            this.trackFormSubmissions();
        }

        // 스크롤 깊이
        if (ANALYTICS_CONFIG.TRACK_EVENTS.SCROLL_DEPTH) {
            this.trackScrollDepth();
        }

        // 페이지 체류 시간
        if (ANALYTICS_CONFIG.TRACK_EVENTS.TIME_ON_PAGE) {
            this.trackTimeOnPage();
        }

        // 비디오 추적
        this.trackVideoEngagement();

        // 파일 다운로드
        this.trackDownloads();

        // 외부 링크
        this.trackOutboundLinks();
    }

    // 클릭 이벤트 추적
    trackClickEvents() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, a, [data-track]');
            if (!target) return;

            const eventData = {
                event_name: 'click',
                element_type: target.tagName.toLowerCase(),
                element_text: target.textContent.trim().substring(0, 100),
                element_classes: target.className,
                element_id: target.id,
                element_href: target.href,
                data_track: target.dataset.track
            };

            this.trackEvent('click', eventData);
        });
    }

    // 폼 제출 추적
    trackFormSubmissions() {
        document.addEventListener('submit', (e) => {
            const form = e.target;

            const eventData = {
                event_name: 'form_submit',
                form_id: form.id,
                form_name: form.name,
                form_action: form.action,
                form_method: form.method,
                form_fields: Array.from(form.elements)
                    .filter(el => el.name)
                    .map(el => ({ name: el.name, type: el.type }))
            };

            this.trackEvent('form_submit', eventData);
        });
    }

    // 스크롤 깊이 추적
    trackScrollDepth() {
        let maxScroll = 0;
        const checkpoints = [10, 25, 50, 75, 90, 100];
        const reached = new Set();

        const handleScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);

            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;

                checkpoints.forEach(checkpoint => {
                    if (scrollPercent >= checkpoint && !reached.has(checkpoint)) {
                        reached.add(checkpoint);

                        this.trackEvent('scroll_depth', {
                            percentage: checkpoint,
                            pixels: window.scrollY,
                            page_height: document.documentElement.scrollHeight
                        });
                    }
                });
            }
        };

        // Debounced scroll handler
        let scrollTimer;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(handleScroll, 100);
        });
    }

    // 페이지 체류 시간 추적
    trackTimeOnPage() {
        const startTime = Date.now();
        let isActive = true;
        let activeTime = 0;
        let lastActiveTime = startTime;

        // 활성 상태 추적
        const updateActiveTime = () => {
            if (isActive) {
                activeTime += Date.now() - lastActiveTime;
            }
            lastActiveTime = Date.now();
        };

        // 포커스/블러 이벤트
        window.addEventListener('focus', () => {
            isActive = true;
            lastActiveTime = Date.now();
        });

        window.addEventListener('blur', () => {
            updateActiveTime();
            isActive = false;
        });

        // 주기적 전송 (30초마다)
        setInterval(() => {
            updateActiveTime();

            this.trackEvent('time_on_page', {
                total_time: Date.now() - startTime,
                active_time: activeTime,
                page_path: window.location.pathname
            });
        }, 30000);

        // 페이지 떠날 때
        window.addEventListener('beforeunload', () => {
            updateActiveTime();

            this.trackEvent('page_exit', {
                total_time: Date.now() - startTime,
                active_time: activeTime,
                exit_page: window.location.pathname
            });
        });
    }

    // 사용자 행동 추적
    setupUserBehaviorTracking() {
        // 마우스 이동 히트맵
        this.trackMouseMovement();

        // 클릭 히트맵
        this.trackClickHeatmap();

        // 세션 리플레이 (샘플링)
        if (Math.random() < 0.01) { // 1% 샘플링
            this.startSessionRecording();
        }
    }

    // 마우스 이동 추적 (샘플링)
    trackMouseMovement() {
        const movements = [];
        let lastTime = Date.now();

        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastTime > 100) { // 100ms 간격
                movements.push({
                    x: e.pageX,
                    y: e.pageY,
                    t: now - this.pageLoadTime
                });
                lastTime = now;

                // 100개마다 전송
                if (movements.length >= 100) {
                    this.sendMouseMovements(movements.splice(0, 100));
                }
            }
        });
    }

    // 클릭 히트맵 추적
    trackClickHeatmap() {
        document.addEventListener('click', (e) => {
            const rect = document.documentElement.getBoundingClientRect();

            this.trackEvent('click_heatmap', {
                x: e.pageX,
                y: e.pageY,
                viewport_width: window.innerWidth,
                viewport_height: window.innerHeight,
                page_width: rect.width,
                page_height: rect.height,
                element: e.target.tagName,
                timestamp: Date.now() - this.pageLoadTime
            });
        });
    }

    // 에러 추적
    setupErrorTracking() {
        // JavaScript 에러
        window.addEventListener('error', (e) => {
            this.trackError('javascript_error', {
                message: e.message,
                filename: e.filename,
                line: e.lineno,
                column: e.colno,
                stack: e.error?.stack
            });
        });

        // Promise rejection
        window.addEventListener('unhandledrejection', (e) => {
            this.trackError('promise_rejection', {
                reason: e.reason,
                promise: e.promise
            });
        });

        // 리소스 로드 실패
        window.addEventListener('error', (e) => {
            if (e.target !== window) {
                this.trackError('resource_error', {
                    type: e.target.tagName,
                    src: e.target.src || e.target.href,
                    message: 'Resource failed to load'
                });
            }
        }, true);
    }

    // 전자상거래 추적
    setupEcommerceTracking() {
        // 제품 조회
        this.trackProductViews();

        // 장바구니 추가
        this.trackAddToCart();

        // 구매 추적
        this.trackPurchases();
    }

    // 제품 조회 추적
    trackProductViews() {
        if (window.location.pathname.includes('services')) {
            document.addEventListener('service_viewed', (e) => {
                this.trackEcommerce('view_item', {
                    currency: 'KRW',
                    value: e.detail.price,
                    items: [{
                        item_id: e.detail.id,
                        item_name: e.detail.name,
                        item_category: e.detail.category,
                        price: e.detail.price
                    }]
                });
            });
        }
    }

    // 장바구니 추가 추적
    trackAddToCart() {
        document.addEventListener('add_to_cart', (e) => {
            this.trackEcommerce('add_to_cart', {
                currency: 'KRW',
                value: e.detail.price,
                items: [{
                    item_id: e.detail.id,
                    item_name: e.detail.name,
                    item_category: e.detail.category,
                    price: e.detail.price,
                    quantity: e.detail.quantity
                }]
            });
        });
    }

    // 구매 추적
    trackPurchases() {
        document.addEventListener('purchase_complete', (e) => {
            this.trackEcommerce('purchase', {
                transaction_id: e.detail.orderId,
                value: e.detail.totalAmount,
                currency: 'KRW',
                tax: e.detail.tax,
                shipping: 0,
                items: e.detail.items
            });
        });
    }

    // 이벤트 전송
    trackEvent(eventName, parameters = {}) {
        if (!this.initialized) return;

        // GA4로 전송
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                ...parameters,
                session_id: this.sessionId,
                user_id: this.userId,
                timestamp: Date.now()
            });
        }

        // 로컬 저장 (분석용)
        this.events.push({
            name: eventName,
            parameters,
            timestamp: Date.now()
        });

        // 개발 환경 로그
        if (ENV_CONFIG.IS_DEVELOPMENT) {
            console.log(`📊 Analytics Event: ${eventName}`, parameters);
        }
    }

    // 페이지뷰 추적
    trackPageView(customParameters = {}) {
        const parameters = {
            page_title: document.title,
            page_location: window.location.href,
            page_path: window.location.pathname,
            page_referrer: document.referrer,
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            ...customParameters
        };

        this.trackEvent('page_view', parameters);
    }

    // 성능 추적
    trackPerformance(metric, value) {
        this.trackEvent('performance_metric', {
            metric_name: metric,
            metric_value: value,
            page_path: window.location.pathname
        });
    }

    // 에러 추적
    trackError(errorType, errorData) {
        // 무시할 에러 체크
        const shouldIgnore = MONITORING_CONFIG.ERROR_REPORTING.IGNORE_ERRORS.some(
            pattern => errorData.message?.includes(pattern)
        );

        if (shouldIgnore) return;

        // 샘플링
        if (Math.random() > MONITORING_CONFIG.ERROR_REPORTING.SAMPLE_RATE) return;

        this.trackEvent('error', {
            error_type: errorType,
            ...errorData,
            page_path: window.location.pathname,
            user_agent: navigator.userAgent
        });

        // 심각한 에러는 즉시 백엔드로 전송
        if (errorType === 'javascript_error') {
            this.reportCriticalError(errorData);
        }
    }

    // 전자상거래 이벤트 추적
    trackEcommerce(eventName, parameters) {
        this.trackEvent(eventName, parameters);
    }

    // 사용자 타입 가져오기
    getUserType() {
        const userInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_INFO) || '{}');
        if (!userInfo.id) return 'anonymous';
        if (ADMIN_CONFIG.ADMIN_EMAILS.includes(userInfo.email)) return 'admin';
        return userInfo.isPremium ? 'premium' : 'registered';
    }

    // 가입일 가져오기
    getRegistrationDate() {
        const userInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_INFO) || '{}');
        return userInfo.createdAt || null;
    }

    // 느린 리소스 보고
    reportSlowResources(resourceStats) {
        const slowThreshold = 3000; // 3초
        const slowResources = [];

        ['scripts', 'styles', 'images', 'xhr'].forEach(type => {
            resourceStats[type].forEach(resource => {
                if (resource.duration > slowThreshold) {
                    slowResources.push({
                        type,
                        name: resource.name,
                        duration: resource.duration
                    });
                }
            });
        });

        if (slowResources.length > 0) {
            this.trackEvent('slow_resources', {
                resources: slowResources,
                count: slowResources.length
            });
        }
    }

    // 성능 위반 보고
    reportPerformanceViolations(violations) {
        this.trackEvent('performance_violation', {
            violations,
            page_path: window.location.pathname
        });
    }

    // 마우스 이동 데이터 전송
    sendMouseMovements(movements) {
        this.trackEvent('mouse_movement', {
            movements,
            page_path: window.location.pathname
        });
    }

    // 심각한 에러 즉시 보고
    async reportCriticalError(errorData) {
        if (API_CONFIG.USE_MOCK) return;

        try {
            await fetch(`${API_CONFIG.BASE_URL}/monitoring/error`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify({
                    ...errorData,
                    session_id: this.sessionId,
                    user_id: this.userId,
                    timestamp: Date.now()
                })
            });
        } catch (error) {
            console.error('Critical error reporting failed:', error);
        }
    }

    // 세션 레코딩 시작 (간단한 구현)
    startSessionRecording() {
        console.log('Session recording started (1% sample)');
        // 실제 구현은 rrweb 같은 라이브러리 사용
    }

    // 분석 데이터 내보내기
    exportAnalyticsData() {
        return {
            session: {
                id: this.sessionId,
                user_id: this.userId,
                duration: Date.now() - this.pageLoadTime
            },
            performance: this.performanceData,
            events: this.events
        };
    }
}

// 전역 인스턴스 생성
window.enhancedAnalytics = new EnhancedAnalytics();

// 전역 헬퍼 함수
window.Analytics = {
    // 커스텀 이벤트 추적
    track: (eventName, parameters) => {
        window.enhancedAnalytics.trackEvent(eventName, parameters);
    },

    // 전환 추적
    trackConversion: (conversionType, value) => {
        window.enhancedAnalytics.trackEvent('conversion', {
            conversion_type: conversionType,
            conversion_value: value
        });
    },

    // 사용자 속성 설정
    setUserProperty: (name, value) => {
        if (typeof gtag !== 'undefined') {
            gtag('set', 'user_properties', { [name]: value });
        }
    },

    // 데이터 내보내기
    export: () => window.enhancedAnalytics.exportAnalyticsData()
};
