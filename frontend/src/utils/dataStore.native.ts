import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FS from 'expo-file-system/legacy';
import { DAILY_JOURNAL_KEY, validDailyEntries } from './dailyJournalFormat';

const KEY = '@taro_readings';
const fileKeys = new Map([[KEY, 'readings'], [DAILY_JOURNAL_KEY, 'daily-journal']]);

function pathsFor(key: string) {
  const stem = fileKeys.get(key);
  if (!stem) return null;
  const base = `${FS.documentDirectory}${stem}`;
  return { file: `${base}.json`, previous: `${base}.previous.json`, temporary: `${base}.pending.json` };
}

function valid(key: string, text: string): string {
  const value: unknown = JSON.parse(text);
  if (!(key === DAILY_JOURNAL_KEY ? validDailyEntries(value) : Array.isArray(value))) throw new Error('Повреждён файл истории');
  return text;
}

/** Atomic history files avoid Android SQLite's 2 MB row limit. */
export const dataStore = {
  ...AsyncStorage,
  async getItem(key: string): Promise<string | null> {
    const paths = pathsFor(key);
    if (!paths) return AsyncStorage.getItem(key);
    const { file, previous } = paths;
    let found = false;
    for (const uri of [file, previous]) {
      if (!(await FS.getInfoAsync(uri)).exists) continue;
      found = true;
      try { return valid(key, await FS.readAsStringAsync(uri)); } catch {}
    }
    if (found) throw new Error('Не удалось прочитать историю. Восстановите её из резервной копии.');
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, text: string): Promise<void> {
    const paths = pathsFor(key);
    if (!paths) return AsyncStorage.setItem(key, text);
    const { file, previous, temporary } = paths;
    valid(key, text);
    await FS.writeAsStringAsync(temporary, text);
    if ((await FS.getInfoAsync(file)).exists) {
      let old: string | null = null;
      try { old = valid(key, await FS.readAsStringAsync(file)); } catch {}
      if (old) await FS.writeAsStringAsync(previous, old);
    }
    await FS.moveAsync({ from: temporary, to: file });
    await AsyncStorage.removeItem(key);
  },
  async removeItem(key: string): Promise<void> {
    const paths = pathsFor(key);
    if (paths) for (const uri of Object.values(paths)) await FS.deleteAsync(uri, { idempotent: true });
    await AsyncStorage.removeItem(key);
  },
  async getAllKeys(): Promise<readonly string[]> {
    const keys = new Set(await AsyncStorage.getAllKeys());
    for (const key of fileKeys.keys()) {
      const { file, previous } = pathsFor(key)!;
      if ((await FS.getInfoAsync(file)).exists || (await FS.getInfoAsync(previous)).exists) keys.add(key);
    }
    return [...keys];
  },
  async clear(): Promise<void> {
    for (const key of fileKeys.keys()) await this.removeItem(key);
    await AsyncStorage.clear();
  },
};
