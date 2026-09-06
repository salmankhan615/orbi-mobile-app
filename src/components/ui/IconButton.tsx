import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { haptics } from '@/utils/haptics';

export interface IconButtonProps {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  color?: keyof typeof tokens.colors;
  background?: keyof typeof tokens.colors;
  size?: number;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function IconButton({
  name,
  onPress,
  color = 'textPrimary',
  background = 'transparent',
  size = 20,
  style,
}: IconButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    haptics.tap();
    // eslint-disable-next-line react-hooks/immutability -- Reanimated SharedValue, not React state
    scale.value = withSpring(0.9, tokens.spring.press);
  }

  function handlePressOut() {
    // eslint-disable-next-line react-hooks/immutability -- Reanimated SharedValue, not React state
    scale.value = withSpring(1, tokens.spring.release);
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={8}
      style={[styles.button, { backgroundColor: tokens.colors[background] }, animatedStyle, style]}
    >
      <Ionicons name={name} size={size} color={tokens.colors[color]} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
