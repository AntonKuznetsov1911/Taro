import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export function captureReadingImage(view: View, width: number, height: number): Promise<string> {
  return captureRef(view, { format: 'png', result: 'tmpfile', width, height });
}
