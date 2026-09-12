import { FlatList, StyleSheet, View } from 'react-native';
import { useMemo, useState } from 'react';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { ScalePressable } from '@/components/custom/ScalePressable';
import {
  useInvoices,
  useAgreements,
  useShifts,
  useClosedDays,
  useCloseDay,
  useOpenDay,
} from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToastStore } from '@/store/useToastStore';
import { toISODate } from '@/utils/date';
import type { Agreement, Invoice } from '@/api/staff';
import type { RootStackScreenProps } from '@/navigation/types';

type InvoiceFilter = 'all' | Invoice['status'];
type AgreementFilter = 'all' | Agreement['status'];

const INVOICE_FILTERS: { key: InvoiceFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'due', label: 'Due' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paid', label: 'Paid' },
];

const AGREEMENT_FILTERS: { key: AgreementFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'signed', label: 'Signed' },
  { key: 'expired', label: 'Expired' },
];

export function InvoicesScreen({ navigation }: RootStackScreenProps<'Invoices'>) {
  const allowed = useHasPermission('view_invoices');
  const { data, isLoading } = useInvoices();
  const [filter, setFilter] = useState<InvoiceFilter>('all');
  const invoices = data ?? [];
  const visible = useMemo(
    () => (filter === 'all' ? invoices : invoices.filter((item) => item.status === filter)),
    [invoices, filter],
  );

  if (!allowed) {
    return (
      <StackScreen title="Invoices">
        <Text variant="body" color="textMuted">
          You do not have permission to view invoices.
        </Text>
      </StackScreen>
    );
  }
  return (
    <StackScreen title="Invoices" scroll={false}>
      <View style={styles.filters}>
        {INVOICE_FILTERS.map((item) => {
          const active = filter === item.key;
          const count =
            item.key === 'all'
              ? invoices.length
              : invoices.filter((row) => row.status === item.key).length;
          return (
            <ScalePressable
              key={item.key}
              haptic={false}
              onPress={() => setFilter(item.key)}
              style={active ? styles.chipActive : styles.chip}
            >
              <Text variant="caption" color={active ? 'onSecondary' : 'textSecondary'}>
                {item.label}
                {isLoading ? '' : ` · ${count}`}
              </Text>
            </ScalePressable>
          );
        })}
      </View>
      {isLoading ? (
        <EntityListSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          message={filter === 'all' ? 'No invoices yet.' : `No ${filter} invoices.`}
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <EntityRow
              icon="receipt-outline"
              title={item.studentName}
              subtitle={item.planName || item.issuedOn}
              meta={item.invoiceNumber ? `#${item.invoiceNumber}` : item.issuedOn}
              badge={{
                label: `${item.amountLabel} · ${item.status}`,
                tone:
                  item.status === 'paid'
                    ? 'success'
                    : item.status === 'overdue'
                      ? 'danger'
                      : 'warning',
              }}
              onPress={() =>
                navigation.navigate('InvoiceDetail', {
                  invoiceId: item.id,
                  studentName: item.studentName,
                  studentEmail: item.studentEmail,
                  amountLabel: item.amountLabel,
                  status: item.status,
                  issuedOn: item.issuedOn,
                  planName: item.planName,
                  invoiceNumber: item.invoiceNumber,
                  dueOn: item.dueOn,
                  paidOn: item.paidOn,
                  notes: item.notes,
                  installments: item.installments,
                })
              }
            />
          )}
        />
      )}
    </StackScreen>
  );
}

