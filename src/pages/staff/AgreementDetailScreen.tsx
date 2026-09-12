import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { StackScreen } from '@/components/custom/StackScreen';
import { EntityRow } from '@/components/custom/EntityRow';
import { CourseworkFileChip } from '@/features/coursework/components/CourseworkFileChip';
import type { AgreementArtifact } from '@/api/staff';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'AgreementDetail'>;

export function AgreementDetailScreen({ route, navigation }: Props) {
  const {
    title,
    studentName,
    studentEmail,
    status,
    statusLabel,
    submittedOn,
    signedOn,
    expiresOn,
    senderName,
    deliveryMethod,
    agreementType,
    artifacts = [],
  } = route.params;

  return (
    <StackScreen title="Agreement">
      <Text variant="heading">{title}</Text>
      <View style={styles.badge}>
        <Badge
          label={statusLabel || status}
          tone={status === 'signed' ? 'success' : status === 'pending' ? 'warning' : 'danger'}
        />
      </View>

      <EntityRow icon="person-outline" title="Recipient" subtitle={studentName} />
      {studentEmail ? (
        <EntityRow icon="mail-outline" title="Email" subtitle={studentEmail} />
      ) : null}
      {senderName ? <EntityRow icon="send-outline" title="Sent by" subtitle={senderName} /> : null}
      {agreementType ? (
        <EntityRow icon="pricetag-outline" title="Type" subtitle={agreementType} />
      ) : null}
      {deliveryMethod ? (
        <EntityRow icon="swap-horizontal-outline" title="Delivery" subtitle={deliveryMethod} />
      ) : null}
      <EntityRow icon="calendar-outline" title="Created" subtitle={submittedOn || '—'} />
      {signedOn ? <EntityRow icon="create-outline" title="Signed" subtitle={signedOn} /> : null}
      {expiresOn ? (
        <EntityRow icon="hourglass-outline" title="Expires" subtitle={expiresOn} />
      ) : null}

      <Text variant="title" style={styles.section}>
        Documents
      </Text>
      {artifacts.length === 0 ? (
        <Text variant="bodySmall" color="textMuted">
          No signed documents attached yet.
        </Text>
      ) : (
        <View style={styles.files}>
          {artifacts.map((file: AgreementArtifact) => (
            <CourseworkFileChip
              key={file.id}
              file={file}
              onPress={() =>
                navigation.navigate('CourseworkFile', {
                  url: file.url,
                  filename: file.filename,
                  type: file.type,
                })
              }
            />
          ))}
        </View>
      )}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  badge: {
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  section: {
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  files: {
    gap: tokens.spacing.sm,
  },
});
