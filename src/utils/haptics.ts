import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Thin wrapper so call sites don't repeat the platform guard — haptics only
// exist on iOS/Android, and are safe to no-op elsewhere (web).
function guard(fn: () => void) {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    fn();
  }
}

export const haptics = {
  tap: () => guard(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  select: () => guard(() => Haptics.selectionAsync()),
  success: () => guard(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => guard(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