export function AgreementsScreen({ navigation }: RootStackScreenProps<'Agreements'>) {
  const allowed = useHasPermission('view_agreements');
  const { data, isLoading } = useAgreements();
  const [filter, setFilter] = useState<AgreementFilter>('all');
  const agreements = data ?? [];
  const list = useMemo(
    () => (filter === 'all' ? agreements : agreements.filter((item) => item.status === filter)),
    [agreements, filter],
  );

  if (!allowed) {
    return (
      <StackScreen title="Agreements">
        <Text variant="body" color="textMuted">
          You do not have permission to view agreements.
        </Text>
      </StackScreen>
    );
  }

  return (
    <StackScreen title="Agreements" scroll={false}>
      <View style={styles.filters}>
        {AGREEMENT_FILTERS.map((item) => {
          const active = filter === item.key;
          const count =
            item.key === 'all'
              ? agreements.length
              : agreements.filter((row) => row.status === item.key).length;
          return (
            <ScalePressable
              key={item.key}
              haptic={false}
              onPress={() => setFilter(item.key)}
              style={active ? styles.chipActive : styles.chip}
            >
              <Text variant="caption" color={active ? 'onSecondary' : 'textSecondary'}>
                {item.label}
                {isLoading ? '' : ` · ${count}`}
              </Text>
            </ScalePressable>
          );
        })}
      </View>
      {isLoading ? (
        <EntityListSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          icon="document-attach-outline"
          message={filter === 'all' ? 'No agreements yet.' : `No ${filter} agreements.`}
        />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <EntityRow
              icon="document-attach-outline"
              title={item.title}
              subtitle={item.studentName}
              meta={`${item.submittedOn}${item.artifacts?.length ? ` · ${item.artifacts.length} doc${item.artifacts.length === 1 ? '' : 's'}` : ''}`}
              badge={{
                label: item.statusLabel || item.status,
                tone:
                  item.status === 'signed'
                    ? 'success'
                    : item.status === 'pending'
                      ? 'warning'
                      : 'danger',
              }}
              onPress={() =>
                navigation.navigate('AgreementDetail', {
                  agreementId: item.id,
                  title: item.title,
                  studentName: item.studentName,
                  studentEmail: item.studentEmail,
                  status: item.status,
                  statusLabel: item.statusLabel,
                  submittedOn: item.submittedOn,
                  signedOn: item.signedOn,
                  expiresOn: item.expiresOn,
                  senderName: item.senderName,
                  deliveryMethod: item.deliveryMethod,
                  agreementType: item.agreementType,
                  artifacts: item.artifacts,
                })
              }
            />
          )}
        />
      )}
    </StackScreen>
  );
}

export function BookingShiftsScreen({ navigation }: RootStackScreenProps<'BookingShifts'>) {
  const allowed = useHasPermission('view_shifts');
  const dateOptions = useMemo(() => upcomingDates(7), []);
  const [iso, setIso] = useState(() => dateOptions[0] ?? toISODate(new Date()));
  const [filter, setFilter] = useState<'all' | 'active' | 'cancelled'>('all');
  const { data, isLoading } = useShifts(iso);
  const shifts = data ?? [];
  const visible = useMemo(
    () => (filter === 'all' ? shifts : shifts.filter((item) => item.status === filter)),
    [shifts, filter],
  );

  if (!allowed) {
    return (
      <StackScreen title="Shifts">
        <Text variant="body" color="textMuted">
          You do not have permission to view shifts.
        </Text>
      </StackScreen>
    );
  }
  return (
    <StackScreen title="Booking shifts" scroll={false}>
      <Text variant="bodySmall" color="textSecondary" style={styles.copy}>
        Practical training seats booked for each day.
      </Text>
      <View style={styles.filters}>
        {dateOptions.map((day) => (
          <ScalePressable
            key={day}
            haptic={false}
            onPress={() => setIso(day)}
            style={iso === day ? styles.chipActive : styles.chip}
          >
            <Text variant="caption" color={iso === day ? 'onSecondary' : 'textSecondary'}>
              {day === toISODate(new Date()) ? 'Today' : day.slice(5)}
            </Text>
          </ScalePressable>
        ))}
      </View>
      <View style={styles.filters}>
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'cancelled', label: 'Cancelled' },
          ] as const
        ).map((item) => {
          const active = filter === item.key;
          const count =
            item.key === 'all' ? shifts.length : shifts.filter((row) => row.status === item.key).length;
          return (
            <ScalePressable
              key={item.key}
              haptic={false}
              onPress={() => setFilter(item.key)}
              style={active ? styles.chipActive : styles.chip}
            >
              <Text variant="caption" color={active ? 'onSecondary' : 'textSecondary'}>
                {item.label}
                {isLoading ? '' : ` · ${count}`}
              </Text>
            </ScalePressable>
          );
        })}
      </View>
      {isLoading ? (
        <EntityListSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="time-outline"
          message={
            filter === 'all'
              ? 'No practical training bookings for this day.'
              : `No ${filter} shift bookings for this day.`
          }
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <EntityRow
              icon="time-outline"
              title={item.shiftName}
              subtitle={`${item.studentName}${item.seat != null ? ` · Seat ${item.seat}` : ''}`}
              meta={`${item.startTime}–${item.endTime} · ${item.location}`}
              badge={{
                label: item.attendance || item.statusLabel,
                tone:
                  item.status === 'cancelled'
                    ? 'danger'
                    : item.attendance
                      ? /absent/i.test(item.attendance)
                        ? 'danger'
                        : 'success'
                      : 'warning',
              }}
              onPress={() =>
                navigation.navigate('BookingShiftDetail', {
                  dayId: item.dayId,
                  bookingId: item.bookingId,
                  studentId: item.studentId,
                  studentName: item.studentName,
                  studentEmail: item.studentEmail,
                  shiftName: item.shiftName,
                  date: item.date,
                  startTime: item.startTime,
                  endTime: item.endTime,
                  location: item.location,
                  seat: item.seat,
                  status: item.status,
                  statusLabel: item.statusLabel,
                  attendance: item.attendance,
                  bookedAt: item.bookedAt,
                  bookedByName: item.bookedByName,
                  cancelledAt: item.cancelledAt,
                  isOverridden: item.isOverridden,
                })
              }
            />
          )}
        />
      )}
    </StackScreen>
  );
}

