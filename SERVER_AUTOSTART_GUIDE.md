# MarketGrow 백엔드 서버 자동 실행 가이드

## 🚀 서버 상시 실행 방법

### 방법 1: PM2 사용 (현재 설정됨)

PM2는 Node.js 애플리케이션을 위한 프로세스 매니저로, 서버를 상시 실행하고 자동 재시작을 관리합니다.

#### 서버 시작
```bash
# 방법 1: 배치 파일 사용
start-server.bat

# 방법 2: 직접 명령어
cd backend
pm2 start ecosystem.config.js
```

#### 서버 관리 명령어
```bash
# 서버 상태 확인
pm2 status

# 서버 재시작
pm2 restart marketgrow-backend

# 서버 중지
pm2 stop marketgrow-backend

# 로그 확인
pm2 logs marketgrow-backend

# 실시간 모니터링
pm2 monit

# 프로세스 삭제
pm2 delete marketgrow-backend
```

### 방법 2: Windows 작업 스케줄러로 자동 시작

1. **작업 스케줄러 열기**
   - Win + R → `taskschd.msc` 입력

2. **새 작업 만들기**
   - 오른쪽 패널에서 "작업 만들기" 클릭

3. **일반 탭 설정**
   - 이름: `MarketGrow Backend Server`
   - 설명: `MarketGrow 백엔드 서버 자동 시작`
   - "사용자가 로그온할 때만 실행" 선택
   - "가장 높은 권한으로 실행" 체크

4. **트리거 탭**
   - "새로 만들기" 클릭
   - "작업 시작": "시작할 때" 선택
   - "사용" 체크

5. **동작 탭**
   - "새로 만들기" 클릭
   - 동작: "프로그램 시작"
   - 프로그램/스크립트: `C:\Users\박시현\sns-marketing-site\start-server.bat`
   - 시작 위치: `C:\Users\박시현\sns-marketing-site`

6. **조건 탭**
   - "AC 전원이 켜져 있는 경우에만 작업 시작" 체크 해제

7. **설정 탭**
   - "작업 실패 시 다시 시작" 체크
   - "작업이 이미 실행 중인 경우" → "새 인스턴스 시작 안 함"

### 방법 3: Windows 서비스로 등록 (pm2-windows-service)

```bash
# pm2-windows-service 설치
npm install -g pm2-windows-service

# 서비스 설치
pm2-service-install

# 서비스 시작
net start PM2

# PM2로 앱 시작
pm2 start ecosystem.config.js
pm2 save
```

### 방법 4: 시작 프로그램 폴더에 추가

1. Win + R → `shell:startup` 입력
2. `start-server.bat` 파일의 바로가기를 이 폴더에 복사

## 📊 서버 상태 확인

### PM2 대시보드
```bash
# 실시간 모니터링
pm2 monit

# 웹 대시보드 (선택사항)
pm2 install pm2-web
pm2 web
```

### 로그 파일 위치
- PM2 로그: `C:\Users\박시현\.pm2\logs\`
- 애플리케이션 로그: `backend\logs\`

## 🔧 문제 해결

### 서버가 시작되지 않는 경우
```bash
# PM2 프로세스 모두 삭제
pm2 delete all

# PM2 재시작
pm2 resurrect

# 수동으로 다시 시작
cd backend
pm2 start ecosystem.config.js
```

### 포트 충돌 시
```bash
# 5001 포트 사용 프로세스 확인
netstat -ano | findstr :5001

# 프로세스 종료 (PID는 위 명령어로 확인)
taskkill /PID [프로세스ID] /F
```

### MongoDB 연결 실패 시
- `.env` 파일의 `MONGODB_URI` 확인
- 인터넷 연결 확인
- MongoDB Atlas 화이트리스트에 현재 IP 추가

## 🚨 중요 사항

1. **메모리 관리**: PM2는 자동으로 메모리를 관리하고 1GB 초과 시 재시작
2. **클러스터 모드**: 현재 6개 인스턴스로 실행 (CPU 코어 수에 맞춤)
3. **자동 재시작**: 크래시 시 자동으로 재시작 (최대 10회)
4. **로그 로테이션**: PM2 로그는 자동으로 관리됨

## 📞 지원

문제가 지속되면 다음을 확인하세요:
- PM2 상태: `pm2 status`
- PM2 로그: `pm2 logs --lines 100`
- 시스템 리소스: 작업 관리자에서 CPU/메모리 확인