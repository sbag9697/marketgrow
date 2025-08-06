// 패키지 관리 시스템
class PackageManager {
    constructor() {
        this.packages = {
            starter: {
                name: '스타터 패키지',
                services: [
                    { type: 'instagram-followers', quantity: 1000, name: '인스타그램 팔로워 1,000명' },
                    { type: 'instagram-likes', quantity: 2000, name: '인스타그램 좋아요 2,000개' },
                    { type: 'youtube-subscribers', quantity: 500, name: '유튜브 구독자 500명' },
                    { type: 'tiktok-followers', quantity: 1500, name: '틱톡 팔로워 1,500명' }
                ],
                originalPrice: 189000,
                packagePrice: 129000,
                discount: 32
            },
            pro: {
                name: '프로 패키지',
                services: [
                    { type: 'instagram-followers-kr', quantity: 5000, name: '인스타그램 팔로워 5,000명 (한국)' },
                    { type: 'instagram-likes', quantity: 10000, name: '인스타그램 좋아요 10,000개' },
                    { type: 'youtube-subscribers', quantity: 2000, name: '유튜브 구독자 2,000명' },
                    { type: 'youtube-views', quantity: 50000, name: '유튜브 조회수 50,000회' },
                    { type: 'tiktok-followers', quantity: 7000, name: '틱톡 팔로워 7,000명' },
                    { type: 'instagram-auto-likes', quantity: 1, name: '30일 자동 좋아요 서비스' }
                ],
                originalPrice: 798000,
                packagePrice: 389000,
                discount: 51
            },
            enterprise: {
                name: '엔터프라이즈 패키지',
                services: [
                    { type: 'instagram-followers-premium', quantity: 20000, name: '인스타그램 팔로워 20,000명 (프리미엄)' },
                    { type: 'youtube-subscribers', quantity: 10000, name: '유튜브 구독자 10,000명' },
                    { type: 'facebook-page-likes', quantity: 15000, name: '페이스북 페이지 좋아요 15,000개' },
                    { type: 'linkedin-followers', quantity: 5000, name: '링크드인 팔로워 5,000명' },
                    { type: 'twitter-followers', quantity: 10000, name: '트위터 팔로워 10,000명' }
                ],
                originalPrice: 2890000,
                packagePrice: 1299000,
                discount: 55
            }
        };

        this.selectedServices = new Map();
        this.init();
    }

