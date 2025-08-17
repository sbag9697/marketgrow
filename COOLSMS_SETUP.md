# CoolSMS 설정 가이드

## 1. CoolSMS 계정 생성

### 1.1 회원가입
1. https://coolsms.co.kr 접속
2. 우측 상단 "회원가입" 클릭
3. 이메일, 비밀번호, 휴대폰 번호 입력
4. 본인인증 완료

### 1.2 발신번호 등록 (필수!)
1. 로그인 후 대시보드 접속
2. 좌측 메뉴 "발신번호 관리" 클릭
3. "발신번호 등록" 버튼 클릭
4. 본인 휴대폰 번호 입력
5. 인증번호 받아서 인증 완료
   - **중요**: 등록된 번호만 발신 가능합니다

## 2. API 키 발급

### 2.1 API 키 생성
1. 대시보드에서 "API Key 관리" 메뉴 클릭
2. "새 API Key 만들기" 클릭
3. 메모 입력 (예: "MarketGrow SMS")
4. 생성된 API Key와 API Secret 복사
   - **주의**: API Secret은 생성 시에만 확인 가능하므로 반드시 저장

### 2.2 API 정보 확인
```
API Key: NCXXXXXXXXXXXXXXXXXX
API Secret: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
발신번호: 010-XXXX-XXXX (하이픈 없이 입력)
```

## 3. 충전하기

### 3.1 포인트 충전
1. 대시보드 "충전하기" 메뉴
2. 충전 금액 선택 (최소 1,000원)
3. 결제 수단 선택 (카드/계좌이체)
4. 충전 완료

### 3.2 요금 안내
- SMS (90byte 이하): 건당 20원
- LMS (2000byte 이하): 건당 50원
- 충전 시 부가세 10% 별도

## 4. 백엔드 환경변수 설정

### 4.1 로컬 개발 (.env 파일)
```env
# CoolSMS 설정
COOLSMS_API_KEY=NCXXXXXXXXXXXXXXXXXX
COOLSMS_API_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
COOLSMS_SENDER=01012345678  # 하이픈 없이 입력
```

### 4.2 Render 환경변수 설정
1. https://dashboard.render.com 접속
2. 백엔드 서비스 선택
3. Environment > Environment Variables
4. 다음 변수 추가:
   - `COOLSMS_API_KEY`: [API Key 입력]
   - `COOLSMS_API_SECRET`: [API Secret 입력]
   - `COOLSMS_SENDER`: [발신번호 입력]
5. "Save Changes" 클릭

## 5. 패키지 설치 확인

### 5.1 패키지 설치 상태 확인
```bash
cd backend
npm list coolsms-node-sdk
```

### 5.2 설치되지 않은 경우
```bash
npm install coolsms-node-sdk
```

## 6. 테스트

### 6.1 백엔드 로그 확인
Render 대시보드 > Logs에서 다음 메시지 확인:
```
CoolSMS module loaded successfully
CoolSMS configured successfully
```

### 6.2 실제 테스트
1. https://marketgrow.kr/signup 접속
2. 휴대폰 번호 입력
3. "인증" 버튼 클릭
4. 실제 SMS 수신 확인

## 7. 문제 해결

### 7.1 발신번호 오류
- 에러: "등록되지 않은 발신번호입니다"
- 해결: CoolSMS 대시보드에서 발신번호 등록 확인

### 7.2 잔액 부족
- 에러: "잔액이 부족합니다"
- 해결: CoolSMS 대시보드에서 포인트 충전

### 7.3 API 키 오류
- 에러: "인증에 실패했습니다"
- 해결: API Key와 Secret 재확인

## 8. 모니터링

### 8.1 발송 내역 확인
1. CoolSMS 대시보드 > "문자 발송 내역"
2. 발송 상태, 성공/실패 확인
3. 실패 시 실패 사유 확인

### 8.2 잔액 확인
- 대시보드 상단에 실시간 잔액 표시
- 잔액 부족 시 알림 설정 가능

## 9. 보안 주의사항

1. **API Secret 노출 금지**
   - GitHub에 절대 커밋하지 마세요
   - .env 파일은 .gitignore에 포함

2. **발신번호 도용 방지**
   - 본인 소유 번호만 등록
   - 타인 번호 무단 사용 시 법적 처벌

3. **스팸 방지**
   - 광고 문자는 (광고) 표시 필수
   - 수신 거부 번호 포함 필수
   - 야간 발송 제한 (21시~08시)

## 10. 비용 절감 팁

1. **인증번호는 SMS로**
   - 6자리 숫자는 SMS(90byte)로 충분
   - LMS는 긴 메시지에만 사용

2. **재발송 제한**
   - 프론트엔드: 재발송 버튼 60초 제한
   - 백엔드: IP당 5분 3회 제한

3. **개발 시 테스트 모드 활용**
   - 개발 환경에서는 실제 발송 없이 테스트

---

## 빠른 시작 체크리스트

- [ ] CoolSMS 회원가입
- [ ] 발신번호 등록
- [ ] API Key 발급
- [ ] 1,000원 이상 충전
- [ ] Render 환경변수 설정
- [ ] 테스트 SMS 발송 확인

완료 후 실제 SMS 인증이 작동합니다!