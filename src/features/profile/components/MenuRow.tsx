import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { ScalePressable } from '@/components/custom/ScalePressable';

interface MenuRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: 'default' | 'danger';
  trailingLabel?: string;
  onPress?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function MenuRow({
  icon,
  label,
  tone = 'default',
  trailingLabel,
  onPress,
  isLast = false,
}: MenuRowProps) {
  const isDanger = tone === 'danger';

  return (
    <ScalePressable
      onPress={onPress}
      haptic={false}
      style={[styles.row, ...(!isLast ? [styles.divider] : [])]}
    >
      <View style={[styles.iconChip, isDanger && styles.iconChipDanger]}>
        <Ionicons
          name={icon}
          size={16}
          color={isDanger ? tokens.colors.danger : tokens.colors.primary}
        />
      </View>
      <Text variant="bodySmall" color={isDanger ? 'danger' : 'textPrimary'} style={styles.label}>
        {label}
      </Text>
      {trailingLabel && (
        <Text variant="caption" color="textMuted">
          {trailingLabel}
        </Text>
      )}
      {!isDanger && <Ionicons name="chevron-forward" size={14} color={tokens.colors.textMuted} />}
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    backgroundColor: tokens.colors.surface,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border,
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipDanger: {
    backgroundColor: tokens.colors.dangerMuted,
  },
  label: {
    flex: 1,
    fontFamily: tokens.fontFamily.medium,
  },
});
