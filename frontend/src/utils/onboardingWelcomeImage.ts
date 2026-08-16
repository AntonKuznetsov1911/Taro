/**
 * Необязательная фоновая картинка приветственного экрана онбординга.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ Хотите заменить нарисованную кодом сцену своей картинкой —          │
 * │ просто положите файл                                                │
 * │                                                                     │
 * │     frontend/assets/onboarding-welcome.png                          │
 * │                                                                     │
 * │ и пересоберите приложение. Картинка развернётся на весь экран        │
 * │ (resizeMode="cover") позади всего содержимого, поверх неё ляжет      │
 * │ тёмная вуаль, чтобы заголовок и подписи остались читаемыми,          │
 * │ а нарисованный фон (небо, туманность, портьеры, карты) выключится.   │
 * │ Файла нет — фон рисуется кодом, ничего не ломается.                  │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Почему try/catch: голый require() несуществующего файла роняет сборку
 * Metro («Unable to resolve module»). Зависимости внутри try/catch Metro
 * считает опциональными (allowOptionalDependencies включён в конфиге Expo),
 * поэтому сборка проходит и при отсутствии файла — здесь мы просто ловим
 * ошибку и отдаём null.
 */
let welcomeImage: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  welcomeImage = require('../../assets/onboarding-welcome.png');
} catch {
  welcomeImage = null;
}

export const ONBOARDING_WELCOME_IMAGE: any = welcomeImage ?? null;

export const hasOnboardingWelcomeImage = ONBOARDING_WELCOME_IMAGE != null;
