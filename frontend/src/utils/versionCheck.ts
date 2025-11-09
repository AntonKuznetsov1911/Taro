import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { versionStorage } from './storage';

export interface VersionInfo {
  currentVersion: string;
  previousVersion: string | null;
  isFirstLaunch: boolean;
  isUpdated: boolean;
  buildNumber: string | null;
}

/**
 * Get current app version information
 */
export async function getVersionInfo(): Promise<VersionInfo> {
  const currentVersion = Application.nativeApplicationVersion || '1.0.0';
  const buildNumber = Application.nativeBuildVersion;
  const previousVersion = await versionStorage.getVersion();
  const isFirstLaunch = previousVersion === null;
  const isUpdated = previousVersion !== null && previousVersion !== currentVersion;

  return {
    currentVersion,
    previousVersion,
    isFirstLaunch,
    isUpdated,
    buildNumber,
  };
}

/**
 * Save current version to storage
 */
export async function saveCurrentVersion(): Promise<void> {
  const currentVersion = Application.nativeApplicationVersion || '1.0.0';
  await versionStorage.saveVersion(currentVersion);
}

/**
 * Check for updates (Expo Updates)
 */
export async function checkForUpdates(): Promise<{
  isAvailable: boolean;
  manifest?: any;
}> {
  try {
    if (!Updates.isEnabled) {
      return { isAvailable: false };
    }

    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      return {
        isAvailable: true,
        manifest: update.manifest,
      };
    }

    return { isAvailable: false };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return { isAvailable: false };
  }
}

/**
 * Download and install update
 */
export async function installUpdate(): Promise<boolean> {
  try {
    if (!Updates.isEnabled) {
      return false;
    }

    const { isAvailable } = await checkForUpdates();

    if (!isAvailable) {
      return false;
    }

    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();

    return true;
  } catch (error) {
    console.error('Error installing update:', error);
    return false;
  }
}

/**
 * Get update info from Expo Updates
 */
export function getUpdateInfo() {
  return {
    updateId: Updates.updateId,
    createdAt: Updates.createdAt,
    runtimeVersion: Updates.runtimeVersion,
    isEmergencyLaunch: Updates.isEmergencyLaunch,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    channel: Updates.channel,
  };
}

/**
 * Handle version migration
 */
export async function handleVersionMigration(
  currentVersion: string,
  previousVersion: string | null
): Promise<void> {
  // Example migration logic
  if (!previousVersion) {
    // First launch - no migration needed
    console.log('First launch detected');
    return;
  }

  if (previousVersion !== currentVersion) {
    console.log(`Migrating from ${previousVersion} to ${currentVersion}`);

    // Add migration logic here based on versions
    // Example:
    // if (compareVersions(previousVersion, '2.0.0') < 0) {
    //   await migrateToV2();
    // }
  }
}

/**
 * Compare version strings (simple implementation)
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}
