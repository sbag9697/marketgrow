// 영수증 발급 시스템
const API_URL = 'https://marketgrow-production-c586.up.railway.app/api';

// 사업자 정보 (실제 정보)
const BUSINESS_INFO = {
    companyName: 'SNS그로우',
    businessNumber: '154-38-01411',
    representative: '박시현',
    phone: '010-5772-8658',
    email: 'marketgrow.kr@gmail.com',
    taxInvoiceEmail: 'tax@marketgrow.kr'
};

class ReceiptSystem {
    constructor() {
        this.currentReceipt = null;
    }

    // 영수증 발급 요청
    async requestReceipt(orderId, receiptType = 'simple') {
        try {
            const token = localStorage.getItem('authToken');
            
            const requestData = {
                orderId: orderId,
                receiptType: receiptType, // simple, tax, cash
                businessInfo: receiptType === 'tax' ? this.getBusinessInfo() : null
            };

            const response = await fetch(`${API_URL}/receipts/issue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (data.success) {
                this.currentReceipt = data.data;
                return {
                    success: true,
                    receiptId: data.data.receiptId,
                    downloadUrl: data.data.downloadUrl
                };
            }

            return {
                success: false,
                message: data.message || '영수증 발급 실패'
            };
        } catch (error) {
            console.error('영수증 발급 오류:', error);
            return {
                success: false,
                message: '영수증 발급 중 오류가 발생했습니다.'
            };
        }
    }

    // 세금계산서 발급
    async issueTaxInvoice(orderId, buyerInfo) {
        try {
            const token = localStorage.getItem('authToken');
            
            const requestData = {
                orderId: orderId,
                buyerInfo: {
                    businessNumber: buyerInfo.businessNumber,
                    companyName: buyerInfo.companyName,
                    representative: buyerInfo.representative,
                    address: buyerInfo.address,
                    businessType: buyerInfo.businessType,
                    businessItem: buyerInfo.businessItem,
                    email: buyerInfo.email
                },
                sellerInfo: BUSINESS_INFO
            };

            const response = await fetch(`${API_URL}/receipts/tax-invoice`, {
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
                    invoiceNumber: data.data.invoiceNumber,
                    issueDate: data.data.issueDate,
                    downloadUrl: data.data.downloadUrl
                };
            }

            return {
                success: false,
                message: data.message || '세금계산서 발급 실패'
            };
        } catch (error) {
            console.error('세금계산서 발급 오류:', error);
            return {
                success: false,
                message: '세금계산서 발급 중 오류가 발생했습니다.'
            };
        }
    }

    // 현금영수증 발급
    async issueCashReceipt(orderId, cashReceiptInfo) {
        try {
            const token = localStorage.getItem('authToken');
            
            const requestData = {
                orderId: orderId,
                purpose: cashReceiptInfo.purpose, // income (소득공제), expense (지출증빙)
                identityNumber: cashReceiptInfo.identityNumber, // 휴대폰번호, 사업자번호, 현금영수증카드번호
                identityType: cashReceiptInfo.identityType // phone, business, card
            };

            const response = await fetch(`${API_URL}/receipts/cash-receipt`, {
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
                    approvalNumber: data.data.approvalNumber,
                    issueDate: data.data.issueDate,
                    downloadUrl: data.data.downloadUrl
                };
            }

            return {
                success: false,
                message: data.message || '현금영수증 발급 실패'
            };
        } catch (error) {
            console.error('현금영수증 발급 오류:', error);
            return {
                success: false,
                message: '현금영수증 발급 중 오류가 발생했습니다.'
            };
        }
    }

    // 영수증 다운로드
    async downloadReceipt(receiptId) {
        try {
            const token = localStorage.getItem('authToken');
            
            const response = await fetch(`${API_URL}/receipts/${receiptId}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `receipt_${receiptId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                return { success: true };
            }

            return { success: false };
        } catch (error) {
            console.error('영수증 다운로드 오류:', error);
            return { success: false };
        }
    }

    // 영수증 이메일 전송
    async sendReceiptByEmail(receiptId, email) {
        try {
            const token = localStorage.getItem('authToken');
            
            const response = await fetch(`${API_URL}/receipts/${receiptId}/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('영수증 이메일 전송 오류:', error);
            return { success: false };
        }
    }

    // 영수증 미리보기 생성
    generateReceiptPreview(order) {
        const now = new Date();
        const receiptNumber = `MG${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${order._id.slice(-6)}`;
        
        return `
            <div class="receipt-preview">
                <div class="receipt-header">
                    <h2>영수증</h2>
                    <p class="receipt-number">No. ${receiptNumber}</p>
                </div>
                
                <div class="receipt-info">
                    <div class="info-section">
                        <h3>공급자</h3>
                        <table>
                            <tr>
                                <td>상호</td>
                                <td>${BUSINESS_INFO.companyName}</td>
                            </tr>
                            <tr>
                                <td>사업자번호</td>
                                <td>${this.formatBusinessNumber(BUSINESS_INFO.businessNumber)}</td>
                            </tr>
                            <tr>
                                <td>대표자</td>
                                <td>${BUSINESS_INFO.representative}</td>
                            </tr>
                            <tr>
                                <td>연락처</td>
                                <td>${BUSINESS_INFO.phone}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div class="info-section">
                        <h3>거래 내역</h3>
                        <table>
                            <tr>
                                <td>주문번호</td>
                                <td>${order._id}</td>
                            </tr>
                            <tr>
                                <td>주문일시</td>
                                <td>${this.formatDate(order.createdAt)}</td>
                            </tr>
                            <tr>
                                <td>서비스명</td>
                                <td>${order.serviceName}</td>
                            </tr>
                            <tr>
                                <td>수량</td>
                                <td>${order.quantity.toLocaleString()}개</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <div class="receipt-amount">
                    <table>
                        <tr>
                            <td>공급가액</td>
                            <td>₩${Math.floor(order.totalPrice / 1.1).toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td>부가세</td>
                            <td>₩${(order.totalPrice - Math.floor(order.totalPrice / 1.1)).toLocaleString()}</td>
                        </tr>
                        <tr class="total">
                            <td>합계</td>
                            <td>₩${order.totalPrice.toLocaleString()}</td>
                        </tr>
                    </table>
                </div>
                
                <div class="receipt-footer">
                    <p>발행일: ${this.formatDate(new Date())}</p>
                    <p>본 영수증은 전자적으로 발행되었습니다.</p>
                </div>
            </div>
        `;
    }

    // 사업자번호 포맷
    formatBusinessNumber(number) {
        const cleaned = number.replace(/[^0-9]/g, '');
        if (cleaned.length === 10) {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
        }
        return number;
    }

    // 날짜 포맷
    formatDate(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    // 사업자 정보 가져오기
    getBusinessInfo() {
        return BUSINESS_INFO;
    }
}

// 영수증 UI 컴포넌트
class ReceiptUI {
    constructor() {
        this.receiptSystem = new ReceiptSystem();
        this.modal = null;
    }

    // 영수증 모달 표시
    showReceiptModal(order) {
        this.closeModal();
        
        const modal = document.createElement('div');
        modal.className = 'receipt-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="receiptUI.closeModal()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>영수증 발급</h2>
                    <button class="close-btn" onclick="receiptUI.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="receipt-types">
                        <h3>영수증 종류 선택</h3>
                        <div class="type-options">
                            <label class="type-option">
                                <input type="radio" name="receiptType" value="simple" checked>
                                <div class="option-content">
                                    <i class="fas fa-receipt"></i>
                                    <span>간이영수증</span>
                                    <small>일반 구매 증빙용</small>
                                </div>
                            </label>
                            
                            <label class="type-option">
                                <input type="radio" name="receiptType" value="tax">
                                <div class="option-content">
                                    <i class="fas fa-file-invoice"></i>
                                    <span>세금계산서</span>
                                    <small>사업자 세금 처리용</small>
                                </div>
                            </label>
                            
                            <label class="type-option">
                                <input type="radio" name="receiptType" value="cash">
                                <div class="option-content">
                                    <i class="fas fa-money-bill"></i>
                                    <span>현금영수증</span>
                                    <small>소득공제/지출증빙용</small>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <!-- 세금계산서 정보 입력 -->
                    <div id="taxInvoiceInfo" style="display: none;">
                        <h3>세금계산서 정보</h3>
                        <div class="form-group">
                            <input type="text" id="taxBusinessNumber" placeholder="사업자등록번호 (10자리)">
                            <input type="text" id="taxCompanyName" placeholder="상호명">
                            <input type="text" id="taxRepresentative" placeholder="대표자명">
                            <input type="text" id="taxAddress" placeholder="사업장 주소">
                            <input type="text" id="taxBusinessType" placeholder="업태">
                            <input type="text" id="taxBusinessItem" placeholder="종목">
                            <input type="email" id="taxEmail" placeholder="이메일 주소">
                        </div>
                    </div>
                    
                    <!-- 현금영수증 정보 입력 -->
                    <div id="cashReceiptInfo" style="display: none;">
                        <h3>현금영수증 정보</h3>
                        <div class="form-group">
                            <select id="cashPurpose">
                                <option value="income">소득공제용</option>
                                <option value="expense">지출증빙용</option>
                            </select>
                            <select id="cashIdentityType">
                                <option value="phone">휴대폰번호</option>
                                <option value="business">사업자번호</option>
                                <option value="card">현금영수증카드</option>
                            </select>
                            <input type="text" id="cashIdentityNumber" placeholder="번호 입력">
                        </div>
                    </div>
                    
                    <!-- 영수증 미리보기 -->
                    <div class="receipt-preview-container">
                        <h3>미리보기</h3>
                        ${this.receiptSystem.generateReceiptPreview(order)}
                    </div>
                    
                    <div class="receipt-actions">
                        <label>
                            <input type="checkbox" id="sendEmail">
                            이메일로 받기
                        </label>
                        <input type="email" id="receiptEmail" placeholder="이메일 주소" style="display: none;">
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-cancel" onclick="receiptUI.closeModal()">취소</button>
                    <button class="btn-submit" onclick="receiptUI.issueReceipt('${order._id}')">
                        <i class="fas fa-download"></i> 발급 및 다운로드
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;
        this.setupEventListeners();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 영수증 타입 변경
        const typeRadios = document.querySelectorAll('input[name="receiptType"]');
        typeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.getElementById('taxInvoiceInfo').style.display = 
                    e.target.value === 'tax' ? 'block' : 'none';
                document.getElementById('cashReceiptInfo').style.display = 
                    e.target.value === 'cash' ? 'block' : 'none';
            });
        });

        // 이메일 전송 체크박스
        const sendEmailCheck = document.getElementById('sendEmail');
        if (sendEmailCheck) {
            sendEmailCheck.addEventListener('change', (e) => {
                document.getElementById('receiptEmail').style.display = 
                    e.target.checked ? 'block' : 'none';
            });
        }

        // 현금영수증 용도 변경
        const cashPurpose = document.getElementById('cashPurpose');
        if (cashPurpose) {
            cashPurpose.addEventListener('change', (e) => {
                const identityType = document.getElementById('cashIdentityType');
                if (e.target.value === 'expense') {
                    // 지출증빙용은 사업자번호만 가능
                    identityType.value = 'business';
                    identityType.disabled = true;
                } else {
                    identityType.disabled = false;
                }
            });
        }
    }

    // 영수증 발급
    async issueReceipt(orderId) {
        const receiptType = document.querySelector('input[name="receiptType"]:checked').value;
        let result;

        try {
            if (receiptType === 'simple') {
                // 간이영수증
                result = await this.receiptSystem.requestReceipt(orderId, 'simple');
                
            } else if (receiptType === 'tax') {
                // 세금계산서
                const taxInfo = {
                    businessNumber: document.getElementById('taxBusinessNumber').value,
                    companyName: document.getElementById('taxCompanyName').value,
                    representative: document.getElementById('taxRepresentative').value,
                    address: document.getElementById('taxAddress').value,
                    businessType: document.getElementById('taxBusinessType').value,
                    businessItem: document.getElementById('taxBusinessItem').value,
                    email: document.getElementById('taxEmail').value
                };

                // 유효성 검사
                if (!this.validateTaxInfo(taxInfo)) {
                    return;
                }

                result = await this.receiptSystem.issueTaxInvoice(orderId, taxInfo);
                
            } else if (receiptType === 'cash') {
                // 현금영수증
                const cashInfo = {
                    purpose: document.getElementById('cashPurpose').value,
                    identityType: document.getElementById('cashIdentityType').value,
                    identityNumber: document.getElementById('cashIdentityNumber').value
                };

                // 유효성 검사
                if (!this.validateCashInfo(cashInfo)) {
                    return;
                }

                result = await this.receiptSystem.issueCashReceipt(orderId, cashInfo);
            }

            if (result.success) {
                // 이메일 전송 옵션 확인
                const sendEmail = document.getElementById('sendEmail').checked;
                if (sendEmail) {
                    const email = document.getElementById('receiptEmail').value;
                    if (email) {
                        await this.receiptSystem.sendReceiptByEmail(result.receiptId, email);
                    }
                }

                // 다운로드
                if (result.downloadUrl) {
                    window.open(result.downloadUrl, '_blank');
                } else if (result.receiptId) {
                    await this.receiptSystem.downloadReceipt(result.receiptId);
                }

                alert('영수증이 발급되었습니다.');
                this.closeModal();
            } else {
                alert(result.message || '영수증 발급에 실패했습니다.');
            }
        } catch (error) {
            console.error('영수증 발급 오류:', error);
            alert('영수증 발급 중 오류가 발생했습니다.');
        }
    }

    // 세금계산서 정보 유효성 검사
    validateTaxInfo(info) {
        if (!info.businessNumber || info.businessNumber.length !== 10) {
            alert('사업자등록번호를 올바르게 입력해주세요.');
            return false;
        }
        if (!info.companyName || !info.representative) {
            alert('상호명과 대표자명을 입력해주세요.');
            return false;
        }
        if (!info.email || !this.validateEmail(info.email)) {
            alert('올바른 이메일 주소를 입력해주세요.');
            return false;
        }
        return true;
    }

    // 현금영수증 정보 유효성 검사
    validateCashInfo(info) {
        if (!info.identityNumber) {
            alert('번호를 입력해주세요.');
            return false;
        }
        
        // 번호 형식 검사
        const cleaned = info.identityNumber.replace(/[^0-9]/g, '');
        if (info.identityType === 'phone' && cleaned.length !== 11) {
            alert('휴대폰번호를 올바르게 입력해주세요.');
            return false;
        }
        if (info.identityType === 'business' && cleaned.length !== 10) {
            alert('사업자번호를 올바르게 입력해주세요.');
            return false;
        }
        
        return true;
    }

    // 이메일 유효성 검사
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // 모달 닫기
    closeModal() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }
}

// 전역 인스턴스 생성
const receiptSystem = new ReceiptSystem();
const receiptUI = new ReceiptUI();

// 전역 함수 등록
window.receiptSystem = receiptSystem;
window.receiptUI = receiptUI;