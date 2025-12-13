@echo off
echo ========================================
echo   🔮 TARO - Mystical Tarot App
echo   Запуск Backend + Туннель
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Запуск Backend на порту 8000...
start "Taro Backend" cmd /k "cd backend && python -m uvicorn server:app --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak > nul

echo [2/3] Создание публичного туннеля...
start "Taro Tunnel" cmd /k "lt --port 8000 --subdomain taro-mystical"
timeout /t 3 /nobreak > nul

echo [3/3] Открытие Frontend...
start https://antonkuznetsov1911.github.io/Taro/

echo.
echo ========================================
echo   ✅ TARO запущен!
echo ========================================
echo.
echo 📍 Frontend:  https://antonkuznetsov1911.github.io/Taro/
echo 🔗 Backend:   https://taro-mystical.loca.lt
echo 🖥️  Local:    http://localhost:8000
echo.
echo ⚠️  НЕ ЗАКРЫВАЙТЕ окна Backend и Tunnel!
echo    Они должны работать для полной функциональности.
echo.
echo 📖 Документация: README.md
echo 🛑 Для остановки закройте окна Backend и Tunnel
echo.
pause
