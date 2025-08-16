@echo off
echo ====================================
echo MarketGrow 백엔드 서버 시작 (PM2)
echo ====================================
echo.

cd /d "%~dp0backend"

:: PM2가 설치되어 있는지 확인
where pm2 >nul 2>&1
if %errorlevel% neq 0 (
    echo PM2가 설치되어 있지 않습니다. PM2를 설치합니다...
    npm install -g pm2
)

:: 이미 실행 중인 프로세스 확인
pm2 list | findstr "marketgrow-backend" >nul
if %errorlevel% equ 0 (
    echo 서버가 이미 실행 중입니다. 재시작합니다...
    pm2 restart marketgrow-backend
) else (
    echo 새로운 서버 인스턴스를 시작합니다...
    pm2 start ecosystem.config.js
)

:: 프로세스 상태 표시
pm2 status

echo.
echo ====================================
echo 서버가 실행되었습니다!
echo ====================================
echo.
echo 백엔드 접속 주소: http://localhost:5001
echo.
echo 유용한 명령어:
echo - 서버 중지: pm2 stop marketgrow-backend
echo - 서버 재시작: pm2 restart marketgrow-backend
echo - 로그 확인: pm2 logs marketgrow-backend
echo - 모니터링: pm2 monit
echo - 프로세스 목록: pm2 list
echo.
pause