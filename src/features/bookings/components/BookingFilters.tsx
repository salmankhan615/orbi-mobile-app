import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { ScalePressable } from '@/components/custom/ScalePressable';
import type { BookingFilterOption } from '@/features/bookings/bookingFilters';

interface FilterSelectRowProps {
  label: string;
  value: string;
  options: BookingFilterOption[];
  onChange: (id: string) => void;
}

export function FilterSelectRow({ label, value, options, onChange }: FilterSelectRowProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((option) => option.id === value) ?? options[0];

  return (
    <>
      <ScalePressable hapticStyle="select" onPress={() => setOpen(true)} style={styles.row}>
        <View style={styles.copy}>
          <Text variant="caption" color="textMuted">
            {label}
          </Text>
          <Text variant="bodySmall" style={styles.value} numberOfLines={1}>
            {selected?.label ?? '—'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={tokens.colors.textMuted} />
      </ScalePressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, tokens.spacing.lg) }]}
          >
            <View style={styles.sheetHandle} />
            <Text variant="title" style={styles.sheetTitle}>
              {label}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
              {options.map((option) => {
                const active = option.id === value;
                return (
                  <ScalePressable
                    key={option.id}
                    hapticStyle="select"
                    onPress={() => {
                      onChange(option.id);
                      setOpen(false);
                    }}
                    style={active ? [styles.option, styles.optionActive] : styles.option}
                  >
                    <Text
                      variant="bodySmall"
                      color={active ? 'primary' : 'textPrimary'}
                      style={styles.optionLabel}
                      numberOfLines={2}
                    >
                      {option.label}
                    </Text>
                    {active ? (
                      <Ionicons name="checkmark" size={18} color={tokens.colors.primary} />
                    ) : null}
                  </ScalePressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

interface SegmentedFilterProps {
  options: BookingFilterOption[];
  value: string;
  onChange: (id: string) => void;
}

export function SegmentedFilter({ options, value, onChange }: SegmentedFilterProps) {
  return (
    <View style={styles.segment}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <ScalePressable
            key={option.id}
            hapticStyle="select"
            onPress={() => onChange(option.id)}
            style={active ? [styles.segmentItem, styles.segmentItemActive] : styles.segmentItem}
          >
            <Text
              variant="caption"
              color={active ? 'onSecondary' : 'textSecondary'}
              style={styles.segmentLabel}
            >
              {option.label}
            </Text>
          </ScalePressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surfaceAlt,
    borderRadius: tokens.radius.full,
    padding: tokens.spacing.xxs,
    gap: tokens.spacing.xxs,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.sm + 2,
    borderRadius: tokens.radius.full,
  },
  segmentItemActive: {
    backgroundColor: tokens.colors.secondary,
  },
  segmentLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  value: {
    fontFamily: tokens.fontFamily.semibold,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: tokens.colors.overlay,
  },
  sheet: {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: tokens.radius.xxl,
    borderTopRightRadius: tokens.radius.xxl,
    maxHeight: '65%',
    paddingTop: tokens.spacing.sm,
    ...tokens.shadows.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.colors.borderStrong,
    marginBottom: tokens.spacing.md,
  },
  sheetTitle: {
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
  },
  optionActive: {
    backgroundColor: tokens.colors.surfaceAlt,
  },
  optionLabel: {
    flex: 1,
    fontFamily: tokens.fontFamily.medium,
  },
});
