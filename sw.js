// Service Worker - 캐싱 및 오프라인 지원

const CACHE_NAME = 'marketgrow-v1.0.0';
const STATIC_CACHE = 'marketgrow-static-v1';
const DYNAMIC_CACHE = 'marketgrow-dynamic-v1';

// 캐시할 정적 리소스
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/login.html',
    '/register.html',
    '/dashboard.html',
    '/services.html',
    '/payment-history.html',
    '/notification-settings.html',
    '/styles.css',
    '/dashboard.css',
    '/services.css',
    '/payment-result.css',
    '/payment-history.css',
    '/notification-settings.css',
    '/script.js',
    '/js/api.js',
    '/js/auth.js',
    '/js/dashboard.js',
    '/js/services.js',
    '/js/order.js',
    '/js/payment.js',
    '/js/payment-success.js',
    '/js/payment-fail.js',
    '/js/payment-history.js',
    '/js/notification-service.js',
    '/js/notification-settings.js',
    '/js/performance.js',
    '/js/utils/optimization.js',
    '/offline.html'
];

// 캐시할 외부 리소스
const EXTERNAL_ASSETS = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap',
    'https://js.tosspayments.com/v1/payment',
    'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js'
];

// Service Worker 설치
self.addEventListener('install', (event) => {
    console.log('Service Worker 설치 중...');

    event.waitUntil(
        Promise.all([
            // 정적 리소스 캐시
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('정적 리소스 캐싱 중...');
                return cache.addAll(STATIC_ASSETS);
            }),
            // 외부 리소스 캐시
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('외부 리소스 캐싱 중...');
                return Promise.allSettled(
                    EXTERNAL_ASSETS.map(url =>
                        cache.add(url).catch(err => console.warn(`캐시 실패: ${url}`, err))
                    )
                );
            })
        ]).then(() => {
            console.log('Service Worker 설치 완료');
            return self.skipWaiting();
        })
    );
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
    console.log('Service Worker 활성화 중...');

    event.waitUntil(
        // 오래된 캐시 정리
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('오래된 캐시 삭제:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker 활성화 완료');
            return self.clients.claim();
        })
    );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // chrome-extension 요청은 무시
    if (url.protocol === 'chrome-extension:') {
        return;
    }

    // 외부 API 요청은 Service Worker가 처리하지 않음
    if (url.hostname !== location.hostname) {
        return;
    }

    // 로컬 API 요청 처리
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleAPIRequest(request));
        return;
    }

    // 정적 리소스 처리
    if (request.method === 'GET') {
        event.respondWith(handleStaticRequest(request));
    }
});

// API 요청 처리 (네트워크 우선, 캐시 폴백)
async function handleAPIRequest(request) {
    const url = new URL(request.url);

    try {
        // 네트워크 요청 시도
        const networkResponse = await fetch(request);

        // 성공적인 GET 요청만 캐시
        if (request.method === 'GET' && networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('네트워크 요청 실패, 캐시 확인 중:', url.pathname);

        // 캐시에서 찾기
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('캐시에서 응답 반환:', url.pathname);
            return cachedResponse;
        }

        // 오프라인 상태를 나타내는 응답
        if (request.method === 'GET') {
            return new Response(JSON.stringify({
                success: false,
                message: '인터넷 연결을 확인해주세요',
                error: 'OFFLINE',
                offline: true
            }), {
                status: 503,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
        }

        throw error;
    }
}

// 정적 리소스 처리 (캐시 우선, 네트워크 폴백)
async function handleStaticRequest(request) {
    const url = new URL(request.url);

    // 캐시에서 먼저 찾기
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        // 백그라운드에서 네트워크 업데이트 (stale-while-revalidate)
        updateCache(request);
        return cachedResponse;
    }

    try {
        // 네트워크에서 가져오기
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // chrome-extension 스킴은 캐시하지 않음
            const url = new URL(request.url);
            if (!url.protocol.startsWith('chrome-extension')) {
                // 동적 캐시에 저장
                const cache = await caches.open(DYNAMIC_CACHE);
                cache.put(request, networkResponse.clone());
            }
        }

        return networkResponse;
    } catch (error) {
        console.log('네트워크 및 캐시 모두 실패:', url.pathname);

        // HTML 페이지에 대해서는 오프라인 페이지 반환
        if (request.headers.get('Accept')?.includes('text/html')) {
            const offlineResponse = await caches.match('/offline.html');
            return offlineResponse || new Response('오프라인 상태입니다.', {
                status: 503,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
        }

        throw error;
    }
}

// 백그라운드 캐시 업데이트
async function updateCache(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            await cache.put(request, networkResponse);
        }
    } catch (error) {
        // 백그라운드 업데이트 실패는 무시
        console.log('백그라운드 캐시 업데이트 실패:', error);
    }
}

