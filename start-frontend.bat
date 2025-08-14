@echo off
echo ====================================
echo MarketGrow 프론트엔드 서버 시작
echo ====================================
echo.

echo 프론트엔드 서버를 시작합니다...
echo http://localhost:8080 에서 접속 가능합니다
echo.

python -m http.server 8080

pause