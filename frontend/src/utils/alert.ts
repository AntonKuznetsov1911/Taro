import { Alert, Platform } from 'react-native';

export interface AlertButtonSpec {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * react-native-web's Alert.alert() is a silent no-op
 * (node_modules/react-native-web/src/exports/Alert — the class has one method
 * and an empty body). Since this app ships primarily as a web build, every
 * confirmation dialog, validation message and success notice that called
 * `Alert.alert(...)` directly simply never appeared, and any `onPress`
 * handler passed to it never ran — buttons looked dead.
 *
 * This gives the exact same call signature a real implementation on web
 * (native `window.alert`/`window.confirm`) while native builds keep using
 * the real `Alert.alert`.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButtonSpec[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;
  const list = buttons && buttons.length > 0 ? buttons : [{ text: 'ОК' } as AlertButtonSpec];

  if (list.length === 1) {
    window.alert(text);
    list[0].onPress?.();
    return;
  }

  const cancelButton = list.find((b) => b.style === 'cancel');
  const confirmButton = list.find((b) => b !== cancelButton) ?? list[0];

  if (window.confirm(text)) {
    confirmButton.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
}
