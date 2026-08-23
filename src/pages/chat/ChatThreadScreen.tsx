import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/custom/Screen';
import { Avatar } from '@/features/chat/components/Avatar';
import { MessageBubble } from '@/features/chat/components/MessageBubble';
import { useConversation, useMessages, useSendMessage } from '@/queries/useChat';
import { haptics } from '@/utils/haptics';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'ChatThread'>;

export function ChatThreadScreen({ route, navigation }: Props) {
  const { conversationId } = route.params;
  const { data: conversation } = useConversation(conversationId);
  const { data: messages } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    haptics.tap();
    sendMessage.mutate(text, {
      onSuccess: () =>
        requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true })),
    });
  }

  return (
    <Screen edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <IconButton name="arrow-back" onPress={() => navigation.goBack()} />
        {conversation && (
          <View style={styles.headerInfo}>
            <Avatar initial={conversation.avatarInitial} online={conversation.online} size={36} />
            <View>
              <Text variant="body" style={styles.headerName}>
                {conversation.name}
              </Text>
              <Text variant="caption" color={conversation.online ? 'success' : 'textMuted'}>
                {conversation.online ? 'Online' : conversation.role}
              </Text>
            </View>
          </View>
        )}
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <FlatList
          ref={listRef}
          data={messages ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          renderItem={({ item }) => <MessageBubble message={item} />}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputBar}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message..."
            placeholderTextColor={tokens.colors.textMuted}
            style={styles.input}
            multiline
          />
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim()}
            style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
          >
            <Ionicons name="arrow-up" size={18} color={tokens.colors.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {},
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border,
    gap: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  headerName: {
    fontFamily: tokens.fontFamily.semibold,
  },
  headerSpacer: {
    width: 36,
  },
  messages: {
    paddingHorizontal: tokens.spacing.screen,
    paddingVertical: tokens.spacing.lg,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.screen,
    paddingVertical: tokens.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: tokens.colors.surfaceMuted,
    borderRadius: tokens.radius.full,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    fontSize: tokens.fontSize.md,
    fontFamily: tokens.fontFamily.regular,
    color: tokens.colors.textPrimary,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.35,
  },
});
