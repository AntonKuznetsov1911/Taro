# Taro - Deployment Guide

## Обзор

Taro - мистическое приложение для гаданий на картах Таро, состоящее из двух частей:
- **Frontend**: React Native (Expo) приложение с web-поддержкой
- **Backend**: FastAPI сервер с MongoDB и OpenAI интеграцией

---

## Frontend Deployment (GitHub Pages)

### Автоматическое развертывание

Frontend настроен для автоматического развертывания на GitHub Pages через GitHub Actions.

#### Шаги для активации:

1. **Перейдите в настройки репозитория**
   ```
   GitHub Repository → Settings → Pages
   ```

2. **Настройте Source**
   - Source: `GitHub Actions`
   - Workflow: `.github/workflows/deploy.yml` (уже создан)

3. **Push изменений в main ветку**
   ```bash
   git add .
   git commit -m "Setup GitHub Pages deployment"
   git push origin main
   ```

4. **Проверьте деплой**
   - Перейдите во вкладку `Actions`
   - Дождитесь завершения workflow "Deploy to GitHub Pages"
   - После успешного деплоя приложение будет доступно по адресу:
     ```
     https://antonkuznetsov1911.github.io/Taro/
     ```

### Ручное развертывание

Если нужно развернуть вручную:

```bash
# 1. Перейдите в папку frontend
cd frontend

# 2. Установите зависимости
npm install

# 3. Соберите приложение для web
npx expo export --platform web

# 4. Добавьте .nojekyll файл
cd dist
touch .nojekyll

# 5. Деплой через GitHub Pages (например, с помощью gh-pages)
npm install -g gh-pages
gh-pages -d dist
```

---

## Backend Deployment

Backend требует развертывания на сервере с поддержкой Python и доступом к MongoDB.

### Рекомендуемые платформы:

#### 1. **Render.com** (Рекомендуется)

**Преимущества:**
- Бесплатный tier
- Автоматический деплой из GitHub
- Встроенная поддержка Python
- Бесплатная PostgreSQL база (можно использовать MongoDB Atlas отдельно)

**Шаги:**

