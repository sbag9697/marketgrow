@echo off
echo Checking Railway deployment status...
echo.

echo 1. Testing health endpoint:
curl -X GET https://marketgrow-production.up.railway.app/api/health 2>nul
echo.
echo.

echo 2. Testing username check endpoint:
curl -X POST https://marketgrow-production.up.railway.app/api/auth/check-username -H "Content-Type: application/json" -d "{\"username\":\"testuser\"}" 2>nul
echo.
echo.

echo 3. Railway deployment URL:
echo https://railway.app/project/df35e723-9c8e-49e0-b92f-2c9695f973f9
echo.

pause