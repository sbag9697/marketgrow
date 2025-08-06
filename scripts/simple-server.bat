@echo off
echo ========================================
echo MarketGrow 간단한 로컬 서버 (Windows)
echo ========================================
echo.

REM 현재 디렉토리 확인
echo 현재 위치: %CD%
echo.

REM Python 설치 확인
python --version >nul 2>&1
if not errorlevel 1 (
    echo [✓] Python이 설치되어 있습니다.
    echo [🚀] Python 웹서버를 시작합니다...
    echo.
    echo 브라우저에서 http://localhost:8000 으로 접속하세요
    echo 서버를 중지하려면 Ctrl+C를 누르세요
    echo.
    start http://localhost:8000
    python -m http.server 8000
    goto :end
)

REM Node.js 설치 확인
node --version >nul 2>&1
if not errorlevel 1 (
    echo [✓] Node.js가 설치되어 있습니다.
    echo [🚀] Node.js 웹서버를 시작합니다...
    echo.
    echo 브라우저에서 http://localhost:8000 으로 접속하세요
    echo 서버를 중지하려면 Ctrl+C를 누르세요
    echo.
    start http://localhost:8000
    npx http-server . -p 8000
    goto :end
)

REM 둘 다 없는 경우
echo [오류] Python 또는 Node.js가 설치되어 있지 않습니다.
echo.
echo 다음 중 하나를 설치해주세요:
echo - Python: https://www.python.org/downloads/
echo - Node.js: https://nodejs.org/
echo.
echo 또는 Docker를 사용하여 완전한 시스템을 실행하려면
echo scripts\quick-start.bat 을 실행하세요
echo.

:end
pause