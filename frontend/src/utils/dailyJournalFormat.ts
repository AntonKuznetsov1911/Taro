export const DAILY_JOURNAL_KEY = '@taro_daily_journal';
export const DAILY_NOTE_LIMIT = 600;
export type DailyEntry = { date: string; cardId: number; reversed: boolean; note: string };

export function localDateKey(date: Date = new Date()): string {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((part, i) => String(part).padStart(i === 0 ? 4 : 2, '0')).join('-');
}

export function dateFromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function validDailyEntries(value: unknown): value is DailyEntry[] {
  if (!Array.isArray(value) || value.length > 10000) return false;
  const seen = new Set<string>();
  return value.every(entry => {
    if (!entry || typeof entry.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) ||
      localDateKey(dateFromKey(entry.date)) !== entry.date || seen.has(entry.date) ||
      !Number.isInteger(entry.cardId) || entry.cardId < 0 || entry.cardId >= 78 ||
      typeof entry.reversed !== 'boolean' || typeof entry.note !== 'string' || entry.note.length > DAILY_NOTE_LIMIT) return false;
    seen.add(entry.date);
    return true;
  });
}
