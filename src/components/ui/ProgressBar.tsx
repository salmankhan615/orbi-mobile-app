import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { tokens } from '@/theme';

export interface ProgressBarProps {
  progress: number; // 0–100
  trackColor?: keyof typeof tokens.colors;
  fillColor?: keyof typeof tokens.colors;
  height?: number;
}

export function ProgressBar({
  progress,
  trackColor = 'surfaceAlt',
  fillColor = 'success',
  height = 6,
}: ProgressBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(Math.max(progress, 0), 100), {
      duration: tokens.duration.slow,
      easing: tokens.easing.decelerate,
    });
  }, [progress, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: tokens.colors[trackColor], height, borderRadius: height / 2 },
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          animatedStyle,
          { backgroundColor: tokens.colors[fillColor], borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
