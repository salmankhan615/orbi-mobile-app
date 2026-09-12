import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { StackScreen } from '@/components/custom/StackScreen';
import { EntityRow } from '@/components/custom/EntityRow';
import type { InvoiceInstallment } from '@/api/staff';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'InvoiceDetail'>;

function installmentTone(status: string): 'success' | 'danger' | 'warning' | 'neutral' {
  const value = status.toLowerCase();
  if (value.includes('paid') || value.includes('complete')) return 'success';
  if (value.includes('overdue') || value.includes('late')) return 'danger';
  if (value.includes('due') || value.includes('pending')) return 'warning';
  return 'neutral';
}

export function InvoiceDetailScreen({ route }: Props) {
  const {
    studentName,
    studentEmail,
    amountLabel,
    status,
    issuedOn,
    planName,
    invoiceNumber,
    dueOn,
    paidOn,
    notes,
    installments = [],
  } = route.params;

  return (
    <StackScreen title="Invoice">
      <Text variant="heading">{studentName}</Text>
      {studentEmail ? (
        <Text variant="bodySmall" color="textSecondary" style={styles.email}>
          {studentEmail}
        </Text>
      ) : null}
      <View style={styles.badge}>
        <Badge
          label={status}
          tone={status === 'paid' ? 'success' : status === 'overdue' ? 'danger' : 'warning'}
        />
      </View>

      <EntityRow icon="cash-outline" title="Amount" subtitle={amountLabel} />
      {invoiceNumber ? (
        <EntityRow icon="receipt-outline" title="Invoice number" subtitle={invoiceNumber} />
      ) : null}
      {planName ? <EntityRow icon="school-outline" title="Plan" subtitle={planName} /> : null}
      <EntityRow icon="calendar-outline" title="Issued" subtitle={issuedOn || '—'} />
      {dueOn ? <EntityRow icon="alarm-outline" title="Due" subtitle={dueOn} /> : null}
      {paidOn ? <EntityRow icon="checkmark-circle-outline" title="Paid" subtitle={paidOn} /> : null}
      {notes ? <EntityRow icon="document-text-outline" title="Notes" subtitle={notes} /> : null}

      {installments.length > 0 ? (
        <>
          <Text variant="title" style={styles.section}>
            Installments
          </Text>
          {installments.map((item: InvoiceInstallment) => (
            <EntityRow
              key={item.id}
              icon="card-outline"
              title={item.label}
              subtitle={`${item.amountLabel}${item.dueDate ? ` · Due ${item.dueDate}` : ''}`}
              badge={{ label: item.status, tone: installmentTone(item.status) }}
            />
          ))}
        </>
      ) : null}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  email: {
    marginTop: tokens.spacing.sm,
  },
  badge: {
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  section: {
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
});
