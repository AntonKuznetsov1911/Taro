import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FS from 'expo-file-system/legacy';

const KEY = '@taro_readings';
const file = `${FS.documentDirectory}readings.json`;
const previous = `${FS.documentDirectory}readings.previous.json`;
const temporary = `${FS.documentDirectory}readings.pending.json`;

function valid(text: string): string {
  if (!Array.isArray(JSON.parse(text))) throw new Error('Повреждён файл истории');
  return text;
}

/** Atomic history files avoid Android SQLite's 2 MB row limit. */
export const dataStore = {
  ...AsyncStorage,
  async getItem(key: string): Promise<string | null> {
    if (key !== KEY) return AsyncStorage.getItem(key);
    let found = false;
    for (const uri of [file, previous]) {
      if (!(await FS.getInfoAsync(uri)).exists) continue;
      found = true;
      try { return valid(await FS.readAsStringAsync(uri)); } catch {}
    }
    if (found) throw new Error('Не удалось прочитать историю. Восстановите её из резервной копии.');
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, text: string): Promise<void> {
    if (key !== KEY) return AsyncStorage.setItem(key, text);
    valid(text);
    await FS.writeAsStringAsync(temporary, text);
    if ((await FS.getInfoAsync(file)).exists) {
      let old: string | null = null;
      try { old = valid(await FS.readAsStringAsync(file)); } catch {}
      if (old) await FS.writeAsStringAsync(previous, old);
    }
    await FS.moveAsync({ from: temporary, to: file });
    await AsyncStorage.removeItem(key);
  },
  async removeItem(key: string): Promise<void> {
    if (key === KEY) for (const uri of [file, previous, temporary]) await FS.deleteAsync(uri, { idempotent: true });
    await AsyncStorage.removeItem(key);
  },
  async getAllKeys(): Promise<readonly string[]> {
    const keys = new Set(await AsyncStorage.getAllKeys());
    if ((await FS.getInfoAsync(file)).exists || (await FS.getInfoAsync(previous)).exists) keys.add(KEY);
    return [...keys];
  },
  async clear(): Promise<void> { await this.removeItem(KEY); await AsyncStorage.clear(); },
};
