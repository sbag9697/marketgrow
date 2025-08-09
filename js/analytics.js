// Google Analytics 4 초기화
const initGoogleAnalytics = () => {
    // GA4 측정 ID
    const GA_MEASUREMENT_ID = 'G-RYV6141QY4';
    
    // Google Analytics 스크립트 동적 로드
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script1);
    
    // gtag 설정
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
        page_path: window.location.pathname,
        cookie_flags: 'SameSite=None;Secure'
    });
};

// 이벤트 추적 함수들
const trackEvent = (eventName, parameters = {}) => {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
};

// 페이지뷰 추적
const trackPageView = (pagePath, pageTitle) => {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            page_path: pagePath,
            page_title: pageTitle
        });
    }
};

// 전환 추적
const trackConversion = (conversionType, value, currency = 'KRW') => {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'conversion', {
            'send_to': `${GA_MEASUREMENT_ID}/${conversionType}`,
            'value': value,
            'currency': currency
        });
    }
};

// 주요 이벤트 추적 함수들
const analyticsEvents = {
    // 회원가입 추적
    trackSignUp: (method) => {
        trackEvent('sign_up', {
            method: method
        });
    },
    
    // 로그인 추적
    trackLogin: (method) => {
        trackEvent('login', {
            method: method
        });
    },
    
    // 상품 조회 추적
    trackViewItem: (itemId, itemName, category, price) => {
        trackEvent('view_item', {
            currency: 'KRW',
            value: price,
            items: [{
                item_id: itemId,
                item_name: itemName,
                item_category: category,
                price: price,
                quantity: 1
            }]
        });
    },
    
    // 장바구니 추가 추적
    trackAddToCart: (itemId, itemName, category, price, quantity) => {
        trackEvent('add_to_cart', {
            currency: 'KRW',
            value: price * quantity,
            items: [{
                item_id: itemId,
                item_name: itemName,
                item_category: category,
                price: price,
                quantity: quantity
            }]
        });
    },
    
    // 구매 시작 추적
    trackBeginCheckout: (items, totalValue) => {
        trackEvent('begin_checkout', {
            currency: 'KRW',
            value: totalValue,
            items: items
        });
    },
    
    // 구매 완료 추적
    trackPurchase: (transactionId, items, totalValue, tax = 0, shipping = 0) => {
        trackEvent('purchase', {
            transaction_id: transactionId,
            value: totalValue,
            tax: tax,
            shipping: shipping,
            currency: 'KRW',
            items: items
        });
    },
    
    // 검색 추적
    trackSearch: (searchTerm) => {
        trackEvent('search', {
            search_term: searchTerm
        });
    },
    
    // 공유 추적
    trackShare: (method, contentType, itemId) => {
        trackEvent('share', {
            method: method,
            content_type: contentType,
            item_id: itemId
        });
    },
    
    // 문의 추적
    trackContact: (contactType) => {
        trackEvent('contact', {
            contact_type: contactType
        });
    }
};

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGoogleAnalytics);
} else {
    initGoogleAnalytics();
}

// 전역 객체로 export
window.analytics = analyticsEvents;
window.trackEvent = trackEvent;
window.trackPageView = trackPageView;
window.trackConversion = trackConversion;