# Taro - Mystical Tarot App

Приложение на React Native / Expo 54. В Android 1.4.1 есть колода из 78 карт,
расклады с выбором карт из веера, дневник карты дня, история, гороскоп, руны,
нумерология, совместимость и хиромантия. Раскладом можно поделиться как PNG.

На главном экране находятся карта дня, выбор расклада и мистические практики.
Дневник карты дня открывается из списка практик и из открытой карты дня.
Основные расчёты и распознавание ладони выполняются на устройстве.

## Разработка и проверки

Нужны Node.js 20.19.4+ и npm. Используется `package-lock.json`.

```sh
cd frontend
npm ci
npm run typecheck
npm run test:unit
npm run build:web
```

Проверка общего интерфейса в браузере: установите зависимости также в корне
репозитория (`npm ci`), запустите `python frontend/scripts/serve-export.py`, затем
в другом терминале `node frontend/scripts/test-android-web.js`. Для установленного
Chrome/Edge можно задать `TARO_BROWSER_PATH`, иначе нужен `npx playwright install chromium`.

## Android

Нужны JDK 21, Android SDK 36, Build Tools 36.0.0, NDK 27.1.12297006,
CMake 3.22.1. На Windows используйте короткие физические пути к проекту
и `GRADLE_USER_HOME`; подставные диски могут нарушить автоподключение модулей.

```sh
cd frontend
npx expo prebuild --platform android --no-install
cd android
./gradlew :app:assembleRelease :app:bundleRelease :app:lintRelease
```

Перед сборкой положите **локальный** файл `frontend/signing.properties`:

```properties
storeFile=/absolute/path/to/taro-release.jks
storePassword=YOUR_LOCAL_PASSWORD
keyAlias=taro
keyPassword=YOUR_LOCAL_PASSWORD
```

Настоящий ключ и пароль находятся отдельно от исходников. Для обновлений нужен
тот же ключ. Файлы подписи, готовые APK/AAB и сгенерированный каталог Android
исключены из Git. Нативные изменения воспроизводит `frontend/plugins/with-taro-android.js`.
GitHub CI проверяет сборку с одноразовым тестовым ключом и не распространяет установщики.

Четыре инструментальных теста проверяют стартовый экран, нативное распознавание
и сохранение ежедневного напоминания без дубликатов
против release на подключённом эмуляторе: из `frontend` сначала выполните
`python scripts/prepare-native-tests.py`, повторите prebuild,
затем `./gradlew :app:connectedReleaseAndroidTest`. Тестовая фотография Google MediaPipe
не входит в приложение и загружается только для проверки.

Данные хранятся локально. Резервная копия в настройках переносит профиль,
настройки, историю, избранное, дневник карты дня и сохранённые фотографии ладони.
