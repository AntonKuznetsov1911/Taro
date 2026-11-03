import { DAILY_JOURNAL_KEY, validDailyEntries } from './dailyJournalFormat';

export const BACKUP_KEYS = [
  '@taro_readings', '@taro_favorites', '@taro_notes', '@taro_tags', '@taro_daily_card',
  '@taro_preferences', '@taro_cache_timestamp', '@taro_app_version', '@taro_onboarding',
  '@taro_settings', '@taro_user_profile', '@taro_onboarding_seen', '@taro_horoscope_sign',
  DAILY_JOURNAL_KEY,
] as const;
export type BackupData = Record<string, string>;
export type TaroBackup = { format: 'taro-backup'; version: 1; appVersion: string; createdAt: string; data: BackupData; photos: Record<string, string> };
export const MAX_BACKUP_BYTES = 50 * 1024 * 1024;
const object = (v: any): v is Record<string, any> => Boolean(v && typeof v === 'object' && !Array.isArray(v));
const strings = (v: any): v is string[] => Array.isArray(v) && v.every(s => typeof s === 'string');
function requireValid(value: unknown): asserts value { if (!value) throw new Error('Файл содержит некорректные данные Таро'); }

/** Validate before touching storage; unknown keys never enter application state. */
export function parseBackup(text: string): TaroBackup {
  if (text.length > MAX_BACKUP_BYTES) throw new Error('Копия больше 50 МБ');
  let b: any;
  try { b = JSON.parse(text); } catch { throw new Error('Не удалось прочитать JSON-файл'); }
  requireValid(object(b) && b.format === 'taro-backup' && b.version === 1 && typeof b.createdAt === 'string' && Number.isFinite(Date.parse(b.createdAt)) && object(b.data));
  const data: BackupData = {};
  for (const [key, raw] of Object.entries(b.data)) {
    requireValid((BACKUP_KEYS as readonly string[]).includes(key) && typeof raw === 'string' && raw.length <= 25 * 1024 * 1024);
    if (key === '@taro_horoscope_sign') { requireValid(raw.length < 64); data[key] = raw; continue; }
    let value: any;
    try { value = JSON.parse(raw); } catch { throw new Error('Повреждён раздел резервной копии'); }
    if (key === '@taro_readings') {
      requireValid(Array.isArray(value) && value.length <= 10000);
      const ids = new Set<string>();
      for (const r of value) {
        requireValid(object(r) && typeof r.id === 'string' && r.id.length <= 200 && !ids.has(r.id) && typeof r.question === 'string' && typeof r.interpretation === 'string' && typeof r.spread_type === 'string' && typeof r.category === 'string' && typeof r.created_at === 'string' && Number.isFinite(Date.parse(r.created_at)) && Array.isArray(r.cards) && r.cards.length <= 78);
        ids.add(r.id);
        for (const c of r.cards) requireValid(object(c) && Number.isInteger(c.id) && c.id >= 0 && c.id < 78 && typeof c.name === 'string' && strings(c.keywords));
        if (r.image_uri) requireValid(typeof r.image_uri === 'string' && /^taro-photo:photo-\d+$/.test(r.image_uri));
      }
    } else if (key === DAILY_JOURNAL_KEY) requireValid(validDailyEntries(value));
    else if (key === '@taro_favorites') requireValid(strings(value));
    else if (key === '@taro_notes') requireValid(object(value) && Object.values(value).every(v => typeof v === 'string'));
    else if (key === '@taro_tags') requireValid(object(value) && Object.values(value).every(strings));
    else if (key === '@taro_settings') {
      requireValid(object(value));
      for (const field of ['notifications', 'soundEnabled', 'autoSave', 'vibration']) requireValid(typeof value[field] === 'boolean');
      requireValid(value.language === 'russian' && typeof value.effectsVolume === 'number' && value.effectsVolume >= 0 && value.effectsVolume <= 1);
    } else if (key === '@taro_user_profile') {
      requireValid(object(value) && typeof value.name === 'string' && ['male', 'female', 'other'].includes(value.gender) && typeof value.birthDate === 'string' && Number.isFinite(Date.parse(value.birthDate)) && object(value.sunSign) && typeof value.sunSign.name === 'string' && typeof value.sunSign.nameRu === 'string' && typeof value.sunSign.symbol === 'string' && typeof value.isComplete === 'boolean');
    } else if (key === '@taro_onboarding_seen') requireValid(value === 1);
    else if (key === '@taro_onboarding') requireValid(typeof value === 'boolean');
    else if (key === '@taro_cache_timestamp') requireValid(typeof value === 'number' && Number.isFinite(value));
    else if (key === '@taro_app_version') requireValid(typeof value === 'string');
    else if (key === '@taro_preferences') requireValid(object(value));
    else if (key === '@taro_daily_card') requireValid(object(value));
    data[key] = raw;
  }
  const photos: Record<string, string> = {};
  if (b.photos !== undefined) {
    requireValid(object(b.photos));
    for (const [id, bytes] of Object.entries(b.photos)) {
      requireValid(/^photo-\d+$/.test(id) && typeof bytes === 'string' && bytes.startsWith('/9j/') && bytes.length <= 6 * 1024 * 1024 && /^[A-Za-z0-9+/]*={0,2}$/.test(bytes));
      photos[id] = bytes;
    }
  }
  for (const r of JSON.parse(data['@taro_readings'] || '[]')) if (r.image_uri) requireValid(photos[r.image_uri.slice(11)]);
  return { format: 'taro-backup', version: 1, appVersion: typeof b.appVersion === 'string' ? b.appVersion : '', createdAt: b.createdAt, data, photos };
}

export function backupReadingCount(backup: TaroBackup): number { return JSON.parse(backup.data['@taro_readings'] || '[]').length; }
