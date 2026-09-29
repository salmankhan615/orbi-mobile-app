import { useEffect, useRef } from 'react';
import { getApiSession } from '@/api/client';
import { tokenManager } from '@/store/tokenManager';
import {
  initializePushNotifications,
  registerPushToken,
  setPushTokenUpdateHandler,
  createNotificationChannels,
} from '@/services/pushNotifications';
import {
  startPushNotificationPolling,
  stopPushNotificationPolling,
} from '@/services/pushNotificationHandler';

async function resolveAccessToken(): Promise<string | null> {
  const fromSession = getApiSession().token;
  if (fromSession) return fromSession;
  return tokenManager.getAccessToken();
}

/**
 * Set up push notifications whenever the user is authenticated.
 * Handles token registration, renewal, and announcement polling.
 * Document: Area 3 - Push notifications
 */
export function usePushNotifications(isLoggedIn: boolean) {
  const registeredForToken = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      if (!isLoggedIn) {
        stopPushNotificationPolling();
        registeredForToken.current = null;
        setPushTokenUpdateHandler(null);
        return;
      }

      try {
        await createNotificationChannels();
        await initializePushNotifications();

        const accessToken = await resolveAccessToken();
        if (!accessToken || cancelled) {
          console.warn('[Push] No access token available after login');
          return;
        }

        setPushTokenUpdateHandler(async () => {
          const token = await resolveAccessToken();
          if (!token) return;
          await registerPushToken(token);
        });

        if (registeredForToken.current !== accessToken) {
          const expoToken = await registerPushToken(accessToken);
          if (expoToken) {
            registeredForToken.current = accessToken;
          }
        }

        if (!cancelled) {
          startPushNotificationPolling(accessToken);
        }
      } catch (error) {
        console.error('[Push] Setup error:', error);
      }
    };

    void setup();

    return () => {
      cancelled = true;
      stopPushNotificationPolling();
      setPushTokenUpdateHandler(null);
    };
  }, [isLoggedIn]);
}
