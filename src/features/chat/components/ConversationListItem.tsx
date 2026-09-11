import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { FadeInView } from '@/components/custom/FadeInView';
import { staggerDelay } from '@/utils/formatters';
import { Avatar } from './Avatar';
import type { Conversation } from '@/api/chat';

interface ConversationListItemProps {
  conversation: Conversation;
  preview?: string;
  index?: number;
  onPress?: () => void;
}

export function ConversationListItem({
  conversation,
  preview,
  index = 0,
  onPress,
}: ConversationListItemProps) {
  return (
    <FadeInView delay={staggerDelay(index)}>
      <ScalePressable onPress={onPress} style={styles.card}>
        <Avatar initial={conversation.avatarInitial} online={conversation.online} size={48} />
        <View style={styles.body}>
          <View style={styles.top}>
            <Text variant="bodySmall" style={styles.name} numberOfLines={1}>
              {conversation.name}
            </Text>
            <Text
              variant="caption"
              color={conversation.online ? 'success' : 'textMuted'}
              style={styles.status}
            >
              {conversation.online ? 'Online' : 'Offline'}
            </Text>
          </View>
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {conversation.role}
          </Text>
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {preview ?? 'Tap to start a conversation'}
          </Text>
        </View>
      </ScalePressable>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
  },
  name: {
    flex: 1,
    fontFamily: tokens.fontFamily.semibold,
  },
  status: {
    fontFamily: tokens.fontFamily.medium,
  },
});
