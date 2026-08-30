import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

function vibrateAndroid(pattern: number | number[]) {
  try {
    Vibration.vibrate(pattern);
  } catch {
    // Device may not support vibration — safe to ignore.
  }
}

export const haptics = {
  /** Light tap on buttons, cards, and icon actions. */
  tap: () => {
    if (Platform.OS === 'ios') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    if (Platform.OS === 'android') {
      vibrateAndroid(14);
    }
  },

  /** Tab switches, toggles, filter chips, and picker changes. */
  select: () => {
    if (Platform.OS === 'ios') {
      void Haptics.selectionAsync();
      return;
    }
    if (Platform.OS === 'android') {
      vibrateAndroid(10);
    }
  },

  /** Completed actions — booking confirmed, lesson marked done, etc. */
  success: () => {
    if (Platform.OS === 'ios') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    if (Platform.OS === 'android') {
      vibrateAndroid([0, 12, 48, 16]);
    }
  },

  /** Destructive or blocked actions — sign out confirm, locked lesson, etc. */
  warning: () => {
    if (Platform.OS === 'ios') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (Platform.OS === 'android') {
      vibrateAndroid([0, 18, 36, 22]);
    }
  },
};
