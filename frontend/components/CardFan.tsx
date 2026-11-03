import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { CardBack } from './CardBack';
import { taro } from './TaroPage';
import type { DrawnCard } from '../src/utils/offlineApi';

type LeafProps = { slot: number; used: boolean; lifted: boolean; disabled: boolean; back: string; onPress: () => void };

function FanLeaf({ slot, used, lifted, disabled, back, onPress }: LeafProps) {
  const lift = useSharedValue(0);
  useEffect(() => { lift.value = withTiming(lifted ? 1 : 0, { duration: 170 }); }, [lifted, lift]);
  const offset = (slot % 7) - 3;
  const animation = useAnimatedStyle(() => ({
    transform: [{ translateY: offset * offset * 2 - 25 * lift.value }, { rotate: `${offset * (4 - 2 * lift.value)}deg` }],
  }));
  return (
    <Animated.View style={[styles.leaf, { zIndex: lifted ? 30 : slot + 1, opacity: used ? .18 : 1 }, animation]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Выбрать карту ${slot + 1}`}
        accessibilityState={{ disabled: disabled || used, selected: used }} disabled={disabled || used} onPress={onPress}
        style={[styles.back, lifted && styles.highlight]}>
        {back ? <CardBack uri={back} style={styles.art} /> : <Text style={styles.star}>✦</Text>}
      </Pressable>
    </Animated.View>
  );
}

export function CardFan({ cards, chosen, lifted, back, onPick }: {
  cards: DrawnCard[]; chosen: DrawnCard[]; lifted: number | null; back: string; onPick: (card: DrawnCard) => void;
}) {
  const ids = new Set(chosen.map(card => card.id));
  return (
    <View style={styles.container}>
      <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
        {cards.map((card, index) => <FanLeaf key={card.id} slot={index} used={ids.has(card.id)}
          lifted={lifted === card.id} disabled={lifted !== null} back={back} onPress={() => onPick(card)} />)}
      </ScrollView>
      <Text style={styles.hint}>Листайте веер в стороны</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#150D24', borderRadius: 17, borderWidth: 1, borderColor: taro.border, overflow: 'hidden' },
  cards: { paddingTop: 32, paddingBottom: 24, paddingLeft: 31, paddingRight: 20 },
  leaf: { marginLeft: -13 },
  back: { width: 62, height: 94, borderRadius: 7, overflow: 'hidden', backgroundColor: '#271642', borderWidth: 1, borderColor: '#AE8558', alignItems: 'center', justifyContent: 'center' },
  highlight: { borderColor: '#FFDE9B', borderWidth: 2 },
  art: { width: '100%', height: '100%' },
  star: { color: taro.gold, fontSize: 23 },
  hint: { textAlign: 'center', color: taro.muted, fontSize: 12, paddingBottom: 12 },
});