function upcomingDates(count: number): string[] {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return toISODate(date);
  });
}

export function CloseCalendarScreen() {
  const allowed = useHasPermission('close_calendar');
  const { data: closed = [], isLoading } = useClosedDays();
  const closeDay = useCloseDay();
  const openDay = useOpenDay();
  const showToast = useToastStore((state) => state.show);
  const dateOptions = upcomingDates(14);
  const [iso, setIso] = useState(() => dateOptions[0] ?? toISODate(new Date()));

  if (!allowed) {
    return (
      <StackScreen title="Close day">
        <Text variant="body" color="textMuted">
          You do not have permission to close calendar days.
        </Text>
      </StackScreen>
    );
  }

  return (
    <StackScreen title="Close calendar day">
      <Text variant="body" color="textSecondary" style={styles.copy}>
        Closed days cannot take new class or training bookings.
      </Text>
      <View style={styles.filters}>
        {dateOptions.map((day) => (
          <ScalePressable
            key={day}
            haptic={false}
            onPress={() => setIso(day)}
            style={iso === day ? styles.chipActive : styles.chip}
          >
            <Text variant="caption" color={iso === day ? 'onSecondary' : 'textSecondary'}>
              {day}
            </Text>
          </ScalePressable>
        ))}
      </View>
      <EntityRow
        icon="lock-closed-outline"
        title={closed.includes(iso) ? `${iso} is closed` : `${iso} is open`}
        subtitle="Tap to toggle"
        onPress={() => {
          if (closed.includes(iso)) {
            openDay.mutate(iso, { onSuccess: () => showToast('Day reopened', 'success') });
          } else {
            closeDay.mutate(iso, { onSuccess: () => showToast('Day closed', 'neutral') });
          }
        }}
      />
      <Text variant="title" style={styles.section}>
        Currently closed
      </Text>
      {isLoading ? (
        <EntityListSkeleton rows={3} />
      ) : closed.length === 0 ? (
        <Text variant="bodySmall" color="textMuted">
          No closed days.
        </Text>
      ) : (
        closed.map((day) => (
          <EntityRow key={day} icon="close-circle-outline" title={day} subtitle="Closed" />
        ))
      )}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  copy: {
    marginBottom: tokens.spacing.lg,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },
  chip: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
  },
  chipActive: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.secondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.secondary,
  },
  section: {
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  list: {
    paddingBottom: tokens.spacing.xl,
  },
});
