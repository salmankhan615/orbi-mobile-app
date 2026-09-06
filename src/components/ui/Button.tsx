import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { haptics } from '@/utils/haptics';
import { Text } from './Text';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  /** Dark blue squircle, purple block, gold pill, or outline. */
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'tinted';
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
    if (isDisabled) return;
    haptics.tap();
    // eslint-disable-next-line react-hooks/immutability -- Reanimated SharedValue, not React state
    scale.value = withSpring(0.98, tokens.spring.press);
  }

  function handlePressOut() {
    // eslint-disable-next-line react-hooks/immutability -- Reanimated SharedValue, not React state
    scale.value = withSpring(1, tokens.spring.release);
  }

  function handlePress() {
    onPress?.();
  }

  const variantStyle =
    variant === 'secondary'
      ? styles.secondary
      : variant === 'accent'
        ? styles.accent
        : variant === 'outline'
          ? styles.outline
          : variant === 'ghost'
            ? styles.ghost
            : variant === 'tinted'
              ? styles.tinted
              : styles.primary;

  const labelColor =
    variant === 'primary' || variant === 'secondary'
      ? 'onPrimary'
      : variant === 'accent'
        ? 'onTertiary'
        : variant === 'tinted'
          ? 'secondary'
          : variant === 'ghost'
            ? 'textSecondary'
            : 'primary';

  const iconColor =
    variant === 'primary' || variant === 'secondary'
      ? tokens.colors.onPrimary
      : variant === 'accent'
        ? tokens.colors.onTertiary
        : variant === 'tinted'
          ? tokens.colors.secondary
          : tokens.colors.primary;

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={isDisabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.base, variantStyle, isDisabled && styles.disabled, animatedStyle, style]}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
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
    borderRadius: tokens.radius.xl,
  },
  secondary: {
    backgroundColor: tokens.colors.secondary,
    borderRadius: tokens.radius.md,
  },
  accent: {
    backgroundColor: tokens.colors.tertiary,
    borderRadius: tokens.radius.full,
  },
  outline: {
    backgroundColor: tokens.colors.surface,
    borderWidth: 1.5,
    borderColor: tokens.colors.primary,
    borderRadius: tokens.radius.xl,
  },
  ghost: {
    backgroundColor: tokens.colors.transparent,
    borderRadius: tokens.radius.lg,
  },
  tinted: {
    backgroundColor: tokens.colors.secondaryMuted,
    borderRadius: tokens.radius.md,
  },
  label: {
    fontFamily: tokens.fontFamily.semibold,
    fontSize: tokens.fontSize.lg,
  },
  disabled: {
    opacity: 0.35,
  },
});
