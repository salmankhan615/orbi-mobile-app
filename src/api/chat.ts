export interface ChatMessage {
  id: string;
  conversationId: string;
  text: string;
  fromMe: boolean;
  timestamp: number;
}

export interface Conversation {
  id: string;
  name: string;
  role: string;
  avatarInitial: string;
  online: boolean;
}

const conversations: Conversation[] = [
  {
    id: 'conv-arslan',
    name: 'Arslan M',
    role: 'Sage 50 Instructor',
    avatarInitial: 'A',
    online: true,
  },
  {
    id: 'conv-kiran',
    name: 'Kiran F',
    role: 'Taxation Instructor',
    avatarInitial: 'K',
    online: false,
  },
  {
    id: 'conv-support',
    name: 'KBM Support',
    role: 'Student Support',
    avatarInitial: 'S',
    online: true,
  },
];

const messages: Record<string, ChatMessage[]> = {
  'conv-arslan': [
    {
      id: 'm1',
      conversationId: 'conv-arslan',
      text: 'Hi! Just a reminder your Sage 50 session starts at 10 AM tomorrow.',
      fromMe: false,
      timestamp: Date.now() - 1000 * 60 * 60 * 3,
    },
    {
      id: 'm2',
      conversationId: 'conv-arslan',
      text: 'Thanks, I’ll be there!',
      fromMe: true,
      timestamp: Date.now() - 1000 * 60 * 60 * 2,
    },
  ],
  'conv-kiran': [
    {
      id: 'm3',
      conversationId: 'conv-kiran',
      text: 'Let me know if the taxation session recording is helpful.',
      fromMe: false,
      timestamp: Date.now() - 1000 * 60 * 60 * 24,
    },
  ],
  'conv-support': [
    {
      id: 'm4',
      conversationId: 'conv-support',
      text: 'Welcome to KBM! Let us know if you need anything.',
      fromMe: false,
      timestamp: Date.now() - 1000 * 60 * 60 * 48,
    },
  ],
};

const AUTO_REPLIES = [
  'Got it, thanks for the update!',
  'Sure, I’ll look into that and get back to you shortly.',
  'Sounds good — see you in the next session.',
  'Thanks for letting me know!',
];

function mockDelay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const chatApi = {
  listConversations: (): Promise<Conversation[]> => mockDelay(conversations),
  getConversation: (id: string): Promise<Conversation | undefined> =>
    mockDelay(conversations.find((c) => c.id === id)),
  listMessages: (conversationId: string): Promise<ChatMessage[]> =>
    mockDelay(messages[conversationId] ?? []),
  lastMessage: (conversationId: string): ChatMessage | undefined => {
    const thread = messages[conversationId];
    return thread?.[thread.length - 1];
  },
  sendMessage: async (conversationId: string, text: string): Promise<ChatMessage[]> => {
    const thread = messages[conversationId] ?? [];
    const outgoing: ChatMessage = {
      id: `m-${Date.now()}`,
      conversationId,
      text,
      fromMe: true,
      timestamp: Date.now(),
    };
    messages[conversationId] = [...thread, outgoing];
    await mockDelay(null, 200);

    // Simulate the other person replying, so the thread feels alive.
    const reply: ChatMessage = {
      id: `m-${Date.now() + 1}`,
      conversationId,
      text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
      fromMe: false,
      timestamp: Date.now() + 900,
    };
    setTimeout(() => {
      messages[conversationId] = [...(messages[conversationId] ?? []), reply];
    }, 900);

    return messages[conversationId];
  },
};
