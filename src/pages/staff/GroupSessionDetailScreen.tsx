import { FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { getGroupSessionAttendance } from '@/api/crm';
import { unwrapList } from '@/api/unwrap';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'GroupSessionDetail'>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

type AttendanceRow = {
  id: string;
  name: string;
  state: string;
  tone: 'success' | 'danger' | 'warning' | 'primary';
};

function attendanceLabel(raw: unknown): { state: string; tone: AttendanceRow['tone'] } {
  const value = str(raw);
  if (/absent/i.test(value)) return { state: 'Absent', tone: 'danger' };
  if (/present/i.test(value)) return { state: 'Present', tone: 'success' };
  if (/late/i.test(value)) return { state: 'Late', tone: 'warning' };
  return { state: 'Booked', tone: 'primary' };
}

function personName(raw: unknown): string {
  const row = asRecord(raw);
  if (!row) return '';
  return `${str(row.name, row.firstName)} ${str(row.lname, row.lastName)}`.trim() || str(row.email);
}

export function GroupSessionDetailScreen({ route }: Props) {
  const { groupId, classId, title, date, startTime, endTime, location } = route.params;
  const { data, isLoading } = useQuery({
    queryKey: ['staff', 'group-session', groupId, classId],
    queryFn: async () => {
      const raw = await getGroupSessionAttendance(groupId, classId);
      const payload = asRecord(asRecord(raw)?.data) ?? asRecord(raw) ?? {};
      const rows: AttendanceRow[] = [];
      for (const item of unwrapList(payload.booked ?? payload.bookedStudents)) {
        const row = asRecord(item);
        if (!row) continue;
        const student = asRecord(row.student) ?? asRecord(row.user) ?? row;
        const { state, tone } = attendanceLabel(row.attendance);
        rows.push({
          id: str(row._id, row.id, student._id, `b-${rows.length}`),
          name: personName(student) || 'Student',
          state,
          tone,
        });
      }
      for (const item of unwrapList(payload.notBooked ?? payload.notBookedStudents)) {
        const row = asRecord(item);
        if (!row) continue;
        const student = asRecord(row.student) ?? asRecord(row.user) ?? row;
        rows.push({
          id: str(row._id, row.id, student._id, `n-${rows.length}`),
          name: personName(student) || 'Student',
          state: 'Not booked',
          tone: 'primary',
        });
      }
      const bookedRows = rows.filter((row) => row.state !== 'Not booked');
      return {
        counts: {
          present: bookedRows.filter((row) => row.state === 'Present').length,
          absent: bookedRows.filter((row) => row.state === 'Absent').length,
          booked: bookedRows.length,
        },
        rows,
      };
    },
    staleTime: 30_000,
  });

  return (
    <StackScreen title={title || 'Session'} scroll={false}>
      <Text variant="bodySmall" color="textSecondary" style={styles.meta}>
        {date} · {startTime}–{endTime}
      </Text>
      <Text variant="caption" color="textMuted" style={styles.location}>
        {location || '—'}
      </Text>
      {isLoading ? (
        <EntityListSkeleton rows={4} />
      ) : (data?.rows ?? []).length === 0 ? (
        <EmptyState icon="people-outline" message="No attendance rows for this session." />
      ) : (
        <FlatList
          data={data?.rows ?? []}
          keyExtractor={(item) => item.id}
          initialNumToRender={12}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            data ? (
              <Text variant="caption" color="textMuted" style={styles.counts}>
                Present {data.counts.present} · Absent {data.counts.absent} · Booked{' '}
                {data.counts.booked}
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <EntityRow
              icon="person-outline"
              title={item.name}
              badge={{ label: item.state, tone: item.tone }}
            />
          )}
        />
      )}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  meta: {
    marginBottom: tokens.spacing.xs,
  },
  location: {
    marginBottom: tokens.spacing.lg,
  },
  counts: {
    marginBottom: tokens.spacing.md,
  },
  list: {
    paddingBottom: tokens.spacing.xl,
  },
});
