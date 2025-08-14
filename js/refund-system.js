// 환불 처리 시스템 - KG이니시스 연동
const API_URL = 'https://marketgrow-production-c586.up.railway.app/api';

// KG이니시스 환불 설정
const INICIS_REFUND_CONFIG = {
    mid: 'INIpayTest', // 실제 상점 ID
    signKey: 'SU5JTElURV9UUklQTEVERVNfS0VZU1RS', // 실제 사인키
    apiUrl: 'https://iniapi.inicis.com/api/v1/refund'
};

class RefundSystem {
    constructor() {
        this.currentOrder = null;
        this.refundReason = '';
        this.refundAmount = 0;
    }

    // 환불 가능 여부 확인
    async checkRefundEligibility(orderId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/orders/${orderId}/refund-check`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                return {
                    eligible: data.data.eligible,
                    reason: data.data.reason,
                    maxRefundAmount: data.data.maxRefundAmount,
                    refundDeadline: data.data.refundDeadline
                };
            }
            
            return {
                eligible: false,
                reason: data.message || '환불 불가'
            };
        } catch (error) {
            console.error('환불 가능 여부 확인 오류:', error);
            return {
                eligible: false,
                reason: '시스템 오류'
            };
        }
    }

    // 환불 요청
    async requestRefund(orderId, refundData) {
        try {
            const token = localStorage.getItem('authToken');
            
            // 환불 요청 데이터
            const requestData = {
                orderId: orderId,
                reason: refundData.reason,
                amount: refundData.amount,
                bankAccount: refundData.bankAccount || null,
                refundType: refundData.type || 'full' // full, partial
            };

            const response = await fetch(`${API_URL}/refunds/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (data.success) {
                return {
                    success: true,
                    refundId: data.data.refundId,
                    status: data.data.status,
                    message: '환불 요청이 접수되었습니다.'
                };
            } else {
                return {
                    success: false,
                    message: data.message || '환불 요청 실패'
                };
            }
        } catch (error) {
            console.error('환불 요청 오류:', error);
            return {
                success: false,
                message: '환불 요청 중 오류가 발생했습니다.'
            };
        }
    }

    // KG이니시스 환불 처리
    async processInicisRefund(paymentInfo, refundAmount) {
        try {
            // 환불 요청 데이터 생성
            const refundData = {
                mid: INICIS_REFUND_CONFIG.mid,
                tid: paymentInfo.tid, // 원거래 TID
                amount: refundAmount,
                reason: this.refundReason,
                timestamp: new Date().getTime()
            };

            // 서명 생성
            refundData.signature = this.generateSignature(refundData);

            // KG이니시스 API 호출 (백엔드 경유)
            const response = await fetch(`${API_URL}/payments/inicis-refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(refundData)
            });

            const result = await response.json();

            if (result.success) {
                return {
                    success: true,
                    refundTid: result.data.refundTid,
                    refundDate: result.data.refundDate,
                    message: '환불이 완료되었습니다.'
                };
            } else {
                return {
                    success: false,
                    message: result.message || '환불 처리 실패'
                };
            }
        } catch (error) {
            console.error('KG이니시스 환불 처리 오류:', error);
            return {
                success: false,
                message: '환불 처리 중 오류가 발생했습니다.'
            };
        }
    }

    // 서명 생성
    generateSignature(data) {
        // 실제로는 서버에서 생성해야 함
        const signString = `${data.mid}${data.tid}${data.amount}${data.timestamp}${INICIS_REFUND_CONFIG.signKey}`;
        // SHA-256 해시 (실제로는 crypto 라이브러리 사용)
        return btoa(signString); // 임시 인코딩
    }

    // 환불 상태 조회
    async getRefundStatus(refundId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/refunds/${refundId}/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                return data.data;
            }
            
            return null;
        } catch (error) {
            console.error('환불 상태 조회 오류:', error);
            return null;
        }
    }

    // 환불 내역 조회
    async getRefundHistory() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/refunds/history`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                return data.data.refunds;
            }
            
            return [];
        } catch (error) {
            console.error('환불 내역 조회 오류:', error);
            return [];
        }
    }

    // 환불 금액 계산
    calculateRefundAmount(order) {
        // 서비스 진행 상태에 따른 환불 금액 계산
        const totalAmount = order.totalPrice;
        const deliveredPercentage = (order.delivered || 0) / order.quantity;
        
        // 환불 정책
        if (order.status === 'pending') {
            // 대기중: 100% 환불
            return totalAmount;
        } else if (order.status === 'processing') {
            // 처리중: 90% 환불
            return Math.floor(totalAmount * 0.9);
        } else if (order.status === 'in_progress') {
            // 진행중: 미배송 부분만 환불
            const undeliveredPercentage = 1 - deliveredPercentage;
            return Math.floor(totalAmount * undeliveredPercentage);
        } else {
            // 완료: 환불 불가
            return 0;
        }
    }

    // 환불 사유 유효성 검사
    validateRefundReason(reason) {
        const minLength = 10;
        const maxLength = 500;
        
        if (!reason || reason.trim().length < minLength) {
            return {
                valid: false,
                message: `환불 사유는 최소 ${minLength}자 이상 입력해주세요.`
            };
        }
        
        if (reason.length > maxLength) {
            return {
                valid: false,
                message: `환불 사유는 ${maxLength}자를 초과할 수 없습니다.`
            };
        }
        
        return {
            valid: true
        };
    }
}

