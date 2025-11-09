# 🚂 Railway Setup - Пошаговая Инструкция

## 🎯 Быстрый старт (3 минуты)

### Вариант 1: Через веб-интерфейс (Рекомендуется)

#### ✅ Шаг за шагом:

**1. Авторизация**
```
Откройте: https://railway.app
Нажмите: "Start a New Project" или "Login with GitHub"
```

**2. Создание проекта**
```
→ New Project
→ Deploy from GitHub repo
→ Найдите и выберите: AntonKuznetsov1911/Taro
→ Railway автоматически обнаружит Python проект
```

**3. Конфигурация (Railway сделает автоматически!)**

Railway обнаружит:
- ✅ `railway.json` - конфигурация проекта
- ✅ `Procfile` - команда запуска
- ✅ `nixpacks.toml` - настройки сборки
- ✅ `backend/requirements.txt` - зависимости Python

**4. Переменные окружения**

Нажмите **"Variables"** и добавьте:

| Переменная | Значение | Где получить |
|------------|----------|--------------|
| `OPENAI_API_KEY` | `sk-...` | https://platform.openai.com/api-keys |
| `MONGO_URL` | `mongodb+srv://...` | https://www.mongodb.com/cloud/atlas |
| `DB_NAME` | `taro` | Просто введите `taro` |

**5. Deploy!**
```
Нажмите: "Deploy"
Ожидайте: 2-3 минуты
Получите: URL вашего backend (например: taro-production.up.railway.app)
```

---

## 📋 Детальная настройка переменных

### OPENAI_API_KEY

**Что это:** Ключ для доступа к OpenAI GPT API

**Как получить:**

1. Перейдите на https://platform.openai.com
2. Зарегистрируйтесь или войдите
3. API Keys → Create new secret key
4. Скопируйте ключ (начинается с `sk-...`)
5. ⚠️ Сохраните ключ! Его нельзя увидеть снова

**Формат:**
```
OPENAI_API_KEY=sk-proj-abc123xyz...
```

**Стоимость:**
- GPT-3.5-turbo: ~$0.002 за 1K токенов
- Одно гадание: ~$0.01-0.03
- 100 гаданий ≈ $1-3

---

### MONGO_URL

**Что это:** Connection string для MongoDB базы данных

**Как получить:**

1. Перейдите на https://www.mongodb.com/cloud/atlas
2. Создайте бесплатный аккаунт
3. **Create Cluster:**
   - Выберите: **Free Shared (M0)** - 512 MB бесплатно
   - Регион: выберите ближайший
   - Нажмите: Create

4. **Database Access:**
   - Add New Database User
   - Username: `taro` (или любой другой)
   - Password: сгенерируйте сложный пароль
   - User Privileges: **Read and write to any database**
   - Сохраните пароль!

5. **Network Access:**
   - Add IP Address
   - Выберите: **Allow Access from Anywhere**
   - IP: `0.0.0.0/0`
   - Confirm

6. **Get Connection String:**
   - Clusters → Connect
   - Connect your application
   - Driver: **Python** / Version: **3.12 or later**
   - Скопируйте connection string

**Формат:**
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

**⚠️ Важно:** Замените:
- `username` на имя пользователя (например: `taro`)
- `password` на ваш пароль

**Пример:**
```
MONGO_URL=mongodb+srv://taro:MySecurePass123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

---

### DB_NAME

**Что это:** Имя базы данных

**Значение:** Просто введите `taro`

```
DB_NAME=taro
```

---

## 🔧 Railway с MongoDB в одном месте

Railway предлагает встроенную MongoDB! Это проще:

**1. В вашем Railway проекте:**
```
→ + New
→ Database
→ Add MongoDB
```

**2. Railway автоматически создаст:**
- MongoDB instance
- Connection URL
- Все переменные окружения

**3. Переменная `MONGO_URL` будет добавлена автоматически!**

**Преимущества:**
- ✅ Не нужно настраивать Atlas
- ✅ Автоматическая конфигурация
- ✅ Все в одном месте

**Недостатки:**
- ❌ Не бесплатно (использует Railway кредиты)
- ❌ Ограничения по объему

---

## ✅ Проверка правильности настройки

После добавления всех переменных:

**1. Проверьте Variables:**
```
✅ OPENAI_API_KEY должен начинаться с sk-
✅ MONGO_URL должен начинаться с mongodb+srv://
✅ DB_NAME должен быть taro
```

**2. Нажмите Deploy**

**3. Проверьте логи:**
```
Railway Dashboard → Deployments → View Logs
```

**4. Ищите:**
```
✅ "Application startup complete"
✅ Нет ошибок подключения к MongoDB
✅ Нет ошибок OpenAI API
```

**5. Получите URL:**
```
Railway Dashboard → Settings → Domains
```

Пример: `https://taro-production.up.railway.app`

