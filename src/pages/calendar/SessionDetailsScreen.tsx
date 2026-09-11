import { useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { Screen } from '@/components/custom/Screen';
import { Spinner } from '@/components/ui/Spinner';
import { FadeInView } from '@/components/custom/FadeInView';
import { sessionStatusBadge, type Session } from '@/api/sessions';
import { useSession } from '@/queries/useSessions';
import {
  useBookSlot,
  useCancelSessionBooking,
  useClassAvailability,
} from '@/queries/useBookings';
import { useAuthStore, displayName } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';
import { formatPortalDate, formatPortalTime, toISODate } from '@/utils/date';
import { smoothScrollProps } from '@/utils/scroll';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'SessionDetails'>;

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.detailRow}>
      <Text variant="bodySmall" color="textMuted" style={styles.detailLabel}>
        {label}
      </Text>
      <View style={styles.detailValue}>{children}</View>
    </View>
  );
}

function isActiveBooking(session: Session) {
  const mb = session.myBooking;
  if (!mb) return false;
  return !(mb.status ?? '').toLowerCase().includes('cancel');
}

function isPastSession(session: Session) {
  if (session.status === 'completed') return true;
  return session.date < toISODate(new Date());
}

export function SessionDetailsScreen({ route, navigation }: Props) {
  const { data: session, isLoading } = useSession(route.params.sessionId);

  if (isLoading || !session) {
    return (
      <Screen style={styles.loading}>
        <Spinner fill label="Loading session…" />
      </Screen>
    );
  }

  return <BookingDetailsContent session={session} onClose={() => navigation.goBack()} />;
}

