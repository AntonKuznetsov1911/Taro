# 🤖 Деплой Telegram бота Taro на Railway

## 📋 Подготовка

### 1. Получить MongoDB URI
Создайте бесплатный кластер на [MongoDB Atlas](https://www.mongodb.com/cloud/atlas):
- Создайте M0 Free Tier кластер
- Создайте database user
- Добавьте IP `0.0.0.0/0` в Network Access
- Скопируйте Connection String

### 2. Проверить токены
- ✅ Telegram Bot Token: `8027914431:AAH03n5VZBqCs_2hOnGnTIm6fobVA_VzbEE`
- ✅ Railway Project ID: `2f485ad7-672e-4b9f-9223-aa2136396904`

---

## 🚀 Деплой на Railway

### Вариант 1: Через Web UI (Рекомендуется)

1. Откройте [Railway Dashboard](https://railway.app/dashboard)
2. Найдите проект `2f485ad7-672e-4b9f-9223-aa2136396904`
3. Нажмите **New** → **GitHub Repo**
4. Выберите репозиторий: `AntonKuznetsov1911/Taro`
5. После создания сервиса, добавьте переменные окружения

### Вариант 2: Через CLI

```bash
# 1. Перейти в директорию проекта
cd C:\Users\PC\Taro

# 2. Подключиться к Railway (интерактивно)
railway link

# 3. Добавить переменные окружения
railway variables set TELEGRAM_BOT_TOKEN="8027914431:AAH03n5VZBqCs_2hOnGnTIm6fobVA_VzbEE"
railway variables set MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority"
railway variables set DB_NAME="taro_bot"
railway variables set OPENAI_API_KEY="sk-your-key-here"

# 4. Деплой
railway up
```

---

## ⚙️ Переменные окружения для Railway

Добавьте следующие переменные в Railway Dashboard:

| Переменная | Значение | Обязательная |
|------------|----------|--------------|
| `TELEGRAM_BOT_TOKEN` | `8027914431:AAH03n5VZBqCs_2hOnGnTIm6fobVA_VzbEE` | ✅ Да |
| `MONGO_URL` | `mongodb+srv://...` | ✅ Да |
| `DB_NAME` | `taro_bot` | ✅ Да |
| `OPENAI_API_KEY` | `sk-...` | ✅ Да |

---

## 📦 Что деплоится?

- **Файл запуска**: `backend/bot.py`
- **Команда**: `cd backend && python bot.py`
- **Зависимости**: `backend/requirements.txt`
  - `python-telegram-bot>=20.0`
  - `openai>=0.28.1`
  - `motor==3.3.1` (MongoDB async driver)
  - И другие...

---

## ✅ Проверка работы

### 1. Проверить логи
```bash
railway logs
```

### 2. Проверить статус
```bash
railway status
```

### 3. Проверить бота
Откройте Telegram и найдите бота:
- Отправьте `/start`
- Выберите "🔮 Расклад Таро"
- Задайте вопрос

---

## 🔧 Возможные проблемы

### Ошибка "TELEGRAM_BOT_TOKEN not found"
**Решение**: Добавьте переменную окружения в Railway Dashboard

### Ошибка подключения к MongoDB
**Решение**:
1. Проверьте правильность MONGO_URL
2. Убедитесь, что IP `0.0.0.0/0` добавлен в MongoDB Atlas Network Access
3. Проверьте username и password в connection string

### Бот не отвечает
**Решение**:
1. Проверьте логи: `railway logs`
2. Убедитесь, что деплой успешен в Railway Dashboard
3. Проверьте, что сервис запущен

---

## 📊 Конфигурация Railway

### Файлы конфигурации:
- `Procfile` - команда запуска для Railway
- `railway.toml` - настройки деплоя
- `nixpacks.toml` - конфигурация Nixpacks builder

### Procfile содержит:
```
bot: cd backend && python bot.py
```

---

## 🎯 Функционал бота

### 🔮 Расклады Таро:
- **Одна карта** - быстрый ответ
- **Три карты** - прошлое, настоящее, будущее
- **Кельтский крест** - детальный анализ (10 карт)

### 🤝 Совместимость:
- Анализ совместимости по именам
- AI-интерпретация от OpenAI

### 🎨 Категории:
- ❤️ Любовь
- 💼 Карьера
- 💰 Финансы
- 🔮 Общие вопросы

---

## 📝 Команды Railway CLI

```bash
# Подключиться к проекту
railway link

# Посмотреть статус
railway status

# Посмотреть переменные
railway variables

# Добавить переменную
railway variables set KEY=VALUE

# Деплой
railway up

# Логи (реалтайм)
railway logs

# Открыть Dashboard
railway open
```

---

## 🔗 Полезные ссылки

- [Railway Dashboard](https://railway.app/dashboard)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Telegram BotFather](https://t.me/BotFather)
- [OpenAI API Keys](https://platform.openai.com/api-keys)

---

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи: `railway logs`
2. Проверьте переменные окружения в Railway Dashboard
3. Убедитесь, что все токены корректные
4. Проверьте подключение к MongoDB Atlas

---

**Создано**: 2025-12-13
**Автор**: Anton Kuznetsov
**Помощник**: Claude Code
