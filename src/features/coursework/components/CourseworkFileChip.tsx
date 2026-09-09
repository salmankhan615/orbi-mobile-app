import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import type { CourseworkFile } from '@/api/staff';

interface FileChipProps {
  file: CourseworkFile;
  onPress: () => void;
}

export function CourseworkFileChip({ file, onPress }: FileChipProps) {
  const icon =
    file.type.toUpperCase() === 'VIDEO'
      ? 'videocam-outline'
      : file.type.toUpperCase() === 'IMAGE'
        ? 'image-outline'
        : 'document-outline';

  return (
    <Pressable onPress={onPress} style={styles.chip}>
      <Ionicons name={icon} size={16} color={tokens.colors.textSecondary} />
      <Text variant="caption" color="textSecondary" style={styles.chipLabel} numberOfLines={1}>
        {file.filename}
      </Text>
      <Ionicons name="eye-outline" size={16} color={tokens.colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: tokens.colors.surfaceAlt,
    borderRadius: tokens.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
  },
  chipLabel: {
    flexShrink: 1,
    fontFamily: tokens.fontFamily.medium,
  },
});
