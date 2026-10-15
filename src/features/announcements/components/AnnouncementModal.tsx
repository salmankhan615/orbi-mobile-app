import { Modal, Pressable, StyleSheet, View, ScrollView } from 'react-native';
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
  /** Close without acknowledging (session dismiss). */
  onDismiss?: () => void;
}

export function AnnouncementModal({
  visible,
  announcement,
  onAcknowledge,
  onDismiss,
}: AnnouncementModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => onDismiss?.()}
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
            <View style={styles.headerRight}>
              {announcement.pinned ? <Badge label="Pinned" tone="warning" /> : null}
              {onDismiss ? (
                <Pressable
                  onPress={onDismiss}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close announcement"
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={22} color={tokens.colors.textSecondary} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator>
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
          </ScrollView>

          {announcement.isAcknowledged ? (
            <View style={styles.acknowledgedFooter}>
              <View style={styles.acknowledgedBanner}>
                <Ionicons name="checkmark-circle" size={18} color={tokens.colors.success} />
                <Text variant="bodySmall" color="success" style={styles.acknowledgedLabel}>
                  Already acknowledged
                </Text>
              </View>
              <Button
                label="Close"
                variant="outline"
                icon="close"
                onPress={() => onDismiss?.()}
                style={styles.acknowledgeButton}
              />
            </View>
          ) : (
            <Button
              label="I Acknowledge & Understand"
              onPress={onAcknowledge}
              style={styles.acknowledgeButton}
            />
          )}
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
    maxHeight: '80%',
    borderRadius: tokens.radius.xl,
    backgroundColor: tokens.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    flexDirection: 'column',
    ...tokens.shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surfaceMuted,
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
  scrollContent: {
    flexGrow: 1,
    marginBottom: tokens.spacing.lg,
    paddingRight: 4,
  },
  title: {
    marginBottom: 8,
    fontFamily: tokens.fontFamily.semibold,
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
  acknowledgedFooter: {
    gap: tokens.spacing.sm,
  },
  acknowledgedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.successMuted,
  },
  acknowledgedLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
});
