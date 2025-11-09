# 🚂 Railway Deployment Guide for Taro Backend

## Автоматическое развертывание (Рекомендуется)

### Метод 1: Через веб-интерфейс Railway (Самый простой)

#### Шаг 1: Создайте аккаунт Railway
1. Перейдите на https://railway.app
2. Нажмите **"Start a New Project"** или **"Login with GitHub"**
3. Авторизуйтесь через GitHub

#### Шаг 2: Создайте новый проект
1. Нажмите **"New Project"**
2. Выберите **"Deploy from GitHub repo"**
3. Выберите репозиторий **AntonKuznetsov1911/Taro**
4. Railway автоматически определит Python проект

#### Шаг 3: Настройте переменные окружения
В разделе **Variables** добавьте:

```bash
OPENAI_API_KEY=sk-your-openai-api-key
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/
DB_NAME=taro
PORT=8000
```

#### Шаг 4: Настройте MongoDB (бесплатно)
1. В том же проекте нажмите **"+ New"**
2. Выберите **"Database"** → **"Add MongoDB"**
3. Railway создаст MongoDB instance
4. Скопируйте **MONGO_URL** и добавьте в переменные окружения

#### Шаг 5: Deploy!
1. Нажмите **"Deploy"**
2. Дождитесь завершения деплоя (2-3 минуты)
3. Получите URL вашего backend (например: `https://taro-production.up.railway.app`)

---

## Метод 2: Через Railway CLI

### Установка Railway CLI

#### Windows (PowerShell):
```powershell
iwr https://railway.app/install.ps1 | iex
```

#### macOS/Linux:
```bash
curl -fsSL https://railway.app/install.sh | sh
```

### Использование

```bash
# 1. Перейдите в директорию проекта
cd Taro

# 2. Логин в Railway
railway login

# 3. Инициализация проекта
railway init

# 4. Добавьте переменные окружения
railway variables set OPENAI_API_KEY="your-key"
railway variables set MONGO_URL="your-mongo-url"
railway variables set DB_NAME="taro"

# 5. Deploy!
railway up

# 6. Получите URL
railway open
```

---

## Метод 3: GitHub Integration (Автодеплой при push)

После создания проекта на Railway:

1. Перейдите в **Settings** → **GitHub**
2. Подключите репозиторий **AntonKuznetsov1911/Taro**
3. Включите **Auto-deploy on push**
4. Укажите **Root Directory**: оставьте пустым (или укажите `/`)
5. **Build Command**: `pip install -r backend/requirements.txt`
6. **Start Command**: `cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT`

Теперь каждый push в main будет автоматически деплоиться!

---

## Настройка MongoDB Atlas (если не используете Railway MongoDB)

### Шаг 1: Создайте кластер
1. Перейдите на https://www.mongodb.com/cloud/atlas
2. Создайте бесплатный аккаунт
3. Создайте **Free Shared Cluster (M0)**
4. Выберите регион (ближайший к вам)

### Шаг 2: Создайте пользователя базы данных
1. Database Access → Add New Database User
2. Username: `taro`
3. Password: сгенерируйте сложный пароль
4. User Privileges: **Read and write to any database**

### Шаг 3: Настройте Network Access
1. Network Access → Add IP Address
2. **Allow Access from Anywhere**: `0.0.0.0/0`
3. (для продакшена укажите конкретные IP)

### Шаг 4: Получите Connection String
1. Clusters → Connect → Connect your application
2. Driver: **Python** / Version: **3.12 or later**
3. Скопируйте connection string:
   ```
   mongodb+srv://taro:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   ```
4. Замените `<password>` на ваш пароль

---

## Получение OpenAI API Key

1. Перейдите на https://platform.openai.com
2. Создайте аккаунт (если нет)
3. API Keys → Create new secret key
4. Скопируйте ключ (начинается с `sk-...`)
5. **Важно**: Сохраните ключ, его нельзя увидеть снова!

**Стоимость использования:**
- GPT-3.5-turbo: ~$0.002 за 1K токенов
- Одно гадание: ~$0.01-0.03
- 100 гаданий ≈ $1-3

---

## Проверка деплоя

После успешного деплоя на Railway:

### 1. Проверьте здоровье API
```bash
curl https://your-app.up.railway.app/api/
```

Ответ должен быть: `{"message": "Taro API is running"}`

### 2. Проверьте категории
```bash
curl https://your-app.up.railway.app/api/categories
```

### 3. Проверьте расклады
```bash
curl https://your-app.up.railway.app/api/spreads
```

---

## Обновление Frontend с Backend URL

После успешного деплоя backend:

1. Скопируйте URL вашего Railway app (например: `https://taro-production.up.railway.app`)

2. Обновите `frontend/.env`:
```env
EXPO_PUBLIC_BACKEND_URL=https://taro-production.up.railway.app
```

3. Закоммитьте и запушьте:
```bash
cd Taro
git add frontend/.env
git commit -m "Update backend URL for production"
git push origin main
```

4. GitHub Actions автоматически пересоберет frontend с новым backend URL

---

## Мониторинг

### Railway Dashboard
- Логи: Railway Dashboard → Deployments → View Logs
- Метрики: CPU, Memory, Network usage
- Переменные: Variables tab

### Проверка статуса
```bash
# Через curl
curl -I https://your-app.up.railway.app/api/

# Через Railway CLI
railway logs
railway status
```

---

## Стоимость Railway

### Hobby Plan (бесплатно)
- $5 бесплатных кредитов в месяц
- Достаточно для ~500 часов работы
- Автоматическое усыпление при неактивности

### Developer Plan ($5/месяц)
- $5 кредитов + неограниченное время работы
- Подходит для production приложений

---

## Troubleshooting

### Backend не запускается

1. **Проверьте логи**:
   ```bash
   railway logs
   ```

2. **Проверьте переменные окружения**:
   - OPENAI_API_KEY установлен?
   - MONGO_URL правильный?
   - DB_NAME указан?

3. **Проверьте build**:
   - Все зависимости из requirements.txt установлены?

### MongoDB connection errors

1. Проверьте Network Access в MongoDB Atlas
2. Убедитесь, что пароль не содержит специальные символы (или они экранированы)
3. Проверьте connection string формат

### CORS errors

Backend уже настроен на прием запросов от всех источников:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Для продакшена укажите конкретные домены в `allow_origins`.

---

## Полезные команды Railway CLI

```bash
# Просмотр логов в реальном времени
railway logs --follow

# Открыть проект в браузере
railway open

# Просмотр переменных окружения
railway variables

# Перезапустить сервис
railway restart

# Информация о проекте
railway status

# Список всех проектов
railway list

# Подключиться к базе данных (если используете Railway MongoDB)
railway connect
```

---

## Альтернативные платформы

Если Railway не подходит:

### Render.com
- Бесплатный tier
- Автоматический деплой из GitHub
- Немного медленнее Railway

### Fly.io
- Хороший бесплатный tier
- Быстрая производительность
- Глобальные регионы

### Heroku
- Платный ($5/месяц минимум)
- Надежный и проверенный
- Много документации

---

## Следующие шаги

1. ✅ Разверните backend на Railway
2. ✅ Получите Railway URL
3. ✅ Обновите frontend/.env с backend URL
4. ✅ Push изменений → автодеплой frontend
5. ✅ Проверьте работу приложения

---

## Поддержка

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: https://github.com/AntonKuznetsov1911/Taro/issues

---

**Создано с помощью Claude Code**
**Дата: 2025-11-09**
