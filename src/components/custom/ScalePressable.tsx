import { PropsWithChildren } from 'react';
import { GestureResponderEvent, Pressable, PressableProps, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { tokens } from '@/theme';
import { haptics } from '@/utils/haptics';

interface ScalePressableProps extends PropsWithChildren, Pick<PressableProps, 'onPress'> {
  style?: ViewStyle | ViewStyle[];
  scaleTo?: number;
  haptic?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Shared tactile press feedback for tappable cards/list rows — keeps the
// "shrink slightly on press" feel (plus a light haptic tick) consistent
// without every card re-deriving it.
export function ScalePressable({
  children,
  onPress,
  style,
  scaleTo = 0.97,
  haptic = true,
}: ScalePressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    'worklet';
    scale.value = withTiming(scaleTo, {
      duration: tokens.duration.fast,
      easing: tokens.easing.standard,
    });
  }

  function handlePressOut() {
    'worklet';
    scale.value = withTiming(1, { duration: tokens.duration.fast, easing: tokens.easing.standard });
  }

  function handlePress(event: GestureResponderEvent) {
    if (haptic) haptics.tap();
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
