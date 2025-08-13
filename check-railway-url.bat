@echo off
echo Railway URL 테스트
echo.

set /p URL="Railway URL을 입력하세요 (예: https://xxx.up.railway.app): "

echo.
echo Health Check:
curl -s %URL%/api/health

echo.
echo.
echo Username Check:
curl -X POST %URL%/api/auth/check-username -H "Content-Type: application/json" -d "{\"username\":\"testuser\"}"

echo.
echo.
pause