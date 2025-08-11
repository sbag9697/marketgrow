@echo off
echo ================================
echo Railway 환경변수 설정
echo ================================
echo.

echo MongoDB URI 설정 중...
railway variables set MONGODB_URI="mongodb+srv://marketgrow:3917Sihyeon!@cluster0.17qmchk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

echo JWT Secret 설정 중...
railway variables set JWT_SECRET="your-super-secret-jwt-key-change-this-to-random-32-chars"

echo Admin Password 설정 중...
railway variables set ADMIN_PASSWORD="Admin123!@#"

echo Frontend URL 설정 중...
railway variables set FRONTEND_URL="https://melodious-banoffee-c450ea.netlify.app"

echo.
echo ================================
echo 환경변수 설정 완료!
echo ================================
echo.
echo 현재 설정된 변수 확인:
railway variables

pause