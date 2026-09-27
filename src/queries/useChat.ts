import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatRestApi, onNewMessage, sendTypingIndicator, type ChatMessage } from '@/api/chat';

export const chatKeys = {
  conversations: ['conversations'] as const,
  messages: (conversationId: string) => ['conversations', conversationId, 'messages'] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations,
    queryFn: chatRestApi.listConversations,
    staleTime: 30_000, // 30 seconds
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversations', id],
    queryFn: () => chatRestApi.getConversation(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: () => chatRestApi.listMessages(conversationId),
    enabled: Boolean(conversationId),
    staleTime: 5_000, // 5 seconds
  });

  // Listen for new messages in real-time
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = onNewMessage(conversationId, (message) => {
      // Determine if this message is from the current user
      const messageWithFromMe: ChatMessage = {
        ...message,
        fromMe: false, // You may need to check this against the current user ID
        conversationId,
      };

      // Add message to cache
      queryClient.setQueryData(chatKeys.messages(conversationId), (old?: ChatMessage[]) => [
        ...(old ?? []),
        messageWithFromMe,
      ]);
    });

    return unsubscribe;
  }, [conversationId, queryClient]);

  return query;
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text: string) => chatRestApi.sendMessage(conversationId, text),
    onSuccess: (messages) => {
      queryClient.setQueryData(chatKeys.messages(conversationId), messages);
    },
  });
}

/**
 * Hook to send typing indicators as the user types.
 */
export function useTypingIndicator(conversationId: string) {
  return async (isTyping: boolean) => {
    try {
      await sendTypingIndicator(conversationId, isTyping);
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  };
}