---

## 🧪 Тестирование backend

После успешного деплоя проверьте API:

**1. Health check:**
```bash
curl https://your-app.up.railway.app/api/
```

Ответ:
```json
{"message": "Taro API is running"}
```

**2. Проверка категорий:**
```bash
curl https://your-app.up.railway.app/api/categories
```

Ответ:
```json
[
  {"id": "love", "name": "Любовь", "icon": "❤️"},
  {"id": "career", "name": "Карьера", "icon": "💼"},
  ...
]
```

**3. Проверка раскладов:**
```bash
curl https://your-app.up.railway.app/api/spreads
```

---

## 🔗 Подключение Frontend к Backend

После успешного деплоя backend:

**1. Скопируйте URL backend:**
```
Например: https://taro-production.up.railway.app
```

**2. Обновите `frontend/.env`:**
```env
EXPO_PUBLIC_BACKEND_URL=https://taro-production.up.railway.app
```

**3. Закоммитьте:**
```bash
cd Taro
git add frontend/.env
git commit -m "Connect frontend to Railway backend"
git push origin main
```

**4. GitHub Actions автоматически:**
- Соберет frontend с новым backend URL
- Задеплоит на GitHub Pages
- Займет 3-5 минут

**5. Готово!**
```
Frontend: https://antonkuznetsov1911.github.io/Taro/
Backend: https://taro-production.up.railway.app
```

---

## 💰 Стоимость Railway

### Hobby Plan (для тестирования)
- **$5 бесплатных кредитов в месяц**
- ~500 часов работы
- Автоматическое усыпление при неактивности

**Примерный расход:**
- Backend running 24/7: ~$5/месяц
- Backend с автосном: ~$0.50/месяц

### Developer Plan ($5/месяц)
- $5 кредитов включено
- Неограниченное время работы
- Приоритетная поддержка

---

## 🆘 Troubleshooting

### Ошибка: "Failed to build"

**Причина:** Не установились зависимости

**Решение:**
1. Проверьте `backend/requirements.txt`
2. Проверьте логи Railway
3. Убедитесь, что `nixpacks.toml` правильный

---

### Ошибка: "MongoServerError: Authentication failed"

**Причина:** Неправильный пароль или username в MONGO_URL

**Решение:**
1. Проверьте пароль в MongoDB Atlas
2. Убедитесь, что пароль не содержит специальные символы (или экранирован)
3. Проверьте username

**Пример правильного URL:**
```
mongodb+srv://myuser:MyPass123@cluster.mongodb.net/...
```

---

### Ошибка: "OpenAI API key is invalid"

**Причина:** Неправильный или истекший API ключ

**Решение:**
1. Проверьте ключ на https://platform.openai.com/api-keys
2. Создайте новый ключ если нужно
3. Обновите переменную `OPENAI_API_KEY` в Railway

---

### Backend не отвечает на запросы

**Причина:** Network/CORS проблемы

**Решение:**
1. Проверьте логи Railway
2. Убедитесь, что backend запущен (не спит)
3. Проверьте CORS настройки в `server.py`

---

### MongoDB connection timeout

**Причина:** Network Access не настроен

**Решение:**
1. MongoDB Atlas → Network Access
2. Add IP Address: `0.0.0.0/0` (Allow from anywhere)
3. Confirm

---

## 📊 Мониторинг

### Railway Dashboard
- **Logs:** View real-time logs
- **Metrics:** CPU, Memory, Network usage
- **Deployments:** History of all deploys

### Полезные команды (если используете Railway CLI):
```bash
# Просмотр логов
railway logs --follow

# Статус
railway status

# Restart service
railway restart

# Open dashboard
railway open
```

---

## 🎉 Готово!

После успешной настройки:

1. ✅ Backend работает на Railway
2. ✅ MongoDB подключена
3. ✅ OpenAI API настроен
4. ✅ Frontend подключен к backend
5. ✅ Приложение полностью функционально

**Наслаждайтесь работающим Taro App!** 🔮

---

**Создано с помощью Claude Code**
**Дата: 2025-11-09**
