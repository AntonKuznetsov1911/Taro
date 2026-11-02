import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

/** Native vector sky: two animated layers keep the background light on the UI thread. */
export function CosmicBackground() {
  const first = useRef(new Animated.Value(.55)).current;
  const second = useRef(new Animated.Value(1)).current;
  const stars = useMemo(() => Array.from({ length: 260 }, (_, i) => ({
    id: i, x: Math.random() * 400, y: Math.random() * 900,
    r: i % 17 === 0 ? 1.25 : .25 + Math.random() * .55,
    opacity: .25 + Math.random() * .6, color: i % 5 === 0 ? '#A8D4FF' : '#FFF8E7',
  })), []);
  useEffect(() => {
    const pulse = (value: Animated.Value, duration: number) => Animated.loop(Animated.sequence([
      Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(value, { toValue: .38, duration: duration * 1.2, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    ]));
    const a = pulse(first, 3800), b = pulse(second, 5300);
    a.start(); b.start();
    return () => { a.stop(); b.stop(); };
  }, [first, second]);
  return <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}>
    <Svg width="100%" height="100%" viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
      <Defs><RadialGradient id="native-nebula"><Stop offset="0" stopColor="#7A43AB" stopOpacity=".19" /><Stop offset="1" stopColor="#33204D" stopOpacity="0" /></RadialGradient></Defs>
      <Ellipse cx="200" cy="450" rx="280" ry="195" fill="url(#native-nebula)" transform="rotate(-25 200 450)" />
    </Svg>
    {[first, second].map((opacity, layer) => <Animated.View key={layer} style={[StyleSheet.absoluteFill, { opacity }]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice">
        {stars.filter(star => star.id % 2 === layer).map(star => <Circle key={star.id} cx={star.x} cy={star.y} r={star.r} fill={star.color} opacity={star.opacity} />)}
      </Svg>
    </Animated.View>)}
  </View>;
}
