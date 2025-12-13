@echo off
chcp 65001 >nul
echo ══════════════════════════════════════════════════════════
echo 🚀 Railway Deploy - Taro Telegram Bot
echo ══════════════════════════════════════════════════════════
echo.

cd /d "%~dp0"

echo [1/4] Проверка Railway CLI...
railway --version
if %errorlevel% neq 0 (
    echo ❌ Railway CLI не установлен!
    pause
    exit /b 1
)
echo ✅ Railway CLI найден
echo.

echo [2/4] Проверка авторизации...
railway whoami
if %errorlevel% neq 0 (
    echo ❌ Не авторизован в Railway!
    echo Выполните: railway login
    pause
    exit /b 1
)
echo ✅ Авторизован в Railway
echo.

echo [3/4] Деплой на Railway...
echo Выполняется: railway up
echo.
railway up
if %errorlevel% neq 0 (
    echo ❌ Ошибка деплоя!
    pause
    exit /b 1
)
echo ✅ Деплой выполнен
echo.

echo [4/4] Проверка статуса...
railway status
echo.

echo ══════════════════════════════════════════════════════════
echo ✅ ДЕПЛОЙ ЗАВЕРШЕН!
echo ══════════════════════════════════════════════════════════
echo.
echo 📝 Следующие шаги:
echo 1. Откройте Railway Dashboard: railway open
echo 2. Добавьте переменные окружения:
echo    - TELEGRAM_BOT_TOKEN
echo    - MONGO_URL (MongoDB Atlas connection string)
echo    - DB_NAME
echo    - OPENAI_API_KEY
echo 3. Проверьте логи: railway logs
echo.
pause
