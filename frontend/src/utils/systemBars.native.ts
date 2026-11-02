import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
export function configureSystemBars(): void {
  if (Platform.OS === 'android') void NavigationBar.setButtonStyleAsync('light').catch(() => undefined);
}
