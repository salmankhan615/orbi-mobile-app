import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';

interface AvatarProps {
  initial: string;
  online?: boolean;
  size?: number;
}

export function Avatar({ initial, online, size = 48 }: AvatarProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text variant="body" color="onPrimary" style={styles.initial}>
          {initial}
        </Text>
      </View>
      {online && <View style={styles.dot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  circle: {
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: tokens.fontFamily.semibold,
  },
  dot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: tokens.colors.success,
    borderWidth: 2,
    borderColor: tokens.colors.surface,
  },
});
