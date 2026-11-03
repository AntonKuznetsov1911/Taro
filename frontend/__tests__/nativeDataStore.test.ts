jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-file-system/legacy', () => {
  const files = new Map<string, string>();
  return { documentDirectory: 'file:///documents/', files,
    getInfoAsync: jest.fn(async (uri: string) => ({ exists: files.has(uri) })),
    readAsStringAsync: jest.fn(async (uri: string) => { if (!files.has(uri)) throw new Error('missing'); return files.get(uri); }),
    writeAsStringAsync: jest.fn(async (uri: string, value: string) => { files.set(uri, value); }),
    moveAsync: jest.fn(async ({ from, to }: any) => { files.set(to, files.get(from)!); files.delete(from); }),
    deleteAsync: jest.fn(async (uri: string) => { files.delete(uri); }),
  };
});
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FS from 'expo-file-system/legacy';
import { dataStore } from '../src/utils/dataStore.native';
const files: Map<string, string> = (FS as any).files;
const KEY = '@taro_readings';
beforeEach(async () => { files.clear(); await AsyncStorage.clear(); jest.clearAllMocks(); });

test('migrates existing AsyncStorage history after a successful atomic save', async () => {
  await AsyncStorage.setItem(KEY, '[{"id":"old"}]');
  expect(await dataStore.getItem(KEY)).toContain('old');
  await dataStore.setItem(KEY, '[{"id":"new"}]');
  expect(await AsyncStorage.getItem(KEY)).toBeNull();
  expect(await dataStore.getItem(KEY)).toContain('new');
});
test('failed file replacement retains the old history', async () => {
  await dataStore.setItem(KEY, '[{"id":"old"}]');
  jest.spyOn(FS, 'moveAsync').mockRejectedValueOnce(new Error('storage full'));
  await expect(dataStore.setItem(KEY, '[{"id":"new"}]')).rejects.toThrow();
  expect(await dataStore.getItem(KEY)).toContain('old');
});
test('recovers from a damaged main file using the previous snapshot', async () => {
  await dataStore.setItem(KEY, '[{"id":"old"}]');
  await dataStore.setItem(KEY, '[{"id":"new"}]');
  files.set('file:///documents/readings.json', '{');
  expect(await dataStore.getItem(KEY)).toContain('old');
});
test('damaged snapshots produce an error rather than an empty history', async () => {
  files.set('file:///documents/readings.json', '{');
  await expect(dataStore.getItem(KEY)).rejects.toThrow();
});
test('history larger than an Android SQLite cursor is kept in a file', async () => {
  const large = JSON.stringify([{ id: 'large', interpretation: 'x'.repeat(3 * 1024 * 1024) }]);
  await dataStore.setItem(KEY, large);
  expect(await dataStore.getItem(KEY)).toBe(large);
  expect(await dataStore.getAllKeys()).toContain(KEY);
});
