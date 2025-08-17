// API 유틸리티 함수들

/**
 * JSON 응답을 안전하게 처리하는 fetch 래퍼
 * HTML 404 페이지를 JSON으로 파싱하려다 실패하는 문제 방지
 */
async function fetchJSON(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });

        // 상태 코드 체크
        if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error(`HTTP Error ${response.status} at ${url}:`, text.slice(0, 200));
            
            // HTML 응답인 경우 (404 페이지 등)
            if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
                throw new Error(`서버 연결 실패: 잘못된 API 주소입니다. (${response.status})`);
            }
            
            // JSON 에러 응답 파싱 시도
            try {
                const errorData = JSON.parse(text);
                throw new Error(errorData.message || `서버 오류: ${response.status}`);
            } catch (e) {
                throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
            }
        }

        // Content-Type 확인
        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        if (!contentType.includes('application/json')) {
            const text = await response.text().catch(() => '');
            console.error(`Unexpected content-type: ${contentType} at ${url}:`, text.slice(0, 200));
            
            if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
                throw new Error('서버 연결 실패: API가 HTML을 반환했습니다.');
            }
            
            throw new Error(`서버 응답 형식 오류: ${contentType}`);
        }

        return await response.json();
    } catch (error) {
        // 네트워크 오류
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            throw new Error('네트워크 연결 실패. 인터넷 연결을 확인해주세요.');
        }
        
        // 이미 처리된 에러는 그대로 전달
        throw error;
    }
}

/**
 * API 요청 헬퍼 함수
 */
async function apiRequest(endpoint, options = {}) {
    // apiUrl 함수를 사용하여 안전하게 URL 생성
    const url = endpoint.startsWith('http') 
        ? endpoint 
        : window.apiUrl ? window.apiUrl(endpoint) : `${window.API_BASE || 'https://marketgrow.onrender.com/api'}${endpoint}`;
    
    console.log('API Request:', url); // 디버깅용
    
    const token = localStorage.getItem('authToken');
    
    const headers = {
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetchJSON(url, {
        ...options,
        headers
    });
}

// 전역으로 노출
window.fetchJSON = fetchJSON;
window.apiRequest = apiRequest;