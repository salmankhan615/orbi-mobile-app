import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { Screen } from '@/components/custom/Screen';
import { HeroBanner } from '@/components/custom/HeroBanner';
import { FadeInView } from '@/components/custom/FadeInView';
import { ScalePressable } from '@/components/custom/ScalePressable';
import {
  useAvailableTrainingShifts,
  useBookTrainingShift,
  useTrainingLocations,
} from '@/queries/useBookings';
import { ApiError } from '@/api/client';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';
import { formatHeroDate, toISODate } from '@/utils/date';
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
  const heroDate = formatHeroDate(date);

  const { data: locations = [], isLoading: loadingLocations } = useTrainingLocations();
  const [locationId, setLocationId] = useState<string | null>(null);
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [seat, setSeat] = useState<number | null>(null);

  const shiftsQuery = useAvailableTrainingShifts(date, locationId ?? '');
  const book = useBookTrainingShift();

  const shifts = shiftsQuery.data ?? [];
  const selectedLocation = useMemo(
    () => locations.find((item) => item.id === locationId) ?? null,
    [locations, locationId],
  );
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

  const step = !locationId ? 1 : !shiftId ? 2 : 3;
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
          Book Training
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
          <HeroBanner
            kicker={heroDate.weekday}
            title={heroDate.rest}
            subtitle="Pick a location, shift, and seat to confirm."
            icon="people-outline"
          />

          <View style={styles.steps}>
            <Step n={1} label="Location" active={step === 1} done={step > 1} />
            <View style={styles.stepLine} />
            <Step n={2} label="Shift" active={step === 2} done={step > 2} />
            <View style={styles.stepLine} />
            <Step n={3} label="Seat" active={step === 3} done={canConfirm} />
          </View>

          <View style={styles.formCard}>
            <SelectDropdown
              label="Location"
              required
              placeholder="Choose a location..."
              value={locationId}
              options={locationOptions}
              onChange={setLocationId}
              loading={loadingLocations}
              emptyMessage="No training locations available."
            />

            {locationId ? (
              shifts.length === 0 && !shiftsQuery.isLoading ? (
                <View style={styles.fieldBlock}>
                  <Text variant="bodySmall" style={styles.fieldLabel}>
                    Shift <Text color="danger">*</Text>
                  </Text>
                  <View style={styles.warningBox}>
                    <Ionicons name="warning" size={20} color={tokens.colors.warning} />
                    <Text variant="caption" color="textSecondary" style={styles.warningText}>
                      No practical training shifts are available for your allocated access type on
                      this date.
                    </Text>
                  </View>
                </View>
              ) : (
                <SelectDropdown
                  label="Shift"
                  required
                  placeholder="Choose a shift..."
                  value={shiftId}
                  options={shiftOptions}
                  onChange={setShiftId}
                  loading={shiftsQuery.isLoading}
                />
              )
            ) : null}

            {selectedShift && freeSeats.length > 0 ? (
              <View style={styles.fieldBlock}>
                <Text variant="bodySmall" style={styles.fieldLabel}>
                  Seat <Text color="danger">*</Text>
                </Text>
                <View style={styles.seatGrid}>
                  {freeSeats.map((n) => {
                    const selected = seat === n;
                    return (
                      <ScalePressable
                        key={n}
                        hapticStyle="select"
                        onPress={() => setSeat(n)}
                        style={[styles.seatChip, selected && styles.seatChipActive]}
                      >
                        <Text
                          variant="caption"
                          color={selected ? 'onSecondary' : 'textSecondary'}
                          style={styles.seatLabel}
                        >
                          {n}
                        </Text>
                      </ScalePressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>

          {selectedLocation && selectedShift && seat != null ? (
            <View style={styles.summary}>
              <Text variant="overline" color="textMuted">
                Booking summary
              </Text>
              <Text variant="bodySmall" style={styles.summaryTitle}>
                {selectedShift.name} · Seat {seat}
              </Text>
              <Text variant="caption" color="textSecondary">
                {selectedLocation.title} · {selectedShift.startTime} – {selectedShift.endTime}
              </Text>
            </View>
          ) : null}
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

function Step({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <View style={styles.step}>
      <View
        style={[
          styles.stepDot,
          active && styles.stepDotActive,
          done && styles.stepDotDone,
        ]}
      >
        {done ? (
          <Ionicons name="checkmark" size={12} color={tokens.colors.onPrimary} />
        ) : (
          <Text variant="caption" color={active ? 'onSecondary' : 'textMuted'} style={styles.stepN}>
            {n}
          </Text>
        )}
      </View>
      <Text
        variant="caption"
        color={active || done ? 'textPrimary' : 'textMuted'}
        style={styles.stepLabel}
      >
        {label}
      </Text>
    </View>
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
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
    paddingHorizontal: tokens.spacing.xs,
  },
  step: {
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: tokens.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: tokens.colors.secondary,
  },
  stepDotDone: {
    backgroundColor: tokens.colors.success,
  },
  stepN: {
    fontFamily: tokens.fontFamily.semibold,
  },
  stepLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  stepLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: tokens.colors.border,
    marginHorizontal: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },
  formCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.xl,
    ...tokens.shadows.sm,
  },
  fieldBlock: {
    gap: tokens.spacing.sm,
  },
  fieldLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  seatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  seatChip: {
    minWidth: 44,
    height: 44,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatChipActive: {
    backgroundColor: tokens.colors.secondary,
    borderColor: tokens.colors.secondary,
  },
  seatLabel: {
    fontFamily: tokens.fontFamily.semibold,
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
  summary: {
    marginTop: tokens.spacing.xl,
    backgroundColor: tokens.colors.tertiaryMuted,
    borderRadius: tokens.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.xs,
  },
  summaryTitle: {
    fontFamily: tokens.fontFamily.semibold,
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