    init() {
        // 맞춤형 패키지 이벤트 리스너
        document.querySelectorAll('.service-option input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.updateCustomPackage(e.target);
            });
        });
    }

    // 패키지 주문
    orderPackage(packageType) {
        if (!authManager.isAuthenticated()) {
            alert('로그인이 필요합니다.');
            showLoginModal();
            return;
        }

        const packageData = this.packages[packageType];
        if (!packageData) {
            alert('패키지를 찾을 수 없습니다.');
            return;
        }

        // 패키지 주문 확인
        const confirmMessage = `
            ${packageData.name} 주문을 진행하시겠습니까?
            
            포함 서비스: ${packageData.services.length}개
            할인율: ${packageData.discount}%
            결제 금액: ₩${packageData.packagePrice.toLocaleString()}
            
            ※ 모든 서비스가 동시에 시작됩니다.
        `;

        if (!confirm(confirmMessage)) return;

        // 주문 데이터 생성
        const orderData = {
            id: 'PKG_' + Date.now(),
            userId: authManager.getCurrentUser().id,
            packageType: packageType,
            packageName: packageData.name,
            services: packageData.services,
            originalPrice: packageData.originalPrice,
            totalPrice: packageData.packagePrice,
            discount: packageData.discount,
            paymentMethod: 'card', // 기본값
            status: 'pending',
            createdAt: new Date().toISOString(),
            completedAt: null,
            progress: 0,
            isPackage: true
        };

        // 결제 처리
        this.processPackagePayment(orderData);
    }

    // 맞춤형 패키지 업데이트
    updateCustomPackage(checkbox) {
        const service = checkbox.dataset.service;
        const price = parseInt(checkbox.dataset.price);
        const serviceName = checkbox.parentElement.querySelector('span').textContent;

        if (checkbox.checked) {
            this.selectedServices.set(service, { price, name: serviceName });
        } else {
            this.selectedServices.delete(service);
        }

        this.updateCustomPackageUI();
    }

    // 맞춤형 패키지 UI 업데이트
    updateCustomPackageUI() {
        const selectedServicesContainer = document.getElementById('selectedServices');
        const subtotalElement = document.getElementById('subtotal');
        const discountRateElement = document.getElementById('discountRate');
        const discountAmountElement = document.getElementById('discountAmount');
        const totalElement = document.getElementById('customTotal');
        const orderButton = document.querySelector('.custom-package-btn');

        // 선택된 서비스 표시
        if (this.selectedServices.size === 0) {
            selectedServicesContainer.innerHTML = '<p class="empty-state">서비스를 선택해주세요</p>';
            subtotalElement.textContent = '₩0';
            discountRateElement.textContent = '0';
            discountAmountElement.textContent = '-₩0';
            totalElement.textContent = '₩0';
            orderButton.disabled = true;
            return;
        }

        // 선택된 서비스 목록 생성
        let servicesHTML = '';
        let subtotal = 0;

        this.selectedServices.forEach((serviceData, serviceType) => {
            subtotal += serviceData.price;
            servicesHTML += `
                <div class="selected-service">
                    <span class="service-name">${serviceData.name}</span>
                    <span class="service-price">₩${serviceData.price.toLocaleString()}</span>
                </div>
            `;
        });

        selectedServicesContainer.innerHTML = servicesHTML;

        // 할인 계산
        const serviceCount = this.selectedServices.size;
        let discountRate = 0;

        if (serviceCount >= 10) discountRate = 40;
        else if (serviceCount >= 5) discountRate = 30;
        else if (serviceCount >= 3) discountRate = 20;
        else if (serviceCount >= 2) discountRate = 10;

        const discountAmount = Math.round(subtotal * (discountRate / 100));
        const total = subtotal - discountAmount;

        // UI 업데이트
        subtotalElement.textContent = `₩${subtotal.toLocaleString()}`;
        discountRateElement.textContent = discountRate;
        discountAmountElement.textContent = `-₩${discountAmount.toLocaleString()}`;
        totalElement.textContent = `₩${total.toLocaleString()}`;
        orderButton.disabled = false;
    }

    // 맞춤형 패키지 주문
    orderCustomPackage() {
        if (!authManager.isAuthenticated()) {
            alert('로그인이 필요합니다.');
            showLoginModal();
            return;
        }

        if (this.selectedServices.size === 0) {
            alert('서비스를 선택해주세요.');
            return;
        }

        const subtotal = Array.from(this.selectedServices.values()).reduce((sum, service) => sum + service.price, 0);
        const serviceCount = this.selectedServices.size;
        
        let discountRate = 0;
        if (serviceCount >= 10) discountRate = 40;
        else if (serviceCount >= 5) discountRate = 30;
        else if (serviceCount >= 3) discountRate = 20;
        else if (serviceCount >= 2) discountRate = 10;

        const discountAmount = Math.round(subtotal * (discountRate / 100));
        const total = subtotal - discountAmount;

        // 주문 확인
        const confirmMessage = `
            맞춤형 패키지 주문을 진행하시겠습니까?
            
            선택한 서비스: ${serviceCount}개
            할인율: ${discountRate}%
            할인 금액: ₩${discountAmount.toLocaleString()}
            최종 결제 금액: ₩${total.toLocaleString()}
        `;

        if (!confirm(confirmMessage)) return;

        // 선택된 서비스들을 배열로 변환
        const services = Array.from(this.selectedServices.entries()).map(([type, data]) => ({
            type: type,
            name: data.name,
            price: data.price,
            quantity: 1000 // 기본 수량
        }));

        // 주문 데이터 생성
        const orderData = {
            id: 'CUSTOM_' + Date.now(),
            userId: authManager.getCurrentUser().id,
            packageType: 'custom',
            packageName: '맞춤형 패키지',
            services: services,
            originalPrice: subtotal,
            totalPrice: total,
            discount: discountRate,
            paymentMethod: 'card',
            status: 'pending',
            createdAt: new Date().toISOString(),
            completedAt: null,
            progress: 0,
            isPackage: true,
            isCustom: true
        };

        // 결제 처리
        this.processPackagePayment(orderData);
    }

    // 패키지 결제 처리
    processPackagePayment(orderData) {
        // 결제 방법 선택
        const paymentMethod = prompt(
            '결제 방법을 선택하세요:\n\n1. 신용카드 (card)\n2. 계좌이체 (bank)\n3. 카카오페이 (kakaopay)\n4. PayPal (paypal)\n\n입력:',
            'card'
        );

        if (!paymentMethod) return;

        orderData.paymentMethod = paymentMethod;

        // 결제 처리 시뮬레이션
        const isSuccess = Math.random() > 0.05; // 95% 성공률

        if (isSuccess) {
            // 결제 성공
            orderData.paymentId = 'PAY_' + Date.now();
            orderData.paidAt = new Date().toISOString();

            // 주문 저장
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            orders.push(orderData);
            localStorage.setItem('orders', JSON.stringify(orders));

            // 사용자 주문 목록 업데이트
            const user = authManager.getCurrentUser();
            user.orders.push(orderData.id);

            // 포인트 적립 (패키지는 2% 적립)
            const points = Math.floor(orderData.totalPrice * 0.02);
            user.points += points;
            localStorage.setItem('currentUser', JSON.stringify(user));

            // 성공 메시지
            alert(`
                🎉 패키지 주문이 완료되었습니다!
                
                주문번호: ${orderData.id}
                패키지: ${orderData.packageName}
                서비스 수: ${orderData.services.length}개
                할인율: ${orderData.discount}%
                결제금액: ₩${orderData.totalPrice.toLocaleString()}
                적립포인트: ${points}P
                
                📊 모든 서비스가 순차적으로 시작됩니다.
                📱 진행상황은 대시보드에서 확인하세요.
            `);

            // 패키지 진행 시뮬레이션 시작
            this.startPackageProgress(orderData.id);

            // 맞춤형 패키지인 경우 선택 초기화
            if (orderData.isCustom) {
                this.resetCustomPackage();
            }

        } else {
            // 결제 실패
            alert('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    }

    // 패키지 진행 시뮬레이션
    startPackageProgress(orderId) {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        order.status = 'processing';

        // 각 서비스를 순차적으로 진행
        let currentServiceIndex = 0;
        const totalServices = order.services.length;

        const progressInterval = setInterval(() => {
            // 현재 서비스 진행률 증가
            const serviceProgress = Math.random() * 15 + 5; // 5-20% 씩 증가
            const totalProgress = (currentServiceIndex / totalServices) * 100 + 
                                (serviceProgress / totalServices);

            order.progress = Math.min(totalProgress, 100);

            // 서비스 완료 체크
            if (serviceProgress >= 100 && currentServiceIndex < totalServices - 1) {
                currentServiceIndex++;
            }

            // 전체 완료 체크
            if (order.progress >= 100) {
                order.progress = 100;
                order.status = 'completed';
                order.completedAt = new Date().toISOString();
                clearInterval(progressInterval);

                // 완료 알림
                if (authManager.getCurrentUser()?.id === order.userId) {
                    setTimeout(() => {
                        alert(`패키지 주문 ${orderId}이 모두 완료되었습니다! 🎉`);
                    }, 1000);
                }
            }

            // 저장
            const updatedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            const orderIndex = updatedOrders.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                updatedOrders[orderIndex] = order;
                localStorage.setItem('orders', JSON.stringify(updatedOrders));
            }

        }, 3000); // 3초마다 진행률 업데이트
    }

    // 맞춤형 패키지 초기화
    resetCustomPackage() {
        this.selectedServices.clear();
        
        // 체크박스 초기화
        document.querySelectorAll('.service-option input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        // UI 초기화
        this.updateCustomPackageUI();
    }
}

// 전역 함수들
function orderPackage(packageType) {
    packageManager.orderPackage(packageType);
}

function orderCustomPackage() {
    packageManager.orderCustomPackage();
}

// 패키지 매니저 인스턴스 생성
const packageManager = new PackageManager();

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('패키지 페이지 로드 완료');
});