import { API_BASE_URL, APP_VERSION } from '@/api/config';

export interface PushDeviceRegister {
  expoPushToken: string;
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  timezone?: string;
  locale?: string;
  deviceName?: string;
  osVersion?: string;
}

/**
 * Push device management.
 * Document: Area 3 - Push notifications
 * PushDevice — unique index on expoPushToken, compound on (userId, deviceId)
 */
export const pushDevicesApi = {
  /**
   * Register or refresh push device.
   * Document: PUT /api/mobile/devices
   * The upsert rule: match on expoPushToken first and reassign to current user,
   * then match on (userId, deviceId).
   */
  async register(
    token: string,
    accessToken: string,
    device: PushDeviceRegister,
  ): Promise<void> {
    try {
      console.log('[Push] Registering device:', device.platform);
      const response = await fetch(`${API_BASE_URL}/api/mobile/devices`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-App-Version': APP_VERSION,
        },
        body: JSON.stringify({
          ...device,
          expoPushToken: token,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Push] Registration failed:', error);
        throw new Error(`Device registration failed: ${response.statusText}`);
      }

      console.log('[Push] ✓ Device registered');
    } catch (error) {
      console.error('[Push] Registration error:', error);
      throw error;
    }
  },

  /**
   * Deregister push device on logout.
   * Document: DELETE /api/mobile/devices/:deviceId
   */
  async deregister(deviceId: string, accessToken: string): Promise<void> {
    try {
      console.log('[Push] Deregistering device:', deviceId);
      const response = await fetch(`${API_BASE_URL}/api/mobile/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-App-Version': APP_VERSION,
        },
      });

      if (!response.ok) {
        console.warn('[Push] Deregistration returned:', response.status);
        // Don't throw — device was logged out anyway
      }

      console.log('[Push] ✓ Device deregistered');
    } catch (error) {
      console.error('[Push] Deregister error:', error);
      // Don't throw — device was logged out anyway
    }
  },

  /**
   * Get notification preferences.
   * Document: GET /api/mobile/notification-settings
   */
  async getPreferences(accessToken: string): Promise<{ pushEnabled: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/notification-settings`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-App-Version': APP_VERSION,
        },
      });

      if (!response.ok) {
        console.warn('[Push] Failed to fetch preferences');
        return { pushEnabled: true }; // Default to enabled
      }

      return await response.json();
    } catch (error) {
      console.error('[Push] Preference fetch error:', error);
      return { pushEnabled: true }; // Default to enabled
    }
  },

  /**
   * Update notification preferences.
   * Document: PUT /api/mobile/notification-settings
   */
  async updatePreferences(
    pushEnabled: boolean,
    accessToken: string,
  ): Promise<void> {
    try {
      console.log('[Push] Updating preferences: pushEnabled =', pushEnabled);
      const response = await fetch(`${API_BASE_URL}/api/mobile/notification-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-App-Version': APP_VERSION,
        },
        body: JSON.stringify({ pushEnabled }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.statusText}`);
      }

      console.log('[Push] ✓ Preferences updated');
    } catch (error) {
      console.error('[Push] Preference update error:', error);
      throw error;
    }
  },
};
