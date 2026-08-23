import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/custom/Screen';
import { useConversations } from '@/queries/useChat';
import { ConversationListItem } from '@/features/chat/components/ConversationListItem';
import { chatApi } from '@/api/chat';
import type { MainTabScreenProps } from '@/navigation/types';

type Props = MainTabScreenProps<'Chat'>;

export function ChatListScreen({ navigation }: Props) {
  const { data: conversations } = useConversations();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const list = conversations ?? [];
    if (!query.trim()) return list;
    const needle = query.trim().toLowerCase();
    return list.filter(
      (c) => c.name.toLowerCase().includes(needle) || c.role.toLowerCase().includes(needle),
    );
  }, [conversations, query]);

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text variant="heading">Messages</Text>
          <Text variant="bodySmall" color="textSecondary">
            Instructors and support
          </Text>
        </View>
        <IconButton name="create-outline" background="surface" />
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={tokens.colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search conversations"
          placeholderTextColor={tokens.colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={28} color={tokens.colors.textMuted} />
            </View>
            <Text variant="bodySmall" color="textMuted">
              No conversations yet
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <ConversationListItem
            conversation={item}
            preview={chatApi.lastMessage(item.id)?.text}
            index={index}
            onPress={() => navigation.navigate('ChatThread', { conversationId: item.id })}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.lg,
  },
  headerCopy: {
    gap: tokens.spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.md,
    height: 48,
    marginBottom: tokens.spacing.lg,
    ...tokens.shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: tokens.fontSize.md,
    fontFamily: tokens.fontFamily.regular,
    color: tokens.colors.textPrimary,
    padding: 0,
  },
  list: {
    paddingBottom: tokens.spacing.xxxl,
  },
  empty: {
    alignItems: 'center',
    paddingTop: tokens.spacing.xxxl,
    gap: tokens.spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
