import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { haptics } from '@/utils/haptics';
import { Text } from './Text';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'tinted';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    'worklet';
    scale.value = withTiming(0.98, {
      duration: tokens.duration.fast,
      easing: tokens.easing.standard,
    });
  }

  function handlePressOut() {
    'worklet';
    scale.value = withTiming(1, {
      duration: tokens.duration.fast,
      easing: tokens.easing.standard,
    });
  }

  function handlePress() {
    haptics.tap();
    onPress?.();
  }

  const variantStyle =
    variant === 'secondary'
      ? styles.secondary
      : variant === 'ghost'
        ? styles.ghost
        : variant === 'tinted'
          ? styles.tinted
          : styles.primary;

  const labelColor =
    variant === 'primary'
      ? 'onPrimary'
      : variant === 'tinted'
        ? 'primary'
        : variant === 'ghost'
          ? 'textSecondary'
          : 'primary';

  const iconColor = variant === 'primary' ? tokens.colors.onPrimary : tokens.colors.primary;

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={isDisabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.base, variantStyle, isDisabled && styles.disabled, animatedStyle, style]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? tokens.colors.onPrimary : tokens.colors.primary}
        />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={18} color={iconColor} /> : null}
          <Text variant="body" color={labelColor} style={styles.label}>
            {label}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radius.full,
    minHeight: 50,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  primary: {
    backgroundColor: tokens.colors.primary,
  },
  secondary: {
    backgroundColor: tokens.colors.surface,
    borderWidth: 1.5,
    borderColor: tokens.colors.primary,
  },
  ghost: {
    backgroundColor: tokens.colors.transparent,
  },
  tinted: {
    backgroundColor: tokens.colors.primaryMuted,
  },
  label: {
    fontFamily: tokens.fontFamily.semibold,
    fontSize: tokens.fontSize.lg,
  },
  disabled: {
    opacity: 0.35,
  },
});
