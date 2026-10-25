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
  /** Omit or pass `0` to show the full title (no ellipsis). Default: 1. */
  titleNumberOfLines?: number;
}

export function EntityRow({
  title,
  subtitle,
  meta,
  badge,
  icon = 'ellipse',
  onPress,
  titleNumberOfLines = 1,
}: EntityRowProps) {
  const multilineTitle = titleNumberOfLines === 0 || titleNumberOfLines > 1;
  const rowStyle = [styles.row, multilineTitle ? styles.rowMultiline : null];

  const content = (
    <>
      <View style={styles.iconChip}>
        <Ionicons name={icon} size={18} color={tokens.colors.secondary} />
      </View>
      <View style={styles.body}>
        <Text
          variant="bodySmall"
          style={styles.title}
          numberOfLines={titleNumberOfLines === 0 ? undefined : titleNumberOfLines}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted" numberOfLines={2}>
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
    return <View style={rowStyle}>{content}</View>;
  }

  return (
    <ScalePressable onPress={onPress} style={rowStyle}>
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
  rowMultiline: {
    alignItems: 'flex-start',
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
