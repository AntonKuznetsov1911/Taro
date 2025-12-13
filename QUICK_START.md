# 🔮 Taro App - Quick Start

## Статус развертывания

✅ **Frontend**: Подготовлен и запушен в GitHub
⏳ **GitHub Pages**: Требуется активация
⏳ **Backend**: Требуется развертывание

---

## 🚀 Быстрый доступ

### Важные ссылки

| Что | Ссылка |
|-----|--------|
| 🌐 **Сайт приложения** | https://antonkuznetsov1911.github.io/Taro/ |
| ⚙️ **Настройки Pages** | https://github.com/AntonKuznetsov1911/Taro/settings/pages |
| 🔄 **GitHub Actions** | https://github.com/AntonKuznetsov1911/Taro/actions |
| 📦 **Репозиторий** | https://github.com/AntonKuznetsov1911/Taro |

---

## ✅ Что уже сделано

1. ✅ Репозиторий склонирован
2. ✅ Frontend собран для web
3. ✅ GitHub Actions workflow создан
4. ✅ Изменения закоммичены и запушены
5. ✅ Документация создана (DEPLOYMENT.md)
6. ✅ Браузер с инструкциями открыт

---

## 📋 Что нужно сделать (2 минуты)

### Шаг 1: Включить GitHub Pages

1. Откройте: https://github.com/AntonKuznetsov1911/Taro/settings/pages
2. В разделе **Source** выберите: `GitHub Actions`
3. Нажмите **Save**

### Шаг 2: Проверить деплой

1. Откройте: https://github.com/AntonKuznetsov1911/Taro/actions
2. Убедитесь, что workflow "Deploy to GitHub Pages" запустился
3. Дождитесь зеленой галочки (3-5 минут)

### Шаг 3: Открыть приложение

После успешного деплоя откройте:
```
https://antonkuznetsov1911.github.io/Taro/
```

---

## 🎯 Текущая ситуация

### Frontend (готов ✅)
- Собран статический build
- Workflow для автодеплоя создан
- Ожидает активации GitHub Pages

### Backend (требует настройки ⏳)

Для полной функциональности приложения нужно развернуть backend.

**Рекомендация: Render.com (бесплатно)**

1. Создайте аккаунт на https://render.com
2. Создайте новый Web Service
3. Подключите репозиторий
4. Настройте команды:
   ```
   Build: pip install -r backend/requirements.txt
   Start: cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT
   ```
5. Добавьте переменные окружения:
   - `OPENAI_API_KEY` - ваш OpenAI ключ
   - `MONGO_URL` - MongoDB connection string
   - `DB_NAME=taro`

**MongoDB (бесплатно)**
- Получите на https://mongodb.com/cloud/atlas
- Free tier M0 (512 MB)

**Подробности в:** `DEPLOYMENT.md`

---

## 📊 Структура проекта

```
Taro/
├── frontend/
│   ├── dist/              # Собранный web-build
│   ├── app/               # React Native app
│   ├── components/        # UI компоненты
│   └── package.json
│
├── backend/
│   ├── server.py          # FastAPI сервер
│   ├── tarot_cards_data.py
│   └── requirements.txt
│
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions
│
├── DEPLOYMENT.md          # Полная документация
├── QUICK_START.md         # Этот файл
└── SETUP_INSTRUCTIONS.html # Интерактивная инструкция
```

---

## 🎨 О приложении Taro

**Taro** - профессиональное мистическое приложение для гаданий с AI-генерацией толкований.

### Возможности:

#### Гадания
- 🔮 Карты Таро (78 карт)
- ⭐ Астрология
- 🔢 Нумерология
- ᚱ Руны (Elder Futhark)
- 🤝 Совместимость
- 👋 Хиромантия

#### Технологии
- **Frontend**: React Native (Expo), TypeScript
- **Backend**: FastAPI, Python
- **AI**: OpenAI GPT-3.5 Turbo
- **Database**: MongoDB
- **Animations**: Reanimated 3

#### Особенности
- 3D анимации карт
- Детальные AI-толкования (1500-2500 слов)
- История гаданий с заметками
- Избранное и теги
- Карта дня
- Темная тема

---

## 🔄 Следующие действия

1. **Сейчас**: Включите GitHub Pages (см. выше)
2. **Потом** (опционально): Разверните backend
3. **Затем**: Обновите `frontend/.env` с backend URL

---

## 🆘 Проблемы?

- **Сайт не открывается?**
  - Проверьте, включен ли GitHub Pages
  - Дождитесь завершения workflow (зеленая галочка)
  - Подождите 2-3 минуты после деплоя

- **Ошибки в Actions?**
  - Проверьте логи workflow
  - Убедитесь, что Pages включен

- **Нужна помощь?**
  - Откройте `DEPLOYMENT.md` для деталей
  - Создайте issue на GitHub

---

## ✨ Создано

- **Дата**: 2025-11-09
- **Автор**: Anton Kuznetsov
- **Помощник**: Claude Code

---

**Приложение готово к публикации! Следуйте инструкциям выше для завершения.**
