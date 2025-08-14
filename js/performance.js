// 성능 최적화 및 모니터링 유틸리티

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoadTime: 0,
            domContentLoadedTime: 0,
            apiCalls: new Map(),
            errors: [],
            userInteractions: []
        };

        this.init();
    }

    init() {
        // 페이지 로드 성능 측정
        this.measurePageLoad();

        // API 호출 성능 추적
        this.trackAPIPerformance();

        // 에러 추적
        this.trackErrors();

        // 사용자 상호작용 추적
        this.trackUserInteractions();

        // 메모리 사용량 모니터링
        this.monitorMemoryUsage();
    }

    measurePageLoad() {
        if (typeof performance !== 'undefined' && performance.timing) {
            window.addEventListener('load', () => {
                const timing = performance.timing;
                this.metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
                this.metrics.domContentLoadedTime = timing.domContentLoadedEventEnd - timing.navigationStart;

                console.log(`페이지 로드 시간: ${this.metrics.pageLoadTime}ms`);
                console.log(`DOM 로드 시간: ${this.metrics.domContentLoadedTime}ms`);

                // 느린 로딩 경고
                if (this.metrics.pageLoadTime > 3000) {
                    console.warn('페이지 로딩이 느립니다. 최적화가 필요합니다.');
                }
            });
        }
    }

    trackAPIPerformance() {
        // Fetch API 래핑
        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0];

            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                const duration = endTime - startTime;

                this.recordAPICall(url, duration, response.status, true);

                if (duration > 1000) {
                    console.warn(`느린 API 호출 감지: ${url} (${duration.toFixed(2)}ms)`);
                }

                return response;
            } catch (error) {
                const endTime = performance.now();
                const duration = endTime - startTime;

                this.recordAPICall(url, duration, 0, false, error.message);
                throw error;
            }
        };
    }

    recordAPICall(url, duration, status, success, errorMessage = null) {
        const key = url.toString();

        if (!this.metrics.apiCalls.has(key)) {
            this.metrics.apiCalls.set(key, {
                url: key,
                calls: 0,
                totalDuration: 0,
                averageDuration: 0,
                successCount: 0,
                errorCount: 0,
                errors: []
            });
        }

        const apiMetric = this.metrics.apiCalls.get(key);
        apiMetric.calls++;
        apiMetric.totalDuration += duration;
        apiMetric.averageDuration = apiMetric.totalDuration / apiMetric.calls;

        if (success) {
            apiMetric.successCount++;
        } else {
            apiMetric.errorCount++;
            if (errorMessage) {
                apiMetric.errors.push({
                    message: errorMessage,
                    timestamp: new Date(),
                    status
                });
            }
        }
    }

    trackErrors() {
        // JavaScript 에러 추적
        window.addEventListener('error', (event) => {
            this.recordError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                timestamp: new Date(),
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        });

        // Promise rejection 추적
        window.addEventListener('unhandledrejection', (event) => {
            this.recordError({
                type: 'promise_rejection',
                message: event.reason?.message || event.reason,
                timestamp: new Date(),
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        });
    }

    recordError(errorInfo) {
        this.metrics.errors.push(errorInfo);

        // 에러가 많으면 경고
        if (this.metrics.errors.length > 10) {
            console.warn('많은 에러가 발생했습니다. 개발자 도구를 확인해주세요.');
        }

        // 에러를 서버로 전송 (선택적)
        if (typeof api !== 'undefined' && api.logError) {
            api.logError(errorInfo).catch(console.error);
        }
    }

    trackUserInteractions() {
        // 클릭 이벤트 추적
        document.addEventListener('click', (event) => {
            this.recordInteraction('click', event.target.tagName, event.target.className);
        });

        // 폼 제출 추적
        document.addEventListener('submit', (event) => {
            this.recordInteraction('form_submit', event.target.tagName, event.target.id);
        });

        // 스크롤 추적 (스로틀링)
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);

            scrollTimeout = setTimeout(() => {
                const scrollPercent = Math.round(
                    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
                );
                this.recordInteraction('scroll', 'window', `${scrollPercent}%`);
            }, 100);
        });
    }

    recordInteraction(type, element, details) {
        this.metrics.userInteractions.push({
            type,
            element,
            details,
            timestamp: new Date(),
            url: window.location.href
        });

        // 메모리 절약을 위해 최근 100개만 유지
        if (this.metrics.userInteractions.length > 100) {
            this.metrics.userInteractions = this.metrics.userInteractions.slice(-100);
        }
    }

    monitorMemoryUsage() {
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
                const totalMB = Math.round(memory.totalJSHeapSize / 1048576);

                if (usedMB > 100) { // 100MB 이상 사용 시 경고
                    console.warn(`높은 메모리 사용량 감지: ${usedMB}MB / ${totalMB}MB`);
                }
            }, 30000); // 30초마다 체크
        }
    }

    // 성능 리포트 생성
    generateReport() {
        const report = {
            timestamp: new Date(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            pageMetrics: {
                loadTime: this.metrics.pageLoadTime,
                domLoadTime: this.metrics.domContentLoadedTime
            },
            apiMetrics: Array.from(this.metrics.apiCalls.values()),
            errorCount: this.metrics.errors.length,
            recentErrors: this.metrics.errors.slice(-5),
            interactionCount: this.metrics.userInteractions.length,
            memoryUsage: performance.memory
                ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                    total: Math.round(performance.memory.totalJSHeapSize / 1048576)
                }
                : null
        };

        return report;
    }

    // 성능 리포트를 서버로 전송
    async sendReport() {
        try {
            const report = this.generateReport();

            if (typeof api !== 'undefined' && api.sendPerformanceReport) {
                await api.sendPerformanceReport(report);
                console.log('성능 리포트가 전송되었습니다.');
            }
        } catch (error) {
            console.error('성능 리포트 전송 실패:', error);
        }
    }

    // 성능 최적화 제안
    getOptimizationSuggestions() {
        const suggestions = [];

        // 페이지 로드 시간 체크
        if (this.metrics.pageLoadTime > 3000) {
            suggestions.push({
                type: 'page_load',
                severity: 'high',
                message: '페이지 로드 시간이 3초를 초과합니다',
                suggestion: '이미지 최적화, CSS/JS 압축, CDN 사용을 고려해보세요'
            });
        }

        // API 호출 성능 체크
        this.metrics.apiCalls.forEach((metric) => {
            if (metric.averageDuration > 1000) {
                suggestions.push({
                    type: 'api_performance',
                    severity: 'medium',
                    message: `${metric.url} API 호출이 느립니다 (평균 ${metric.averageDuration.toFixed(2)}ms)`,
                    suggestion: '캐싱, 데이터 압축, 쿼리 최적화를 고려해보세요'
                });
            }

            if (metric.errorCount > metric.successCount * 0.1) {
                suggestions.push({
                    type: 'api_reliability',
                    severity: 'high',
                    message: `${metric.url} API 호출 실패율이 높습니다 (${((metric.errorCount / metric.calls) * 100).toFixed(1)}%)`,
                    suggestion: '에러 핸들링, 재시도 로직, 서버 안정성을 확인해보세요'
                });
            }
        });

        // 에러 빈도 체크
        if (this.metrics.errors.length > 5) {
            suggestions.push({
                type: 'error_frequency',
                severity: 'high',
                message: `JavaScript 에러가 ${this.metrics.errors.length}개 발생했습니다`,
                suggestion: '코드 품질 검토, 에러 처리 로직 강화가 필요합니다'
            });
        }

        return suggestions;
    }
}

