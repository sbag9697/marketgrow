module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
        jest: true
    },
    extends: [
        'standard'
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        // 코드 품질
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-unused-vars': ['error', { 
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_' 
        }],
        
        // 스타일
        'indent': ['error', 4, { SwitchCase: 1 }],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'comma-dangle': ['error', 'never'],
        'space-before-function-paren': ['error', {
            anonymous: 'always',
            named: 'never',
            asyncArrow: 'always'
        }],
        
        // 최적화 관련
        'prefer-const': 'error',
        'no-var': 'error',
        'prefer-arrow-callback': 'error',
        'prefer-template': 'error',
        
        // 보안 관련
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'no-script-url': 'error',
        
        // 에러 방지
        'no-undef': 'error',
        'no-duplicate-imports': 'error',
        'no-unreachable': 'error',
        'valid-typeof': 'error',
        
        // 한국어 프로젝트 특성상 허용
        'camelcase': ['error', { 
            properties: 'never',
            ignoreDestructuring: true,
            allow: ['^UNSAFE_', '^kr_', '^ko_']
        }]
    },
    globals: {
        // 브라우저 전역 변수
        'window': 'readonly',
        'document': 'readonly',
        'navigator': 'readonly',
        'localStorage': 'readonly',
        'sessionStorage': 'readonly',
        'fetch': 'readonly',
        'FormData': 'readonly',
        'URLSearchParams': 'readonly',
        'IntersectionObserver': 'readonly',
        'performance': 'readonly',
        
        // 외부 라이브러리
        'TossPayments': 'readonly',
        'emailjs': 'readonly',
        'kakao': 'readonly',
        
        // 프로젝트 전역 변수
        'api': 'readonly',
        'auth': 'readonly',
        'performanceMonitor': 'readonly',
        'OptimizationUtils': 'readonly'
    },
    overrides: [
        {
            files: ['server/**/*.js'],
            env: {
                node: true,
                browser: false
            },
            globals: {
                'process': 'readonly',
                'Buffer': 'readonly',
                '__dirname': 'readonly',
                '__filename': 'readonly',
                'module': 'readonly',
                'require': 'readonly',
                'exports': 'readonly',
                'global': 'readonly'
            }
        },
        {
            files: ['*.test.js', '**/*.test.js'],
            env: {
                jest: true
            },
            globals: {
                'describe': 'readonly',
                'it': 'readonly',
                'expect': 'readonly',
                'beforeEach': 'readonly',
                'afterEach': 'readonly',
                'beforeAll': 'readonly',
                'afterAll': 'readonly',
                'jest': 'readonly'
            }
        }
    ]
};