// 캐시 정리 (용량 관리)
async function cleanupCache() {
    const dynamicCache = await caches.open(DYNAMIC_CACHE);
    const keys = await dynamicCache.keys();

    // 50개 이상의 동적 캐시가 있으면 오래된 것부터 삭제
    if (keys.length > 50) {
        const keysToDelete = keys.slice(0, keys.length - 50);
        await Promise.all(
            keysToDelete.map(key => dynamicCache.delete(key))
        );
        console.log(`${keysToDelete.length}개의 오래된 캐시 항목을 삭제했습니다.`);
    }
}

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
    console.log('백그라운드 동기화:', event.tag);

    switch (event.tag) {
        case 'cleanup-cache':
            event.waitUntil(cleanupCache());
            break;
        case 'sync-offline-data':
            event.waitUntil(syncOfflineData());
            break;
    }
});

// 오프라인 데이터 동기화
async function syncOfflineData() {
    try {
        // IndexedDB에서 오프라인 동안 저장된 데이터 가져오기
        const offlineData = await getOfflineData();

        if (offlineData.length > 0) {
            console.log(`${offlineData.length}개의 오프라인 데이터 동기화 시작`);

            for (const data of offlineData) {
                try {
                    await fetch(data.url, {
                        method: data.method,
                        headers: data.headers,
                        body: data.body
                    });

                    // 성공하면 오프라인 데이터에서 제거
                    await removeFromOfflineData(data.id);
                } catch (error) {
                    console.log('오프라인 데이터 동기화 실패:', error);
                }
            }

            console.log('오프라인 데이터 동기화 완료');
        }
    } catch (error) {
        console.error('오프라인 데이터 동기화 오류:', error);
    }
}

// IndexedDB 관련 함수들 (간단한 구현)
async function getOfflineData() {
    // IndexedDB에서 오프라인 데이터 가져오기
    return []; // 실제 구현 필요
}

async function removeFromOfflineData(id) {
    // IndexedDB에서 특정 오프라인 데이터 제거
    // 실제 구현 필요
}

// 푸시 알림 처리
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: data.tag || 'general',
        data: data.data || {},
        actions: data.actions || [],
        requireInteraction: data.requireInteraction || false
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'MarketGrow', options)
    );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const action = event.action;
    const data = event.notification.data;

    let url = '/';

    if (action === 'open_dashboard') {
        url = '/dashboard.html';
    } else if (action === 'open_orders') {
        url = '/payment-history.html';
    } else if (data.url) {
        url = data.url;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // 이미 열린 탭이 있으면 포커스
            for (const client of clientList) {
                if (client.url.includes(url) && 'focus' in client) {
                    return client.focus();
                }
            }

            // 새 탭 열기
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

// 메시지 처리 (클라이언트와의 통신)
self.addEventListener('message', (event) => {
    const { type, data } = event.data;

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'GET_CACHE_SIZE':
            getCacheSize().then(size => {
                event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
            });
            break;
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
            });
            break;
    }
});

// 캐시 크기 계산
async function getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const key of keys) {
            const response = await cache.match(key);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
    }

    return totalSize;
}

// 모든 캐시 삭제
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('모든 캐시가 삭제되었습니다.');
}
