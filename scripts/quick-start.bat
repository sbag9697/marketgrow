@echo off
echo ========================================
echo MarketGrow 빠른 시작 스크립트 (Windows)
echo ========================================
echo.

REM 현재 디렉토리 확인
echo 현재 위치: %CD%
echo.

REM Docker 설치 확인
docker --version >nul 2>&1
if errorlevel 1 (
    echo [오류] Docker가 설치되어 있지 않습니다.
    echo Docker Desktop을 설치해주세요: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [✓] Docker 확인 완료
echo.

REM 환경 변수 파일 확인 및 생성
if not exist .env (
    echo [!] .env 파일이 없습니다. .env.example에서 복사합니다...
    copy .env.example .env
    echo.
    echo [!] .env 파일을 편집하여 실제 설정값을 입력해주세요.
    echo [!] 최소한 다음 항목들을 설정해야 합니다:
    echo     - JWT_SECRET
    echo     - JWT_REFRESH_SECRET
    echo     - MONGO_ROOT_PASSWORD
    echo.
    pause
)

echo [✓] 환경 설정 파일 확인 완료
echo.

REM 필요한 디렉토리 생성
if not exist logs mkdir logs
if not exist uploads mkdir uploads
if not exist nginx\ssl mkdir nginx\ssl

echo [✓] 디렉토리 구조 생성 완료
echo.

REM Docker Compose로 서비스 시작
echo [🚀] 서비스를 시작합니다...
echo 이 과정은 처음 실행 시 몇 분이 걸릴 수 있습니다.
echo.

docker-compose up -d

if errorlevel 1 (
    echo [오류] 서비스 시작에 실패했습니다.
    echo 로그를 확인해주세요: docker-compose logs
    pause
    exit /b 1
)

echo.
echo [✓] 서비스 시작 완료!
echo.

REM 서비스 상태 확인
echo [📊] 서비스 상태:
docker-compose ps
echo.

REM 헬스체크 대기
echo [⏳] 서비스가 완전히 시작될 때까지 대기 중...
timeout /t 30 /nobreak > nul

REM 접속 정보 안내
echo ========================================
echo 🌐 접속 정보
echo ========================================
echo 메인 사이트: http://localhost
echo API 서버: http://localhost:3001
echo MongoDB 관리: http://localhost:8081
echo.
echo ========================================
echo 🔧 관리 명령어
echo ========================================
echo 서비스 중지: docker-compose down
echo 로그 확인: docker-compose logs -f
echo 서비스 재시작: docker-compose restart
echo.

REM 브라우저에서 자동 열기
echo [🌐] 브라우저에서 사이트를 여는 중...
start http://localhost
start http://localhost:3001/health
echo.

echo [🎉] MarketGrow가 성공적으로 시작되었습니다!
echo 문제가 발생하면 로그를 확인해주세요: docker-compose logs
echo.

pause