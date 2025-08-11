#!/usr/bin/env node

/**
 * MarketGrow 모니터링 스크립트
 * 시스템 상태를 실시간으로 모니터링하고 문제 발생 시 알림
 */

const axios = require('axios');
const colors = require('colors'); // npm install colors

// 설정
const CONFIG = {
    API_URL: process.env.API_URL || 'https://marketgrow-production.up.railway.app/api',
    CHECK_INTERVAL: 60000, // 1분마다 체크
    ALERT_THRESHOLD: {
        RESPONSE_TIME: 3000, // 3초 이상 응답 시간
        ERROR_RATE: 0.1, // 10% 이상 에러율
        MEMORY_USAGE: 0.8, // 80% 이상 메모리 사용
    }
};

// 모니터링 데이터
let monitoringData = {
    startTime: new Date(),
    checks: 0,
    errors: 0,
    totalResponseTime: 0,
    lastCheck: null,
    status: {
        api: false,
        database: false,
        services: false,
        payments: false
    }
};

// 콘솔 클리어
function clearConsole() {
    process.stdout.write('\x1Bc');
}

// 헤더 출력
function printHeader() {
    console.log('═══════════════════════════════════════════════════════════════'.cyan);
    console.log('                 MarketGrow 시스템 모니터링                    '.cyan.bold);
    console.log('═══════════════════════════════════════════════════════════════'.cyan);
    console.log(`시작 시간: ${monitoringData.startTime.toLocaleString('ko-KR')}`.gray);
    console.log(`마지막 체크: ${monitoringData.lastCheck ? monitoringData.lastCheck.toLocaleString('ko-KR') : 'N/A'}`.gray);
    console.log('═══════════════════════════════════════════════════════════════'.cyan);
}

// 상태 아이콘
function getStatusIcon(status) {
    return status ? '✅'.green : '❌'.red;
}

// API 헬스체크
async function checkAPIHealth() {
    const startTime = Date.now();
    
    try {
        const response = await axios.get(`${CONFIG.API_URL}/health`, {
            timeout: 5000
        });
        
        const responseTime = Date.now() - startTime;
        monitoringData.totalResponseTime += responseTime;
        
        if (response.data.status === 'OK') {
            monitoringData.status.api = true;
            return {
                success: true,
                responseTime,
                data: response.data
            };
        }
    } catch (error) {
        monitoringData.status.api = false;
        monitoringData.errors++;
        return {
            success: false,
            error: error.message
        };
    }
}

// 서비스 체크
async function checkServices() {
    try {
        const response = await axios.get(`${CONFIG.API_URL}/services`, {
            timeout: 5000
        });
        
        if (response.data.success && response.data.data.services) {
            monitoringData.status.services = true;
            return {
                success: true,
                count: response.data.data.services.length
            };
        }
    } catch (error) {
        monitoringData.status.services = false;
        return {
            success: false,
            error: error.message
        };
    }
}

// 통계 계산
function calculateStats() {
    const uptime = Math.floor((Date.now() - monitoringData.startTime) / 1000);
    const avgResponseTime = monitoringData.checks > 0 
        ? Math.floor(monitoringData.totalResponseTime / monitoringData.checks)
        : 0;
    const errorRate = monitoringData.checks > 0
        ? ((monitoringData.errors / monitoringData.checks) * 100).toFixed(2)
        : 0;
    
    return {
        uptime,
        avgResponseTime,
        errorRate,
        totalChecks: monitoringData.checks,
        totalErrors: monitoringData.errors
    };
}

