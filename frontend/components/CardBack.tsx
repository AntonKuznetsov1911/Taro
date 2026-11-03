import React from 'react';
import { Image, Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

/** Android's Image does not decode SVG. Keep the original vector artwork. */
export function CardBack({ uri, style }: { uri: string; style: StyleProp<ViewStyle> }) {
  if (Platform.OS !== 'web' && uri.startsWith('data:image/svg+xml,')) {
    return <View style={[style, { overflow: 'hidden' }]}><SvgXml xml={decodeURIComponent(uri.slice(uri.indexOf(',') + 1))} width="100%" height="100%" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" /></View>;
  }
  return <Image source={{ uri }} style={style as any} resizeMode="cover" />;
}
