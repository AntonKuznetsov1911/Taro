jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('../src/utils/dataStore', () => ({ dataStore: require('@react-native-async-storage/async-storage') }));
jest.mock('../src/utils/tarotCardAssets', () => ({ getTarotCardImageById: (id: number) => 1000 + id }));
import AsyncStorage from '@react-native-async-storage/async-storage';
import { readingsStorage, STORAGE_KEYS } from '../src/utils/storage';

beforeEach(async () => { await AsyncStorage.clear(); });
test('concurrent readings do not overwrite each other', async () => {
  await Promise.all(Array.from({ length: 30 }, (_, i) => readingsStorage.addReading({ id: String(i), cards: [], question: `q${i}` })));
  expect(await readingsStorage.getReadings()).toHaveLength(30);
});
test('repeated save of one result does not duplicate history', async () => {
  await Promise.all([readingsStorage.addReading({ id: 'same', cards: [] }), readingsStorage.addReading({ id: 'same', cards: [] })]);
  expect(await readingsStorage.getReadings()).toHaveLength(1);
});
test('card images are resolved by stable ID after an APK update', async () => {
  await readingsStorage.addReading({ id: 'r', cards: [{ id: 3, image: 25 }] });
  expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.READINGS))!)[0].cards[0].image).toBeUndefined();
  expect((await readingsStorage.getReadings())[0].cards[0].image).toBe(1003);
});
test('a failed history write does not block later operations', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
  await expect(readingsStorage.addReading({ id: 'failed', cards: [] })).rejects.toThrow();
  await readingsStorage.addReading({ id: 'good', cards: [] });
  expect((await readingsStorage.getReadings()).map(r => r.id)).toEqual(['good']);
  log.mockRestore();
});
