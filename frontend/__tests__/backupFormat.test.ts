import { parseBackup, backupReadingCount } from '../src/utils/backupFormat';

const reading = { id: 'r1', question: 'Вопрос', category: 'general', spread_type: 'one_card', cards: [{ id: 0, name: 'Шут', keywords: ['начало'] }], interpretation: 'Текст', created_at: '2026-11-02T12:00:00Z' };
const backup = (data: any = {}, photos: any = {}) => JSON.stringify({ format: 'taro-backup', version: 1, createdAt: '2026-11-02T12:00:00Z', data, photos });

test('accepts portable readings, favorites, notes and settings', () => {
  const b = parseBackup(backup({ '@taro_readings': JSON.stringify([reading]), '@taro_favorites': '["r1"]', '@taro_notes': '{"r1":"Заметка"}', '@taro_settings': JSON.stringify({ language: 'russian', notifications: false, soundEnabled: true, autoSave: true, vibration: false, effectsVolume: .6 }) }));
  expect(backupReadingCount(b)).toBe(1);
});
test.each(['{}', '{', '{"format":"other","version":1}', backup({ 'foreign-app-secret': '"value"' }), backup(JSON.parse('{"__proto__":"{}"}')), backup({ '@taro_readings': '{}' }), backup({ '@taro_readings': JSON.stringify([reading, reading]) }), backup({ '@taro_readings': JSON.stringify([{ ...reading, created_at: 'bad' }]) }), backup({ '@taro_readings': JSON.stringify([{ ...reading, cards: [{ id: 99, name: 'bad', keywords: [] }] }]) }), backup({ '@taro_settings': '{"effectsVolume":5}' }), backup({ '@taro_notes': '{"r1":42}' })])('rejects malformed or foreign input before restore: %s', text => {
  expect(() => parseBackup(text)).toThrow();
});
test('requires embedded photos and rejects arbitrary file paths', () => {
  expect(() => parseBackup(backup({ '@taro_readings': JSON.stringify([{ ...reading, image_uri: 'file:///data/private' }]) }))).toThrow();
  expect(() => parseBackup(backup({ '@taro_readings': JSON.stringify([{ ...reading, image_uri: 'taro-photo:photo-0' }]) }))).toThrow();
  const b = parseBackup(backup({ '@taro_readings': JSON.stringify([{ ...reading, image_uri: 'taro-photo:photo-0' }]) }, { 'photo-0': '/9j/AA==' }));
  expect(b.photos['photo-0']).toBe('/9j/AA==');
});
test('rejects path traversal in photo names', () => {
  expect(() => parseBackup(backup({}, { '../file': '/9j/AA==' }))).toThrow();
});
