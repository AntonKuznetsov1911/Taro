@echo off
echo =====================================
echo    Taro App - Site Status Checker
echo =====================================
echo.

:check
echo [%date% %time%] Checking site availability...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" https://antonkuznetsov1911.github.io/Taro/

echo.
echo Waiting 30 seconds before next check...
echo Press Ctrl+C to stop
echo.
timeout /t 30 /nobreak >nul
goto check
