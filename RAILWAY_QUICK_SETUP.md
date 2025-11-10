# 🚀 Быстрая настройка Railway - 3 минуты

## ✅ Что уже готово
- OpenAI API ключ: `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`

## 📋 Что нужно сделать (2 шага)

### Шаг 1: Получить MongoDB URL (2 минуты)

**Вариант А: MongoDB Atlas (рекомендуется)**

1. Откройте: https://www.mongodb.com/cloud/atlas/register
2. Зарегистрируйтесь (можно через Google)
3. Выберите **M0 Free** кластер
4. Регион: любой (например, AWS Frankfurt)
5. Нажмите **Create Cluster**
6. Подождите 1-3 минуты
7. Перейдите в **Database Access** → **Add New Database User**
   - Username: `tarouser`
   - Password: `TaroPass2025!` (или свой)
   - Нажмите **Add User**
8. Перейдите в **Network Access** → **Add IP Address**
   - Нажмите **Allow Access from Anywhere** (0.0.0.0/0)
   - Нажмите **Confirm**
9. Вернитесь в **Database** → нажмите **Connect**
   - Выберите **Drivers**
   - Скопируйте connection string
   - Замените `<password>` на ваш пароль

**Результат:** У вас будет URL вида:
```
mongodb+srv://tarouser:TaroPass2025!@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**Вариант Б: Без MongoDB (ограниченный функционал)**

Можно пропустить MongoDB, но тогда не будут работать:
- История гаданий
- Сохранение результатов
- Персональные рекомендации

---

### Шаг 2: Развернуть на Railway (1 минута)

1. Откройте: https://railway.app/new
2. Нажмите **Login with GitHub**
3. Нажмите **Deploy from GitHub repo**
4. Выберите репозиторий: `AntonKuznetsov1911/Taro`
5. Нажмите **Deploy Now**

**Подождите 30 секунд, пока проект создастся**

6. Перейдите во вкладку **Variables**
7. Нажмите **New Variable** и добавьте:

```bash
# Скопируйте эти переменные по одной:

OPENAI_API_KEY
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

MONGO_URL
ваш-mongodb-url-из-шага-1

DB_NAME
taro

PORT
8000
```

8. Railway автоматически начнет деплой (2-3 минуты)
9. После завершения перейдите во вкладку **Settings** → **Networking**
10. Нажмите **Generate Domain**
11. **Скопируйте URL** (например: `taro-production.up.railway.app`)

---

## 🔗 Шаг 3: Подключить Frontend к Backend

Скопируйте полученный Railway URL и сообщите мне. Я автоматически обновлю frontend!

---

## 🆘 Проблемы?

**MongoDB не создается:**
- Выберите регион ближе к вам
- Проверьте email для подтверждения

**Railway не деплоится:**
- Проверьте логи во вкладке **Deployments**
- Убедитесь, что все переменные добавлены

**Backend не отвечает:**
- Подождите 3-5 минут после деплоя
- Проверьте, что домен сгенерирован

---

## 📞 Когда закончите

Напишите мне Railway URL, и я:
1. Обновлю frontend/.env
2. Запущу автоматический деплой
3. Протестирую полную работоспособность

**Ожидаемое время:** 5-7 минут до полностью работающего приложения!
