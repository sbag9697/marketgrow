// 로깅 유틸리티
// 프로덕션 환경에서는 콘솔 로그를 비활성화합니다

(function () {
    // 프로덕션 환경 체크
    const isProduction = window.location.hostname !== 'localhost' &&
                         window.location.hostname !== '127.0.0.1' &&
                         !window.location.hostname.includes('test') &&
                         !window.location.hostname.includes('staging');

    // 원본 console 메서드 저장
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        debug: console.debug,
        info: console.info
    };

    // Logger 클래스
    class Logger {
        constructor() {
            this.isEnabled = !isProduction;
        }

        log(...args) {
            if (this.isEnabled) {
                originalConsole.log(...args);
            }
        }

        error(...args) {
            // 에러는 프로덕션에서도 기록
            originalConsole.error(...args);
        }

        warn(...args) {
            if (this.isEnabled) {
                originalConsole.warn(...args);
            }
        }

        debug(...args) {
            if (this.isEnabled) {
                originalConsole.debug(...args);
            }
        }

        info(...args) {
            if (this.isEnabled) {
                originalConsole.info(...args);
            }
        }

        // 로깅 활성화/비활성화
        enable() {
            this.isEnabled = true;
        }

        disable() {
            this.isEnabled = false;
        }
    }

    // 전역 logger 인스턴스 생성
    window.logger = new Logger();

    // 프로덕션 환경에서 console 메서드 오버라이드
    if (isProduction) {
        console.log = function () {};
        console.debug = function () {};
        console.info = function () {};
        console.warn = function () {};
        // console.error는 유지 (중요한 에러 추적을 위해)
    }

    // 개발자 도구에서 로깅을 일시적으로 활성화할 수 있는 메서드
    window.enableLogging = function () {
        window.logger.enable();
        console.log = originalConsole.log;
        console.debug = originalConsole.debug;
        console.info = originalConsole.info;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
        console.log('Logging enabled!');
    };

    window.disableLogging = function () {
        window.logger.disable();
        if (isProduction) {
            console.log = function () {};
            console.debug = function () {};
            console.info = function () {};
            console.warn = function () {};
        }
    };
})();