// 이미지 레이지 로딩 최적화
class LazyImageLoader {
    constructor() {
        this.images = [];
        this.imageObserver = null;
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.imageObserver.unobserve(entry.target);
                    }
                });
            });

            this.observeImages();
        } else {
            // 폴백: 모든 이미지 즉시 로드
            this.loadAllImages();
        }
    }

    observeImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            this.imageObserver.observe(img);
        });
    }

    loadImage(img) {
        const src = img.getAttribute('data-src');
        if (src) {
            img.src = src;
            img.classList.add('loaded');
            img.removeAttribute('data-src');
        }
    }

    loadAllImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => this.loadImage(img));
    }
}

// 캐시 관리
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.maxSize = 50; // 최대 캐시 항목 수
        this.ttl = 5 * 60 * 1000; // 5분 TTL
    }

    set(key, value) {
        // 캐시 크기 제한
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);

        if (!item) return null;

        // TTL 체크
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    clear() {
        this.cache.clear();
    }

    // 만료된 캐시 정리
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.ttl) {
                this.cache.delete(key);
            }
        }
    }
}

// 전역 인스턴스 생성
const performanceMonitor = new PerformanceMonitor();
const lazyImageLoader = new LazyImageLoader();
const cacheManager = new CacheManager();

// 주기적으로 캐시 정리
setInterval(() => cacheManager.cleanup(), 60000); // 1분마다

// 페이지 언로드 시 성능 리포트 전송
window.addEventListener('beforeunload', () => {
    performanceMonitor.sendReport();
});

// 5분마다 성능 리포트 전송
setInterval(() => {
    performanceMonitor.sendReport();
}, 5 * 60 * 1000);

// 개발자 도구에서 성능 정보 확인 가능하도록 전역 노출
window.performanceMonitor = performanceMonitor;
window.cacheManager = cacheManager;
