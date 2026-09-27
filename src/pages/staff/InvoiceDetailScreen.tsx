import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { StackScreen } from '@/components/custom/StackScreen';
import { EntityRow } from '@/components/custom/EntityRow';
import { Spinner } from '@/components/ui/Spinner';
import { useInvoice } from '@/queries/useStaff';
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
  const params = route.params;
  const { data, isLoading } = useInvoice(params.invoiceId);

  const studentName = data?.studentName || params.studentName;
  const studentEmail = data?.studentEmail || params.studentEmail;
  const amountLabel = data?.amountLabel && data.amountLabel !== '—' ? data.amountLabel : params.amountLabel;
  const status = data?.status || params.status;
  const issuedOn = data?.issuedOn || params.issuedOn;
  const planName = data?.planName || params.planName;
  const invoiceNumber = data?.invoiceNumber || params.invoiceNumber;
  const dueOn = data?.dueOn || params.dueOn;
  const paidOn = data?.paidOn || params.paidOn;
  const notes = data?.notes || params.notes;
  const installments: InvoiceInstallment[] = data?.installments?.length
    ? data.installments
    : (params.installments ?? []);

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

      {isLoading && !data ? <Spinner label="Loading installments…" /> : null}

      <EntityRow icon="cash-outline" title="Amount" subtitle={amountLabel || '—'} />
      {invoiceNumber ? (
        <EntityRow icon="receipt-outline" title="Invoice number" subtitle={invoiceNumber} />
      ) : null}
      {planName ? <EntityRow icon="school-outline" title="Plan" subtitle={planName} /> : null}
      <EntityRow icon="calendar-outline" title="Issued" subtitle={issuedOn || '—'} />
      {dueOn ? <EntityRow icon="alarm-outline" title="Due" subtitle={dueOn} /> : null}
      {paidOn ? <EntityRow icon="checkmark-circle-outline" title="Paid" subtitle={paidOn} /> : null}
      {notes ? <EntityRow icon="document-text-outline" title="Notes" subtitle={notes} /> : null}

      <Text variant="title" style={styles.section}>
        Installments
      </Text>
      {installments.length > 0 ? (
        installments.map((item) => (
          <EntityRow
            key={item.id}
            icon="card-outline"
            title={item.label}
            subtitle={`${item.amountLabel}${item.dueDate ? ` · Due ${item.dueDate}` : ''}`}
            badge={{ label: item.status, tone: installmentTone(item.status) }}
          />
        ))
      ) : (
        <Text variant="caption" color="textMuted">
          {isLoading ? 'Loading installments…' : 'No installments on this invoice.'}
        </Text>
      )}
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
