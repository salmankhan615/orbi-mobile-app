import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { ScalePressable } from '@/components/custom/ScalePressable';

interface AttendanceActionsProps {
  canAttend: boolean;
  canCancel: boolean;
  cancelled?: boolean;
  present?: boolean;
  absent?: boolean;
  pending?: boolean;
  onPresent: () => void;
  onAbsent: () => void;
  onRemove?: () => void;
}

export function AttendanceActions({
  canAttend,
  canCancel,
  cancelled = false,
  present = false,
  absent = false,
  pending = false,
  onPresent,
  onAbsent,
  onRemove,
}: AttendanceActionsProps) {
  const showAttend = canAttend && !cancelled;
  const showRemove = canCancel && !cancelled && Boolean(onRemove);
  if (!showAttend && !showRemove) return null;

  return (
    <View style={styles.row}>
      {showAttend ? (
        <ScalePressable
          hapticStyle="select"
          disabled={present || pending}
          onPress={onPresent}
          style={[
            styles.chip,
            styles.present,
            present && styles.presentActive,
            (present || pending) && styles.disabled,
          ]}
        >
          <Text
            variant="caption"
            color={present ? 'onPrimary' : 'success'}
            style={styles.label}
          >
            Present
          </Text>
        </ScalePressable>
      ) : null}
      {showAttend ? (
        <ScalePressable
          hapticStyle="select"
          disabled={pending}
          onPress={onAbsent}
          style={[styles.chip, styles.absent, absent && styles.absentActive]}
        >
          <Text variant="caption" color={absent ? 'onPrimary' : 'danger'} style={styles.label}>
            Absent
          </Text>
        </ScalePressable>
      ) : null}
      {showRemove ? (
        <ScalePressable hapticStyle="select" onPress={onRemove} style={[styles.chip, styles.remove]}>
          <Ionicons name="trash-outline" size={14} color={tokens.colors.danger} />
          <Text variant="caption" color="danger" style={styles.label}>
            Remove
          </Text>
        </ScalePressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.xs,
    minHeight: 32,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontFamily: tokens.fontFamily.semibold,
  },
  disabled: {
    opacity: 0.45,
  },
  present: {
    borderColor: tokens.colors.success,
  },
  presentActive: {
    backgroundColor: tokens.colors.success,
  },
  absent: {
    borderColor: tokens.colors.danger,
  },
  absentActive: {
    backgroundColor: tokens.colors.danger,
  },
  remove: {
    borderColor: tokens.colors.danger,
  },
});
