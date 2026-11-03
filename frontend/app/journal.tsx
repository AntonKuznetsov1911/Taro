import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { TaroPage, taro } from '../components/TaroPage';
import { dailyJournal } from '../src/utils/dailyJournal';
import { DAILY_NOTE_LIMIT, dateFromKey, localDateKey, type DailyEntry } from '../src/utils/dailyJournalFormat';
import { getCardById } from '../src/data/tarotCards';
import { getTarotCardImageById } from '../src/utils/tarotCardAssets';
import { showAlert } from '../src/utils/alert';

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function JournalScreen() {
  const router = useRouter();
  const [today, setToday] = useState(localDateKey);
  const [selected, setSelected] = useState(today);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const writeInProgress = useRef(false);
  const selection = useRef(selected);
  selection.current = selected;

  useFocusEffect(useCallback(() => {
    let active = true;
    setToday(localDateKey());
    setLoading(true);
    setFailed(false);
    void dailyJournal.list().then(items => {
      if (!active) return;
      setEntries(items);
      setNote(items.find(entry => entry.date === selection.current)?.note ?? '');
    }).catch(() => { if (active) setFailed(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]));

  const entry = entries.find(item => item.date === selected);
  const card = entry && getCardById(entry.cardId);
  const date = dateFromKey(selected);
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const leading = (first.getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((leading + count) / 7);
  const dateIndex = new Set(entries.map(item => item.date));
  const earliest = entries.reduce((min, item) => item.date < min ? item.date : min, today);
  const monthKey = localDateKey(first).slice(0, 7);
  const previousEnabled = monthKey > earliest.slice(0, 7);
  const nextEnabled = monthKey < today.slice(0, 7);

  const choose = (day: string) => {
    setSelected(day);
    setNote(entries.find(item => item.date === day)?.note ?? '');
  };

  const moveMonth = (offset: number) => {
    const destination = localDateKey(new Date(year, month + offset, 1));
    const firstRecorded = entries.filter(item => item.date.startsWith(destination.slice(0, 7)))
      .map(item => item.date).sort()[0];
    choose(firstRecorded ?? destination);
  };

  const save = async () => {
    if (!entry || writeInProgress.current) return;
    writeInProgress.current = true;
    setSaving(true);
    try {
      const updated = await dailyJournal.saveNote(selected, note);
      setEntries(items => items.map(item => item.date === updated.date ? updated : item));
      if (selection.current === updated.date) setNote(updated.note);
    } catch {
      showAlert('Дневник', 'Не удалось сохранить заметку. Попробуйте ещё раз.');
    } finally {
      writeInProgress.current = false;
      setSaving(false);
    }
  };

  return (
    <TaroPage title="Дневник" subtitle="Карты дня, заметки и сохранённые расклады">
      <Pressable accessibilityRole="button" accessibilityLabel="История раскладов" style={styles.history} onPress={() => router.navigate('/history')}>
        <Ionicons name="time-outline" size={21} color={taro.gold} />
        <Text style={styles.historyLabel}>История раскладов</Text>
        <Ionicons name="chevron-forward" size={18} color={taro.muted} />
      </Pressable>
      <View style={styles.panel}>
        <View style={styles.month}>
          <Pressable accessibilityRole="button" accessibilityLabel="Предыдущий месяц" disabled={!previousEnabled}
            onPress={() => moveMonth(-1)} style={[styles.arrow, !previousEnabled && styles.disabled]}>
            <Ionicons name="chevron-back" size={20} color={taro.gold} />
          </Pressable>
          <Text style={styles.monthLabel}>{date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Следующий месяц" disabled={!nextEnabled}
            onPress={() => moveMonth(1)} style={[styles.arrow, !nextEnabled && styles.disabled]}>
            <Ionicons name="chevron-forward" size={20} color={taro.gold} />
          </Pressable>
        </View>
        <View style={styles.week}>{weekdays.map(day => <Text key={day} style={styles.weekday}>{day}</Text>)}</View>
        {Array.from({ length: weeks }, (_, row) => (
          <View key={row} style={styles.week}>
            {weekdays.map((_, column) => {
              const day = row * 7 + column + 1 - leading;
              if (day < 1 || day > count) return <View key={column} style={styles.cell} />;
              const key = localDateKey(new Date(year, month, day));
              const recorded = dateIndex.has(key);
              return (
                <View key={column} style={styles.cell}>
                  <Pressable accessibilityRole="button" accessibilityState={{ selected: key === selected, disabled: key > today }}
                    accessibilityLabel={`${dateFromKey(key).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}${recorded ? ', карта открыта' : ''}`}
                    disabled={key > today} onPress={() => choose(key)} style={[styles.day, key === selected && styles.selectedDay, key > today && styles.disabled]}>
                    <Text style={[styles.dayLabel, recorded && styles.recorded]}>{day}</Text>
                    {recorded && <View style={styles.dot} />}
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </View>
      {loading ? <ActivityIndicator color={taro.gold} /> : failed ? (
        <Pressable accessibilityRole="button" onPress={() => setRetry(value => value + 1)} style={styles.panel}>
          <Text style={styles.muted}>Не удалось прочитать дневник. Повторить</Text>
        </Pressable>
      ) : entry && card ? (
        <View style={styles.panel}>
          <View style={styles.cardRow}>
            <Image source={getTarotCardImageById(entry.cardId)} style={[styles.card, entry.reversed && styles.reversed]} />
            <View style={styles.details}>
              <Text style={styles.entryDate}>{date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</Text>
              <Text style={styles.cardName}>{card.name}</Text>
              {entry.reversed && <Text style={styles.muted}>Перевёрнутая</Text>}
            </View>
          </View>
          <Text style={styles.cardName}>Как прошёл день?</Text>
          <TextInput multiline value={note} onChangeText={setNote} maxLength={DAILY_NOTE_LIMIT} editable={!saving}
            accessibilityLabel="Заметка о дне" placeholder="Что запомнилось сегодня?" placeholderTextColor={taro.muted} style={styles.input} />
          <Pressable accessibilityRole="button" disabled={saving || note.trim() === entry.note}
            style={[styles.save, (saving || note.trim() === entry.note) && styles.disabled]} onPress={() => { void save(); }}>
            <Text style={styles.saveLabel}>{saving ? 'Сохраняем…' : 'Сохранить заметку'}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.panel}>
          <Text style={styles.muted}>{selected === today ? 'Откройте сегодняшнюю карту, чтобы добавить заметку.' : 'В этот день карта не открывалась.'}</Text>
          {selected === today && <Pressable accessibilityRole="button" onPress={() => router.navigate('/')} style={styles.save}>
            <Text style={styles.saveLabel}>К карте дня</Text>
          </Pressable>}
        </View>
      )}
    </TaroPage>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: taro.panel, borderColor: taro.border, borderWidth: 1, borderRadius: 16, padding: 12, gap: 10 },
  history: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 13, backgroundColor: taro.panel, borderColor: taro.border, borderWidth: 1, borderRadius: 14 },
  historyLabel: { color: taro.text, flex: 1, fontSize: 15, fontWeight: '600' },
  month: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  arrow: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { color: taro.gold, fontSize: 17, fontWeight: '600', textTransform: 'capitalize', flexShrink: 1, textAlign: 'center' },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, color: taro.muted, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  cell: { flex: 1, paddingHorizontal: 2 },
  day: { borderRadius: 10, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  selectedDay: { backgroundColor: '#382342', borderColor: '#A88353' },
  dayLabel: { color: taro.text, fontSize: 14 },
  recorded: { color: taro.gold, fontWeight: '700' },
  dot: { position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: taro.gold },
  cardRow: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 5 },
  card: { width: 53, height: 85, borderRadius: 4 },
  reversed: { transform: [{ rotate: '180deg' }] },
  details: { flex: 1, gap: 5 },
  entryDate: { color: taro.gold, fontSize: 13 },
  cardName: { color: taro.text, fontSize: 16, fontWeight: '600' },
  muted: { color: taro.muted, fontSize: 14, lineHeight: 21 },
  input: { minHeight: 86, borderWidth: 1, borderColor: taro.border, borderRadius: 12, padding: 10, color: taro.text, fontSize: 15, textAlignVertical: 'top' },
  save: { minHeight: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: taro.gold, borderRadius: 11, padding: 8 },
  saveLabel: { color: taro.background, fontSize: 14, fontWeight: '700' },
  disabled: { opacity: .4 },
});
