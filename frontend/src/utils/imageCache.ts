import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Image caching utility for better performance
 */

const CACHE_DIR = `${FileSystem.cacheDirectory}images/`;

// Create cache directory if it doesn't exist
async function ensureCacheDirExists(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

/**
 * Get cached file path for a URL
 */
function getCachedFilePath(url: string): string {
  const filename = url.split('/').pop() || 'cached_image';
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${CACHE_DIR}${sanitized}`;
}

/**
 * Download and cache an image
 */
export async function cacheImage(url: string): Promise<string> {
  try {
    await ensureCacheDirExists();

    const cachedPath = getCachedFilePath(url);

    // Check if already cached
    const fileInfo = await FileSystem.getInfoAsync(cachedPath);
    if (fileInfo.exists) {
      return cachedPath;
    }

    // Download and cache
    const downloadResult = await FileSystem.downloadAsync(url, cachedPath);

    if (downloadResult.status === 200) {
      return downloadResult.uri;
    } else {
      throw new Error(`Failed to download image: ${downloadResult.status}`);
    }
  } catch (error) {
    console.error('Error caching image:', error);
    // Return original URL as fallback
    return url;
  }
}

/**
 * Get cached image or download if not cached
 */
export async function getCachedImage(url: string): Promise<string> {
  try {
    const cachedPath = getCachedFilePath(url);
    const fileInfo = await FileSystem.getInfoAsync(cachedPath);

    if (fileInfo.exists) {
      return cachedPath;
    }

    return await cacheImage(url);
  } catch (error) {
    console.error('Error getting cached image:', error);
    return url;
  }
}

/**
 * Clear image cache
 */
export async function clearImageCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      await ensureCacheDirExists();
    }
  } catch (error) {
    console.error('Error clearing image cache:', error);
  }
}

/**
 * Get cache size in bytes
 */
export async function getCacheSize(): Promise<number> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      return 0;
    }

    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    let totalSize = 0;

    for (const file of files) {
      const fileInfo = await FileSystem.getInfoAsync(`${CACHE_DIR}${file}`);
      if (fileInfo.exists && 'size' in fileInfo) {
        totalSize += fileInfo.size || 0;
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
}

/**
 * Clear cache if size exceeds limit
 */
export async function clearCacheIfNeeded(maxSizeBytes: number = 100 * 1024 * 1024): Promise<void> {
  // Default: 100MB
  const currentSize = await getCacheSize();
  if (currentSize > maxSizeBytes) {
    await clearImageCache();
  }
}

/**
 * Preload multiple images
 */
export async function preloadImages(urls: string[]): Promise<void> {
  try {
    await Promise.all(urls.map((url) => cacheImage(url)));
  } catch (error) {
    console.error('Error preloading images:', error);
  }
}
