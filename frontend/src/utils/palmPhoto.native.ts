import * as FS from 'expo-file-system/legacy';
export const PHOTO_DIR = `${FS.documentDirectory}palm-photos/`;

export async function persistPalmPhoto(uri: string): Promise<string> {
  if (!uri || uri.startsWith(PHOTO_DIR)) return uri;
  if (!uri.startsWith(FS.cacheDirectory ?? '\0')) throw new Error('Фотография недоступна');
  await FS.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  const to = `${PHOTO_DIR}${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  await FS.copyAsync({ from: uri, to });
  return to;
}
