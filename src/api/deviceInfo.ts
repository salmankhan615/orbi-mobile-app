import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type { DeviceInfo } from '@/api/mobileAuth';

/**
 * Capture device information for login and push registration.
 * Document: Send the full device object; deviceName and osVersion are what make login history readable.
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const deviceId = await getDeviceId();

  return {
    deviceId,
    platform: (Platform.OS as 'ios' | 'android' | 'web'),
    deviceName: Device.modelName || 'Unknown Device',
    osVersion: Device.osVersion || Platform.Version?.toString(),
    appVersion: '1.0.0', // Match app.json version
  };
}

/**
 * Get or create a stable device ID.
 * Must persist across app reinstalls on the same device.
 */
async function getDeviceId(): Promise<string> {
  // Use Device.getIpAddressAsync() or a combination of model + brand
  // For now, use a hash of device properties as fallback
  const model = Device.modelName?.replace(/\s+/g, '-').toLowerCase() || 'unknown';
  const brand = Device.brand?.replace(/\s+/g, '-').toLowerCase() || 'device';
  return `${brand}-${model}`;
}
