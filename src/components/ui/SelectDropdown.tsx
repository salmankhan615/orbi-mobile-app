import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { haptics } from '@/utils/haptics';

export type SelectOption = {
  id: string;
  label: string;
  detail?: string;
  disabled?: boolean;
};

interface SelectDropdownProps {
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string | null;
  options: SelectOption[];
  onChange: (id: string) => void;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}

export function SelectDropdown({
  label,
  required,
  placeholder = 'Choose…',
  value,
  options,
  onChange,
  disabled,
  loading,
  emptyMessage = 'No options available.',
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((option) => option.id === value);

  function openMenu() {
    if (disabled || loading) return;
    haptics.select();
    setOpen(true);
  }

  return (
    <View style={styles.field}>
      <Text variant="bodySmall" style={styles.label}>
        {label}
        {required ? <Text variant="bodySmall" color="danger"> *</Text> : null}
      </Text>

      <ScalePressable
        haptic={false}
        disabled={disabled || loading}
        onPress={openMenu}
        style={[styles.trigger, (disabled || loading) && styles.triggerDisabled]}
      >
        <View style={styles.triggerCopy}>
          <Text
            variant="bodySmall"
            color={selected ? 'textPrimary' : 'textMuted'}
            numberOfLines={1}
            style={selected ? styles.triggerValue : undefined}
          >
            {loading ? 'Loading…' : (selected?.label ?? placeholder)}
          </Text>
          {selected?.detail ? (
            <Text variant="caption" color="textMuted" numberOfLines={1}>
              {selected.detail}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={tokens.colors.textMuted}
        />
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
            <ScrollView
              keyboardShouldPersistTaps="handled"
              bounces={false}
              contentContainerStyle={styles.sheetContent}
            >
              {options.length === 0 ? (
                <Text variant="bodySmall" color="textMuted" style={styles.empty}>
                  {emptyMessage}
                </Text>
              ) : (
                options.map((option) => {
                  const active = option.id === value;
                  return (
                    <ScalePressable
                      key={option.id}
                      hapticStyle="select"
                      disabled={option.disabled}
                      onPress={() => {
                        if (option.disabled) return;
                        onChange(option.id);
                        setOpen(false);
                      }}
                      style={[
                        styles.option,
                        active && styles.optionActive,
                        option.disabled && styles.optionDisabled,
                      ]}
                    >
                      <View style={styles.optionCopy}>
                        <Text
                          variant="bodySmall"
                          color={active ? 'primary' : 'textPrimary'}
                          style={styles.optionLabel}
                          numberOfLines={2}
                        >
                          {option.label}
                        </Text>
                        {option.detail ? (
                          <Text variant="caption" color="textMuted" numberOfLines={1}>
                            {option.detail}
                          </Text>
                        ) : null}
                      </View>
                      {active ? (
                        <Ionicons name="checkmark" size={18} color={tokens.colors.primary} />
                      ) : null}
                    </ScalePressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: tokens.spacing.sm,
  },
  label: {
    fontFamily: tokens.fontFamily.semibold,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    minHeight: 52,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
    borderWidth: 1.5,
    borderColor: tokens.colors.borderStrong,
    backgroundColor: tokens.colors.surface,
  },
  triggerDisabled: {
    opacity: 0.55,
  },
  triggerCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  triggerValue: {
    fontFamily: tokens.fontFamily.medium,
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
    maxHeight: '70%',
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
    paddingHorizontal: tokens.spacing.screen,
    marginBottom: tokens.spacing.sm,
  },
  sheetContent: {
    paddingBottom: tokens.spacing.md,
  },
  empty: {
    paddingHorizontal: tokens.spacing.screen,
    paddingVertical: tokens.spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.screen,
  },
  optionActive: {
    backgroundColor: tokens.colors.surfaceAlt,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  optionLabel: {
    fontFamily: tokens.fontFamily.medium,
  },
});