1. Создайте аккаунт на [render.com](https://render.com)

2. Создайте новый Web Service:
   - Connect your GitHub repository
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT`

3. Настройте Environment Variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   MONGO_URL=your_mongodb_connection_string
   DB_NAME=taro
   ```

4. Deploy!

#### 2. **Railway.app**

**Преимущества:**
- Простая настройка
- Автоматический деплой
- Интеграция с MongoDB

**Шаги:**

1. Создайте проект на [railway.app](https://railway.app)
2. Deploy from GitHub
3. Добавьте MongoDB из Marketplace
4. Настройте переменные окружения
5. Deploy

#### 3. **Heroku**

**Шаги:**

```bash
# 1. Установите Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# 2. Логин
heroku login

# 3. Создайте приложение
heroku create taro-backend

# 4. Добавьте buildpack для Python
heroku buildpacks:set heroku/python

# 5. Настройте переменные окружения
heroku config:set OPENAI_API_KEY=your_key
heroku config:set MONGO_URL=your_mongo_url
heroku config:set DB_NAME=taro

# 6. Deploy
git subtree push --prefix backend heroku main
```

### MongoDB Setup

Для backend нужна MongoDB база данных.

**Рекомендация: MongoDB Atlas** (бесплатный tier)

1. Создайте аккаунт на [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Создайте бесплатный кластер (M0)
3. Настройте Network Access (разрешите доступ с любого IP: 0.0.0.0/0)
4. Создайте пользователя базы данных
5. Получите connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/taro?retryWrites=true&w=majority
   ```

---

## Environment Variables

### Frontend (.env)

```env
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

После развертывания backend обновите этот файл с актуальным URL.

### Backend (.env)

```env
OPENAI_API_KEY=sk-your-openai-api-key
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/
DB_NAME=taro
```

---

## Полный процесс развертывания

### Шаг 1: Backend

1. Разверните MongoDB на Atlas
2. Получите MONGO_URL
3. Получите OpenAI API Key
4. Разверните backend на Render/Railway/Heroku
5. Настройте переменные окружения
6. Запишите URL backend (например: `https://taro-backend.onrender.com`)

### Шаг 2: Frontend

1. Обновите `frontend/.env`:
   ```env
   EXPO_PUBLIC_BACKEND_URL=https://taro-backend.onrender.com
   ```

2. Закоммитьте изменения:
   ```bash
   git add frontend/.env
   git commit -m "Update backend URL"
   git push origin main
   ```

3. GitHub Actions автоматически развернет frontend на GitHub Pages

### Шаг 3: Проверка

1. Откройте `https://antonkuznetsov1911.github.io/Taro/`
2. Проверьте работу приложения
3. Убедитесь, что API запросы работают

---

## Локальная разработка

### Backend

```bash
cd backend

# Установите зависимости
pip install -r requirements.txt

# Создайте .env файл
echo "OPENAI_API_KEY=your_key" > .env
echo "MONGO_URL=your_mongo_url" >> .env
echo "DB_NAME=taro" >> .env

# Запустите сервер
uvicorn server:app --reload --port 8000
```

Backend будет доступен на `http://localhost:8000`

### Frontend

```bash
cd frontend

# Установите зависимости
npm install

# Создайте .env файл
echo "EXPO_PUBLIC_BACKEND_URL=http://localhost:8000" > .env

# Запустите Expo
npm start
```

Для web: нажмите `w` в терминале Expo

---

## Troubleshooting

### Frontend не загружается

1. Проверьте, что GitHub Pages включен в настройках репозитория
2. Проверьте логи в Actions → Deploy to GitHub Pages
3. Убедитесь, что файл `.nojekyll` присутствует в dist

### Backend ошибки

1. Проверьте переменные окружения
2. Проверьте подключение к MongoDB (Network Access в Atlas)
3. Проверьте логи сервера
4. Убедитесь, что OpenAI API key валиден

### CORS ошибки

Если frontend не может подключиться к backend:

1. Проверьте CORS настройки в `backend/server.py`:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],  # В продакшене укажите конкретные домены
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. Убедитесь, что backend URL правильно указан в `frontend/.env`

---

## Обновление приложения

### Frontend

Просто push изменений в GitHub:
```bash
git add .
git commit -m "Update frontend"
git push origin main
```

GitHub Actions автоматически пересоберет и задеплоит.

### Backend

Зависит от платформы:

**Render/Railway:**
```bash
git add .
git commit -m "Update backend"
git push origin main
```

Автоматически задеплоится.

**Heroku:**
```bash
git subtree push --prefix backend heroku main
```

---

## Мониторинг

### Frontend
- GitHub Actions для логов деплоя
- GitHub Pages статус в Settings → Pages

### Backend
- Логи на платформе хостинга (Render/Railway/Heroku)
- MongoDB Atlas Metrics для мониторинга базы данных
- OpenAI Usage dashboard для отслеживания использования API

---

## Стоимость

### Frontend (GitHub Pages)
- **Бесплатно** для публичных репозиториев
- Лимит: 1 GB хранилища, 100 GB bandwidth/месяц

### Backend
- **Render.com Free Tier**: Бесплатно (усыпает после 15 минут неактивности)
- **Railway.app Free Tier**: $5 кредитов/месяц
- **MongoDB Atlas M0**: Бесплатно (512 MB хранилища)

### API
- **OpenAI GPT-3.5-turbo**: ~$0.002 за 1K токенов
  - Примерная стоимость одного гадания: $0.01-0.03
  - 100 гаданий ≈ $1-3

---

## Альтернативные варианты развертывания

### Vercel (для Frontend)

```bash
npm install -g vercel
cd frontend
vercel --prod
```

### Netlify (для Frontend)

```bash
npm install -g netlify-cli
cd frontend
npx expo export --platform web
netlify deploy --prod --dir=dist
```

---

## Security Notes

1. **Никогда** не коммитьте `.env` файлы с реальными ключами
2. Используйте `.gitignore` для исключения `.env`
3. Используйте переменные окружения на платформе хостинга
4. Ограничьте CORS в продакшене до конкретных доменов
5. Настройте Network Access в MongoDB Atlas

---

## Support

Для вопросов и проблем:
- Создайте issue на GitHub
- Проверьте IMPROVEMENTS_SUMMARY.md для деталей архитектуры

---

**Создано с помощью Claude Code**
**Дата: 2025-11-09**
