// 프론트엔드 최적화 유틸리티

// 디바운스 함수
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// 스로틀 함수
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 지연 로딩 함수
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// CSS 지연 로딩
function loadCSS(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    return link;
}

// 이미지 프리로딩
function preloadImages(urls) {
    const promises = urls.map(url => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
        });
    });
    return Promise.all(promises);
}

// DOM 조작 최적화 - 배치 업데이트
class DOMBatcher {
    constructor() {
        this.updates = [];
        this.scheduled = false;
    }

    add(updateFunction) {
        this.updates.push(updateFunction);
        if (!this.scheduled) {
            this.scheduled = true;
            requestAnimationFrame(() => this.flush());
        }
    }

    flush() {
        this.updates.forEach(update => update());
        this.updates = [];
        this.scheduled = false;
    }
}

// 메모리 효율적인 이벤트 리스너 관리
class EventManager {
    constructor() {
        this.listeners = new Map();
    }

    add(element, event, handler, options = {}) {
        const key = `${element.tagName}-${event}`;
        
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        
        this.listeners.get(key).push({ element, handler, options });
        element.addEventListener(event, handler, options);
    }

    remove(element, event, handler) {
        const key = `${element.tagName}-${event}`;
        const listeners = this.listeners.get(key);
        
        if (listeners) {
            const index = listeners.findIndex(l => 
                l.element === element && l.handler === handler
            );
            
            if (index > -1) {
                listeners.splice(index, 1);
                element.removeEventListener(event, handler);
            }
        }
    }

    removeAll() {
        this.listeners.forEach((listeners, key) => {
            listeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
        });
        this.listeners.clear();
    }
}

// 가시성 API를 사용한 성능 최적화
class VisibilityOptimizer {
    constructor() {
        this.callbacks = {
            visible: [],
            hidden: []
        };
        
        this.init();
    }

    init() {
        if (typeof document.visibilityState !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                const isVisible = !document.hidden;
                const callbacks = isVisible ? this.callbacks.visible : this.callbacks.hidden;
                
                callbacks.forEach(callback => callback());
            });
        }
    }

    onVisible(callback) {
        this.callbacks.visible.push(callback);
    }

    onHidden(callback) {
        this.callbacks.hidden.push(callback);
    }
}

// 네트워크 상태 기반 최적화
class NetworkOptimizer {
    constructor() {
        this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        this.isSlowConnection = false;
        
        this.init();
    }

    init() {
        if (this.connection) {
            this.updateConnectionStatus();
            this.connection.addEventListener('change', () => {
                this.updateConnectionStatus();
            });
        }
    }

    updateConnectionStatus() {
        if (this.connection) {
            // 2G 또는 느린 3G 연결 감지
            this.isSlowConnection = 
                this.connection.effectiveType === '2g' || 
                this.connection.effectiveType === 'slow-2g' ||
                (this.connection.effectiveType === '3g' && this.connection.downlink < 1.5);
                
            console.log(`네트워크 상태: ${this.connection.effectiveType}, 느린 연결: ${this.isSlowConnection}`);
        }
    }

    shouldLoadHighQualityImages() {
        return !this.isSlowConnection;
    }

    getOptimalImageQuality() {
        if (this.isSlowConnection) {
            return 'low';
        }
        return 'high';
    }

    shouldPreloadContent() {
        return !this.isSlowConnection;
    }
}

// 리소스 힌트 추가
function addResourceHints() {
    const hints = [
        { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
        { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
        { rel: 'dns-prefetch', href: '//cdnjs.cloudflare.com' },
        { rel: 'dns-prefetch', href: '//api.tosspayments.com' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true }
    ];

    hints.forEach(hint => {
        const link = document.createElement('link');
        Object.keys(hint).forEach(key => {
            if (key === 'crossorigin') {
                link.setAttribute('crossorigin', '');
            } else {
                link[key] = hint[key];
            }
        });
        document.head.appendChild(link);
    });
}

// Critical CSS 인라인화
function inlineCriticalCSS() {
    const criticalCSS = `
        /* Critical CSS for above-the-fold content */
        body { margin: 0; font-family: 'Noto Sans KR', sans-serif; }
        .navbar { position: fixed; top: 0; width: 100%; z-index: 1000; background: white; }
        .hero-section { min-height: 100vh; display: flex; align-items: center; }
        .loading { opacity: 0.6; pointer-events: none; }
    `;

    const style = document.createElement('style');
    style.innerHTML = criticalCSS;
    document.head.appendChild(style);
}

// 웹폰트 최적화
function optimizeWebFonts() {
    // 폰트 디스플레이 최적화
    const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
    fontLinks.forEach(link => {
        const url = new URL(link.href);
        url.searchParams.set('display', 'swap');
        link.href = url.toString();
    });
}

// 서비스 워커 등록
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker 등록 성공:', registration);
            
            // 업데이트 확인
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // 새 버전 사용 가능 알림
                        if (confirm('새 버전이 사용 가능합니다. 페이지를 새로고침하시겠습니까?')) {
                            window.location.reload();
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Service Worker 등록 실패:', error);
        }
    }
}

// 전역 인스턴스 생성
const domBatcher = new DOMBatcher();
const eventManager = new EventManager();
const visibilityOptimizer = new VisibilityOptimizer();
const networkOptimizer = new NetworkOptimizer();

// 페이지 로드 시 최적화 적용
document.addEventListener('DOMContentLoaded', () => {
    addResourceHints();
    inlineCriticalCSS();
    optimizeWebFonts();
    registerServiceWorker();
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    eventManager.removeAll();
});

// 유틸리티 함수들을 전역으로 노출
window.OptimizationUtils = {
    debounce,
    throttle,
    loadScript,
    loadCSS,
    preloadImages,
    domBatcher,
    eventManager,
    visibilityOptimizer,
    networkOptimizer
};