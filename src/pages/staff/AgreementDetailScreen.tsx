import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { StackScreen } from '@/components/custom/StackScreen';
import { EntityRow } from '@/components/custom/EntityRow';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'AgreementDetail'>;

export function AgreementDetailScreen({ route }: Props) {
  const { title, studentName, status, submittedOn } = route.params;

  return (
    <StackScreen title="Agreement">
      <Text variant="heading">{title}</Text>
      <View style={styles.badge}>
        <Badge
          label={status}
          tone={status === 'signed' ? 'success' : status === 'pending' ? 'warning' : 'danger'}
        />
      </View>
      <EntityRow icon="person-outline" title="Recipient" subtitle={studentName} />
      <EntityRow icon="calendar-outline" title="Submitted" subtitle={submittedOn} />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  badge: {
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
});
