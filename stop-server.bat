@echo off
echo ====================================
echo MarketGrow 백엔드 서버 중지
echo ====================================
echo.

:: PM2가 설치되어 있는지 확인
where pm2 >nul 2>&1
if %errorlevel% neq 0 (
    echo PM2가 설치되어 있지 않습니다.
    pause
    exit /b 1
)

:: 서버 중지
echo 서버를 중지합니다...
pm2 stop marketgrow-backend

:: 프로세스 상태 표시
pm2 status

echo.
echo 서버가 중지되었습니다.
echo.
pause