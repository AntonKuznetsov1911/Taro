jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-file-system/legacy', () => {
  const files = new Map<string, string>();
  return { documentDirectory: 'file:///documents/', cacheDirectory: 'file:///cache/', EncodingType: { Base64: 'base64' }, files,
    getInfoAsync: jest.fn(async (uri: string) => ({ exists: files.has(uri) })),
    readAsStringAsync: jest.fn(async (uri: string) => files.get(uri)),
    writeAsStringAsync: jest.fn(async (uri: string, value: string) => { files.set(uri, value); }),
    deleteAsync: jest.fn(async (uri: string) => { files.delete(uri); }), makeDirectoryAsync: jest.fn(),
  };
});
jest.mock('../src/utils/dataStore', () => {
  const values = new Map<string, string>();
  return { dataStore: { values, getItem: jest.fn(async (key: string) => values.get(key) ?? null), setItem: jest.fn(async (key: string, value: string) => { values.set(key, value); }), removeItem: jest.fn(async (key: string) => { values.delete(key); }) } };
});
import * as FS from 'expo-file-system/legacy';
import { dataStore } from '../src/utils/dataStore';
import { restoreBackup, recoverBackupRestore } from '../src/utils/backup.native';
import { makeBackup } from '../src/utils/backupCore';
const files: Map<string, string> = (FS as any).files;
const values: Map<string, string> = (dataStore as any).values;
const reading = { id: 'new', question: 'Вопрос', category: 'general', spread_type: 'palmistry', cards: [], interpretation: 'Текст', created_at: '2026-11-02T12:00:00Z' };

beforeEach(() => { files.clear(); values.clear(); jest.clearAllMocks(); });
test('successful restore replaces the snapshot and removes the journal', async () => {
  values.set('@taro_notes', '{"old":"note"}');
  await restoreBackup(makeBackup({ '@taro_readings': JSON.stringify([reading]) }));
  expect(values.get('@taro_readings')).toContain('new');
  expect(values.has('@taro_notes')).toBe(false);
  expect(files.has('file:///documents/restore-journal.json')).toBe(false);
  expect(files.get('file:///documents/before-restore.json')).toContain('old');
});
test('a failed write rolls back all profile and history changes', async () => {
  const before = { '@taro_readings': JSON.stringify([{ ...reading, id: 'old' }]), '@taro_notes': '{"old":"keep"}' };
  Object.entries(before).forEach(([k, v]) => values.set(k, v));
  jest.spyOn(dataStore, 'setItem').mockRejectedValueOnce(new Error('full'));
  await expect(restoreBackup(makeBackup({ '@taro_readings': JSON.stringify([reading]) }))).rejects.toThrow('full');
  expect(Object.fromEntries(values)).toEqual(before);
  expect(files.has('file:///documents/restore-journal.json')).toBe(false);
});
test('next launch recovers the snapshot after a process interruption', async () => {
  const before = { '@taro_readings': JSON.stringify([{ ...reading, id: 'old' }]) };
  files.set('file:///documents/restore-journal.json', JSON.stringify(before));
  values.set('@taro_readings', JSON.stringify([reading]));
  await recoverBackupRestore();
  expect(Object.fromEntries(values)).toEqual(before);
  expect(files.has('file:///documents/restore-journal.json')).toBe(false);
});
test('embedded photos become private app files on the destination phone', async () => {
  const b = makeBackup({ '@taro_readings': JSON.stringify([{ ...reading, image_uri: 'taro-photo:photo-0' }]) });
  b.photos['photo-0'] = '/9j/AA==';
  await restoreBackup(b);
  const uri = JSON.parse(values.get('@taro_readings')!)[0].image_uri;
  expect(uri.startsWith('file:///documents/palm-photos/restore-')).toBe(true);
  expect(files.get(uri)).toBe('/9j/AA==');
});
test('foreign input is rejected without changing a single key', async () => {
  values.set('@taro_notes', '{"old":"keep"}');
  await expect(restoreBackup(makeBackup({ unexpected: 'anything' }))).rejects.toThrow();
  expect(dataStore.setItem).not.toHaveBeenCalled();
  expect(files.size).toBe(0);
});
