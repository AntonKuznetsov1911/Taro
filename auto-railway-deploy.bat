@echo off
chcp 65001 >nul
color 0E
echo ╔════════════════════════════════════════════════════════════╗
echo ║     🚀 Автоматический деплой Taro на Railway              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [Шаг 1/5] Проверка Railway CLI...
railway --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Railway CLI не установлен!
    echo 📥 Устанавливаю...
    npm install -g @railway/cli
)
echo ✅ Railway CLI готов
echo.

echo [Шаг 2/5] Авторизация в Railway...
echo 🔑 Открываю браузер для авторизации...
echo 👉 Нажмите любую клавишу после авторизации в браузере
pause >nul

railway login
if errorlevel 1 (
    echo ❌ Ошибка авторизации
    pause
    exit /b 1
)
echo ✅ Авторизация успешна!
echo.

echo [Шаг 3/5] Создание проекта Railway...
railway init

echo.
echo [Шаг 4/5] Настройка переменных окружения...
echo 📝 Добавляю переменные...

railway variables set OPENAI_API_KEY=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

echo.
echo ⚠️  ВНИМАНИЕ: Нужен MongoDB URL!
echo.
echo Выберите вариант:
echo [1] У меня уже есть MongoDB URL
echo [2] Пропустить (ограниченный функционал)
echo.
set /p mongo_choice="Введите 1 или 2: "

if "%mongo_choice%"=="1" (
    echo.
    echo 📋 Вставьте ваш MongoDB connection string:
    set /p mongo_url="MongoDB URL: "
    railway variables set MONGO_URL=!mongo_url!
    railway variables set DB_NAME=taro
) else (
    echo ⏭️  Пропускаю MongoDB
)

railway variables set PORT=8000

echo ✅ Переменные настроены!
echo.

echo [Шаг 5/5] Запуск деплоя...
railway up

echo.
echo ═══════════════════════════════════════════════════════════
echo     ✨ Деплой запущен!
echo ═══════════════════════════════════════════════════════════
echo.
echo 📊 Проверить статус: railway status
echo 🌐 Получить URL: railway domain
echo 📝 Логи: railway logs
echo.
pause
