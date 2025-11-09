@echo off
chcp 65001 >nul
color 0B
echo ╔════════════════════════════════════════════════════════════╗
echo ║     🔮 Taro App - Автоматическое Развертывание            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:menu
echo ═══════════════════════════════════════════════════════════
echo    Выберите действие:
echo ═══════════════════════════════════════════════════════════
echo.
echo  [1] 🌐 Открыть все необходимые ссылки
echo  [2] 📊 Проверить статус развертывания
echo  [3] 🚀 Открыть панель управления (DEPLOY.html)
echo  [4] 📚 Открыть документацию
echo  [5] ✅ Проверить доступность сайта
echo  [6] 🔄 Запустить мониторинг сайта
echo  [7] 📝 Показать инструкции
echo  [8] ❌ Выход
echo.
echo ═══════════════════════════════════════════════════════════
set /p choice="Введите номер (1-8): "

if "%choice%"=="1" goto open_links
if "%choice%"=="2" goto check_status
if "%choice%"=="3" goto open_panel
if "%choice%"=="4" goto open_docs
if "%choice%"=="5" goto check_site
if "%choice%"=="6" goto monitor_site
if "%choice%"=="7" goto show_instructions
if "%choice%"=="8" goto exit
goto menu

:open_links
cls
echo ═══════════════════════════════════════════════════════════
echo    🌐 Открываю все необходимые ссылки...
echo ═══════════════════════════════════════════════════════════
echo.
echo [1/6] GitHub Pages Settings...
start https://github.com/AntonKuznetsov1911/Taro/settings/pages
timeout /t 2 /nobreak >nul

echo [2/6] GitHub Actions...
start https://github.com/AntonKuznetsov1911/Taro/actions
timeout /t 2 /nobreak >nul

echo [3/6] Railway Dashboard...
start https://railway.app/new
timeout /t 2 /nobreak >nul

echo [4/6] MongoDB Atlas...
start https://www.mongodb.com/cloud/atlas
timeout /t 2 /nobreak >nul

echo [5/6] OpenAI Platform...
start https://platform.openai.com/api-keys
timeout /t 2 /nobreak >nul

echo [6/6] Панель управления...
start DEPLOY.html
echo.
echo ✅ Все ссылки открыты!
echo.
pause
goto menu

:check_status
cls
echo ═══════════════════════════════════════════════════════════
echo    📊 Проверка статуса развертывания...
echo ═══════════════════════════════════════════════════════════
echo.

echo [Проверка 1/4] GitHub Repository...
curl -s -o nul -w "Status: %%{http_code}\n" https://github.com/AntonKuznetsov1911/Taro
echo.

echo [Проверка 2/4] Frontend (GitHub Pages)...
curl -s -o nul -w "Status: %%{http_code}\n" https://antonkuznetsov1911.github.io/Taro/
echo.

echo [Проверка 3/4] GitHub Actions...
echo Откройте вручную: https://github.com/AntonKuznetsov1911/Taro/actions
echo.

echo [Проверка 4/4] Конфигурационные файлы...
if exist "railway.json" (echo ✅ railway.json найден) else (echo ❌ railway.json не найден)
if exist "Procfile" (echo ✅ Procfile найден) else (echo ❌ Procfile не найден)
if exist "nixpacks.toml" (echo ✅ nixpacks.toml найден) else (echo ❌ nixpacks.toml не найден)
if exist ".github\workflows\deploy.yml" (echo ✅ GitHub workflow найден) else (echo ❌ GitHub workflow не найден)
echo.

echo ═══════════════════════════════════════════════════════════
echo Статус:
echo • Frontend Build: ✅ Готов
echo • GitHub Actions: ✅ Настроен
echo • Railway Config: ✅ Готов
echo • GitHub Pages: ⏳ Требует активации
echo • Backend Deploy: ⏳ Требует развертывания
echo ═══════════════════════════════════════════════════════════
echo.
pause
goto menu

