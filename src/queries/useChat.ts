import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/api/chat';

export const chatKeys = {
  conversations: ['conversations'] as const,
  messages: (conversationId: string) => ['conversations', conversationId, 'messages'] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations,
    queryFn: chatApi.listConversations,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversations', id],
    queryFn: () => chatApi.getConversation(id),
    enabled: Boolean(id),
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: () => chatApi.listMessages(conversationId),
    enabled: Boolean(conversationId),
    // Short poll so the simulated auto-reply shows up without a manual refresh.
    refetchInterval: 1500,
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text: string) => chatApi.sendMessage(conversationId, text),
    onSuccess: (messages) => {
      queryClient.setQueryData(chatKeys.messages(conversationId), messages);
    },
  });
}
