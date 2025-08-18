# 농협 오픈뱅킹 API 자동 입금 확인 시스템 설정 가이드

## 🏦 자동 입금 확인 시스템 구축 완료!

이제 예치금이 **실시간으로 자동 확인**되어 즉시 반영됩니다.

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
   - Webhook URL: https://marketgrow.onrender.com/api/webhook/openbanking
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

## 2. Render 환경변수 설정

https://dashboard.render.com 에서 다음 환경변수 추가:

```env
# 오픈뱅킹 API 설정
OPENBANKING_BASE_URL=https://openapi.openbanking.or.kr
OPENBANKING_CLIENT_ID=[발급받은 Client ID]
OPENBANKING_CLIENT_SECRET=[발급받은 Client Secret]
OPENBANKING_REDIRECT_URI=https://marketgrow.onrender.com/api/webhook/openbanking

# 농협 계좌 정보
NH_ACCOUNT_NUMBER=3010373375401
NH_ACCOUNT_HOLDER=박시현
NH_FINTECH_USE_NUM=[발급받은 핀테크이용번호]

# 관리자 설정
ADMIN_EMAIL=admin@marketgrow.kr
ADMIN_SECRET=[관리자 시크릿 키 설정]
```

## 3. 시스템 동작 방식

### 자동 확인 주기
- **실시간**: 5분마다 자동 확인
- **정기**: 매시 정각 확인
- **일일 정산**: 매일 자정

### 입금 처리 프로세스
1. 고객이 농협 301-0373-3754-01로 입금
2. 5분 이내 자동 감지
3. 입금자명 + 금액으로 매칭
4. 예치금 잔액 즉시 반영
5. 고객에게 알림 발송 (이메일/SMS)

### 매칭 규칙
- **정확 매칭**: 입금자명 + 금액이 일치
- **미매칭 시**: 관리자에게 알림 → 수동 확인

## 4. 관리자 기능

### 수동 입금 확인 (긴급 시)
```bash
curl -X POST https://marketgrow.onrender.com/api/webhook/check-deposits \
  -H "Authorization: Bearer [ADMIN_SECRET]"
```

### 스케줄러 상태 확인
```bash
curl https://marketgrow.onrender.com/api/webhook/scheduler-status
```

응답:
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "tasks": 3,
    "nextCheck": "5분 이내"
  }
}
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