import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { useToastStore } from '@/store/useToastStore';

const TONE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  danger: 'alert-circle',
  neutral: 'information-circle',
};

const TONE_COLOR: Record<string, keyof typeof tokens.colors> = {
  success: 'success',
  danger: 'danger',
  neutral: 'onPrimary',
};

function hideToast() {
  useToastStore.getState().hide();
}

// Mounted once near the root (see App.tsx) and driven by useToastStore, so
// any screen can call `useToastStore.getState().show(...)` without prop
// drilling a toast host through navigation.
export function Toast() {
  const { message, tone } = useToastStore();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!message) return;

    translateY.value = withSpring(0, { damping: 16, stiffness: 180 });
    opacity.value = withTiming(1, { duration: tokens.duration.fast });

    const timeout = setTimeout(() => {
      opacity.value = withTiming(0, { duration: tokens.duration.base });
      translateY.value = withTiming(40, { duration: tokens.duration.base }, (finished) => {
        if (finished) {
          // Animation callbacks run on the UI thread — bridge back to JS
          // before touching Zustand, or the app crashes.
          runOnJS(hideToast)();
        }
      });
    }, 2400);

    return () => clearTimeout(timeout);
  }, [message, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, { bottom: insets.bottom + tokens.spacing.xxl }, animatedStyle]}
    >
      <Ionicons name={TONE_ICON[tone]} size={18} color={tokens.colors[TONE_COLOR[tone]]} />
      <Text variant="bodySmall" color="onPrimary" style={styles.message}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: tokens.spacing.xl,
    right: tokens.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    ...tokens.shadows.lg,
  },
  message: {
    flex: 1,
    fontFamily: tokens.fontFamily.medium,
  },
});
