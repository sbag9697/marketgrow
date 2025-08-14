// 실시간 채팅 상담 시스템
const API_URL = 'https://marketgrow-production-c586.up.railway.app/api';
const WS_URL = 'wss://marketgrow-production-c586.up.railway.app';

class ChatSupport {
    constructor() {
        this.socket = null;
        this.chatId = null;
        this.isConnected = false;
        this.isMinimized = false;
        this.unreadCount = 0;
        this.messages = [];
        this.userInfo = null;
        this.chatWidget = null;
        this.typingTimeout = null;
        this.isTyping = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        this.init();
    }

    // 초기화
    init() {
        // 사용자 정보 확인
        this.loadUserInfo();

        // 채팅 위젯 생성
        this.createChatWidget();

        // WebSocket 연결
        this.connectWebSocket();

        // 이벤트 리스너 설정
        this.setupEventListeners();

        // 저장된 채팅 기록 로드
        this.loadChatHistory();
    }

    // 사용자 정보 로드
    loadUserInfo() {
        const token = localStorage.getItem('authToken');
        const userInfo = localStorage.getItem('userInfo');

        if (token && userInfo) {
            this.userInfo = JSON.parse(userInfo);
        } else {
            // 비로그인 사용자도 채팅 가능
            this.userInfo = {
                id: `guest_${Date.now()}`,
                name: '방문자',
                type: 'guest'
            };
        }
    }

    // 채팅 위젯 생성
    createChatWidget() {
        const widget = document.createElement('div');
        widget.className = 'chat-widget';
        widget.innerHTML = `
            <!-- 채팅 버튼 -->
            <button class="chat-button" id="chatButton">
                <i class="fas fa-comment-dots"></i>
                <span class="unread-badge" id="unreadBadge" style="display: none;">0</span>
            </button>
            
            <!-- 채팅 창 -->
            <div class="chat-container" id="chatContainer" style="display: none;">
                <div class="chat-header">
                    <div class="chat-header-info">
                        <div class="chat-status">
                            <span class="status-dot"></span>
                            <span class="status-text">상담원 연결중...</span>
                        </div>
                        <div class="chat-title">SNS그로우 고객센터</div>
                    </div>
                    <div class="chat-header-actions">
                        <button class="chat-minimize" id="minimizeChat">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="chat-close" id="closeChat">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="chat-messages" id="chatMessages">
                    <!-- 환영 메시지 -->
                    <div class="message system">
                        <div class="message-content">
                            안녕하세요! SNS그로우 고객센터입니다.
                            무엇을 도와드릴까요?
                        </div>
                    </div>
                    
                    <!-- 빠른 답변 버튼 -->
                    <div class="quick-replies">
                        <button class="quick-reply" onclick="chatSupport.sendQuickReply('주문 문의')">
                            주문 문의
                        </button>
                        <button class="quick-reply" onclick="chatSupport.sendQuickReply('결제 문의')">
                            결제 문의
                        </button>
                        <button class="quick-reply" onclick="chatSupport.sendQuickReply('서비스 문의')">
                            서비스 문의
                        </button>
                        <button class="quick-reply" onclick="chatSupport.sendQuickReply('기타 문의')">
                            기타 문의
                        </button>
                    </div>
                </div>
                
                <div class="chat-typing" id="typingIndicator" style="display: none;">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span>상담원이 입력중입니다...</span>
                </div>
                
                <div class="chat-input">
                    <form id="chatForm">
                        <input type="text" id="chatInput" placeholder="메시지를 입력하세요..." 
                               autocomplete="off" maxlength="500">
                        <button type="submit" id="sendButton">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(widget);
        this.chatWidget = widget;
    }

    // WebSocket 연결
    connectWebSocket() {
        try {
            this.socket = new WebSocket(`${WS_URL}/chat`);

            this.socket.onopen = () => {
                console.log('채팅 서버 연결됨');
                this.isConnected = true;
                this.reconnectAttempts = 0;

                // 인증 정보 전송
                this.socket.send(JSON.stringify({
                    type: 'auth',
                    userId: this.userInfo.id,
                    userName: this.userInfo.name,
                    userType: this.userInfo.type
                }));

                this.updateConnectionStatus(true);
            };

            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket 오류:', error);
                this.updateConnectionStatus(false);
            };

            this.socket.onclose = () => {
                console.log('채팅 서버 연결 종료');
                this.isConnected = false;
                this.updateConnectionStatus(false);

                // 재연결 시도
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    setTimeout(() => {
                        this.reconnectAttempts++;
                        this.connectWebSocket();
                    }, 3000 * this.reconnectAttempts);
                }
            };
        } catch (error) {
            console.error('WebSocket 연결 실패:', error);
            this.updateConnectionStatus(false);
        }
    }

    // 메시지 처리
    handleMessage(data) {
        switch (data.type) {
            case 'chat_id':
                this.chatId = data.chatId;
                break;

            case 'message':
                this.addMessage(data.message, data.sender, data.timestamp);
                if (!this.isMinimized && data.sender === 'agent') {
                    this.playNotificationSound();
                    this.updateUnreadCount();
                }
                break;

            case 'typing':
                this.showTypingIndicator(data.isTyping);
                break;

            case 'agent_connected':
                this.addSystemMessage('상담원이 연결되었습니다.');
                this.updateConnectionStatus(true, data.agentName);
                break;

            case 'agent_disconnected':
                this.addSystemMessage('상담원과의 연결이 종료되었습니다.');
                this.updateConnectionStatus(false);
                break;

            case 'chat_history':
                this.loadMessages(data.messages);
                break;

            case 'error':
                this.addSystemMessage(data.message);
                break;
        }
    }

    // 메시지 전송
    sendMessage(message) {
        if (!message.trim()) return;

        // UI에 메시지 추가
        this.addMessage(message, 'user');

        // WebSocket으로 전송
        if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'message',
                chatId: this.chatId,
                message,
                timestamp: new Date().toISOString()
            }));
        } else {
            // 오프라인 모드: API로 전송
            this.sendMessageViaAPI(message);
        }

        // 입력 필드 초기화
        document.getElementById('chatInput').value = '';
    }

    // API를 통한 메시지 전송 (오프라인 모드)
    async sendMessageViaAPI(message) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/chat/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    chatId: this.chatId,
                    message,
                    userId: this.userInfo.id
                })
            });

            const data = await response.json();
            if (data.success) {
                // 자동 응답이 있으면 표시
                if (data.autoReply) {
                    setTimeout(() => {
                        this.addMessage(data.autoReply, 'agent');
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('메시지 전송 실패:', error);
            this.addSystemMessage('메시지 전송에 실패했습니다. 다시 시도해주세요.');
        }
    }

    // 빠른 답변 전송
    sendQuickReply(text) {
        this.sendMessage(text);

        // 빠른 답변 버튼 숨기기
        const quickReplies = document.querySelector('.quick-replies');
        if (quickReplies) {
            quickReplies.style.display = 'none';
        }
    }

    // 메시지 추가
    addMessage(text, sender = 'user', timestamp = null) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const time = timestamp ? new Date(timestamp) : new Date();
        const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

        messageDiv.innerHTML = `
            <div class="message-content">
                ${this.escapeHtml(text)}
                <div class="message-time">${timeString}</div>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);

