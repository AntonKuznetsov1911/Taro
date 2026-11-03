import { dataStore } from './dataStore';
import { BACKUP_KEYS, type BackupData, type TaroBackup } from './backupFormat';
import { version as appVersion } from '../../package.json';

export async function snapshotData(): Promise<BackupData> {
  const pairs = await Promise.all(BACKUP_KEYS.map(async key => [key, await dataStore.getItem(key)] as const));
  return Object.fromEntries(pairs.filter((pair): pair is readonly [typeof BACKUP_KEYS[number], string] => pair[1] !== null));
}
export async function replaceData(data: BackupData): Promise<void> {
  // Write replacements first. A failed write must not erase existing keys.
  for (const key of BACKUP_KEYS) if (data[key] !== undefined) await dataStore.setItem(key, data[key]);
  for (const key of BACKUP_KEYS) if (data[key] === undefined) await dataStore.removeItem(key);
}
export function makeBackup(data: BackupData): TaroBackup {
  return { format: 'taro-backup', version: 1, appVersion, createdAt: new Date().toISOString(), data, photos: {} };
}
