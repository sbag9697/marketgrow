// Security Module - Input Validation and XSS Prevention
(function () {
    'use strict';

    // XSS Protection - HTML entity encoding
    const escapeHtml = (text) => {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            '\'': '&#x27;',
            '/': '&#x2F;'
        };
        return String(text).replace(/[&<>"'/]/g, (s) => map[s]);
    };

    // Remove dangerous HTML tags and attributes
    const sanitizeHtml = (html) => {
        // Create a temporary div to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Remove script tags
        const scripts = temp.querySelectorAll('script');
        scripts.forEach(script => script.remove());

        // Remove event handlers
        const allElements = temp.querySelectorAll('*');
        allElements.forEach(element => {
            // Remove all event attributes
            for (const attr of element.attributes) {
                if (attr.name.startsWith('on')) {
                    element.removeAttribute(attr.name);
                }
            }
            // Remove javascript: protocols
            if (element.href && element.href.startsWith('javascript:')) {
                element.removeAttribute('href');
            }
            if (element.src && element.src.startsWith('javascript:')) {
                element.removeAttribute('src');
            }
        });

        // Remove dangerous tags
        const dangerousTags = ['iframe', 'object', 'embed', 'applet', 'meta', 'link', 'style'];
        dangerousTags.forEach(tag => {
            const elements = temp.querySelectorAll(tag);
            elements.forEach(el => el.remove());
        });

        return temp.innerHTML;
    };

    // Input Validation Functions
    const validators = {
        // Email validation
        email: (email) => {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(email) && email.length <= 254;
        },

        // Password strength check
        password: (password) => {
            if (password.length < 8) return { valid: false, message: '비밀번호는 최소 8자 이상이어야 합니다.' };
            if (!/[A-Z]/.test(password)) return { valid: false, message: '비밀번호에 대문자가 포함되어야 합니다.' };
            if (!/[a-z]/.test(password)) return { valid: false, message: '비밀번호에 소문자가 포함되어야 합니다.' };
            if (!/[0-9]/.test(password)) return { valid: false, message: '비밀번호에 숫자가 포함되어야 합니다.' };
            if (!/[!@#$%^&*]/.test(password)) return { valid: false, message: '비밀번호에 특수문자가 포함되어야 합니다.' };
            return { valid: true, message: '강력한 비밀번호입니다.' };
        },

        // URL validation
        url: (url) => {
            try {
                const urlObj = new URL(url);
                return ['http:', 'https:'].includes(urlObj.protocol);
            } catch {
                return false;
            }
        },

        // Phone number validation (Korean)
        phone: (phone) => {
            const phoneRegex = /^(01[016789])-?([0-9]{3,4})-?([0-9]{4})$/;
            return phoneRegex.test(phone.replace(/-/g, ''));
        },

        // Username validation
        username: (username) => {
            const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
            return usernameRegex.test(username);
        },

        // Korean name validation
        koreanName: (name) => {
            const nameRegex = /^[가-힣]{2,10}$/;
            return nameRegex.test(name);
        },

        // Number validation
        number: (value, min = -Infinity, max = Infinity) => {
            const num = Number(value);
            return !isNaN(num) && num >= min && num <= max;
        },

        // Credit card validation (basic Luhn algorithm)
        creditCard: (cardNumber) => {
            const cleaned = cardNumber.replace(/\s/g, '');
            if (!/^\d{13,19}$/.test(cleaned)) return false;

            let sum = 0;
            let isEven = false;

            for (let i = cleaned.length - 1; i >= 0; i--) {
                let digit = parseInt(cleaned[i], 10);

                if (isEven) {
                    digit *= 2;
                    if (digit > 9) digit -= 9;
                }

                sum += digit;
                isEven = !isEven;
            }

            return sum % 10 === 0;
        }
    };

    // CSRF Token Management
    class CSRFToken {
        constructor() {
            this.tokenKey = 'csrf_token';
            this.tokenExpiry = 'csrf_token_expiry';
        }

        // Generate new CSRF token
        generate() {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

            // Store with expiry (1 hour)
            const expiry = Date.now() + (60 * 60 * 1000);
            sessionStorage.setItem(this.tokenKey, token);
            sessionStorage.setItem(this.tokenExpiry, expiry);

            return token;
        }

        // Get current token or generate new one
        get() {
            const token = sessionStorage.getItem(this.tokenKey);
            const expiry = sessionStorage.getItem(this.tokenExpiry);

            if (!token || !expiry || Date.now() > parseInt(expiry)) {
                return this.generate();
            }

            return token;
        }

        // Validate token
        validate(token) {
            const storedToken = sessionStorage.getItem(this.tokenKey);
            const expiry = sessionStorage.getItem(this.tokenExpiry);

            if (!storedToken || !expiry) return false;
            if (Date.now() > parseInt(expiry)) return false;

            return token === storedToken;
        }

        // Add token to request headers
        addToHeaders(headers = {}) {
            headers['X-CSRF-Token'] = this.get();
            return headers;
        }

        // Add token to form
        addToForm(form) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'csrf_token';
            input.value = this.get();
            form.appendChild(input);
        }
    }

    // Rate Limiting
    class RateLimiter {
        constructor(maxRequests = 10, windowMs = 60000) {
            this.maxRequests = maxRequests;
            this.windowMs = windowMs;
            this.requests = new Map();
        }

        check(key) {
            const now = Date.now();
            const userRequests = this.requests.get(key) || [];

            // Remove old requests outside the window
            const validRequests = userRequests.filter(time => now - time < this.windowMs);

            if (validRequests.length >= this.maxRequests) {
                return {
                    allowed: false,
                    retryAfter: Math.ceil((validRequests[0] + this.windowMs - now) / 1000)
                };
            }

            validRequests.push(now);
            this.requests.set(key, validRequests);

            return { allowed: true };
        }

        reset(key) {
            this.requests.delete(key);
        }
    }

    // SQL Injection Prevention
    const preventSQLInjection = (input) => {
        // Remove or escape dangerous SQL characters
        const dangerous = /['";\\]/g;
        return input.replace(dangerous, '');
    };

    // Path Traversal Prevention
    const preventPathTraversal = (path) => {
        // Remove path traversal attempts
        return path.replace(/\.\./g, '').replace(/[\/\\]+/g, '/');
    };

    // Content Type Validation
    const validateContentType = (file, allowedTypes) => {
        const fileType = file.type || '';
        const fileName = file.name || '';
        const extension = fileName.split('.').pop().toLowerCase();

        // Check MIME type
        if (!allowedTypes.includes(fileType)) {
            return { valid: false, message: '지원하지 않는 파일 형식입니다.' };
        }

        // Additional extension check
        const typeExtensions = {
            'image/jpeg': ['jpg', 'jpeg'],
            'image/png': ['png'],
            'image/gif': ['gif'],
            'application/pdf': ['pdf'],
            'text/plain': ['txt'],
            'application/msword': ['doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx']
        };

        const validExtensions = typeExtensions[fileType] || [];
        if (!validExtensions.includes(extension)) {
            return { valid: false, message: '파일 확장자가 올바르지 않습니다.' };
        }

        return { valid: true };
    };

    // File Size Validation
    const validateFileSize = (file, maxSizeInMB) => {
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
            return { valid: false, message: `파일 크기는 ${maxSizeInMB}MB를 초과할 수 없습니다.` };
        }
        return { valid: true };
    };

    // Secure Random String Generator
    const generateSecureRandom = (length = 32) => {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    };

    // Session Timeout Manager
    class SessionManager {
        constructor(timeoutMinutes = 30) {
            this.timeoutMinutes = timeoutMinutes;
            this.lastActivity = Date.now();
            this.timeoutId = null;
            this.warningShown = false;

            this.startMonitoring();
        }

        startMonitoring() {
            // Monitor user activity
            ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
                document.addEventListener(event, () => this.updateActivity(), { passive: true });
            });

            this.checkTimeout();
        }

        updateActivity() {
            this.lastActivity = Date.now();
            this.warningShown = false;
        }

        checkTimeout() {
            const now = Date.now();
            const elapsed = now - this.lastActivity;
            const timeout = this.timeoutMinutes * 60 * 1000;
            const warning = timeout - (5 * 60 * 1000); // 5 minutes before timeout

            if (elapsed > timeout) {
                this.handleTimeout();
            } else if (elapsed > warning && !this.warningShown) {
                this.showWarning();
                this.warningShown = true;
            }

            // Check again in 1 minute
            this.timeoutId = setTimeout(() => this.checkTimeout(), 60000);
        }

        showWarning() {
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.warning('세션이 5분 후 만료됩니다. 계속하려면 페이지를 새로고침하세요.');
            }
        }

        handleTimeout() {
            clearTimeout(this.timeoutId);

            // Clear session
            localStorage.removeItem('authToken');
            sessionStorage.clear();

            // Redirect to login
            window.location.href = '/login.html?session_expired=true';
        }

        destroy() {
            clearTimeout(this.timeoutId);
        }
    }

    // Export security utilities
    window.SecurityUtils = {
        escapeHtml,
        sanitizeHtml,
        validators,
        CSRFToken: new CSRFToken(),
        RateLimiter,
        preventSQLInjection,
        preventPathTraversal,
        validateContentType,
        validateFileSize,
        generateSecureRandom,
        SessionManager
    };

    // Auto-initialize session manager for authenticated users
    if (localStorage.getItem('authToken')) {
        window.sessionManager = new SessionManager(30);
    }
})();
