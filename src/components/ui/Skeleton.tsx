import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { tokens } from '@/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  circle?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = '100%',
  height = 12,
  radius = tokens.radius.sm,
  circle = false,
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: tokens.duration.slow * 2, easing: tokens.easing.standard }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const size = circle ? height : undefined;

  return (
    <Animated.View
      style={[
        styles.bone,
        {
          width: circle ? size : width,
          height: circle ? size : height,
          borderRadius: circle ? height / 2 : radius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

interface SkeletonStackProps {
  children: ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonStack({
  children,
  gap = tokens.spacing.md,
  style,
}: SkeletonStackProps) {
  return <View style={[{ gap }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  bone: {
    backgroundColor: tokens.colors.surfaceMuted,
  },
});
