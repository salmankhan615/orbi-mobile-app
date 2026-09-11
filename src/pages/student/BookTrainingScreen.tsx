import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { Screen } from '@/components/custom/Screen';
import { FadeInView } from '@/components/custom/FadeInView';
import {
  useAvailableTrainingShifts,
  useBookTrainingShift,
  useTrainingLocations,
} from '@/queries/useBookings';
import { ApiError } from '@/api/client';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';
import { formatPortalDate, toISODate } from '@/utils/date';
import { smoothScrollProps } from '@/utils/scroll';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'BookTraining'>;

function messageFromError(error: unknown): string {
  if (error instanceof ApiError) {
    const body = error.body;
    if (body && typeof body === 'object') {
      const message = (body as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message.trim();
    }
    if (error.message.trim()) return error.message.trim();
  }
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return 'Could not book this training shift';
}

export function BookTrainingScreen({ route, navigation }: Props) {
  const date = route.params?.date ?? toISODate(new Date());
  const showToast = useToastStore((state) => state.show);

  const { data: locations = [], isLoading: loadingLocations } = useTrainingLocations();
  const [locationId, setLocationId] = useState<string | null>(null);
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [seat, setSeat] = useState<number | null>(null);

  const shiftsQuery = useAvailableTrainingShifts(date, locationId ?? '');
  const book = useBookTrainingShift();

  const shifts = shiftsQuery.data ?? [];
  const selectedShift = useMemo(
    () => shifts.find((item) => item.id === shiftId) ?? null,
    [shifts, shiftId],
  );
  const freeSeats = selectedShift?.freeSeats ?? [];

  useEffect(() => {
    setShiftId(null);
    setSeat(null);
  }, [locationId]);

  useEffect(() => {
    setSeat(null);
  }, [shiftId]);

  const locationOptions = useMemo(
    () => locations.map((item) => ({ id: item.id, label: item.title })),
    [locations],
  );

  const shiftOptions = useMemo(
    () =>
      shifts.map((shift) => {
        const full = shift.availableCount <= 0 || shift.freeSeats.length === 0;
        return {
          id: shift.id,
          label: shift.name,
          detail: full
            ? `${shift.startTime} – ${shift.endTime} · Full`
            : `${shift.startTime} – ${shift.endTime} · ${shift.availableCount} seats left`,
          disabled: full,
        };
      }),
    [shifts],
  );

  const seatOptions = useMemo(
    () => freeSeats.map((n) => ({ id: String(n), label: `Seat ${n}` })),
    [freeSeats],
  );

  const canConfirm =
    Boolean(locationId && shiftId && seat != null && freeSeats.includes(seat)) && !book.isPending;

  function handleConfirm() {
    if (!locationId || !shiftId || seat == null) return;
    book.mutate(
      { locationId, shiftId, date, seat },
      {
        onSuccess: () => {
          haptics.success();
          showToast('Booking successful', 'success');
          navigation.goBack();
        },
        onError: (error) => {
          showToast(messageFromError(error), 'danger');
        },
      },
    );
  }

  return (
    <Screen edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <IconButton name="arrow-back" onPress={() => navigation.goBack()} />
        <Text variant="title" style={styles.headerTitle} numberOfLines={1}>
          Book Practical Training
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        {...smoothScrollProps}
      >
        <FadeInView>
          <View style={styles.dateCard}>
            <Text variant="caption" color="textMuted" style={styles.dateLabel}>
              Date
            </Text>
            <Text variant="title">{formatPortalDate(date)}</Text>
          </View>

          <View style={styles.form}>
            {loadingLocations ? (
              <ActivityIndicator color={tokens.colors.primary} style={styles.loader} />
            ) : (
              <SelectDropdown
                label="Select Location"
                required
                placeholder="Choose a location..."
                value={locationId}
                options={locationOptions}
                onChange={setLocationId}
                emptyMessage="No training locations available."
              />
            )}

            {locationId ? (
              <View style={styles.fieldBlock}>
                {shiftsQuery.isLoading ? (
                  <View style={styles.shiftLoading}>
                    <Text variant="bodySmall" style={styles.fieldLabel}>
                      Select Shift <Text color="danger">*</Text>
                    </Text>
                    <ActivityIndicator color={tokens.colors.primary} />
                  </View>
                ) : shifts.length === 0 ? (
                  <View style={styles.fieldBlock}>
                    <Text variant="bodySmall" style={styles.fieldLabel}>
                      Select Shift <Text color="danger">*</Text>
                    </Text>
                    <View style={styles.warningBox}>
                      <Ionicons name="warning" size={20} color={tokens.colors.warning} />
                      <Text variant="caption" color="textSecondary" style={styles.warningText}>
                        No practical training shifts are available for your allocated access type on
                        the selected date.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <SelectDropdown
                    label="Select Shift"
                    required
                    placeholder="Choose a shift..."
                    value={shiftId}
                    options={shiftOptions}
                    onChange={setShiftId}
                  />
                )}
              </View>
            ) : null}

            {selectedShift && freeSeats.length > 0 ? (
              <SelectDropdown
                label="Select Seat Number"
                required
                placeholder="Choose a seat..."
                value={seat != null ? String(seat) : null}
                options={seatOptions}
                onChange={(id) => setSeat(Number(id))}
              />
            ) : null}
          </View>
        </FadeInView>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Cancel"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.footerBtn}
        />
        <Button
          label="Confirm Booking"
          icon="checkmark"
          variant="accent"
          disabled={!canConfirm}
          loading={book.isPending}
          onPress={handleConfirm}
          style={styles.footerBtn}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.sm,
    gap: tokens.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.xxxl,
  },
  dateCard: {
    gap: tokens.spacing.xs,
    backgroundColor: tokens.colors.surfaceAlt,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
  },
  dateLabel: {
    fontFamily: tokens.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  form: {
    gap: tokens.spacing.xl,
  },
  fieldBlock: {
    gap: tokens.spacing.sm,
  },
  fieldLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  loader: {
    marginTop: tokens.spacing.md,
    alignSelf: 'flex-start',
  },
  shiftLoading: {
    gap: tokens.spacing.md,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.sm,
    backgroundColor: tokens.colors.warningMuted,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
  },
  warningText: {
    flex: 1,
    lineHeight: tokens.lineHeight.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
  },
  footerBtn: {
    flex: 1,
  },
});
