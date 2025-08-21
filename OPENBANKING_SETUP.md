# 농협 오픈뱅킹 API 자동 입금 확인 시스템 설정 가이드

## 🏦 자동 입금 확인 시스템 고도화 완료!

전문가 피드백을 반영하여 **안전하고 신뢰할 수 있는** 자동 입금 확인 시스템으로 업그레이드되었습니다.

### ✨ 새로운 기능
- **멱등성 보장**: 중복 처리 완전 방지
- **고도화된 매칭**: 이름 유사도 검사, 편집거리 알고리즘
- **보안 강화**: 감사 로그, 토큰 영구 저장
- **안정성 향상**: 5분 폴링, 안전망 시스템

## 1. 농협 오픈뱅킹 API 신청

### 1.1 오픈뱅킹 가입
1. https://www.openbanking.or.kr 접속
2. 기업회원 가입
3. 사업자등록증 첨부
4. 승인 대기 (1-2일)

### 1.2 API 이용 신청
1. 마이페이지 → API 관리
2. "API 이용신청" 클릭
3. 서비스 정보 입력:
   - 서비스명: MarketGrow
   - 서비스 URL: https://marketgrow.kr
   - Redirect URI: https://marketgrow.kr/api/openbanking/callback
4. 권한 범위:
   - ✅ 계좌조회 (inquiry)
   - ✅ 거래내역조회 (inquiry)
   - ⬜ 이체 (transfer) - 불필요

### 1.3 농협은행 계좌 등록
1. 농협 인터넷뱅킹 로그인
2. 오픈뱅킹 → 계좌등록
3. 계좌번호: 301-0373-3754-01
4. 핀테크이용번호 발급받기
5. 이용기관: MarketGrow 선택

## 2. 환경변수 설정 (업그레이드됨)

### 🔥 필수 환경변수 (전문가 피드백 반영)

```env
# 오픈뱅킹 API 설정 (업그레이드)
OPENBANKING_BASE_URL=https://openapi.openbanking.or.kr  # 운영: openapi, 테스트: testapi
OPENBANKING_CLIENT_ID=[발급받은 Client ID]
OPENBANKING_CLIENT_SECRET=[발급받은 Client Secret] 
OPENBANKING_CLIENT_USE_CODE=[9자리 기관코드]  # 새로 추가
OPENBANKING_REDIRECT_URI=https://marketgrow.kr/api/openbanking/callback  # 경로 변경
OPENBANKING_STATE=marketgrow_oauth_state  # CSRF 방지용

# 농협 계좌 정보
NH_ACCOUNT_NUMBER=3010373375401
NH_ACCOUNT_HOLDER=박시현
NH_FINTECH_USE_NUM=[34자리 핀테크이용번호]  # 정확한 자릿수

# 관리자 설정 (보안 강화)
ADMIN_EMAIL=admin@marketgrow.kr
ADMIN_SECRET=[강력한 관리자 시크릿 키]  # 최소 20자 이상

# 알림 설정 (선택)
SMS_ENABLED=false  # SMS 알림 사용 여부
```

### 📱 Railway/Render 배포 시
위 환경변수를 각 플랫폼의 환경변수 설정에서 추가하세요.

## 3. 시스템 동작 방식 (고도화됨)

### 🔄 자동 확인 주기 (멱등성 보장)
- **실시간**: 5분마다 자동 확인 (중복 처리 방지)
- **안전망**: 매시 정각 보조 확인
- **일일 정산**: 매일 자정 (미매칭 건 처리)

### 🎯 입금 처리 프로세스 (업그레이드)
1. 고객이 농협 301-0373-3754-01로 입금
2. **5분 이내** 자동 감지 (API 실시간 조회)
3. **고도화된 매칭** 알고리즘으로 정확한 연결
4. 예치금 잔액 **즉시 반영** (트랜잭션 보장)
5. 고객에게 **자동 알림** 발송 (이메일/SMS)
6. **감사 로그** 기록 (보안 추적)

