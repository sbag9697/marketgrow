// 알림 서비스 (이메일/SMS)
class NotificationService {
    constructor() {
        this.emailjsConfig = {
            serviceId: 'service_marketgrow',
            templateId: {
                orderConfirmation: 'template_order_confirm',
                paymentSuccess: 'template_payment_success',
                paymentFailed: 'template_payment_failed',
                orderUpdate: 'template_order_update',
                welcome: 'template_welcome'
            },
            publicKey: 'YOUR_EMAILJS_PUBLIC_KEY'
        };

        this.smsConfig = {
            apiKey: 'YOUR_SMS_API_KEY',
            senderId: 'MarketGrow',
            endpoint: 'https://api.coolsms.co.kr/sms/4/send'
        };

        this.init();
    }

    // EmailJS 초기화
    async init() {
        try {
            // EmailJS 라이브러리 로드
            if (typeof emailjs === 'undefined') {
                await this.loadEmailJS();
            }

            // EmailJS 초기화
            emailjs.init(this.emailjsConfig.publicKey);

            console.log('NotificationService 초기화 완료');
        } catch (error) {
            console.error('NotificationService 초기화 실패:', error);
        }
    }

    // EmailJS 라이브러리 동적 로드
    loadEmailJS() {
        return new Promise((resolve, reject) => {
            if (document.querySelector('script[src*="emailjs"]')) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // 이메일 전송
    async sendEmail(templateType, templateParams) {
        try {
            const templateId = this.emailjsConfig.templateId[templateType];
            if (!templateId) {
                throw new Error(`알 수 없는 템플릿 타입: ${templateType}`);
            }

            const result = await emailjs.send(
                this.emailjsConfig.serviceId,
                templateId,
                templateParams
            );

            console.log('이메일 전송 성공:', result);
            return {
                success: true,
                messageId: result.text,
                message: '이메일이 성공적으로 전송되었습니다.'
            };
        } catch (error) {
            console.error('이메일 전송 실패:', error);
            return {
                success: false,
                error: error.message,
                message: '이메일 전송에 실패했습니다.'
            };
        }
    }

    // SMS 전송
    async sendSMS(phoneNumber, message) {
        try {
            const response = await fetch(this.smsConfig.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.smsConfig.apiKey}`
                },
                body: JSON.stringify({
                    to: phoneNumber,
                    from: this.smsConfig.senderId,
                    text: message
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('SMS 전송 성공:', result);
                return {
                    success: true,
                    messageId: result.messageId,
                    message: 'SMS가 성공적으로 전송되었습니다.'
                };
            } else {
                throw new Error(result.message || 'SMS 전송 실패');
            }
        } catch (error) {
            console.error('SMS 전송 실패:', error);
            return {
                success: false,
                error: error.message,
                message: 'SMS 전송에 실패했습니다.'
            };
        }
    }

    // 회원가입 환영 알림
    async sendWelcomeNotification(userInfo) {
        const notifications = [];

        // 이메일 전송
        if (userInfo.email && userInfo.emailNotifications) {
            const emailParams = {
                to_name: userInfo.name,
                to_email: userInfo.email,
                service_name: 'MarketGrow',
                login_url: `${window.location.origin}/login.html`,
                dashboard_url: `${window.location.origin}/dashboard.html`
            };

            const emailResult = await this.sendEmail('welcome', emailParams);
            notifications.push({
                type: 'email',
                ...emailResult
            });
        }

        // SMS 전송
        if (userInfo.phone && userInfo.smsNotifications) {
            const smsMessage = `${userInfo.name}님, MarketGrow에 가입해주셔서 감사합니다! 지금 바로 SNS 마케팅 서비스를 시작해보세요. ${window.location.origin}`;

            const smsResult = await this.sendSMS(userInfo.phone, smsMessage);
            notifications.push({
                type: 'sms',
                ...smsResult
            });
        }

        return notifications;
    }

    // 주문 확인 알림
    async sendOrderConfirmation(orderInfo, userInfo) {
        const notifications = [];

        // 이메일 전송
        if (userInfo.email && userInfo.emailNotifications) {
            const emailParams = {
                to_name: userInfo.name,
                to_email: userInfo.email,
                order_number: orderInfo.orderNumber,
                service_name: orderInfo.serviceName,
                quantity: orderInfo.quantity?.toLocaleString(),
                target_url: orderInfo.targetUrl,
                total_amount: PaymentUtils.formatAmount(orderInfo.totalAmount),
                order_date: new Date(orderInfo.createdAt).toLocaleString('ko-KR'),
                dashboard_url: `${window.location.origin}/dashboard.html`
            };

            const emailResult = await this.sendEmail('orderConfirmation', emailParams);
            notifications.push({
                type: 'email',
                ...emailResult
            });
        }

        // SMS 전송
        if (userInfo.phone && userInfo.smsNotifications) {
            const smsMessage = `[MarketGrow] 주문이 접수되었습니다. 주문번호: ${orderInfo.orderNumber} / 서비스: ${orderInfo.serviceName} / 금액: ${PaymentUtils.formatAmount(orderInfo.totalAmount)}`;

            const smsResult = await this.sendSMS(userInfo.phone, smsMessage);
            notifications.push({
                type: 'sms',
                ...smsResult
            });
        }

        return notifications;
    }

    // 결제 성공 알림
    async sendPaymentSuccessNotification(paymentInfo, orderInfo, userInfo) {
        const notifications = [];

        // 이메일 전송
        if (userInfo.email && userInfo.emailNotifications) {
            const emailParams = {
                to_name: userInfo.name,
                to_email: userInfo.email,
                payment_id: paymentInfo.paymentId,
                order_number: orderInfo.orderNumber,
                service_name: orderInfo.serviceName,
                payment_amount: PaymentUtils.formatAmount(paymentInfo.amount),
                payment_method: PaymentUtils.getPaymentMethodName(paymentInfo.paymentMethod),
                payment_date: new Date(paymentInfo.createdAt).toLocaleString('ko-KR'),
                receipt_url: `${window.location.origin}/payment-success.html?paymentKey=${paymentInfo.paymentKey}&orderId=${paymentInfo.orderId}&amount=${paymentInfo.amount}`,
                dashboard_url: `${window.location.origin}/dashboard.html`
            };

            const emailResult = await this.sendEmail('paymentSuccess', emailParams);
            notifications.push({
                type: 'email',
                ...emailResult
            });
        }

        // SMS 전송
        if (userInfo.phone && userInfo.smsNotifications) {
            const smsMessage = `[MarketGrow] 결제가 완료되었습니다. 결제금액: ${PaymentUtils.formatAmount(paymentInfo.amount)} / 결제번호: ${paymentInfo.paymentId} / 서비스가 곧 시작됩니다.`;

            const smsResult = await this.sendSMS(userInfo.phone, smsMessage);
            notifications.push({
                type: 'sms',
                ...smsResult
            });
        }

        return notifications;
    }

    // 결제 실패 알림
    async sendPaymentFailedNotification(paymentInfo, orderInfo, userInfo) {
        const notifications = [];

        // 이메일 전송 (실패 시에는 이메일만)
        if (userInfo.email && userInfo.emailNotifications) {
            const emailParams = {
                to_name: userInfo.name,
                to_email: userInfo.email,
                order_number: orderInfo.orderNumber,
                service_name: orderInfo.serviceName,
                payment_amount: PaymentUtils.formatAmount(paymentInfo.amount),
                failure_reason: paymentInfo.failureReason || '알 수 없는 오류',
                retry_url: `${window.location.origin}/payment.html?orderId=${orderInfo.orderNumber}`,
                support_url: `${window.location.origin}/support.html`
            };

            const emailResult = await this.sendEmail('paymentFailed', emailParams);
            notifications.push({
                type: 'email',
                ...emailResult
            });
        }

        return notifications;
    }

    // 주문 상태 업데이트 알림
    async sendOrderUpdateNotification(orderInfo, updateInfo, userInfo) {
        const notifications = [];

        // 이메일 전송
        if (userInfo.email && userInfo.emailNotifications) {
            const emailParams = {
                to_name: userInfo.name,
                to_email: userInfo.email,
                order_number: orderInfo.orderNumber,
                service_name: orderInfo.serviceName,
                old_status: updateInfo.oldStatus,
                new_status: updateInfo.newStatus,
                update_message: updateInfo.message,
                update_date: new Date().toLocaleString('ko-KR'),
                dashboard_url: `${window.location.origin}/dashboard.html`
            };

            const emailResult = await this.sendEmail('orderUpdate', emailParams);
            notifications.push({
                type: 'email',
                ...emailResult
            });
        }

        // SMS 전송 (중요한 상태 변경에만)
        if (userInfo.phone && userInfo.smsNotifications && this.isImportantStatusChange(updateInfo.newStatus)) {
            const statusText = this.getStatusText(updateInfo.newStatus);
            const smsMessage = `[MarketGrow] 주문 상태가 변경되었습니다. 주문번호: ${orderInfo.orderNumber} / 상태: ${statusText} / ${updateInfo.message}`;

            const smsResult = await this.sendSMS(userInfo.phone, smsMessage);
            notifications.push({
                type: 'sms',
                ...smsResult
            });
        }

        return notifications;
    }

    // 중요한 상태 변경인지 확인
    isImportantStatusChange(status) {
        const importantStatuses = ['completed', 'cancelled', 'refunded', 'failed'];
        return importantStatuses.includes(status);
    }

    // 상태 텍스트 반환
    getStatusText(status) {
        const statusTexts = {
            pending: '대기중',
            processing: '처리중',
            completed: '완료',
            cancelled: '취소됨',
            refunded: '환불됨',
            failed: '실패'
        };
        return statusTexts[status] || '알 수 없음';
    }

    // 알림 설정 업데이트
    async updateNotificationSettings(userId, settings) {
        try {
            const response = await api.updateNotificationSettings(userId, settings);
            if (response.success) {
                // 로컬 스토리지에 설정 저장
                localStorage.setItem('notificationSettings', JSON.stringify(settings));
                return {
                    success: true,
                    message: '알림 설정이 업데이트되었습니다.'
                };
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('알림 설정 업데이트 실패:', error);
            return {
                success: false,
                error: error.message,
                message: '알림 설정 업데이트에 실패했습니다.'
            };
        }
    }

    // 알림 설정 가져오기
    getNotificationSettings() {
        const defaultSettings = {
            emailNotifications: true,
            smsNotifications: false,
            orderUpdates: true,
            paymentNotifications: true,
            marketingNotifications: false
        };

        try {
            const saved = localStorage.getItem('notificationSettings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (error) {
            console.error('알림 설정 로드 실패:', error);
            return defaultSettings;
        }
    }

    // 테스트 알림 전송
    async sendTestNotification(type, userInfo) {
        try {
            let result;

            switch (type) {
                case 'email':
                    result = await this.sendEmail('welcome', {
                        to_name: userInfo.name,
                        to_email: userInfo.email,
                        service_name: 'MarketGrow (테스트)',
                        login_url: `${window.location.origin}/login.html`,
                        dashboard_url: `${window.location.origin}/dashboard.html`
                    });
                    break;

                case 'sms':
                    result = await this.sendSMS(
                        userInfo.phone,
                        '[MarketGrow] 테스트 메시지입니다. 알림 설정이 정상적으로 작동하고 있습니다.'
                    );
                    break;

                default:
                    throw new Error('지원하지 않는 알림 타입입니다.');
            }

            return result;
        } catch (error) {
            console.error('테스트 알림 전송 실패:', error);
            return {
                success: false,
                error: error.message,
                message: '테스트 알림 전송에 실패했습니다.'
            };
        }
    }
}

// 전역 인스턴스 생성
const notificationService = new NotificationService();

// 다른 스크립트에서 사용할 수 있도록 전역 객체에 등록
window.NotificationService = notificationService;
