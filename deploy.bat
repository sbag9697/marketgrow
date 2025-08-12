@echo off
setlocal enabledelayedexpansion

REM MarketGrow 자동 배포 스크립트 (Windows)
REM 사용법: deploy.bat [frontend|backend|all]

echo =======================================
echo    MarketGrow 자동 배포 스크립트
echo =======================================
echo.

REM 색상 설정
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

REM 배포 타겟 설정
set TARGET=%1
if "%TARGET%"=="" set TARGET=all

REM Node.js 버전 확인
echo %GREEN%[INFO]%NC% Node.js 버전 확인 중...
for /f "tokens=2 delims=v." %%a in ('node -v') do set NODE_VERSION=%%a
if %NODE_VERSION% LSS 18 (
    echo %RED%[ERROR]%NC% Node.js 18 이상이 필요합니다.
    exit /b 1
)
echo %GREEN%[INFO]%NC% Node.js 버전 확인 완료

REM 백엔드 배포 함수
if "%TARGET%"=="backend" goto :deploy_backend
if "%TARGET%"=="all" goto :deploy_backend
goto :check_frontend

:deploy_backend
echo.
echo %GREEN%[INFO]%NC% 백엔드 배포 시작...
cd backend

REM 환경 변수 파일 확인
if not exist .env (
    echo %RED%[ERROR]%NC% .env 파일이 없습니다.
    echo .env.example을 참고하여 생성해주세요.
    cd ..
    exit /b 1
)

REM 의존성 설치
echo %GREEN%[INFO]%NC% 백엔드 의존성 설치 중...
call npm install
if errorlevel 1 (
    echo %RED%[ERROR]%NC% 의존성 설치 실패
    cd ..
    exit /b 1
)

REM Railway CLI 확인
where railway >nul 2>nul
if errorlevel 1 (
    echo %YELLOW%[WARN]%NC% Railway CLI가 설치되지 않았습니다.
    echo 설치하려면: npm install -g @railway/cli
    echo.
    echo Git에 푸시하여 자동 배포를 진행합니다...
    git add .
    git commit -m "Deploy backend to Railway"
    git push origin main
) else (
    echo %GREEN%[INFO]%NC% Railway로 배포 중...
    call railway up
    
    REM 배포 상태 확인
    timeout /t 5 /nobreak >nul
    call railway status
)

echo %GREEN%[INFO]%NC% 백엔드 배포 완료!
cd ..

if "%TARGET%"=="backend" goto :end

:check_frontend
if "%TARGET%"=="frontend" goto :deploy_frontend
if "%TARGET%"=="all" goto :deploy_frontend
goto :invalid_target

:deploy_frontend
echo.
echo %GREEN%[INFO]%NC% 프론트엔드 배포 시작...

REM 의존성 설치
echo %GREEN%[INFO]%NC% 프론트엔드 의존성 설치 중...
call npm install
if errorlevel 1 (
    echo %RED%[ERROR]%NC% 의존성 설치 실패
    exit /b 1
)

REM 프로덕션 빌드
echo %GREEN%[INFO]%NC% 프로덕션 빌드 중...
call npm run build
if errorlevel 1 (
    echo %RED%[ERROR]%NC% 빌드 실패
    exit /b 1
)

REM Netlify CLI 확인
where netlify >nul 2>nul
if errorlevel 1 (
    echo %YELLOW%[WARN]%NC% Netlify CLI가 설치되지 않았습니다.
    echo 설치하려면: npm install -g netlify-cli
    echo.
    echo 수동으로 dist 폴더를 Netlify에 업로드해주세요.
    start https://app.netlify.com/drop
    explorer dist
) else (
    echo %GREEN%[INFO]%NC% Netlify로 배포 중...
    call netlify deploy --prod --dir=dist
)

echo %GREEN%[INFO]%NC% 프론트엔드 배포 완료!
goto :end

:invalid_target
echo %RED%[ERROR]%NC% 잘못된 옵션: %TARGET%
echo 사용법: deploy.bat [frontend^|backend^|all]
exit /b 1

:end
echo.
echo =======================================
echo    🎉 배포가 완료되었습니다! 🎉
echo =======================================
echo.
echo 다음 단계:
echo 1. Railway 대시보드에서 백엔드 상태 확인
echo    https://railway.app/dashboard
echo.
echo 2. Netlify 대시보드에서 프론트엔드 상태 확인
echo    https://app.netlify.com
echo.
echo 3. 배포된 사이트 테스트
echo    - API 헬스체크: https://your-backend.up.railway.app/api/health
echo    - 프론트엔드: https://your-site.netlify.app
echo.
pause