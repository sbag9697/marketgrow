@echo off
echo ========================================
echo MarketGrow 백엔드 서버 시작
echo ========================================
echo.

echo 1. 패키지 설치 중...
call npm install

echo.
echo 2. 서버 시작 중...
echo 서버 주소: http://localhost:5000
echo API 문서: http://localhost:5000/api-docs
echo.
echo 관리자 계정:
echo ID: admin@marketgrow.com
echo PW: admin123!@#
echo.
echo Ctrl+C를 눌러 서버를 종료할 수 있습니다.
echo ========================================

npm start