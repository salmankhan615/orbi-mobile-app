import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { StackScreen } from '@/components/custom/StackScreen';
import { EntityRow } from '@/components/custom/EntityRow';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'InvoiceDetail'>;

export function InvoiceDetailScreen({ route }: Props) {
  const { studentName, amountLabel, status, issuedOn } = route.params;

  return (
    <StackScreen title="Invoice">
      <Text variant="heading">{studentName}</Text>
      <View style={styles.badge}>
        <Badge
          label={status}
          tone={status === 'paid' ? 'success' : status === 'overdue' ? 'danger' : 'warning'}
        />
      </View>
      <EntityRow icon="cash-outline" title="Amount" subtitle={amountLabel} />
      <EntityRow icon="calendar-outline" title="Issued" subtitle={issuedOn} />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  badge: {
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
});
