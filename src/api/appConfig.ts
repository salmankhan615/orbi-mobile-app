import { API_BASE_URL, APP_VERSION } from '@/api/config';

export interface MobileConfig {
  minSupportedVersion: string;
  latestVersion: string;
  storeUrls: {
    ios: string;
    android: string;
  };
  updateMessage?: string;
  chatBaseUrl?: string;
}

/**
 * App configuration from server.
 * Document: GET /api/mobile/config — must work without a valid token
 * Returns version floor + store URLs + other config
 */
export const appConfigApi = {
  /**
   * Fetch app configuration.
   * No authentication required — clients too old to login still need to know to update.
   */
  async getConfig(): Promise<MobileConfig> {
    try {
      console.log('[Config] Fetching app configuration...');
      const response = await fetch(`${API_BASE_URL}/api/mobile/config`, {
        method: 'GET',
        headers: {
          'X-App-Version': APP_VERSION,
        },
      });

      if (!response.ok) {
        console.warn('[Config] Failed to fetch:', response.status);
        // Return safe defaults if config unavailable
        return {
          minSupportedVersion: '0.0.0',
          latestVersion: APP_VERSION,
          storeUrls: {
            ios: 'itms-apps://apps.apple.com/app/id6499064234',
            android: 'market://details?id=com.kbmgroups.kbmtrainingrecruitment',
          },
        };
      }

      const data = (await response.json()) as MobileConfig;
      console.log('[Config] ✓ Config fetched');
      return data;
    } catch (error) {
      console.error('[Config] Fetch error:', error);
      // Return safe defaults
      return {
        minSupportedVersion: '0.0.0',
        latestVersion: APP_VERSION,
        storeUrls: {
          ios: 'itms-apps://apps.apple.com/app/id6499064234',
          android: 'market://details?id=com.kbmgroups.kbmtrainingrecruitment',
        },
      };
    }
  },

  /**
   * Check if current app version is supported.
   * Document: Check minSupportedVersion on launch and on resume
   */
  isVersionSupported(currentVersion: string, minVersion: string): boolean {
    const current = parseVersion(currentVersion);
    const minimum = parseVersion(minVersion);
    return compareVersions(current, minimum) >= 0;
  },

  /**
   * Check if update is available.
   */
  isUpdateAvailable(currentVersion: string, latestVersion: string): boolean {
    const current = parseVersion(currentVersion);
    const latest = parseVersion(latestVersion);
    return compareVersions(current, latest) < 0;
  },
};

/**
 * Parse version string (e.g., "1.2.3") to [1, 2, 3].
 */
function parseVersion(version: string): number[] {
  return version.split('.').map((v) => parseInt(v, 10) || 0);
}

/**
 * Compare two version arrays.
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1: number[], v2: number[]): number {
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const a = v1[i] || 0;
    const b = v2[i] || 0;
    if (a < b) return -1;
    if (a > b) return 1;
  }
  return 0;
}
