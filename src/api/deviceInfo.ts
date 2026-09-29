import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { DeviceInfo } from '@/api/mobileAuth';
import { APP_VERSION } from '@/api/config';

const DEVICE_ID_KEY = 'kbm.device.id';

/**
 * Capture device information for login and push registration.
 * Document: Send the full device object; deviceName and osVersion are what make login history readable.
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const deviceId = await getDeviceId();

  return {
    deviceId,
    platform: Platform.OS as 'ios' | 'android' | 'web',
    deviceName: Device.modelName || 'Unknown Device',
    osVersion: Device.osVersion || Platform.Version?.toString(),
    appVersion: APP_VERSION,
  };
}

/**
 * Stable device id persisted in SecureStore (survives restarts; new install = new id).
 */
async function getDeviceId(): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      const existing = globalThis.localStorage?.getItem(DEVICE_ID_KEY);
      if (existing) return existing;
      const created = `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      globalThis.localStorage?.setItem(DEVICE_ID_KEY, created);
      return created;
    }

    const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (existing) return existing;

    const created = `${Platform.OS}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    await SecureStore.setItemAsync(DEVICE_ID_KEY, created);
    return created;
  } catch {
    const model = Device.modelName?.replace(/\s+/g, '-').toLowerCase() || 'unknown';
    const brand = Device.brand?.replace(/\s+/g, '-').toLowerCase() || 'device';
    return `${brand}-${model}`;
  }
}
