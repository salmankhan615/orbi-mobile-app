import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { Screen } from '@/components/custom/Screen';
import { FadeInView } from '@/components/custom/FadeInView';
import { sessionStatusBadge } from '@/api/sessions';
import { useSession } from '@/queries/useSessions';
import { useSessionActions } from '@/features/calendar/useSessionActions';
import { smoothScrollProps } from '@/utils/scroll';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'SessionDetails'>;

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={tokens.colors.primary} />
      </View>
      <View style={styles.infoRowText}>
        <Text variant="caption" color="textMuted">
          {label}
        </Text>
        <Text variant="bodySmall">{value}</Text>
      </View>
    </View>
  );
}

export function SessionDetailsScreen({ route, navigation }: Props) {
  const { data: session, isLoading } = useSession(route.params.sessionId);

  if (isLoading || !session) {
    return (
      <Screen style={styles.loading}>
        <Text variant="body" color="textMuted">
          Loading…
        </Text>
      </Screen>
    );
  }

  return <SessionDetailsContent session={session} onBack={() => navigation.goBack()} />;
}

function SessionDetailsContent({
  session,
  onBack,
}: {
  session: NonNullable<ReturnType<typeof useSession>['data']>;
  onBack: () => void;
}) {
  const { join, isJoining, addToCalendar, isAddingToCalendar, addedToCalendar } =
    useSessionActions(session);
  const statusBadge = sessionStatusBadge(session);

  function handleShare() {
    Share.share({
      message: `${session.title} — ${session.date}, ${session.startTime} to ${session.endTime}. Code: ${session.code}`,
    });
  }

  return (
    <Screen edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <IconButton name="arrow-back" onPress={onBack} />
        <Text variant="title" style={styles.headerTitle}>
          Session Details
        </Text>
        <IconButton name="create-outline" onPress={handleShare} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        {...smoothScrollProps}
      >
        <FadeInView>
          <View style={styles.titleRow}>
            <Text variant="heading" style={styles.titleText}>
              {session.title}
            </Text>
            <Badge label={statusBadge.label} tone={statusBadge.tone} />
          </View>

          <View style={styles.infoCard}>
            <InfoRow icon="calendar-outline" label="Date" value={session.date} />
            <InfoRow
              icon="time-outline"
              label="Time"
              value={`${session.startTime} - ${session.endTime}`}
            />
            <InfoRow icon="pricetag-outline" label="ID" value={session.code} />
            <InfoRow icon="person-outline" label="Instructor" value={session.instructor} />
            <InfoRow
              icon={session.mode === 'Online' ? 'videocam-outline' : 'location-outline'}
              label="Mode"
              value={session.mode === 'Online' ? 'Online' : (session.location ?? 'In-Person')}
            />
          </View>

          <Text variant="title" style={styles.sectionTitle}>
            Description
          </Text>
          <Text variant="body" color="textSecondary">
            {session.description}
          </Text>

          {session.attachments.length > 0 && (
            <>
              <Text variant="title" style={styles.sectionTitle}>
                Attachments
              </Text>
              {session.attachments.map((attachment) => (
                <View key={attachment.id} style={styles.attachment}>
                  <View style={styles.pdfIcon}>
                    <Ionicons name="document-text" size={18} color={tokens.colors.danger} />
                  </View>
                  <View style={styles.attachmentBody}>
                    <Text variant="bodySmall">{attachment.name}</Text>
                    <Text variant="caption" color="textMuted">
                      {attachment.sizeLabel}
                    </Text>
                  </View>
                  <Ionicons name="download-outline" size={20} color={tokens.colors.primary} />
                </View>
              ))}
            </>
          )}
        </FadeInView>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={session.mode === 'Online' ? 'Join Session' : 'Get Directions'}
          icon={session.mode === 'Online' ? 'videocam' : 'navigate'}
          loading={isJoining}
          onPress={join}
        />
        <Button
          label={addedToCalendar ? 'Added to Calendar ✓' : 'Add to Calendar'}
          icon="calendar-outline"
          variant="outline"
          disabled={addedToCalendar}
          loading={isAddingToCalendar}
          onPress={addToCalendar}
          style={styles.secondaryButton}
        />
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  titleText: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRowText: {
    flex: 1,
  },
  sectionTitle: {
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.xs,
  },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  pdfIcon: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.dangerMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentBody: {
    flex: 1,
  },
  footer: {
    padding: tokens.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.border,
    gap: tokens.spacing.sm,
  },
  secondaryButton: {
    marginTop: 0,
  },
});
