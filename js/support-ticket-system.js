// 고객 문의 관리 시스템
const API_URL = 'https://marketgrow-production.up.railway.app/api';
const WS_URL = 'wss://marketgrow-production.up.railway.app';

class SupportTicketSystem {
    constructor() {
        this.tickets = [];
        this.currentTicket = null;
        this.isAdmin = false;
        this.socket = null;
        this.filters = {
            status: 'all',
            priority: 'all',
            category: 'all',
            search: ''
        };
        this.sortBy = 'createdAt';
        this.sortOrder = 'desc';

        this.init();
    }

    // 초기화
    async init() {
        this.checkAdminStatus();
        if (this.isAdmin) {
            await this.loadTickets();
            this.connectWebSocket();
            this.setupEventListeners();
            this.startAutoRefresh();
        }
    }

    // 관리자 권한 확인
    checkAdminStatus() {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const user = JSON.parse(userInfo);
            this.isAdmin = user.role === 'admin' || user.isAdmin === true;
        }
    }

    // WebSocket 연결
    connectWebSocket() {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            this.socket = new WebSocket(`${WS_URL}/support?token=${token}`);

            this.socket.onopen = () => {
                console.log('고객 지원 서버 연결됨');
                this.socket.send(JSON.stringify({
                    type: 'admin_connect',
                    token
                }));
            };

            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket 오류:', error);
            };

            this.socket.onclose = () => {
                console.log('고객 지원 서버 연결 종료');
                // 재연결 시도
                setTimeout(() => this.connectWebSocket(), 5000);
            };
        } catch (error) {
            console.error('WebSocket 연결 실패:', error);
        }
    }

    // WebSocket 메시지 처리
    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'new_ticket':
                this.addTicket(data.ticket);
                this.showNotification('새 문의가 접수되었습니다', 'info');
                break;

            case 'ticket_updated':
                this.updateTicket(data.ticket);
                break;

            case 'new_message':
                this.addMessageToTicket(data.ticketId, data.message);
                if (data.message.sender !== 'admin') {
                    this.showNotification(`새 메시지: ${data.message.text.substring(0, 50)}...`, 'info');
                }
                break;

            case 'customer_typing':
                this.showTypingIndicator(data.ticketId, true);
                break;

            case 'customer_stopped_typing':
                this.showTypingIndicator(data.ticketId, false);
                break;
        }
    }

    // 티켓 목록 로드
    async loadTickets() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/support/tickets`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                this.tickets = data.data.tickets;
                this.renderTicketList();
                this.updateStatistics();
            }
        } catch (error) {
            console.error('티켓 로드 실패:', error);
        }
    }

    // 티켓 생성 (고객용)
    async createTicket(ticketData) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/support/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(ticketData)
            });

            const data = await response.json();

            if (data.success) {
                return data.data.ticket;
            }

            throw new Error(data.message || '티켓 생성 실패');
        } catch (error) {
            console.error('티켓 생성 오류:', error);
            throw error;
        }
    }

    // 티켓 상세 정보 로드
    async loadTicketDetails(ticketId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/support/tickets/${ticketId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                this.currentTicket = data.data.ticket;
                this.renderTicketDetails();
                return data.data.ticket;
            }
        } catch (error) {
            console.error('티켓 상세 정보 로드 실패:', error);
        }
    }

    // 티켓 상태 업데이트
    async updateTicketStatus(ticketId, status) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/support/tickets/${ticketId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            const data = await response.json();

            if (data.success) {
                this.updateTicket(data.data.ticket);
                this.showNotification('티켓 상태가 업데이트되었습니다', 'success');
            }
        } catch (error) {
            console.error('티켓 상태 업데이트 실패:', error);
        }
    }

    // 티켓 우선순위 변경
    async updateTicketPriority(ticketId, priority) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/support/tickets/${ticketId}/priority`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ priority })
            });

            const data = await response.json();

            if (data.success) {
                this.updateTicket(data.data.ticket);
                this.showNotification('우선순위가 변경되었습니다', 'success');
            }
        } catch (error) {
            console.error('우선순위 변경 실패:', error);
        }
    }

    // 티켓 담당자 할당
    async assignTicket(ticketId, adminId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/support/tickets/${ticketId}/assign`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ adminId })
            });

            const data = await response.json();

            if (data.success) {
                this.updateTicket(data.data.ticket);
                this.showNotification('담당자가 할당되었습니다', 'success');
            }
        } catch (error) {
            console.error('담당자 할당 실패:', error);
        }
    }

    // 메시지 전송
    async sendMessage(ticketId, message, attachments = []) {
        try {
            const token = localStorage.getItem('authToken');
            const formData = new FormData();
            formData.append('message', message);
            formData.append('sender', this.isAdmin ? 'admin' : 'customer');

            // 첨부파일 추가
            attachments.forEach(file => {
                formData.append('attachments', file);
            });

            const response = await fetch(`${API_URL}/support/tickets/${ticketId}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.addMessageToTicket(ticketId, data.data.message);

                // WebSocket으로 실시간 전송
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({
                        type: 'message',
                        ticketId,
                        message: data.data.message
                    }));
                }

                return data.data.message;
            }
        } catch (error) {
            console.error('메시지 전송 실패:', error);
        }
    }

    // 티켓에 메시지 추가
    addMessageToTicket(ticketId, message) {
        const ticket = this.tickets.find(t => t._id === ticketId);
        if (ticket) {
            if (!ticket.messages) ticket.messages = [];
            ticket.messages.push(message);

            // 마지막 메시지 업데이트
            ticket.lastMessage = message.text;
            ticket.lastMessageAt = message.createdAt;

            // 현재 보고 있는 티켓이면 UI 업데이트
            if (this.currentTicket && this.currentTicket._id === ticketId) {
                this.renderMessage(message);
            }

            // 티켓 목록 업데이트
            this.renderTicketList();
        }
    }

    // 티켓 추가
    addTicket(ticket) {
        this.tickets.unshift(ticket);
        this.renderTicketList();
        this.updateStatistics();
    }

    // 티켓 업데이트
    updateTicket(updatedTicket) {
        const index = this.tickets.findIndex(t => t._id === updatedTicket._id);
        if (index >= 0) {
            this.tickets[index] = { ...this.tickets[index], ...updatedTicket };
            this.renderTicketList();

            if (this.currentTicket && this.currentTicket._id === updatedTicket._id) {
                this.currentTicket = this.tickets[index];
                this.renderTicketDetails();
            }
        }
    }

    // 티켓 목록 렌더링
    renderTicketList() {
        const container = document.getElementById('ticketList');
        if (!container) return;

        // 필터링
        let filteredTickets = this.filterTickets();

        // 정렬
        filteredTickets = this.sortTickets(filteredTickets);

        if (filteredTickets.length === 0) {
            container.innerHTML = `
                <div class="no-tickets">
                    <i class="fas fa-inbox"></i>
                    <p>문의 티켓이 없습니다</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredTickets.map(ticket => `
            <div class="ticket-item ${ticket.status}" onclick="supportTickets.loadTicketDetails('${ticket._id}')">
                <div class="ticket-header">
                    <div class="ticket-info">
                        <span class="ticket-id">#${ticket.ticketNumber}</span>
                        <span class="ticket-priority priority-${ticket.priority}">
                            ${this.getPriorityText(ticket.priority)}
                        </span>
                        <span class="ticket-status status-${ticket.status}">
                            ${this.getStatusText(ticket.status)}
                        </span>
                    </div>
                    <div class="ticket-time">
                        ${this.getRelativeTime(ticket.createdAt)}
                    </div>
                </div>
                
                <div class="ticket-subject">
                    <strong>${ticket.subject}</strong>
                </div>
                
                <div class="ticket-customer">
                    <i class="fas fa-user"></i> ${ticket.customerName}
                    ${ticket.customerEmail ? `(${ticket.customerEmail})` : ''}
                </div>
                
                ${ticket.lastMessage
        ? `
                    <div class="ticket-last-message">
                        <i class="fas fa-comment"></i> ${ticket.lastMessage.substring(0, 100)}...
                    </div>
                `
        : ''}
                
                <div class="ticket-footer">
                    <div class="ticket-category">
                        <i class="fas fa-tag"></i> ${ticket.category}
                    </div>
                    ${ticket.assignedTo
        ? `
                        <div class="ticket-assigned">
                            <i class="fas fa-user-check"></i> ${ticket.assignedTo.name}
                        </div>
                    `
        : ''}
                </div>
                
                ${ticket.unreadCount > 0
        ? `
                    <div class="unread-badge">${ticket.unreadCount}</div>
                `
        : ''}
            </div>
        `).join('');
    }

    // 티켓 상세 정보 렌더링
    renderTicketDetails() {
        const container = document.getElementById('ticketDetails');
        if (!container || !this.currentTicket) return;

        const ticket = this.currentTicket;

        container.innerHTML = `
            <div class="ticket-detail-header">
                <div class="ticket-detail-info">
                    <h2>#${ticket.ticketNumber} - ${ticket.subject}</h2>
                    <div class="ticket-meta">
                        <span class="status-badge status-${ticket.status}">
                            ${this.getStatusText(ticket.status)}
                        </span>
                        <span class="priority-badge priority-${ticket.priority}">
                            ${this.getPriorityText(ticket.priority)}
                        </span>
                        <span class="category-badge">
                            <i class="fas fa-tag"></i> ${ticket.category}
                        </span>
                    </div>
                </div>
                
                <div class="ticket-actions">
                    <button class="btn-secondary" onclick="supportTickets.showStatusMenu('${ticket._id}')">
                        <i class="fas fa-exchange-alt"></i> 상태 변경
                    </button>
                    <button class="btn-secondary" onclick="supportTickets.showPriorityMenu('${ticket._id}')">
                        <i class="fas fa-flag"></i> 우선순위
                    </button>
                    <button class="btn-secondary" onclick="supportTickets.showAssignMenu('${ticket._id}')">
                        <i class="fas fa-user-plus"></i> 담당자 할당
                    </button>
                    <button class="btn-danger" onclick="supportTickets.closeTicket('${ticket._id}')">
                        <i class="fas fa-times"></i> 닫기
                    </button>
                </div>
            </div>
            
            <div class="ticket-customer-info">
                <h3>고객 정보</h3>
                <div class="customer-details">
                    <div><i class="fas fa-user"></i> ${ticket.customerName}</div>
                    <div><i class="fas fa-envelope"></i> ${ticket.customerEmail}</div>
                    ${ticket.customerPhone ? `<div><i class="fas fa-phone"></i> ${ticket.customerPhone}</div>` : ''}
                    <div><i class="fas fa-clock"></i> 접수일: ${new Date(ticket.createdAt).toLocaleString('ko-KR')}</div>
                </div>
            </div>
            
            <div class="ticket-messages">
                <h3>대화 내역</h3>
                <div class="messages-container" id="messagesContainer">
                    ${ticket.messages ? ticket.messages.map(msg => this.renderMessageHTML(msg)).join('') : ''}
                </div>
                
                <div class="typing-indicator" id="typingIndicator" style="display: none;">
                    <span></span><span></span><span></span> 고객이 입력중...
                </div>
            </div>
            
            <div class="message-input-area">
                <form id="messageForm" onsubmit="supportTickets.handleMessageSubmit(event, '${ticket._id}')">
                    <div class="input-group">
                        <textarea id="messageInput" 
                                  placeholder="답변을 입력하세요..." 
                                  rows="3"
                                  required></textarea>
                        <div class="input-actions">
                            <button type="button" class="btn-attach" onclick="document.getElementById('attachFile').click()">
                                <i class="fas fa-paperclip"></i>
                            </button>
                            <input type="file" id="attachFile" style="display: none;" multiple>
                            <button type="submit" class="btn-send">
                                <i class="fas fa-paper-plane"></i> 전송
                            </button>
                        </div>
                    </div>
                </form>
                
                <div class="quick-responses">
                    <button onclick="supportTickets.insertQuickResponse('감사합니다. 확인 후 빠르게 답변드리겠습니다.')">
                        빠른 확인
                    </button>
                    <button onclick="supportTickets.insertQuickResponse('문제가 해결되었습니다. 확인 부탁드립니다.')">
                        해결 완료
                    </button>
                    <button onclick="supportTickets.insertQuickResponse('추가 정보가 필요합니다. 자세한 설명 부탁드립니다.')">
                        추가 정보 요청
                    </button>
                </div>
            </div>
        `;

        // 메시지 컨테이너 스크롤 하단으로
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    // 메시지 HTML 렌더링
    renderMessageHTML(message) {
        const isAdmin = message.sender === 'admin';
        return `
            <div class="message ${isAdmin ? 'admin-message' : 'customer-message'}">
                <div class="message-header">
                    <span class="message-sender">
                        <i class="fas ${isAdmin ? 'fa-headset' : 'fa-user'}"></i>
                        ${isAdmin ? '관리자' : '고객'}
                    </span>
                    <span class="message-time">
                        ${new Date(message.createdAt).toLocaleString('ko-KR')}
                    </span>
                </div>
                <div class="message-content">
                    ${message.text}
                </div>
                ${message.attachments && message.attachments.length > 0
        ? `
                    <div class="message-attachments">
                        ${message.attachments.map(att => `
                            <a href="${att.url}" target="_blank" class="attachment">
                                <i class="fas fa-file"></i> ${att.name}
                            </a>
                        `).join('')}
                    </div>
                `
        : ''}
            </div>
        `;
    }

    // 메시지 렌더링 (실시간)
    renderMessage(message) {
        const container = document.getElementById('messagesContainer');
        if (container) {
            const messageHTML = this.renderMessageHTML(message);
            container.insertAdjacentHTML('beforeend', messageHTML);
            container.scrollTop = container.scrollHeight;
        }
    }

    // 메시지 제출 처리
    async handleMessageSubmit(event, ticketId) {
        event.preventDefault();

        const input = document.getElementById('messageInput');
        const fileInput = document.getElementById('attachFile');
        const message = input.value.trim();

        if (!message) return;

        // 메시지 전송
        await this.sendMessage(ticketId, message, fileInput.files);

        // 입력 필드 초기화
        input.value = '';
        fileInput.value = '';
    }

    // 빠른 응답 삽입
    insertQuickResponse(text) {
        const input = document.getElementById('messageInput');
        if (input) {
            input.value = text;
            input.focus();
        }
    }

    // 티켓 필터링
    filterTickets() {
        return this.tickets.filter(ticket => {
            // 상태 필터
            if (this.filters.status !== 'all' && ticket.status !== this.filters.status) {
                return false;
            }

            // 우선순위 필터
            if (this.filters.priority !== 'all' && ticket.priority !== this.filters.priority) {
                return false;
            }

            // 카테고리 필터
            if (this.filters.category !== 'all' && ticket.category !== this.filters.category) {
                return false;
            }

            // 검색어 필터
            if (this.filters.search) {
                const search = this.filters.search.toLowerCase();
                return ticket.subject.toLowerCase().includes(search) ||
                       ticket.customerName.toLowerCase().includes(search) ||
                       ticket.ticketNumber.includes(search);
            }

            return true;
        });
    }

    // 티켓 정렬
    sortTickets(tickets) {
        return tickets.sort((a, b) => {
            let aValue = a[this.sortBy];
            let bValue = b[this.sortBy];

            // 우선순위 정렬 (숫자)
            if (this.sortBy === 'priority') {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                aValue = priorityOrder[aValue] || 0;
                bValue = priorityOrder[bValue] || 0;
            }

            // 날짜 정렬
            if (this.sortBy === 'createdAt' || this.sortBy === 'updatedAt') {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            }

            if (this.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }

    // 필터 적용
    applyFilter(filterType, value) {
        this.filters[filterType] = value;
        this.renderTicketList();
    }

    // 정렬 변경
    changeSort(sortBy) {
        if (this.sortBy === sortBy) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = sortBy;
            this.sortOrder = 'desc';
        }
        this.renderTicketList();
    }

    // 통계 업데이트
    updateStatistics() {
        const stats = {
            total: this.tickets.length,
            open: this.tickets.filter(t => t.status === 'open').length,
            inProgress: this.tickets.filter(t => t.status === 'in_progress').length,
            resolved: this.tickets.filter(t => t.status === 'resolved').length,
            closed: this.tickets.filter(t => t.status === 'closed').length,
            highPriority: this.tickets.filter(t => t.priority === 'high').length
        };

        // 통계 표시
        Object.keys(stats).forEach(key => {
            const element = document.getElementById(`stat_${key}`);
            if (element) {
                element.textContent = stats[key];
            }
        });
    }

    // 티켓 닫기
    async closeTicket(ticketId) {
        if (confirm('이 티켓을 닫으시겠습니까?')) {
            await this.updateTicketStatus(ticketId, 'closed');
        }
    }

    // 타이핑 표시
    showTypingIndicator(ticketId, show) {
        if (this.currentTicket && this.currentTicket._id === ticketId) {
            const indicator = document.getElementById('typingIndicator');
            if (indicator) {
                indicator.style.display = show ? 'flex' : 'none';
            }
        }
    }

    // 상태 텍스트
    getStatusText(status) {
        const statusMap = {
            open: '열림',
            in_progress: '진행중',
            pending: '대기중',
            resolved: '해결됨',
            closed: '닫힘'
        };
        return statusMap[status] || status;
    }

    // 우선순위 텍스트
    getPriorityText(priority) {
        const priorityMap = {
            low: '낮음',
            medium: '보통',
            high: '높음',
            urgent: '긴급'
        };
        return priorityMap[priority] || priority;
    }

    // 상대 시간
    getRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = Math.floor((now - time) / 1000);

        if (diff < 60) return '방금 전';
        if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;

        return time.toLocaleDateString('ko-KR');
    }

    // 알림 표시
    showNotification(message, type = 'info') {
        // notification-system.js 활용
        if (window.notificationSystem) {
            window.notificationSystem.showToastNotification({
                title: '고객 지원',
                message,
                icon: type === 'success' ? 'fa-check-circle' : 'fa-info-circle',
                color: type === 'success' ? '#10b981' : '#3b82f6'
            });
        }
    }

    // 자동 새로고침
    startAutoRefresh() {
        setInterval(() => {
            this.loadTickets();
        }, 30000); // 30초마다
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 검색
        const searchInput = document.getElementById('ticketSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.renderTicketList();
            });
        }

        // 필터
        ['status', 'priority', 'category'].forEach(filterType => {
            const select = document.getElementById(`filter_${filterType}`);
            if (select) {
                select.addEventListener('change', (e) => {
                    this.applyFilter(filterType, e.target.value);
                });
            }
        });
    }
}

// 전역 인스턴스 생성
const supportTickets = new SupportTicketSystem();

// 전역 함수 등록
window.supportTickets = supportTickets;
