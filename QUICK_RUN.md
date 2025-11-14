# 🔮 TARO - Быстрый запуск

## ✅ Приложение развернуто!

### 🌐 Frontend (GitHub Pages)
**URL:** https://antonkuznetsov1911.github.io/Taro/

**Статус:** ✅ Работает
**Деплой:** Автоматический через GitHub Actions

---

### 🔗 Backend (Local + Tunnel)
**Публичный URL:** https://taro-mystical.loca.lt
**Локальный URL:** http://localhost:8000

**Статус:** ✅ Запущен
**Процессы:** 2 фоновых процесса (Backend + Tunnel)

---

## 🚀 Как запустить?

### Вариант 1: Быстрый запуск (один клик)
```bash
# Дважды кликните на файл:
START_TARO.bat
```

Этот скрипт автоматически:
1. Запустит Backend на порту 8000
2. Создаст публичный туннель
3. Откроет Frontend в браузере

### Вариант 2: Ручной запуск

#### 1. Backend
```bash
cd backend
python -m uvicorn server:app --host 0.0.0.0 --port 8000
```

#### 2. Публичный туннель (в новом окне)
```bash
lt --port 8000 --subdomain taro-mystical
```

#### 3. Frontend
Откройте: https://antonkuznetsov1911.github.io/Taro/

---

## 📊 Текущая конфигурация

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=tatoai_database
OPENAI_API_KEY=sk-proj-9VjZIK...
```

### Frontend (.env)
```env
EXPO_PUBLIC_BACKEND_URL=https://taro-mystical.loca.lt
```

---

## 🔧 Управление процессами

### Проверить статус Backend
```bash
curl http://localhost:8000/
```

### Проверить туннель
```bash
curl https://taro-mystical.loca.lt/
```

### Остановить все
Закройте окна командной строки с Backend и Tunnel

---

## 📱 Возможности приложения

### Гадания
- 🔮 **Таро** - 78 карт с AI-толкованиями
- ⭐ **Астрология** - натальные карты
- 🔢 **Нумерология** - расчеты и прогнозы
- ᚱ **Руны** - Elder Futhark
- 🤝 **Совместимость** - анализ отношений
- 👋 **Хиромантия** - чтение по ладони

### Технологии
- **Frontend:** React Native (Expo), TypeScript
- **Backend:** FastAPI, Python
- **AI:** OpenAI GPT-3.5 Turbo
- **Database:** MongoDB
- **Hosting:** GitHub Pages + localtunnel

---

## 🆘 Проблемы?

### Backend не запускается
```bash
# Проверьте зависимости
cd backend
pip install -r requirements.txt
```

### Туннель не работает
```bash
# Переустановите localtunnel
npm install -g localtunnel
```

### Frontend не обновляется
```bash
# Проверьте GitHub Actions
# https://github.com/AntonKuznetsov1911/Taro/actions
```

---

## 📝 Следующие шаги

### Для постоянного хостинга:

1. **MongoDB Atlas** (бесплатно)
   - https://www.mongodb.com/cloud/atlas/register
   - Создайте M0 кластер
   - Обновите MONGO_URL в backend/.env

2. **Railway** (бесплатно)
   - https://railway.app
   - Deploy from GitHub
   - Добавьте переменные окружения
   - Получите постоянный URL

3. **Обновите Frontend**
   - Замените EXPO_PUBLIC_BACKEND_URL в frontend/.env
   - Закоммитьте и запушьте в GitHub
   - Автоматический деплой через Actions

---

## 📞 Полезные ссылки

| Ресурс | URL |
|--------|-----|
| 🌐 **Frontend** | https://antonkuznetsov1911.github.io/Taro/ |
| ⚙️ **GitHub Pages Settings** | https://github.com/AntonKuznetsov1911/Taro/settings/pages |
| 🔄 **GitHub Actions** | https://github.com/AntonKuznetsov1911/Taro/actions |
| 📦 **Репозиторий** | https://github.com/AntonKuznetsov1911/Taro |
| 🔗 **Backend Tunnel** | https://taro-mystical.loca.lt |

---

## ✨ Создано

**Дата:** 2025-11-14
**Автор:** Anton Kuznetsov
**Помощник:** Claude Code

---

**Приложение готово к использованию! Следуйте инструкциям выше для запуска.**
