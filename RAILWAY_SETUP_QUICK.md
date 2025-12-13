# 🚂 Быстрая настройка Railway для Taro

## ✅ Исправлено
- ✅ Nixpacks конфигурация исправлена
- ✅ Build команды упрощены
- ✅ Готово к деплою

---

## 🚀 Деплой за 5 минут

### Шаг 1: Откройте Railway
👉 https://railway.app/new

### Шаг 2: Deploy from GitHub
1. Нажмите **"Deploy from GitHub repo"**
2. Выберите репозиторий: **AntonKuznetsov1911/Taro**
3. Нажмите **Deploy Now**

Railway автоматически обнаружит Python проект и начнет деплой.

### Шаг 3: Добавьте переменные окружения

После создания проекта перейдите в **Variables** и добавьте:

```env
ANTHROPIC_API_KEY=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

XAI_API_KEY=xai-ZDSIDBihzv0ndTU2mZdDF7S1zgHQly368askDGSdHOE0BVr2DXxBWMnb87EOJaF2oISjJoeBcCorxFnJ

MONGO_URL=mongodb://localhost:27017
DB_NAME=taro
PORT=8000
```

**ВАЖНО**: Замените `MONGO_URL` на ваш MongoDB Atlas connection string!

### Шаг 4: Добавьте MongoDB (опционально)

Если у вас нет MongoDB:

1. В том же проекте нажмите **"+ New"**
2. Выберите **"Database" → "MongoDB"**
3. Railway создаст MongoDB и автоматически добавит `MONGO_URL`

### Шаг 5: Настройте домен

1. Перейдите в **Settings → Networking**
2. Нажмите **"Generate Domain"**
3. Скопируйте URL (например: `taro-production.up.railway.app`)

### Шаг 6: Проверьте деплой

Откройте в браузере:
```
https://your-app.up.railway.app/api/
```

Должно вернуть: `{"message": "Taro API is running"}`

---

## 📋 Переменные окружения

| Переменная | Описание | Обязательно |
|-----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API ключ (основной AI) | ✅ Да |
| `XAI_API_KEY` | XAI Grok ключ (запасной AI) | ✅ Да |
| `MONGO_URL` | MongoDB connection string | ✅ Да |
| `DB_NAME` | Имя базы данных | ✅ Да |
| `PORT` | Порт сервера (Railway установит автоматически) | ⚠️ Нет |

---

## 🔍 Проверка логов

Если возникли ошибки:

1. Перейдите в **Deployments**
2. Выберите последний деплой
3. Нажмите **"View Logs"**
4. Проверьте на ошибки:
   - ✅ `Claude API инициализирован`
   - ✅ `XAI (Grok) API инициализирован`
   - ❌ Если ошибки - проверьте API ключи

---

## ✅ Проверка работы API

После успешного деплоя проверьте:

```bash
# Здоровье API
curl https://your-app.up.railway.app/api/

# Категории гаданий
curl https://your-app.up.railway.app/api/categories

# Типы раскладов
curl https://your-app.up.railway.app/api/spreads
```

---

## 🎯 Следующие шаги

После успешного деплоя backend:

1. **Скопируйте Railway URL** (например: `https://taro-production.up.railway.app`)
2. Сообщите мне URL - я обновлю frontend
3. GitHub Actions автоматически пересоберет приложение
4. Ваше приложение Taro заработает полностью!

---

## 💰 Стоимость

**Railway Hobby Plan** (бесплатно):
- $5 бесплатных кредитов в месяц
- Достаточно для ~500 часов работы
- Идеально для тестирования

**Claude 3.5 Haiku**:
- $0.25 / 1M входящих токенов
- $1.25 / 1M исходящих токенов
- Одно гадание ≈ $0.001-0.005 (1000 гаданий = $1-5)

**XAI Grok** (запасной):
- Используется только если Claude недоступен
- Экономит деньги

---

## ❓ Проблемы?

### Build fails
- Проверьте что `nixpacks.toml` без `pip` в nixPkgs
- Коммит `2df0b36` должен быть в main

### API не отвечает
- Проверьте переменные окружения (Variables)
- Проверьте что `ANTHROPIC_API_KEY` и `XAI_API_KEY` установлены
- Проверьте логи деплоя

### MongoDB ошибки
- Убедитесь что `MONGO_URL` правильный
- Для MongoDB Atlas: разрешите доступ с `0.0.0.0/0` в Network Access

---

**Готово! 🎉**

После деплоя сообщите мне Railway URL и я обновлю frontend!
