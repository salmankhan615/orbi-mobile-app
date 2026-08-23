import { Pressable, StyleSheet, ViewStyle } from 'react-native';
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

export function IconButton({
  name,
  onPress,
  color = 'textPrimary',
  background = 'transparent',
  size = 20,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress?.();
      }}
      hitSlop={8}
      style={[styles.button, { backgroundColor: tokens.colors[background] }, style]}
    >
      <Ionicons name={name} size={size} color={tokens.colors[color]} />
    </Pressable>
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
