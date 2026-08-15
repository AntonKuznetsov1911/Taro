import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_SEEN_KEY = '@taro_onboarding_seen';

// Главный экран отправляет на онбординг всех, у кого нет профиля. Без отметки
// о пропуске кнопка «Пропустить» возвращала бы пользователя обратно на онбординг,
// и выйти из него можно было бы только заполнив все поля.

export async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1');
  } catch {
    // Не критично: в худшем случае онбординг покажется ещё раз
  }
}

export async function wasOnboardingSeen(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_SEEN_KEY)) === '1';
  } catch {
    return false;
  }
}
