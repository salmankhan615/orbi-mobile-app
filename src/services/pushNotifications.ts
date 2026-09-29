import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { pushDevicesApi } from '@/api/pushDevices';
import { getDeviceInfo } from '@/api/deviceInfo';

let pushTokenUpdateHandler: ((token: string) => Promise<void>) | null = null;
let notificationHandler: ((notification: Notifications.Notification) => void) | null = null;
let initialized = false;
let responseSubscription: Notifications.EventSubscription | null = null;
let tokenSubscription: Notifications.EventSubscription | null = null;

function getEasProjectId(): string | undefined {
  return (
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    undefined
  );
}

/**
 * Initialize push notifications once for the app lifetime.
 * Document: Area 3 - Push notifications
 */
export async function initializePushNotifications() {
  try {
    if (initialized) {
      console.log('[Push] Already initialized');
      return;
    }

    console.log('[Push] Initializing...');

    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        console.log('[Push] Notification received:', notification);
        notificationHandler?.(notification);
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });

    responseSubscription?.remove();
    responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[Push] Notification tapped:', response.notification);
      handleNotificationTapped(response.notification);
    });

    const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
    if (lastNotificationResponse) {
      console.log('[Push] App opened from notification:', lastNotificationResponse.notification);
      handleNotificationTapped(lastNotificationResponse.notification);
    }

    initialized = true;
    console.log('[Push] ✓ Initialized');
  } catch (error) {
    console.error('[Push] Initialization error:', error);
    throw error;
  }
}

/**
 * Register or update push token with the backend.
 * Document: Call PUT /devices after every login and whenever Expo hands a changed token
 */
export async function registerPushToken(accessToken: string): Promise<string | null> {
  try {
    if (!accessToken) {
      console.warn('[Push] No access token for registration');
      return null;
    }

    if (!Device.isDevice) {
      console.warn('[Push] Push tokens require a physical device');
      return null;
    }

    // Android 8+: channel must exist before the permission prompt on some devices
    await createNotificationChannels();

    console.log('[Push] Requesting permission...');
    const permission = await Notifications.getPermissionsAsync();
    let granted = permission.granted || permission.status === 'granted';
    if (!granted) {
      const requested = await Notifications.requestPermissionsAsync();
      granted = requested.granted || requested.status === 'granted';
    }
    if (!granted) {
      console.warn('[Push] Notification permission denied');
      return null;
    }

    const projectId = getEasProjectId();
    if (!projectId) {
      console.error('[Push] Missing EAS projectId — cannot fetch Expo push token');
      return null;
    }

    console.log('[Push] Getting push token for project', projectId);
    const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = pushToken.data;
    console.log('[Push] Token obtained:', token.substring(0, 24) + '...');

    const device = await getDeviceInfo();
    console.log('[Push] Registering device with backend...');
    await pushDevicesApi.register(token, accessToken, {
      expoPushToken: token,
      deviceId: device.deviceId,
      platform: device.platform,
      appVersion: device.appVersion,
      deviceName: device.deviceName,
      osVersion: device.osVersion,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
    });
    console.log('[Push] ✓ Token registered successfully');

    tokenSubscription?.remove();
    tokenSubscription = Notifications.addPushTokenListener((deviceToken) => {
      const newToken = typeof deviceToken.data === 'string' ? deviceToken.data : null;
      if (!newToken) return;
      console.log('[Push] Native push token changed — re-fetching Expo token');
      void (async () => {
        try {
          const refreshed = await Notifications.getExpoPushTokenAsync({ projectId });
          await pushTokenUpdateHandler?.(refreshed.data);
        } catch (error) {
          console.error('[Push] Token refresh failed:', error);
        }
      })();
    });

    return token;
  } catch (error) {
    console.error('[Push] Registration error:', error);
    return null;
  }
}

/**
 * Set handler for push token updates (Expo token string).
 */
export function setPushTokenUpdateHandler(
  handler: ((token: string) => Promise<void>) | null,
) {
  pushTokenUpdateHandler = handler;
}

/**
 * Set handler for incoming notifications while the app is running.
 */
export function setNotificationHandler(
  handler: ((notification: Notifications.Notification) => void) | null,
) {
  notificationHandler = handler;
}

/**
 * Handle notification tapped — deep-link based on data.type.
 */
function handleNotificationTapped(notification: Notifications.Notification) {
  const data = notification.request.content.data as Record<string, unknown> | undefined;
  console.log('[Push] Handling tap, type:', data?.type);

  switch (data?.type) {
    case 'chat.message':
    case 'announcement':
    case 'class.reminder':
    case 'booking.reminder':
    case 'course.nudge':
      // Navigation is wired from app screens; keep logging for now.
      break;
    default:
      console.log('[Push] Unknown notification type');
  }
}

/**
 * Create Android notification channels (required for Android 8+).
 */
export async function createNotificationChannels() {
  if (Platform.OS !== 'android') return;

  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('chat', {
      name: 'Chat Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('announcements', {
      name: 'Announcements',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });

    console.log('[Push] ✓ Android channels created');
  } catch (error) {
    console.error('[Push] Channel creation error:', error);
  }
}
