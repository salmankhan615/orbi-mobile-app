import { PropsWithChildren } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { tokens } from '@/theme';
import { haptics } from '@/utils/haptics';

interface ScalePressableProps extends PropsWithChildren, Pick<PressableProps, 'onPress' | 'disabled'> {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
  hapticStyle?: 'tap' | 'select';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Shared tactile press feedback for tappable cards/list rows — spring scale on
// press plus platform haptics (Taptic on iOS, short vibrate on Android).
export function ScalePressable({
  children,
  onPress,
  style,
  scaleTo = 0.97,
  haptic = true,
  hapticStyle = 'tap',
  disabled,
}: ScalePressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function fireHaptic() {
    if (!haptic || disabled) return;
    if (hapticStyle === 'select') {
      haptics.select();
      return;
    }
    haptics.tap();
  }

  function handlePressIn() {
    if (disabled) return;
    fireHaptic();
    // eslint-disable-next-line react-hooks/immutability -- Reanimated SharedValue, not React state
    scale.value = withSpring(scaleTo, tokens.spring.press);
  }

  function handlePressOut() {
    // eslint-disable-next-line react-hooks/immutability -- Reanimated SharedValue, not React state
    scale.value = withSpring(1, tokens.spring.release);
  }

  function handlePress(event: GestureResponderEvent) {
    if (disabled) return;
    onPress?.(event);
  }

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
