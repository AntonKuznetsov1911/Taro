import { dailyJournal } from '../src/utils/dailyJournal';
import { dataStore } from '../src/utils/dataStore';

jest.mock('../src/utils/dataStore', () => {
  let value: string | null = null;
  return { dataStore: {
    getItem: async () => value,
    setItem: async (_key: string, text: string) => { value = text; },
    removeItem: async () => { value = null; },
  } };
});

beforeEach(async () => { await dataStore.removeItem('@taro_daily_journal'); });

test('rapid opening keeps a single card and note for each date', async () => {
  const today = '2026-11-03';
  const [first, duplicate] = await Promise.all([
    dailyJournal.open(today, 12, true),
    dailyJournal.open(today, 27, false),
  ]);
  expect(duplicate).toEqual(first);
  await dailyJournal.saveNote(today, '  Вечерняя запись  ');
  await dailyJournal.open(today, 51, false);
  await dailyJournal.open('2026-11-04', 18, false);
  expect(await dailyJournal.list()).toEqual([
    { date: today, cardId: 12, reversed: true, note: 'Вечерняя запись' },
    { date: '2026-11-04', cardId: 18, reversed: false, note: '' },
  ]);
});
