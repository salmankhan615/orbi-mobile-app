import { Platform } from 'react-native';

/**
 * Android 3-button navigation is ~48dp. Edge-to-edge can report `insets.bottom`
 * as 0, which puts a custom tab bar on top of the system buttons.
 */
export const ANDROID_NAV_FALLBACK = 48;

export function systemNavInset(safeBottom: number) {
  if (Platform.OS === 'android' && safeBottom <= 0) {
    return ANDROID_NAV_FALLBACK;
  }
  return Math.max(0, safeBottom);
}
