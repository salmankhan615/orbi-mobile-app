import { apiClient } from '@/api/client';
import { CHAT_BASE_URL, APP_VERSION } from '@/api/config';
import { initChatSocket, getChatSocket, emitChatEvent, onChatEvent } from '@/api/chatSocket';
import { getApiSession } from '@/api/client';

export interface ChatMessage {
  _id?: string;
  id?: string;
  conversationId?: string;
  conversation?: string;
  text: string;
  sender?: {
    _id: string;
    name: string;
    firstName?: string;
    lastName?: string;
  };
  senderId?: string;
  fromMe: boolean;
  timestamp?: number;
  createdAt?: string;
  seen?: boolean;
  seenAt?: string;
}

export interface User {
  _id: string;
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  type?: string;
  companyId?: string;
}

export interface Conversation {
  _id?: string;
  id?: string;
  name?: string;
  displayName?: string;
  participants?: User[];
  users?: string[];
  lastMessage?: ChatMessage;
  createdAt?: string;
  updatedAt?: string;
  role?: string;
  avatarInitial?: string;
  online?: boolean;
}

/**
 * REST API endpoints for chat operations.
 */
export const chatRestApi = {
  /**
   * Fetch all conversations for the current user.
   */
  async listConversations(): Promise<Conversation[]> {
    try {
      const response = await fetch(`${CHAT_BASE_URL}/api/conversation/all`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${getApiSession().token}`,
          'X-App-Version': APP_VERSION,
        },
      });

      if (!response.ok) {
        console.error('[Chat] Response status:', response.status, response.statusText);
        const text = await response.text();
        console.error('[Chat] Response body:', text.substring(0, 200));
        throw new Error(`Failed to fetch conversations: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('[Chat] Invalid content type:', contentType);
        console.error('[Chat] Response body:', text.substring(0, 200));
        return [];
      }

      const data = (await response.json()) as Conversation[];
      return data || [];
    } catch (error) {
      console.error('[Chat] Failed to list conversations:', error);
      return []; // Return empty array instead of throwing
    }
  },

  /**
   * Get a single conversation by ID.
   */
  async getConversation(id: string): Promise<Conversation | undefined> {
    try {
      const conversations = await chatRestApi.listConversations();
      return conversations.find((c) => c._id === id || c.id === id);
    } catch (error) {
      console.error('[Chat] Failed to get conversation:', error);
      return undefined; // Return undefined instead of throwing
    }
  },

  /**
   * Fetch message history for a conversation.
   */
  async listMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const response = await fetch(
        `${CHAT_BASE_URL}/api/conversation/${conversationId}/messages`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${getApiSession().token}`,
            'X-App-Version': APP_VERSION,
          },
        },
      );

      if (!response.ok) {
        console.error('[Chat] Response status:', response.status, response.statusText);
        const text = await response.text();
        console.error('[Chat] Response body:', text.substring(0, 200));
        return [];
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('[Chat] Invalid content type:', contentType);
        console.error('[Chat] Response body:', text.substring(0, 200));
        return [];
      }

      const data = (await response.json()) as ChatMessage[];
      // Ensure messages have consistent ID format
      return (data || []).map((msg) => ({
        ...msg,
        id: msg._id || msg.id,
        conversationId: msg.conversation || conversationId,
      }));
    } catch (error) {
      console.error('[Chat] Failed to list messages:', error);
      return []; // Return empty array instead of throwing
    }
  },

  /**
   * Get the last message in a conversation.
   */
  lastMessage: (conversationId: string): ChatMessage | undefined => {
    // This is called synchronously, so we cannot make async requests
    // In the real app, this should be stored in query cache
    return undefined;
  },

  /**
   * Send a message to a conversation.
   */
  async sendMessage(conversationId: string, text: string): Promise<ChatMessage[]> {
    try {
      const socket = getChatSocket();

      if (!socket?.connected) {
        // Fallback to REST if socket not connected
        try {
          const response = await fetch(`${CHAT_BASE_URL}/api/message/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${getApiSession().token}`,
              'X-App-Version': APP_VERSION,
            },
            body: JSON.stringify({
              conversation_id: conversationId,
              text,
            }),
          });

          if (!response.ok) {
            console.error('[Chat] Send failed:', response.status, response.statusText);
            return [];
          }

          // Return updated message list after send
          return chatRestApi.listMessages(conversationId);
        } catch (error) {
          console.error('[Chat] Failed to send via REST:', error);
          return [];
        }
      }

      // Use socket.io for real-time send
      try {
        await emitChatEvent('sendMessage', {
          conversationId,
          text,
        });

        // Return updated message list
        return chatRestApi.listMessages(conversationId);
      } catch (error) {
        console.error('[Chat] Failed to send via socket:', error);
        return [];
      }
    } catch (error) {
      console.error('[Chat] Failed to send message:', error);
      return []; // Return empty array instead of throwing
    }
  },
};

/**
 * Initialize chat and return the API instance.
 * Call this once when the auth flow completes.
 */
export function initChat(): void {
  try {
    initChatSocket();
  } catch (error) {
    console.error('[Chat] Failed to initialize:', error);
    // Don't throw — chat is optional, the app works without it
  }
}

/**
 * Close chat connection on logout.
 */
export function closeChat(): void {
  const socket = getChatSocket();
  if (socket) {
    socket.disconnect();
  }
}

/**
 * Listen for new messages in real-time.
 */
export function onNewMessage(
  conversationId: string,
  callback: (message: ChatMessage) => void,
): () => void {
  return onChatEvent(`message:${conversationId}`, (data) => {
    if (typeof data === 'object' && data !== null) {
      callback(data as ChatMessage);
    }
  });
}

/**
 * Listen for typing indicators.
 */
export function onUserTyping(
  conversationId: string,
  callback: (data: { userId: string; isTyping: boolean }) => void,
): () => void {
  return onChatEvent(`typing:${conversationId}`, (data) => {
    if (typeof data === 'object' && data !== null) {
      callback(data as { userId: string; isTyping: boolean });
    }
  });
}

/**
 * Emit a typing indicator.
 */
export async function sendTypingIndicator(
  conversationId: string,
  isTyping: boolean,
): Promise<void> {
  try {
    const socket = getChatSocket();
    if (socket?.connected) {
      socket.emit('typing', { conversationId, isTyping });
    }
  } catch (error) {
    console.error('[Chat] Failed to send typing indicator:', error);
  }
}

// For backward compatibility with existing code
export const chatApi = chatRestApi;