### 🧠 고도화된 매칭 알고리즘
1. **1차**: 정확 매칭 (입금자명 + 금액)
2. **2차**: 유사 이름 매칭 (편집거리 80% 이상)
3. **3차**: 금액 매칭 (최근 6시간 내)
4. **실패 시**: 미매칭으로 분류 → 관리자 알림

### 🔒 보안 및 안정성
- **멱등성**: 동일 거래 중복 처리 불가
- **토큰 관리**: DB 영구 저장, 자동 갱신
- **감사 로그**: 모든 API 호출 기록
- **에러 복구**: 실패 시 자동 재시도

## 4. 관리자 기능 (업그레이드됨)

### 💼 새로운 API 엔드포인트
- **기존**: `/api/webhook/*` → **변경**: `/api/openbanking/*`
- **OAuth 콜백**: `/api/openbanking/callback`
- **계좌 정보**: `/api/openbanking/account/info`
- **거래 내역**: `/api/openbanking/transactions`

### 🚨 수동 입금 확인 (긴급 시)
```bash
curl -X POST https://marketgrow.kr/api/openbanking/check-deposits \
  -H "Authorization: Bearer [ADMIN_SECRET]"
```

### 📊 스케줄러 상태 확인 (상세 정보)
```bash
curl https://marketgrow.kr/api/openbanking/scheduler-status
```

응답 (상세 통계):
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "isChecking": false,
    "tasks": 3,
    "lastCheckTime": "2024-01-15T10:30:00Z",
    "nextCheck": "5분 이내",
    "statistics": {
      "totalChecks": 1440,
      "successfulChecks": 1435,
      "errors": 5,
      "successRate": "99%",
      "lastError": null
    },
    "health": {
      "status": "healthy",
      "lastActivity": "2 minutes ago"
    }
  }
}
```

### 🏦 계좌 정보 조회
```bash
curl https://marketgrow.kr/api/openbanking/account/info \
  -H "Authorization: Bearer [ADMIN_SECRET]"
```

### 📈 거래 내역 조회
```bash
curl "https://marketgrow.kr/api/openbanking/transactions?fromDate=2024-01-01&toDate=2024-01-15" \
  -H "Authorization: Bearer [ADMIN_SECRET]"
```

## 5. 테스트 방법

### 5.1 개발 환경 테스트
1. 소액 입금 (10,000원)
2. 5분 대기
3. 대시보드에서 잔액 확인

### 5.2 로그 확인
Render Dashboard → Logs에서:
```
💰 Deposit auto-check scheduler started
Running realtime deposit check...
Auto-confirmed deposit: User test@example.com, Amount: 10000
```

## 6. 문제 해결

### API 연결 실패
- Client ID/Secret 확인
- 오픈뱅킹 API 상태 확인

### 입금 미반영
- 입금자명 정확히 입력했는지 확인
- 5분 이상 기다렸는지 확인
- 로그에서 "Unmatched deposit" 확인

### 스케줄러 중지
- Render 서비스 재시작
- 환경변수 확인

## 7. 보안 주의사항

1. **API Secret 노출 금지**
2. **핀테크이용번호 보안 관리**
3. **Webhook URL HTTPS 필수**
4. **관리자 시크릿 키 정기 변경**

## 8. 모니터링

### 대시보드 지표
- 일일 입금 건수
- 자동 매칭률
- 평균 처리 시간

### 알림 설정
- 미매칭 입금 발생 시
- 스케줄러 오류 시
- 대량 입금 감지 시

---

## ✅ 설정 완료 체크리스트

- [ ] 오픈뱅킹 API 가입
- [ ] Client ID/Secret 발급
- [ ] 농협 계좌 등록
- [ ] 핀테크이용번호 발급
- [ ] Render 환경변수 설정
- [ ] 테스트 입금 확인
- [ ] 관리자 알림 테스트

설정 완료 후 **예치금이 5분 이내 자동 반영**됩니다! 🎉