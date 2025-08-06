// Jest 테스트 환경 설정

// jsdom 환경에서 누락된 API들 모킹
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// fetch API 모킹
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        blob: () => Promise.resolve(new Blob())
    })
);

// localStorage 모킹
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

// sessionStorage 모킹
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// IntersectionObserver 모킹
global.IntersectionObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
}));

// ResizeObserver 모킹
global.ResizeObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
}));

// performance API 모킹
global.performance = {
    now: jest.fn(() => Date.now()),
    timing: {
        navigationStart: Date.now() - 1000,
        loadEventEnd: Date.now(),
        domContentLoadedEventEnd: Date.now() - 500
    },
    memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000
    },
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => [])
};

// 외부 서비스 모킹
global.TossPayments = jest.fn(() => ({
    requestPayment: jest.fn(() => Promise.resolve()),
    requestBillingAuth: jest.fn(() => Promise.resolve())
}));

global.emailjs = {
    init: jest.fn(),
    send: jest.fn(() => Promise.resolve()),
    sendForm: jest.fn(() => Promise.resolve())
};

// 콘솔 에러/경고 숨기기 (테스트 중에만)
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
});

afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
});

// 각 테스트 후 모든 모킹 리셋
afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    fetch.mockClear();
});