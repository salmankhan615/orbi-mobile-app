import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { StackScreen } from '@/components/custom/StackScreen';
import { Spinner } from '@/components/ui/Spinner';
import { EntityRow } from '@/components/custom/EntityRow';
import { getCrmUserById } from '@/api/crm';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'UserDetail'>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function UserDetailScreen({ route }: Props) {
  const { userId, name: fallbackName, email: fallbackEmail, role, status } = route.params;
  const { data, isLoading } = useQuery({
    queryKey: ['staff', 'user', userId],
    queryFn: async () => {
      const raw = await getCrmUserById(userId);
      return asRecord(asRecord(raw)?.data) ?? asRecord(raw) ?? {};
    },
    staleTime: 60_000,
  });

  if (isLoading && !data) {
    return (
      <StackScreen title="User">
        <Spinner fill label="Loading user…" />
      </StackScreen>
    );
  }

  const first = str(data?.name, data?.firstName, fallbackName);
  const last = str(data?.lname, data?.lastName);
  const fullName = `${first} ${last}`.trim() || fallbackName || 'User';
  const email = str(data?.email, fallbackEmail) || '—';
  const phone = str(data?.mobile, data?.phone) || '—';
  const type = str(data?.type, data?.role, role) || '—';
  const userStatus = str(data?.status, status) || '—';
  const country = str(data?.country) || '—';

  return (
    <StackScreen title="User">
      <Text variant="heading">{fullName}</Text>
      <View style={styles.badges}>
        <Badge label={type} tone="primary" />
        <Badge label={userStatus} tone={/active/i.test(userStatus) ? 'success' : 'warning'} />
      </View>
      <EntityRow icon="mail-outline" title="Email" subtitle={email} />
      <EntityRow icon="call-outline" title="Phone" subtitle={phone} />
      <EntityRow icon="globe-outline" title="Country" subtitle={country} />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
});
