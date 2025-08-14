// 고객 상담 관리 시스템
class SupportManager {
    constructor() {
        this.apiBase = '/.netlify/functions';
        this.currentTickets = [];
        this.init();
    }

    init() {
        this.createSupportWidget();
        this.loadUserTickets();
    }

    // 상담 위젯 생성 (우측 하단 플로팅 버튼)
    createSupportWidget() {
        const widget = document.createElement('div');
        widget.className = 'support-widget';
        widget.innerHTML = `
            <div class="support-toggle" onclick="supportManager.toggleWidget()">
                <i class="fas fa-headset"></i>
                <span class="support-badge" id="supportBadge" style="display: none;">!</span>
            </div>
            <div class="support-panel" id="supportPanel" style="display: none;">
                <div class="support-header">
                    <h3>고객상담</h3>
                    <button onclick="supportManager.toggleWidget()" class="close-btn">&times;</button>
                </div>
                <div class="support-content">
                    <div class="support-options">
                        <button class="support-btn kakao" onclick="supportManager.connectKakao()">
                            <i class="fas fa-comment"></i>
                            카카오톡 상담
                        </button>
                        <button class="support-btn telegram" onclick="supportManager.connectTelegram()">
                            <i class="fab fa-telegram"></i>
                            텔레그램 상담
                        </button>
                        <button class="support-btn email" onclick="supportManager.openTicketForm()">
                            <i class="fas fa-envelope"></i>
                            이메일 문의
                        </button>
                        <button class="support-btn phone" onclick="supportManager.showContact()">
                            <i class="fas fa-phone"></i>
                            전화 상담
                        </button>
                    </div>
                    <div class="recent-tickets" id="recentTickets">
                        <h4>최근 문의</h4>
                        <div class="tickets-list" id="ticketsList">
                            <p class="no-tickets">문의 내역이 없습니다.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // CSS 스타일 추가
        const style = document.createElement('style');
        style.textContent = `
            .support-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .support-toggle {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
                position: relative;
            }

            .support-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 30px rgba(0,0,0,0.2);
            }

