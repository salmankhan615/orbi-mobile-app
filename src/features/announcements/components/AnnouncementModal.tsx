import { Modal, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Announcement } from '@/api/announcements';

interface AnnouncementModalProps {
  visible: boolean;
  announcement: Announcement;
  onAcknowledge: () => void;
  /** Lets already-acknowledged alerts close without posting again. */
  onDismiss?: () => void;
}

export function AnnouncementModal({
  visible,
  announcement,
  onAcknowledge,
  onDismiss,
}: AnnouncementModalProps) {
  const alreadyRead = Boolean(announcement.isAcknowledged);
  const close = alreadyRead ? (onDismiss ?? onAcknowledge) : onAcknowledge;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={alreadyRead ? close : () => {}}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.iconChip}>
                <Ionicons name="megaphone-outline" size={16} color={tokens.colors.tertiary} />
              </View>
              <Text variant="bodySmall" color="textSecondary" style={styles.headerLabel}>
                Announcement
              </Text>
            </View>
            {announcement.pinned ? <Badge label="Pinned" tone="warning" /> : null}
          </View>

          <Text variant="title" style={styles.title}>
            {announcement.title}
          </Text>
          <Text variant="caption" color="textMuted" style={styles.meta}>
            {new Date(announcement.createdAt).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
            })}{' '}
            · {announcement.author}
          </Text>
          <Text variant="body" color="textSecondary" style={styles.message}>
            {announcement.body}
          </Text>

          <Button
            label={alreadyRead ? 'Close' : 'I Acknowledge & Understand'}
            variant={alreadyRead ? 'outline' : 'primary'}
            onPress={close}
            style={styles.acknowledgeButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.overlay,
    padding: tokens.spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: tokens.radius.xl,
    backgroundColor: tokens.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    ...tokens.shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  iconChip: {
    width: 28,
    height: 28,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.tertiaryMuted,
  },
  headerLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  title: {
    marginBottom: 4,
  },
  meta: {
    marginBottom: tokens.spacing.md,
  },
  message: {
    lineHeight: tokens.lineHeight.md,
    marginBottom: tokens.spacing.lg,
  },
  acknowledgeButton: {
    width: '100%',
  },
});
