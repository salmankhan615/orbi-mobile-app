import { PropsWithChildren, useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { tokens } from '@/theme';

interface FadeInViewProps extends PropsWithChildren {
  delay?: number;
  style?: ViewStyle;
}

export function FadeInView({ children, delay = 0, style }: FadeInViewProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: tokens.duration.base, easing: tokens.easing.decelerate }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: tokens.duration.base, easing: tokens.easing.decelerate }),
    );
  }, [delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