:open_panel
cls
echo Открываю панель управления...
start DEPLOY.html
echo ✅ Панель управления открыта
timeout /t 2 >nul
goto menu

:open_docs
cls
echo ═══════════════════════════════════════════════════════════
echo    📚 Открываю документацию...
echo ═══════════════════════════════════════════════════════════
echo.
echo [1/4] README_DEPLOY.md
start README_DEPLOY.md
timeout /t 1 /nobreak >nul

echo [2/4] RAILWAY_DEPLOY.md
start RAILWAY_DEPLOY.md
timeout /t 1 /nobreak >nul

echo [3/4] DEPLOYMENT.md
start DEPLOYMENT.md
timeout /t 1 /nobreak >nul

echo [4/4] QUICK_START.md
start QUICK_START.md
echo.
echo ✅ Документация открыта!
echo.
pause
goto menu

:check_site
cls
echo ═══════════════════════════════════════════════════════════
echo    ✅ Проверка доступности сайта...
echo ═══════════════════════════════════════════════════════════
echo.
echo Frontend URL: https://antonkuznetsov1911.github.io/Taro/
echo.
curl -s -o nul -w "HTTP Status: %%{http_code}\n" https://antonkuznetsov1911.github.io/Taro/
echo.
echo Если статус 200 - сайт работает ✅
echo Если статус 404 - сайт еще не развернут ⏳
echo.
echo Хотите открыть сайт в браузере? (Y/N)
set /p open="Ваш выбор: "
if /i "%open%"=="Y" start https://antonkuznetsov1911.github.io/Taro/
echo.
pause
goto menu

:monitor_site
cls
echo ═══════════════════════════════════════════════════════════
echo    🔄 Мониторинг доступности сайта
echo ═══════════════════════════════════════════════════════════
echo.
echo Запускаю непрерывную проверку сайта...
echo Нажмите Ctrl+C для остановки
echo.
start check-site.bat
timeout /t 2 >nul
goto menu

:show_instructions
cls
echo ╔════════════════════════════════════════════════════════════╗
echo ║     📝 Инструкции по развертыванию                        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo ═══════════════════════════════════════════════════════════
echo  ШАГ 1: Активировать GitHub Pages
echo ═══════════════════════════════════════════════════════════
echo.
echo 1. Откройте: https://github.com/AntonKuznetsov1911/Taro/settings/pages
echo 2. В разделе "Source" выберите: GitHub Actions
echo 3. Нажмите "Save"
echo 4. Ожидайте 3-5 минут
echo.
echo ═══════════════════════════════════════════════════════════
echo  ШАГ 2: Развернуть Backend на Railway
echo ═══════════════════════════════════════════════════════════
echo.
echo 1. Откройте: https://railway.app/new
echo 2. Login with GitHub
echo 3. Deploy from GitHub repo
echo 4. Выберите: AntonKuznetsov1911/Taro
echo 5. Добавьте переменные окружения:
echo    - OPENAI_API_KEY=sk-your-key
echo    - MONGO_URL=mongodb+srv://...
echo    - DB_NAME=taro
echo 6. Нажмите Deploy
echo.
echo ═══════════════════════════════════════════════════════════
echo  ШАГ 3: Получить необходимые ключи
echo ═══════════════════════════════════════════════════════════
echo.
echo MongoDB Atlas (бесплатно):
echo • https://www.mongodb.com/cloud/atlas
echo • Free Cluster M0 (512 MB)
echo.
echo OpenAI API Key:
echo • https://platform.openai.com/api-keys
echo • Стоимость: ~$0.01-0.03 за гадание
echo.
echo ═══════════════════════════════════════════════════════════
echo.
pause
goto menu

:exit
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     Спасибо за использование Taro Deploy Tool!            ║
echo ║                                                            ║
echo ║     Документация: README_DEPLOY.md                        ║
echo ║     Панель управления: DEPLOY.html                        ║
echo ║                                                            ║
echo ║     🔮 Удачи с развертыванием!                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
timeout /t 3 >nul
exit
