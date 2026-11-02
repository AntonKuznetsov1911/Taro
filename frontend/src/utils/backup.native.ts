import * as FS from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { PHOTO_DIR } from './palmPhoto.native';
import { parseBackup, BACKUP_KEYS, MAX_BACKUP_BYTES, type TaroBackup } from './backupFormat';
import { snapshotData, replaceData, makeBackup } from './backupCore';

const JOURNAL = `${FS.documentDirectory}restore-journal.json`;

async function portableBackup(): Promise<TaroBackup> {
  const b = makeBackup(await snapshotData());
  const readings = JSON.parse(b.data['@taro_readings'] || '[]');
  for (const r of readings) {
    if (!r.image_uri) continue;
    const uri = r.image_uri;
    delete r.image_uri;
    if (uri.startsWith(PHOTO_DIR) && (await FS.getInfoAsync(uri)).exists) {
      const id = `photo-${Object.keys(b.photos).length}`;
      b.photos[id] = await FS.readAsStringAsync(uri, { encoding: FS.EncodingType.Base64 });
      r.image_uri = `taro-photo:${id}`;
    }
  }
  if (b.data['@taro_readings']) b.data['@taro_readings'] = JSON.stringify(readings);
  return parseBackup(JSON.stringify(b));
}

export async function exportBackup(): Promise<boolean> {
  const backup = await portableBackup();
  if (Platform.OS === 'android') {
    const access = await FS.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!access.granted) return false;
    const uri = await FS.StorageAccessFramework.createFileAsync(access.directoryUri, `Taro-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    await FS.writeAsStringAsync(uri, JSON.stringify(backup));
    return true;
  }
  const uri = `${FS.cacheDirectory}Taro-${new Date().toISOString().slice(0, 10)}.json`;
  await FS.writeAsStringAsync(uri, JSON.stringify(backup));
  if (!(await Sharing.isAvailableAsync())) throw new Error('Не удалось открыть меню сохранения');
  await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Сохранить копию Таро', UTI: 'public.json' });
  return true;
}

export async function pickBackup(): Promise<TaroBackup | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', 'application/octet-stream'], copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if ((asset.size ?? 0) > MAX_BACKUP_BYTES) throw new Error('Копия больше 50 МБ');
  return parseBackup(await FS.readAsStringAsync(asset.uri));
}

/** On process interruption the next launch rolls back the entire import. */
export async function recoverBackupRestore(): Promise<void> {
  if (!(await FS.getInfoAsync(JOURNAL)).exists) return;
  const before = JSON.parse(await FS.readAsStringAsync(JOURNAL));
  if (!before || typeof before !== 'object' || Array.isArray(before) || Object.entries(before).some(([key, value]) => !(BACKUP_KEYS as readonly string[]).includes(key) || typeof value !== 'string')) throw new Error('Не удалось восстановить данные после прерванного импорта');
  await replaceData(before);
  await FS.deleteAsync(JOURNAL, { idempotent: true });
}

export async function restoreBackup(input: TaroBackup): Promise<void> {
  const b = parseBackup(JSON.stringify(input));
  const before = await snapshotData();
  await FS.writeAsStringAsync(`${FS.documentDirectory}before-restore.json`, JSON.stringify(before));
  await FS.writeAsStringAsync(JOURNAL, JSON.stringify(before));
  try {
    const uris: Record<string, string> = {};
    await FS.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
    for (const [id, bytes] of Object.entries(b.photos)) {
      const uri = `${PHOTO_DIR}restore-${Date.now()}-${id}.jpg`;
      await FS.writeAsStringAsync(uri, bytes, { encoding: FS.EncodingType.Base64 });
      uris[id] = uri;
    }
    if (b.data['@taro_readings']) {
      const readings = JSON.parse(b.data['@taro_readings']);
      for (const r of readings) if (r.image_uri) r.image_uri = uris[r.image_uri.slice(11)];
      b.data['@taro_readings'] = JSON.stringify(readings);
    }
    await replaceData(b.data);
    await FS.deleteAsync(JOURNAL, { idempotent: true });
  } catch (error) {
    await recoverBackupRestore();
    throw error;
  }
}