// 환불 UI 컴포넌트
class RefundUI {
    constructor() {
        this.refundSystem = new RefundSystem();
        this.modal = null;
    }

    // 환불 모달 표시
    showRefundModal(order) {
        // 기존 모달 제거
        this.closeModal();

        // 환불 가능 여부 확인
        this.refundSystem.checkRefundEligibility(order._id).then(eligibility => {
            if (!eligibility.eligible) {
                alert(`환불 불가: ${eligibility.reason}`);
                return;
            }

            // 환불 금액 계산
            const refundAmount = this.refundSystem.calculateRefundAmount(order);

            // 모달 생성
            this.createModal(order, refundAmount, eligibility);
        });
    }

    // 모달 생성
    createModal(order, refundAmount, eligibility) {
        const modal = document.createElement('div');
        modal.className = 'refund-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="refundUI.closeModal()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>환불 요청</h2>
                    <button class="close-btn" onclick="refundUI.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="refund-info">
                        <h3>주문 정보</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>주문번호</label>
                                <span>${order._id}</span>
                            </div>
                            <div class="info-item">
                                <label>서비스</label>
                                <span>${order.serviceName}</span>
                            </div>
                            <div class="info-item">
                                <label>결제금액</label>
                                <span>₩${order.totalPrice.toLocaleString()}</span>
                            </div>
                            <div class="info-item">
                                <label>진행상태</label>
                                <span>${this.getStatusText(order.status)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="refund-amount">
                        <h3>환불 금액</h3>
                        <div class="amount-display">
                            <span class="amount">₩${refundAmount.toLocaleString()}</span>
                            <small>최대 환불 가능 금액</small>
                        </div>
                        ${eligibility.refundDeadline ? `
                            <p class="deadline">환불 가능 기한: ${new Date(eligibility.refundDeadline).toLocaleDateString()}</p>
                        ` : ''}
                    </div>
                    
                    <div class="refund-reason">
                        <h3>환불 사유</h3>
                        <select id="refundReasonType" onchange="refundUI.onReasonTypeChange()">
                            <option value="">선택하세요</option>
                            <option value="service_issue">서비스 문제</option>
                            <option value="wrong_order">잘못된 주문</option>
                            <option value="delay">처리 지연</option>
                            <option value="change_mind">단순 변심</option>
                            <option value="other">기타</option>
                        </select>
                        <textarea id="refundReasonDetail" 
                                  placeholder="상세한 환불 사유를 입력해주세요 (최소 10자)"
                                  rows="4"></textarea>
                    </div>
                    
                    <div class="refund-method">
                        <h3>환불 방법</h3>
                        <div class="method-options">
                            <label>
                                <input type="radio" name="refundMethod" value="original" checked>
                                <span>원결제 수단으로 환불</span>
                            </label>
                            <label>
                                <input type="radio" name="refundMethod" value="bank">
                                <span>계좌 환불</span>
                            </label>
                        </div>
                        
                        <div id="bankInfo" style="display: none;">
                            <input type="text" id="bankName" placeholder="은행명">
                            <input type="text" id="accountNumber" placeholder="계좌번호">
                            <input type="text" id="accountHolder" placeholder="예금주명">
                        </div>
                    </div>
                    
                    <div class="refund-notice">
                        <h4>환불 안내</h4>
                        <ul>
                            <li>환불 요청 후 검토를 거쳐 승인됩니다.</li>
                            <li>승인 후 3-5 영업일 내 환불 처리됩니다.</li>
                            <li>부분 진행된 서비스는 진행률에 따라 환불됩니다.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-cancel" onclick="refundUI.closeModal()">취소</button>
                    <button class="btn-submit" onclick="refundUI.submitRefund('${order._id}', ${refundAmount})">
                        환불 요청
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;

        // 이벤트 리스너 설정
        this.setupEventListeners();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 환불 방법 변경
        const methodRadios = document.querySelectorAll('input[name="refundMethod"]');
        methodRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const bankInfo = document.getElementById('bankInfo');
                bankInfo.style.display = e.target.value === 'bank' ? 'block' : 'none';
            });
        });
    }

    // 환불 사유 타입 변경
    onReasonTypeChange() {
        const reasonType = document.getElementById('refundReasonType').value;
        const reasonDetail = document.getElementById('refundReasonDetail');
        
        const templates = {
            'service_issue': '서비스 진행 중 문제가 발생했습니다. ',
            'wrong_order': '잘못된 서비스를 주문했습니다. ',
            'delay': '처리가 너무 지연되고 있습니다. ',
            'change_mind': '개인 사정으로 인해 서비스가 더 이상 필요하지 않습니다. '
        };
        
        if (templates[reasonType]) {
            reasonDetail.value = templates[reasonType];
        }
    }

    // 환불 요청 제출
    async submitRefund(orderId, maxAmount) {
        // 입력값 검증
        const reasonType = document.getElementById('refundReasonType').value;
        const reasonDetail = document.getElementById('refundReasonDetail').value;
        
        if (!reasonType) {
            alert('환불 사유를 선택해주세요.');
            return;
        }
        
        const validation = this.refundSystem.validateRefundReason(reasonDetail);
        if (!validation.valid) {
            alert(validation.message);
            return;
        }
        
        // 환불 방법
        const refundMethod = document.querySelector('input[name="refundMethod"]:checked').value;
        let bankAccount = null;
        
        if (refundMethod === 'bank') {
            const bankName = document.getElementById('bankName').value;
            const accountNumber = document.getElementById('accountNumber').value;
            const accountHolder = document.getElementById('accountHolder').value;
            
            if (!bankName || !accountNumber || !accountHolder) {
                alert('계좌 정보를 모두 입력해주세요.');
                return;
            }
            
            bankAccount = {
                bankName,
                accountNumber,
                accountHolder
            };
        }
        
        // 환불 요청
        const refundData = {
            reason: `[${reasonType}] ${reasonDetail}`,
            amount: maxAmount,
            type: 'full',
            bankAccount
        };
        
        const result = await this.refundSystem.requestRefund(orderId, refundData);
        
        if (result.success) {
            alert('환불 요청이 접수되었습니다.\n검토 후 처리 결과를 알려드리겠습니다.');
            this.closeModal();
            
            // 페이지 새로고침
            if (window.location.pathname.includes('order-tracking')) {
                window.refreshTracking();
            }
        } else {
            alert(result.message);
        }
    }

    // 모달 닫기
    closeModal() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }

    // 상태 텍스트
    getStatusText(status) {
        const statusMap = {
            'pending': '대기중',
            'processing': '처리중',
            'in_progress': '진행중',
            'completed': '완료'
        };
        return statusMap[status] || status;
    }
}

// 전역 인스턴스 생성
const refundSystem = new RefundSystem();
const refundUI = new RefundUI();

// 전역 함수 등록
window.refundSystem = refundSystem;
window.refundUI = refundUI;