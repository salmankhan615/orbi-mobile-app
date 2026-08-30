import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { ScalePressable } from '@/components/custom/ScalePressable';
import type { BadgeTone } from '@/components/ui/Badge';

interface EntityRowProps {
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: { label: string; tone?: BadgeTone };
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}

export function EntityRow({
  title,
  subtitle,
  meta,
  badge,
  icon = 'ellipse',
  onPress,
}: EntityRowProps) {
  const content = (
    <>
      <View style={styles.iconChip}>
        <Ionicons name={icon} size={18} color={tokens.colors.secondary} />
      </View>
      <View style={styles.body}>
        <Text variant="bodySmall" style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text variant="caption" color="textSecondary">
            {meta}
          </Text>
        ) : null}
      </View>
      {badge ? <Badge label={badge.label} tone={badge.tone} /> : null}
      {onPress ? (
        <Ionicons name="chevron-forward" size={16} color={tokens.colors.textMuted} />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <ScalePressable onPress={onPress} style={styles.row}>
      {content}
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: tokens.fontFamily.semibold,
  },
});
