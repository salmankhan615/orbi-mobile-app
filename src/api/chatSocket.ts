import { io, type Socket } from 'socket.io-client';
import { CHAT_BASE_URL, APP_VERSION } from '@/api/config';
import { getApiSession } from '@/api/client';

let socket: Socket | null = null;

/**
 * Initialize socket.io connection to the chat server.
 * Uses the ERP JWT access token for authentication.
 */
export function initChatSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  const { token } = getApiSession();
  if (!token) {
    throw new Error('No auth token available for chat socket');
  }

  socket = io(CHAT_BASE_URL, {
    auth: {
      token: `Bearer ${token}`,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket'],
    extraHeaders: {
      'X-App-Version': APP_VERSION,
    },
  });

  socket.on('connect', () => {
    console.log('[Chat] Connected to socket server');
  });

  socket.on('connect_error', (error) => {
    console.error('[Chat] Connection error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Chat] Disconnected:', reason);
  });

  return socket;
}

/**
 * Get the current socket instance without creating one.
 */
export function getChatSocket(): Socket | null {
  return socket;
}

/**
 * Close the chat socket connection.
 */
export function closeChatSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Emit a message to the chat server and listen for the response.
 */
export function emitChatEvent<T = unknown>(
  event: string,
  data?: unknown,
  timeout = 5000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error('Chat socket not connected'));
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error(`Chat event "${event}" timed out after ${timeout}ms`));
    }, timeout);

    socket.emit(event, data, (response: T) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
}

/**
 * Listen for chat events from the server.
 */
export function onChatEvent(event: string, callback: (data: unknown) => void): () => void {
  if (!socket) {
    throw new Error('Chat socket not initialized');
  }

  socket.on(event, callback);

  // Return unsubscribe function
  return () => {
    socket?.off(event, callback);
  };
}
