import { PropsWithChildren } from 'react';
import { GestureResponderEvent, Pressable, PressableProps, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { tokens } from '@/theme';
import { haptics } from '@/utils/haptics';

interface ScalePressableProps extends PropsWithChildren, Pick<PressableProps, 'onPress'> {
  style?: ViewStyle | ViewStyle[];
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
}: ScalePressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function fireHaptic() {
    if (!haptic) return;
    if (hapticStyle === 'select') {
      haptics.select();
      return;
    }
    haptics.tap();
  }

  function handlePressIn() {
    fireHaptic();
    scale.value = withSpring(scaleTo, tokens.spring.press);
  }

  function handlePressOut() {
    scale.value = withSpring(1, tokens.spring.release);
  }

  function handlePress(event: GestureResponderEvent) {
    onPress?.(event);
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