// 상태 출력
function printStatus() {
    const stats = calculateStats();
    
    console.log('\n📊 시스템 상태\n'.yellow.bold);
    
    console.log(`  API 서버:        ${getStatusIcon(monitoringData.status.api)} ${monitoringData.status.api ? '정상'.green : '오류'.red}`);
    console.log(`  데이터베이스:    ${getStatusIcon(monitoringData.status.database)} ${monitoringData.status.database ? '연결됨'.green : '연결 안됨'.red}`);
    console.log(`  서비스 목록:     ${getStatusIcon(monitoringData.status.services)} ${monitoringData.status.services ? '정상'.green : '오류'.red}`);
    console.log(`  결제 시스템:     ${getStatusIcon(monitoringData.status.payments)} ${monitoringData.status.payments ? '정상'.green : '테스트 모드'.yellow}`);
    
    console.log('\n📈 통계\n'.yellow.bold);
    
    console.log(`  가동 시간:       ${formatUptime(stats.uptime)}`);
    console.log(`  총 체크 횟수:    ${stats.totalChecks}회`);
    console.log(`  평균 응답 시간:  ${stats.avgResponseTime}ms ${stats.avgResponseTime > CONFIG.ALERT_THRESHOLD.RESPONSE_TIME ? '⚠️'.yellow : ''}`);
    console.log(`  에러율:          ${stats.errorRate}% ${stats.errorRate > CONFIG.ALERT_THRESHOLD.ERROR_RATE * 100 ? '⚠️'.yellow : ''}`);
    console.log(`  총 에러:         ${stats.totalErrors}회`);
    
    // 경고 메시지
    if (stats.avgResponseTime > CONFIG.ALERT_THRESHOLD.RESPONSE_TIME) {
        console.log('\n⚠️  경고: 응답 시간이 느립니다!'.yellow.bold);
    }
    
    if (stats.errorRate > CONFIG.ALERT_THRESHOLD.ERROR_RATE * 100) {
        console.log('\n⚠️  경고: 에러율이 높습니다!'.red.bold);
    }
    
    if (!monitoringData.status.api) {
        console.log('\n🚨 심각: API 서버가 응답하지 않습니다!'.red.bold.bgWhite);
    }
}

// 가동 시간 포맷
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    let result = '';
    if (days > 0) result += `${days}일 `;
    if (hours > 0) result += `${hours}시간 `;
    if (minutes > 0) result += `${minutes}분 `;
    result += `${secs}초`;
    
    return result;
}

// 실시간 로그
function printLiveLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    const prefix = `[${timestamp}]`;
    
    switch(type) {
        case 'success':
            console.log(`${prefix} ✅ ${message}`.green);
            break;
        case 'error':
            console.log(`${prefix} ❌ ${message}`.red);
            break;
        case 'warning':
            console.log(`${prefix} ⚠️  ${message}`.yellow);
            break;
        default:
            console.log(`${prefix} ℹ️  ${message}`.gray);
    }
}

// 모니터링 실행
async function runMonitoring() {
    monitoringData.checks++;
    monitoringData.lastCheck = new Date();
    
    clearConsole();
    printHeader();
    
    // API 체크
    printLiveLog('API 헬스체크 중...', 'info');
    const apiResult = await checkAPIHealth();
    
    if (apiResult.success) {
        printLiveLog(`API 응답 성공 (${apiResult.responseTime}ms)`, 'success');
        
        // 데이터베이스 상태 확인 (API 응답에 포함)
        if (apiResult.data.database) {
            monitoringData.status.database = true;
            printLiveLog('데이터베이스 연결 확인', 'success');
        }
    } else {
        printLiveLog(`API 응답 실패: ${apiResult.error}`, 'error');
    }
    
    // 서비스 체크
    printLiveLog('서비스 목록 확인 중...', 'info');
    const servicesResult = await checkServices();
    
    if (servicesResult.success) {
        printLiveLog(`서비스 ${servicesResult.count}개 확인`, 'success');
    } else {
        printLiveLog(`서비스 확인 실패: ${servicesResult.error}`, 'error');
    }
    
    // 상태 출력
    printStatus();
    
    console.log('\n═══════════════════════════════════════════════════════════════'.cyan);
    console.log(`다음 체크: ${CONFIG.CHECK_INTERVAL / 1000}초 후... (Ctrl+C로 종료)`.gray);
}

// 종료 처리
process.on('SIGINT', () => {
    console.log('\n\n👋 모니터링을 종료합니다.'.yellow.bold);
    
    const stats = calculateStats();
    console.log('\n📊 최종 통계:'.cyan.bold);
    console.log(`  총 가동 시간: ${formatUptime(stats.uptime)}`);
    console.log(`  총 체크 횟수: ${stats.totalChecks}회`);
    console.log(`  총 에러: ${stats.totalErrors}회`);
    console.log(`  평균 응답 시간: ${stats.avgResponseTime}ms`);
    console.log(`  에러율: ${stats.errorRate}%`);
    
    process.exit(0);
});

// 시작
console.log('🚀 MarketGrow 모니터링을 시작합니다...'.green.bold);
console.log(`API URL: ${CONFIG.API_URL}`.gray);
console.log(`체크 간격: ${CONFIG.CHECK_INTERVAL / 1000}초`.gray);
console.log('');

// 즉시 실행
runMonitoring();

// 주기적 실행
setInterval(runMonitoring, CONFIG.CHECK_INTERVAL);