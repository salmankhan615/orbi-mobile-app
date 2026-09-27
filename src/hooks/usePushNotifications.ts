import { useEffect, useCallback } from 'react';
import {
  initializePushNotifications,
  registerPushToken,
  setPushTokenUpdateHandler,
  createNotificationChannels,
} from '@/services/pushNotifications';

/**
 * Set up push notifications when user logs in.
 * Handles token registration and renewal.
 * Document: Area 3 - Push notifications
 */
export function usePushNotifications(accessToken: string | null, isLoggedIn: boolean) {
  const handlePushTokenUpdate = useCallback(
    async (newToken: string) => {
      if (!accessToken) return;

      try {
        console.log('[Push] Re-registering with new token...');
        await registerPushToken(accessToken);
        console.log('[Push] ✓ Re-registered');
      } catch (error) {
        console.error('[Push] Re-registration failed:', error);
      }
    },
    [accessToken],
  );

  // Initialize push notifications
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setup = async () => {
      try {
        // Create Android notification channels
        await createNotificationChannels();

        // Initialize push handler
        cleanup = await initializePushNotifications();

        if (isLoggedIn && accessToken) {
          // Register push token on login
          const tokenCleanup = await registerPushToken(accessToken);
          cleanup = () => {
            tokenCleanup?.();
          };

          // Set up handler for token updates
          setPushTokenUpdateHandler(handlePushTokenUpdate);
        }
      } catch (error) {
        console.error('[Push] Setup error:', error);
      }
    };

    setup();

    return () => {
      cleanup?.();
      setPushTokenUpdateHandler(null);
    };
  }, [isLoggedIn, accessToken, handlePushTokenUpdate]);
}
