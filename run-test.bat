@echo off
echo Starting local test server...
echo.
echo Test page will open at http://localhost:8080/test-api.html
echo.
python -m http.server 8080
pause