function BookingDetailsContent({
  session,
  onClose,
}: {
  session: Session;
  onClose: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.show);
  const booked = isActiveBooking(session);
  const past = isPastSession(session);
  const canBook = !booked && !past && session.kind !== 'training';

  const availabilityQuery = useClassAvailability(session.id, canBook);
  const book = useBookSlot();
  const cancel = useCancelSessionBooking();

  const seats = useMemo(() => {
    const fromApi = availabilityQuery.data?.availableSeats;
    if (Array.isArray(fromApi)) {
      return fromApi.map(Number).filter((n) => Number.isFinite(n) && n > 0);
    }
    return session.availableSeats ?? [];
  }, [availabilityQuery.data, session.availableSeats]);

  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const effectiveSeat = selectedSeat ?? seats[0] ?? null;

  const statusBadge = sessionStatusBadge(session);
  const locationLabel =
    session.mode === 'Online' || session.joinUrl ? 'Online' : (session.location ?? '—');
  const dateLabel = formatPortalDate(session.date);
  const timeLabel = `${formatPortalTime(session.startTime)} - ${formatPortalTime(session.endTime)}`;

  async function openJoinLink() {
    if (!session.joinUrl) {
      showToast('No join link available', 'danger');
      return;
    }
    try {
      await Linking.openURL(session.joinUrl);
      haptics.success();
    } catch {
      showToast('Unable to open join link', 'danger');
    }
  }

  function handleConfirmBooking() {
    if (!user || effectiveSeat == null) return;
    book.mutate(
      { slotId: session.id, student: { id: user.id, name: displayName(user) }, seat: effectiveSeat },
      {
        onSuccess: () => {
          haptics.success();
          showToast('Booking successful', 'success');
        },
        onError: () => showToast('Could not book this class', 'danger'),
      },
    );
  }

  function handleCancelBooking() {
    Alert.alert('Cancel booking', 'This will free your seat for this class.', [
      { text: 'Keep booking', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: () => {
          cancel.mutate(session, {
            onSuccess: () => {
              haptics.warning();
              showToast('Booking cancelled', 'success');
            },
            onError: () => showToast('Could not cancel booking', 'danger'),
          });
        },
      },
    ]);
  }

  return (
    <Screen edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text variant="title" style={styles.headerTitle}>
          Booking Details
        </Text>
        <IconButton name="close" onPress={onClose} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        {...smoothScrollProps}
      >
        <FadeInView>
          <View style={styles.card}>
            {booked && session.joinUrl ? (
              <DetailRow label="Link">
                <Pressable onPress={openJoinLink}>
                  <Text variant="bodySmall" color="secondary" style={styles.link}>
                    Click to join.
                  </Text>
                </Pressable>
              </DetailRow>
            ) : null}

            <DetailRow label="Class">
              <Text variant="bodySmall">{session.title}</Text>
            </DetailRow>
            <DetailRow label="Location">
              <Text variant="bodySmall">{locationLabel}</Text>
            </DetailRow>
            <DetailRow label="Instructor">
              <Text variant="bodySmall">{session.instructor}</Text>
            </DetailRow>
            <DetailRow label="Date">
              <View style={styles.dateRow}>
                <Text variant="bodySmall">{dateLabel}</Text>
                {past && !booked ? (
                  <Text variant="caption" color="danger" style={styles.pastHint}>
                    (Past Event)
                  </Text>
                ) : null}
                <Badge label={statusBadge.label} tone={statusBadge.tone} />
              </View>
            </DetailRow>
            <DetailRow label="Time">
              <Text variant="bodySmall">{timeLabel}</Text>
            </DetailRow>

            {booked && session.myBooking?.seat != null ? (
              <DetailRow label="Your Seat">
                <Badge label={String(session.myBooking.seat)} tone="success" />
              </DetailRow>
            ) : null}
          </View>

          {booked ? (
            <View style={styles.confirmedBox}>
              <View style={styles.confirmedCopy}>
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={tokens.colors.success}
                />
                <View style={styles.confirmedText}>
                  <Text variant="bodySmall" style={styles.confirmedTitle}>
                    Booking Confirmed
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    You have successfully booked this class.
                  </Text>
                </View>
              </View>
              {!past ? (
                <Button
                  label="Cancel Booking"
                  variant="outline"
                  icon="close"
                  loading={cancel.isPending}
                  onPress={handleCancelBooking}
                  style={styles.cancelBtn}
                />
              ) : null}
            </View>
          ) : null}

          {past && !booked ? (
            <View style={styles.pastBox}>
              <Ionicons name="warning" size={20} color={tokens.colors.warning} />
              <View style={styles.pastText}>
                <Text variant="bodySmall" style={styles.pastTitle}>
                  Past Event
                </Text>
                <Text variant="caption" color="textSecondary">
                  This class has already occurred and cannot be booked.
                </Text>
              </View>
            </View>
          ) : null}

          {canBook ? (
            <View style={styles.seatSection}>
              <Text variant="bodySmall" style={styles.seatLabel}>
                Select Seat Number*
              </Text>
              {availabilityQuery.isLoading && seats.length === 0 ? (
                <Spinner />
              ) : seats.length === 0 ? (
                <Text variant="caption" color="textMuted">
                  No seats available for this class.
                </Text>
              ) : (
                <View style={styles.seatGrid}>
                  {seats.map((seat) => {
                    const selected = effectiveSeat === seat;
                    return (
                      <Pressable
                        key={seat}
                        onPress={() => setSelectedSeat(seat)}
                        style={[styles.seatChip, selected && styles.seatChipSelected]}
                      >
                        <Text
                          variant="caption"
                          color={selected ? 'onSecondary' : 'textPrimary'}
                          style={styles.seatChipLabel}
                        >
                          {seat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          ) : null}
        </FadeInView>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Close" icon="close" onPress={onClose} style={styles.footerBtn} />
        {canBook ? (
          <Button
            label="Confirm Booking"
            icon="checkmark"
            variant="secondary"
            disabled={effectiveSeat == null || seats.length === 0}
            loading={book.isPending}
            onPress={handleConfirmBooking}
            style={styles.footerBtn}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
    gap: tokens.spacing.sm,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxxl,
    gap: tokens.spacing.md,
  },
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.md,
  },
  detailLabel: {
    width: 88,
    fontFamily: tokens.fontFamily.medium,
  },
  detailValue: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  pastHint: {
    fontFamily: tokens.fontFamily.semibold,
  },
  link: {
    fontFamily: tokens.fontFamily.semibold,
    textDecorationLine: 'underline',
  },
  confirmedBox: {
    backgroundColor: tokens.colors.successMuted,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  confirmedCopy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.sm,
  },
  confirmedText: {
    flex: 1,
    gap: 2,
  },
  confirmedTitle: {
    fontFamily: tokens.fontFamily.semibold,
  },
  cancelBtn: {
    alignSelf: 'flex-start',
  },
  pastBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.sm,
    backgroundColor: tokens.colors.warningMuted,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
  },
  pastText: {
    flex: 1,
    gap: 2,
  },
  pastTitle: {
    fontFamily: tokens.fontFamily.semibold,
  },
  seatSection: {
    marginTop: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  seatLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  seatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  seatChip: {
    minWidth: 44,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    alignItems: 'center',
  },
  seatChipSelected: {
    backgroundColor: tokens.colors.secondary,
    borderColor: tokens.colors.secondary,
  },
  seatChipLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  footer: {
    flexDirection: 'row',
    padding: tokens.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.border,
    gap: tokens.spacing.sm,
  },
  footerBtn: {
    flex: 1,
  },
});