        // 메시지 저장
        this.messages.push({
            text,
            sender,
            timestamp: time.toISOString()
        });

        // 스크롤 하단으로
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // 로컬 스토리지에 저장
        this.saveChatHistory();
    }

    // 시스템 메시지 추가
    addSystemMessage(text) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        messageDiv.innerHTML = `
            <div class="message-content">${text}</div>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // 타이핑 표시
    showTypingIndicator(show) {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.style.display = show ? 'flex' : 'none';
            if (show) {
                const messages = document.getElementById('chatMessages');
                messages.scrollTop = messages.scrollHeight;
            }
        }
    }

    // 연결 상태 업데이트
    updateConnectionStatus(connected, agentName = null) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');

        if (statusDot && statusText) {
            if (connected) {
                statusDot.className = 'status-dot online';
                statusText.textContent = agentName ? `${agentName} 상담원` : '온라인';
            } else {
                statusDot.className = 'status-dot offline';
                statusText.textContent = '오프라인 (메시지는 저장됩니다)';
            }
        }
    }

    // 읽지 않은 메시지 수 업데이트
    updateUnreadCount() {
        if (this.isMinimized || document.getElementById('chatContainer').style.display === 'none') {
            this.unreadCount++;
            const badge = document.getElementById('unreadBadge');
            if (badge) {
                badge.textContent = this.unreadCount;
                badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
            }
        }
    }

    // 채팅 기록 저장
    saveChatHistory() {
        const history = {
            chatId: this.chatId,
            messages: this.messages.slice(-50), // 최근 50개만 저장
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('chatHistory', JSON.stringify(history));
    }

    // 채팅 기록 로드
    loadChatHistory() {
        const saved = localStorage.getItem('chatHistory');
        if (saved) {
            const history = JSON.parse(saved);

            // 24시간 이내 대화만 복원
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            if (new Date(history.timestamp) > dayAgo) {
                this.chatId = history.chatId;
                this.loadMessages(history.messages);
            }
        }
    }

    // 메시지 로드
    loadMessages(messages) {
        messages.forEach(msg => {
            this.addMessage(msg.text, msg.sender, msg.timestamp);
        });
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 채팅 버튼 클릭
        document.getElementById('chatButton').addEventListener('click', () => {
            this.toggleChat();
        });

        // 최소화 버튼
        document.getElementById('minimizeChat').addEventListener('click', () => {
            this.minimizeChat();
        });

        // 닫기 버튼
        document.getElementById('closeChat').addEventListener('click', () => {
            this.closeChat();
        });

        // 메시지 전송 폼
        document.getElementById('chatForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('chatInput');
            this.sendMessage(input.value);
        });

        // 타이핑 감지
        document.getElementById('chatInput').addEventListener('input', () => {
            this.handleTyping();
        });

        // 엔터키 전송
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.getElementById('chatForm').dispatchEvent(new Event('submit'));
            }
        });
    }

    // 타이핑 처리
    handleTyping() {
        if (!this.isTyping) {
            this.isTyping = true;
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                    type: 'typing',
                    chatId: this.chatId,
                    isTyping: true
                }));
            }
        }

        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                    type: 'typing',
                    chatId: this.chatId,
                    isTyping: false
                }));
            }
        }, 1000);
    }

    // 채팅 토글
    toggleChat() {
        const container = document.getElementById('chatContainer');
        const button = document.getElementById('chatButton');

        if (container.style.display === 'none') {
            container.style.display = 'flex';
            button.style.display = 'none';
            this.isMinimized = false;
            this.unreadCount = 0;
            document.getElementById('unreadBadge').style.display = 'none';

            // 입력 필드에 포커스
            setTimeout(() => {
                document.getElementById('chatInput').focus();
            }, 100);
        } else {
            this.closeChat();
        }
    }

    // 채팅 최소화
    minimizeChat() {
        document.getElementById('chatContainer').style.display = 'none';
        document.getElementById('chatButton').style.display = 'flex';
        this.isMinimized = true;
    }

    // 채팅 닫기
    closeChat() {
        document.getElementById('chatContainer').style.display = 'none';
        document.getElementById('chatButton').style.display = 'flex';
        this.isMinimized = false;

        // WebSocket 연결 종료
        if (this.socket) {
            this.socket.close();
        }
    }

    // 알림음 재생
    playNotificationSound() {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('알림음 재생 실패'));
    }

    // HTML 이스케이프
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 채팅 스타일
const chatStyles = `
<style>
.chat-widget {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    font-family: 'Noto Sans KR', sans-serif;
}

