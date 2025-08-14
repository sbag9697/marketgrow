module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testMatch: [
        '<rootDir>/tests/**/*.test.js',
        '<rootDir>/js/**/*.test.js'
    ],
    collectCoverageFrom: [
        'js/**/*.js',
        '!js/**/*.test.js',
        '!js/vendor/**',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: [
        'text',
        'lcov',
        'html'
    ],
    moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@js/(.*)$': '<rootDir>/js/$1',
        '^@css/(.*)$': '<rootDir>/css/$1'
    },
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    testTimeout: 10000,
    verbose: true,
    clearMocks: true,
    restoreMocks: true,
    globals: {
        TossPayments: {},
        emailjs: {},
        fetch: global.fetch,
        localStorage: {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        },
        sessionStorage: {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        }
    }
};
