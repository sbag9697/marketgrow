// Lazy Loading Implementation
(function() {
    'use strict';

    // Lazy loading for images
    const lazyLoadImages = () => {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        images.forEach(img => imageObserver.observe(img));
    };

    // Lazy loading for iframes
    const lazyLoadIframes = () => {
        const iframes = document.querySelectorAll('iframe[data-src]');
        const iframeObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const iframe = entry.target;
                    iframe.src = iframe.dataset.src;
                    iframe.removeAttribute('data-src');
                    observer.unobserve(iframe);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        iframes.forEach(iframe => iframeObserver.observe(iframe));
    };

    // Preload critical images
    const preloadCriticalImages = () => {
        const criticalImages = document.querySelectorAll('img[data-priority="high"]');
        criticalImages.forEach(img => {
            if (img.dataset.src) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = img.dataset.src;
                document.head.appendChild(link);
            }
        });
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            preloadCriticalImages();
            lazyLoadImages();
            lazyLoadIframes();
        });
    } else {
        preloadCriticalImages();
        lazyLoadImages();
        lazyLoadIframes();
    }

    // Re-run on dynamic content load
    window.lazyLoadNewContent = () => {
        lazyLoadImages();
        lazyLoadIframes();
    };
})();