.chat-button {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: transform 0.3s ease;
    position: relative;
}

.chat-button:hover {
    transform: scale(1.1);
}

.unread-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #ef4444;
    color: white;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
}

.chat-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 380px;
    height: 600px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s ease;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.chat-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px;
    border-radius: 12px 12px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.chat-header-info {
    flex: 1;
}

.chat-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    margin-bottom: 4px;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #94a3b8;
}

.status-dot.online {
    background: #10b981;
    animation: pulse 2s infinite;
}

.status-dot.offline {
    background: #ef4444;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.chat-title {
    font-weight: 600;
    font-size: 16px;
}

.chat-header-actions {
    display: flex;
    gap: 8px;
}

.chat-header-actions button {
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.3s ease;
}

.chat-header-actions button:hover {
    background: rgba(255,255,255,0.3);
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background: #f8fafc;
}

.message {
    margin-bottom: 12px;
    display: flex;
}

.message.user {
    justify-content: flex-end;
}

.message.agent {
    justify-content: flex-start;
}

.message.system {
    justify-content: center;
}

.message-content {
    max-width: 70%;
    padding: 10px 14px;
    border-radius: 12px;
    position: relative;
    word-wrap: break-word;
}

.message.user .message-content {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-bottom-right-radius: 4px;
}

.message.agent .message-content {
    background: white;
    color: #1e293b;
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.message.system .message-content {
    background: transparent;
    color: #64748b;
    font-size: 13px;
    padding: 5px 10px;
}

.message-time {
    font-size: 11px;
    opacity: 0.7;
    margin-top: 4px;
}

.quick-replies {
    padding: 0 16px 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.quick-reply {
    padding: 8px 16px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    color: #475569;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.quick-reply:hover {
    background: #667eea;
    color: white;
    border-color: #667eea;
}

.chat-typing {
    padding: 12px 16px;
    background: white;
    border-top: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #64748b;
    font-size: 14px;
}

.typing-dots {
    display: flex;
    gap: 4px;
}

.typing-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #94a3b8;
    animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes typing {
    0%, 60%, 100% {
        transform: translateY(0);
    }
    30% {
        transform: translateY(-10px);
    }
}

.chat-input {
    padding: 12px;
    background: white;
    border-top: 1px solid #e2e8f0;
    border-radius: 0 0 12px 12px;
}

.chat-input form {
    display: flex;
    gap: 8px;
}

.chat-input input {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 24px;
    outline: none;
    font-size: 14px;
}

.chat-input input:focus {
    border-color: #667eea;
}

.chat-input button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: white;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.chat-input button:hover {
    transform: scale(1.1);
}

/* 모바일 반응형 */
@media (max-width: 480px) {
    .chat-container {
        width: 100%;
        height: 100%;
        right: 0;
        bottom: 0;
        border-radius: 0;
    }
    
    .chat-header {
        border-radius: 0;
    }
    
    .chat-input {
        border-radius: 0;
    }
}
</style>
`;

// 스타일 삽입
document.head.insertAdjacentHTML('beforeend', chatStyles);

// 전역 인스턴스 생성
let chatSupport = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 채팅 위젯 초기화
    chatSupport = new ChatSupport();

    // 전역 함수 등록
    window.chatSupport = chatSupport;
});
