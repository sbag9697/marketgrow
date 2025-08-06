@echo off
echo === MarketGrow Backend Heroku 배포 ===
echo.

echo 1. Git 커밋 준비...
git add .
git commit -m "Initial backend deployment"

echo.
echo 2. Heroku 앱 생성...
echo 다음 명령어를 실행하세요:
echo heroku create marketgrow-backend
echo.

echo 3. 환경 변수 설정 명령어:
echo.
echo heroku config:set NODE_ENV=production
echo heroku config:set MONGODB_URI="mongodb+srv://sbag9697:tlgus0611!@cluster0.17qmchk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
echo heroku config:set JWT_SECRET="abd84b4a6864dc82378baa9363575ccff49e66662cbd4dc4705dcab67cbb2ed0"
echo heroku config:set ADMIN_EMAIL="admin@marketgrow.com"
echo heroku config:set ADMIN_PASSWORD="YihQwkFRFN8Fcbdl!@#"
echo heroku config:set SMM_PANEL_API_KEY="3285e23e5c360ef8216179db7cb716f4"
echo heroku config:set SMM_PANEL_API_URL="https://smmturk.org/api/v2"
echo heroku config:set PRICE_MARGIN=90
echo heroku config:set TOSSPAYMENTS_SECRET_KEY="test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R"
echo heroku config:set TOSSPAYMENTS_CLIENT_KEY="test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq"
echo heroku config:set CORS_ORIGIN="http://localhost:3000,https://marketgrow.netlify.app"
echo.

echo 4. 배포 명령어:
echo git push heroku main
echo.

echo 5. 배포 후 확인:
echo heroku logs --tail
echo heroku open
echo.

pause