import { dataStore } from './dataStore';
import { DAILY_JOURNAL_KEY, DAILY_NOTE_LIMIT, type DailyEntry, validDailyEntries } from './dailyJournalFormat';

async function readEntries(): Promise<DailyEntry[]> {
  const data: unknown = JSON.parse(await dataStore.getItem(DAILY_JOURNAL_KEY) ?? '[]');
  if (!validDailyEntries(data)) throw new Error('Не удалось прочитать календарь карты дня');
  return data;
}

let writes: Promise<unknown> = Promise.resolve();
function update<T>(operation: (entries: DailyEntry[]) => T): Promise<T> {
  const next = writes.then(async () => {
    const entries = await readEntries();
    const result = operation(entries);
    if (!validDailyEntries(entries)) throw new Error('Некорректная запись календаря');
    await dataStore.setItem(DAILY_JOURNAL_KEY, JSON.stringify(entries));
    return result;
  });
  writes = next.catch(() => undefined);
  return next;
}

export const dailyJournal = {
  async list() { await writes; return readEntries(); },
  open(date: string, cardId: number, reversed: boolean) {
    return update(entries => {
      const existing = entries.find(entry => entry.date === date);
      if (existing) return existing;
      const entry = { date, cardId, reversed, note: '' };
      entries.push(entry);
      return entry;
    });
  },
  saveNote(date: string, note: string) {
    return update(entries => {
      const entry = entries.find(item => item.date === date);
      if (!entry) throw new Error('Сначала откройте карту дня');
      entry.note = note.trim().slice(0, DAILY_NOTE_LIMIT);
      return { ...entry };
    });
  },
};
