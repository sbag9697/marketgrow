// 운영 환경 설정 파일
// ⚠️ 주의: 이 파일에 실제 API 키를 입력한 후 .gitignore에 추가하세요!

const PRODUCTION_CONFIG = {
    // ============================================
    // 1. KG이니시스 결제 설정
    // ============================================
    payment: {
        inicis: {
            // TODO: KG이니시스에서 발급받은 실제 값으로 변경
            mid: 'YOUR_ACTUAL_MID', // 예: SIGNsns001
            signKey: 'YOUR_ACTUAL_SIGN_KEY',
            apiKey: 'YOUR_ACTUAL_API_KEY',
            
            // 운영 URL (테스트 완료 후 변경)
            scriptUrl: 'https://stdpay.inicis.com/stdjs/INIStdPay.js',
            apiUrl: 'https://iniapi.inicis.com/api/v1',
            
            // 웹훅 URL
            webhookUrl: 'https://YOUR_DOMAIN/api/payments/inicis/webhook'
        }
    },

    // ============================================
    // 2. 소셜 로그인 API 키
    // ============================================
    social: {
        // Google OAuth 2.0
        google: {
            // ✅ Google 설정 완료
            // https://console.cloud.google.com/
            clientId: '1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com',
            clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET', // Backend에서 필요
            redirectUri: 'https://YOUR_DOMAIN/auth/google/callback'
        },
        
        // Kakao 로그인
        kakao: {
            // ✅ Kakao 설정 완료
            // https://developers.kakao.com/
            appKey: '95a2c17a5ec078dd1762950680e53267',
            appSecret: 'YOUR_KAKAO_APP_SECRET', // REST API 키 (필요시)
            redirectUri: 'https://YOUR_DOMAIN/auth/kakao/callback'
        },
        
        // Naver 로그인
        naver: {
            // ✅ Naver 설정 완료
            // https://developers.naver.com/
            clientId: 'Cirw8aXNIq8wF518fNMZ',
            clientSecret: 'x1lNqh6xcJ',
            redirectUri: 'https://YOUR_DOMAIN/auth/naver/callback'
        }
    },

    // ============================================
    // 3. SMS 인증 (Aligo)
    // ============================================
    sms: {
        aligo: {
            // Aligo에서 발급받은 실제 값
            // https://smartsms.aligo.in/
            apiKey: 'YOUR_ALIGO_API_KEY',
            userId: 'YOUR_ALIGO_USER_ID',
            sender: '010-5772-8658', // 발신번호 (사전 등록 필요)
            
            // API 엔드포인트
            sendUrl: 'https://apis.aligo.in/send/',
            checkUrl: 'https://apis.aligo.in/check/'
        }
    },

    // ============================================
    // 4. 이메일 서비스
    // ============================================
    email: {
        // SendGrid 또는 AWS SES 사용
        sendgrid: {
            apiKey: 'YOUR_SENDGRID_API_KEY',
            fromEmail: 'marketgrow.kr@gmail.com',
            fromName: 'SNS그로우'
        },
        
        // 또는 AWS SES
        aws: {
            accessKeyId: 'YOUR_AWS_ACCESS_KEY',
            secretAccessKey: 'YOUR_AWS_SECRET_KEY',
            region: 'ap-northeast-2'
        }
    },

    // ============================================
    // 5. 서버 & 데이터베이스
    // ============================================
    server: {
        // API 서버
        apiUrl: 'https://marketgrow-production-c586.up.railway.app/api',
        wsUrl: 'wss://marketgrow-production-c586.up.railway.app',
        
        // 실제 도메인 (구매 후 설정)
        domain: 'https://marketgrow.kr',
        
        // CDN (선택사항)
        cdnUrl: 'https://cdn.marketgrow.kr'
    },

    // ============================================
    // 6. 보안 설정
    // ============================================
    security: {
        // JWT 시크릿 (백엔드와 동일하게)
        jwtSecret: 'YOUR_SUPER_SECRET_JWT_KEY_CHANGE_THIS',
        
        // 암호화 키
        encryptionKey: 'YOUR_ENCRYPTION_KEY',
        
        // CORS 허용 도메인
        allowedOrigins: [
            'https://marketgrow.kr',
            'https://www.marketgrow.kr'
        ]
    },

    // ============================================
    // 7. 분석 도구
    // ============================================
    analytics: {
        // Google Analytics
        googleAnalytics: {
            trackingId: 'G-XXXXXXXXXX'
        },
        
        // Facebook Pixel
        facebookPixel: {
            pixelId: 'YOUR_FACEBOOK_PIXEL_ID'
        },
        
        // Naver Analytics
        naverAnalytics: {
            accountId: 'YOUR_NAVER_ANALYTICS_ID'
        }
    },

    // ============================================
    // 8. 사업자 정보
    // ============================================
    business: {
        name: 'SNS그로우',
        representative: '박시현',
        registrationNumber: '154-38-01411',
        phone: '010-5772-8658',
        email: 'marketgrow.kr@gmail.com',
        address: '', // 필요시 추가
    }
};

// 환경별 설정 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PRODUCTION_CONFIG;
} else {
    window.PRODUCTION_CONFIG = PRODUCTION_CONFIG;
}

// ============================================
// 설정 검증 함수
// ============================================
function validateConfig() {
    const errors = [];
    
    // 필수 설정 확인
    if (PRODUCTION_CONFIG.payment.inicis.mid === 'YOUR_ACTUAL_MID') {
        errors.push('KG이니시스 MID가 설정되지 않았습니다');
    }
    
    if (PRODUCTION_CONFIG.social.google.clientId.includes('YOUR_')) {
        errors.push('Google Client ID가 설정되지 않았습니다');
    }
    
    if (PRODUCTION_CONFIG.social.kakao.appKey === 'YOUR_KAKAO_APP_KEY') {
        errors.push('Kakao App Key가 설정되지 않았습니다');
    }
    
    if (PRODUCTION_CONFIG.sms.aligo.apiKey === 'YOUR_ALIGO_API_KEY') {
        errors.push('Aligo API Key가 설정되지 않았습니다');
    }
    
    if (errors.length > 0) {
        console.warn('⚠️ 운영 설정 경고:');
        errors.forEach(error => console.warn(`  - ${error}`));
        return false;
    }
    
    console.log('✅ 모든 운영 설정이 완료되었습니다');
    return true;
}

// 페이지 로드 시 설정 검증
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', validateConfig);
}