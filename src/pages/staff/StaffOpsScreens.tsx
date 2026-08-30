import { StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
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
import type { Agreement } from '@/api/staff';

export function InvoicesScreen() {
  const allowed = useHasPermission('view_invoices');
  const { data } = useInvoices();
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
    <StackScreen title="Invoices">
      {(data ?? []).length === 0 ? (
        <EmptyState icon="receipt-outline" message="No invoices yet." />
      ) : (
        (data ?? []).map((item) => (
          <EntityRow
            key={item.id}
            icon="receipt-outline"
            title={item.studentName}
            subtitle={item.issuedOn}
            badge={{
              label: `${item.amountLabel} · ${item.status}`,
              tone:
                item.status === 'paid'
                  ? 'success'
                  : item.status === 'overdue'
                    ? 'danger'
                    : 'warning',
            }}
          />
        ))
      )}
    </StackScreen>
  );
}

const AGREEMENT_FILTERS: (Agreement['status'] | 'all')[] = ['all', 'pending', 'signed', 'expired'];

export function AgreementsScreen() {
  const allowed = useHasPermission('view_agreements');
  const { data } = useAgreements();
  const [filter, setFilter] = useState<(typeof AGREEMENT_FILTERS)[number]>('all');
  const list =
    filter === 'all' ? (data ?? []) : (data ?? []).filter((item) => item.status === filter);

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
    <StackScreen title="Agreements">
      <View style={styles.filters}>
        {AGREEMENT_FILTERS.map((item) => (
          <ScalePressable
            key={item}
            haptic={false}
            onPress={() => setFilter(item)}
            style={filter === item ? styles.chipActive : styles.chip}
          >
            <Text variant="caption" color={filter === item ? 'onSecondary' : 'textSecondary'}>
              {item}
            </Text>
          </ScalePressable>
        ))}
      </View>
      {list.length === 0 ? (
        <EmptyState icon="document-attach-outline" message="No agreements match this filter." />
      ) : (
        list.map((item) => (
          <EntityRow
            key={item.id}
            icon="document-attach-outline"
            title={item.title}
            subtitle={item.studentName}
            meta={item.submittedOn}
            badge={{
              label: item.status,
              tone:
                item.status === 'signed'
                  ? 'success'
                  : item.status === 'pending'
                    ? 'warning'
                    : 'danger',
            }}
          />
        ))
      )}
    </StackScreen>
  );
}

export function BookingShiftsScreen() {
  const allowed = useHasPermission('view_shifts');
  const { data } = useShifts();
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
    <StackScreen title="Booking shifts">
      {(data ?? []).length === 0 ? (
        <EmptyState icon="time-outline" message="No shifts scheduled." />
      ) : (
        (data ?? []).map((item) => (
          <EntityRow
            key={item.id}
            icon="time-outline"
            title={item.staffName}
            subtitle={`${item.date} · ${item.startTime}–${item.endTime}`}
            meta={item.location}
          />
        ))
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
  const { data: closed = [] } = useClosedDays();
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
      {closed.length === 0 ? (
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
    backgroundColor: tokens.colors.surfaceAlt,
  },
  chipActive: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.secondary,
  },
  section: {
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
});
