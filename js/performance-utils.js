// Performance Optimization Module
(function() {
    'use strict';

    // Debounce function for scroll and resize events
    function debounce(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    // Throttle function for frequent events
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Optimize scroll performance
    const optimizeScroll = () => {
        let ticking = false;
        
        function updateScrollPosition() {
            // Your scroll-based updates here
            ticking = false;
        }
        
        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(updateScrollPosition);
                ticking = true;
            }
        }
        
        window.addEventListener('scroll', requestTick, { passive: true });
    };

    // Preconnect to external domains
    const preconnectDomains = () => {
        const domains = [
            'https://cdnjs.cloudflare.com',
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com'
        ];

        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            link.crossOrigin = '';
            document.head.appendChild(link);
        });
    };

    // Resource hints for better performance
    const addResourceHints = () => {
        // DNS Prefetch
        const dnsPrefetchDomains = [
            '//www.google-analytics.com',
            '//www.googletagmanager.com'
        ];

        dnsPrefetchDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = domain;
            document.head.appendChild(link);
        });
    };

    // Optimize animations with will-change
    const optimizeAnimations = () => {
        const animatedElements = document.querySelectorAll('.service-card, .feature-item, .faq-item');
        
        animatedElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.willChange = 'transform, box-shadow';
            });
            
            element.addEventListener('mouseleave', () => {
                setTimeout(() => {
                    element.style.willChange = 'auto';
                }, 300);
            });
        });
    };

    // Web Font optimization
    const optimizeFonts = () => {
        // Font Face Observer for better font loading
        if ('fonts' in document) {
            Promise.all([
                document.fonts.load('400 1em Noto Sans KR'),
                document.fonts.load('700 1em Noto Sans KR')
            ]).then(() => {
                document.documentElement.classList.add('fonts-loaded');
            });
        }
    };

    // Service Worker registration for caching
    const registerServiceWorker = () => {
        if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registered:', registration);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed:', error);
                });
        }
    };

    // Memory management - cleanup event listeners
    const cleanupOnUnload = () => {
        window.addEventListener('beforeunload', () => {
            // Remove heavy event listeners
            document.querySelectorAll('*').forEach(element => {
                element.replaceWith(element.cloneNode(true));
            });
        });
    };

    // Optimize images on the fly
    const optimizeImageLoading = () => {
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(img => {
            img.loading = 'lazy';
            img.decoding = 'async';
        });
    };

    // Performance monitoring
    const monitorPerformance = () => {
        if ('PerformanceObserver' in window) {
            // Monitor Largest Contentful Paint
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                // LCP monitoring not supported
            }

            // Monitor First Input Delay
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        console.log('FID:', entry.processingStart - entry.startTime);
                    }
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                // FID monitoring not supported
            }
        }
    };

    // Initialize all optimizations
    const init = () => {
        preconnectDomains();
        addResourceHints();
        optimizeScroll();
        optimizeAnimations();
        optimizeFonts();
        optimizeImageLoading();
        registerServiceWorker();
        cleanupOnUnload();
        
        // Monitor performance in development
        if (window.location.hostname === 'localhost') {
            monitorPerformance();
        }
    };

    // Run optimizations when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export utility functions
    window.performanceUtils = {
        debounce,
        throttle
    };
})();