            .support-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ff4757;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
            }

            .support-panel {
                position: absolute;
                bottom: 80px;
                right: 0;
                width: 320px;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                overflow: hidden;
                animation: slideUp 0.3s ease;
            }

            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .support-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .support-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }

            .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .support-content {
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            }

            .support-options {
                display: grid;
                gap: 10px;
                margin-bottom: 20px;
            }

            .support-btn {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 15px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
                text-align: left;
            }

            .support-btn.kakao {
                background: #FEE500;
                color: #000;
            }

            .support-btn.telegram {
                background: #0088cc;
                color: white;
            }

            .support-btn.email {
                background: #7c4dff;
                color: white;
            }

            .support-btn.phone {
                background: #2ed573;
                color: white;
            }

            .support-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }

            .recent-tickets h4 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #666;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
            }

            .ticket-item {
                padding: 8px 0;
                border-bottom: 1px solid #f5f5f5;
                font-size: 12px;
            }

            .ticket-number {
                font-weight: 600;
                color: #667eea;
            }

            .ticket-status {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: 500;
                margin-left: 5px;
            }

            .ticket-status.open { background: #fff3cd; color: #856404; }
            .ticket-status.in_progress { background: #d1ecf1; color: #0c5460; }
            .ticket-status.resolved { background: #d4edda; color: #155724; }

            .no-tickets {
                text-align: center;
                color: #999;
                font-size: 12px;
                padding: 20px 0;
            }

            @media (max-width: 768px) {
                .support-widget {
                    bottom: 15px;
                    right: 15px;
                }
                
                .support-panel {
                    width: 280px;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(widget);
    }

    toggleWidget() {
        const panel = document.getElementById('supportPanel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    // 카카오톡 상담 연결
    async connectKakao() {
        const user = this.getCurrentUser();
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        const phone = prompt('카카오톡 상담을 위해 연락처를 입력해주세요:');
        if (!phone) return;

        try {
            // 먼저 상담 티켓 생성
            const ticket = await this.createQuickTicket('카카오톡 상담 요청', 'general');

            if (ticket.success) {
                // 카카오톡 상담방 연결
                const response = await fetch(`${this.apiBase}/support`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'connect-kakao',
                        ticketId: ticket.ticket.id,
                        phoneNumber: phone
                    })
                });

                const result = await response.json();

                if (result.success) {
                    // 카카오톡 오픈채팅방 링크 제공
                    const kakaoUrl = `https://open.kakao.com/o/s${Math.random().toString(36).substr(2, 8)}`;

                    const modal = this.showModal(`
                        <h3>카카오톡 상담 연결</h3>
                        <p>아래 링크를 클릭하여 카카오톡 상담을 시작하세요:</p>
                        <div style="margin: 15px 0;">
                            <a href="${kakaoUrl}" target="_blank" 
                               style="background: #FEE500; color: #000; padding: 10px 15px; border-radius: 5px; text-decoration: none; display: inline-block;">
                                <i class="fas fa-comment"></i> 카카오톡 상담 시작
                            </a>
                        </div>
                        <p style="font-size: 12px; color: #666;">
                            티켓번호: ${ticket.ticket.ticket_number}<br>
                            상담원이 곧 연결됩니다.
                        </p>
                    `);
                } else {
                    alert('카카오톡 연결에 실패했습니다. 다른 상담 방법을 이용해주세요.');
                }
            }
        } catch (error) {
            console.error('Kakao connection failed:', error);
            alert('연결 중 오류가 발생했습니다.');
        }
    }

    // 텔레그램 상담 연결
    connectTelegram() {
        const telegramUrl = 'https://t.me/socialmarketing_support';

        const modal = this.showModal(`
            <h3>텔레그램 상담</h3>
            <p>텔레그램으로 빠른 상담을 받으세요:</p>
            <div style="margin: 15px 0;">
                <a href="${telegramUrl}" target="_blank" 
                   style="background: #0088cc; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none; display: inline-block;">
                    <i class="fab fa-telegram"></i> 텔레그램 상담 시작
                </a>
            </div>
            <p style="font-size: 12px; color: #666;">
                24시간 빠른 응답을 받을 수 있습니다.
            </p>
        `);
    }

    // 연락처 정보 표시
    showContact() {
        const modal = this.showModal(`
            <h3>전화 상담</h3>
            <div style="text-align: center; margin: 20px 0;">
                <div style="font-size: 24px; color: #667eea; margin-bottom: 10px;">
                    <i class="fas fa-phone"></i>
                </div>
                <div style="font-size: 20px; font-weight: bold; margin-bottom: 5px;">
                    1588-1234
                </div>
                <div style="color: #666; font-size: 14px;">
                    평일 09:00 - 18:00<br>
                    토요일 09:00 - 13:00<br>
                    일요일 및 공휴일 휴무
                </div>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <div style="font-weight: 600; margin-bottom: 5px;">기타 연락처</div>
                <div style="font-size: 14px; color: #666;">
                    이메일: support@socialmarketingpro.com<br>
                    카카오톡: @socialmarketing<br>
                    텔레그램: @socialmarketing_support
                </div>
            </div>
        `);
    }

    // 빠른 티켓 생성
    async createQuickTicket(title, category) {
        try {
            const response = await fetch(`${this.apiBase}/support`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'create-ticket',
                    title,
                    content: `${title} - 자동 생성된 상담 요청`,
                    category
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Quick ticket creation failed:', error);
            return { success: false };
        }
    }

    // 모달 표시
    showModal(content) {
        const modal = document.createElement('div');
        modal.className = 'support-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                ${content}
                <button onclick="this.closest('.support-modal').remove()" 
                        style="margin-top: 15px; padding: 8px 15px; background: #ddd; border: none; border-radius: 4px; cursor: pointer;">
                    닫기
                </button>
            </div>
        `;

        const modalStyle = document.createElement('style');
        modalStyle.textContent = `
            .support-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 20000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
            }
            .modal-content {
                background: white;
                padding: 20px;
                border-radius: 10px;
                max-width: 400px;
                width: 90%;
                position: relative;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
        `;

        document.head.appendChild(modalStyle);
        document.body.appendChild(modal);
        return modal;
    }

    getCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    }

    // 사용자 티켓 로드
    async loadUserTickets() {
        const user = this.getCurrentUser();
        if (!user) return;

        try {
            const response = await fetch(`${this.apiBase}/support?action=get-tickets`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await response.json();
            if (result.success) {
                this.displayTickets(result.tickets);
            }
        } catch (error) {
            console.error('Failed to load tickets:', error);
        }
    }

    displayTickets(tickets) {
        const ticketsList = document.getElementById('ticketsList');

        if (tickets.length === 0) {
            ticketsList.innerHTML = '<p class="no-tickets">문의 내역이 없습니다.</p>';
            return;
        }

        ticketsList.innerHTML = tickets.slice(0, 3).map(ticket => `
            <div class="ticket-item">
                <div class="ticket-number">${ticket.ticket_number}</div>
                <div style="font-size: 11px; color: #999; margin-top: 2px;">
                    ${ticket.title}
                    <span class="ticket-status ${ticket.status}">${this.getStatusText(ticket.status)}</span>
                </div>
            </div>
        `).join('');
    }

    getStatusText(status) {
        const statusMap = {
            open: '접수',
            in_progress: '진행중',
            resolved: '해결완료',
            closed: '종료'
        };
        return statusMap[status] || status;
    }
}

// 전역 인스턴스 생성
const supportManager = new SupportManager();
