import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { FadeInView } from '@/components/custom/FadeInView';
import { staggerDelay } from '@/utils/formatters';
import { sessionStatusBadge, type Session } from '@/api/sessions';
import { SESSION_TYPE_ICON, SESSION_TYPE_TINT, sessionAccentColor } from '../sessionStyle';

interface SessionListItemProps {
  session: Session;
  index?: number;
  onPress?: () => void;
  /** Show trailing chevron (list / day sheet). */
  showChevron?: boolean;
  /** Hide date column when date is already in a group header. */
  hideDate?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

function formatDateParts(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
  };
}

export function SessionListItem({
  session,
  index = 0,
  onPress,
  showChevron = false,
  hideDate = false,
}: SessionListItemProps) {
  const tint = SESSION_TYPE_TINT[session.type];
  const { day, month } = formatDateParts(session.date);
  const statusBadge = sessionStatusBadge(session);

  return (
    <FadeInView delay={staggerDelay(index)} style={styles.wrapper}>
      <ScalePressable onPress={onPress} style={styles.card}>
        <View style={[styles.accent, { backgroundColor: tokens.colors[sessionAccentColor(session)] }]} />
        {!hideDate && (
          <>
            <View style={styles.dateCol}>
              <Text variant="caption" color="textMuted" style={styles.month}>
                {month}
              </Text>
              <Text variant="title" style={styles.day}>
                {day}
              </Text>
            </View>
            <View style={styles.divider} />
          </>
        )}

        <View style={[styles.iconChip, { backgroundColor: tokens.colors[tint.bg] }]}>
          <Ionicons
            name={SESSION_TYPE_ICON[session.type]}
            size={18}
            color={tokens.colors[tint.fg]}
          />
        </View>

        <View style={styles.body}>
          <Text variant="bodySmall" style={styles.title} numberOfLines={2}>
            {session.title}
          </Text>
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {session.startTime} – {session.endTime}
          </Text>
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {session.code}
          </Text>
        </View>

        <View style={styles.trailing}>
          <Badge label={statusBadge.label} tone={statusBadge.tone} />
          {showChevron ? (
            <Ionicons name="chevron-forward" size={16} color={tokens.colors.textMuted} />
          ) : null}
        </View>
      </ScalePressable>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    paddingLeft: tokens.spacing.md + 4,
    marginBottom: tokens.spacing.sm,
    gap: tokens.spacing.md,
    overflow: 'hidden',
    ...tokens.shadows.sm,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  dateCol: {
    width: 40,
    alignItems: 'center',
    paddingTop: 2,
  },
  month: {
    fontFamily: tokens.fontFamily.semibold,
    letterSpacing: 0.4,
  },
  day: {
    fontSize: tokens.fontSize.xl,
    lineHeight: tokens.lineHeight.xl,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: tokens.colors.border,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingTop: 2,
  },
  title: {
    fontFamily: tokens.fontFamily.semibold,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: tokens.spacing.xs,
    flexShrink: 0,
    paddingTop: 2,
  },
});
