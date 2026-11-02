import { parseBackup, MAX_BACKUP_BYTES, type TaroBackup } from './backupFormat';
import { snapshotData, replaceData, makeBackup } from './backupCore';

export async function exportBackup(): Promise<void> {
  const b = makeBackup(await snapshotData());
  if (b.data['@taro_readings']) b.data['@taro_readings'] = JSON.stringify(JSON.parse(b.data['@taro_readings']).map(({ image_uri, ...reading }: any) => reading));
  const uri = URL.createObjectURL(new Blob([JSON.stringify(parseBackup(JSON.stringify(b)))], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = uri; a.download = `Taro-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(uri), 1000);
}
export async function pickBackup(): Promise<TaroBackup | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,application/json';
    input.oncancel = () => resolve(null);
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return resolve(null);
      try { if (file.size > MAX_BACKUP_BYTES) throw new Error('Копия больше 50 МБ'); resolve(parseBackup(await file.text())); } catch (error) { reject(error); }
    };
    input.click();
  });
}
export async function restoreBackup(input: TaroBackup): Promise<void> {
  const b = parseBackup(JSON.stringify(input));
  // Native photo files are preserved in the exported copy; browser history is text.
  if (b.data['@taro_readings']) b.data['@taro_readings'] = JSON.stringify(JSON.parse(b.data['@taro_readings']).map(({ image_uri, ...reading }: any) => reading));
  const before = await snapshotData();
  try { await replaceData(b.data); } catch (error) { await replaceData(before); throw error; }
}
export async function recoverBackupRestore(): Promise<void> {}
