import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { pushDevicesApi } from '@/api/pushDevices';
import { getDeviceInfo } from '@/api/deviceInfo';

let pushTokenUpdateHandler: ((token: string) => Promise<void>) | null = null;
let notificationHandler: ((notification: any) => void) | null = null;

/**
 * Initialize push notifications.
 * Document: Area 3 - Push notifications
 */
export async function initializePushNotifications() {
  try {
    console.log('[Push] Initializing...');

    // Set notification handler to handle incoming notifications
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
        } as any;
      },
    });

    // Handle notification tapped while app is in foreground
    const foregroundSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('[Push] Notification tapped:', response.notification);
        handleNotificationTapped(response.notification);
      },
    );

    // Handle notification tapped while app was backgrounded/closed
    const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
    if (lastNotificationResponse) {
      console.log('[Push] App opened from notification:', lastNotificationResponse.notification);
      handleNotificationTapped(lastNotificationResponse.notification);
    }

    console.log('[Push] ✓ Initialized');

    return () => {
      foregroundSubscription.remove();
    };
  } catch (error) {
    console.error('[Push] Initialization error:', error);
    throw error;
  }
}

/**
 * Register or update push token.
 * Document: Call PUT /devices after every login and whenever Expo hands a changed token
 */
export async function registerPushToken(accessToken: string) {
  try {
    if (!accessToken) {
      console.warn('[Push] No access token for registration');
      return null;
    }

    console.log('[Push] Requesting permission...');

    // Request notification permissions
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) {
      console.log('[Push] Requesting notification permissions...');
      const newPermission = await Notifications.requestPermissionsAsync();
      if (!newPermission.granted) {
        console.warn('[Push] Notification permission denied');
        return null;
      }
    }

    console.log('[Push] Getting push token...');
    const pushToken = await Notifications.getExpoPushTokenAsync();
    console.log('[Push] Token:', pushToken.data.substring(0, 20) + '...');

    // Get device info
    const device = await getDeviceInfo();

    // Register with backend
    await pushDevicesApi.register(pushToken.data, accessToken, {
      expoPushToken: pushToken.data,
      ...device,
    });

    // Set up token change listener
    const subscription = Notifications.addPushTokenListener((event: any) => {
      console.log('[Push] Token updated:', event.pushToken?.data.substring(0, 20) + '...');
      // Immediately re-register with new token
      pushTokenUpdateHandler?.(event.pushToken?.data || '');
    });

    return () => {
      subscription.remove();
    };
  } catch (error) {
    console.error('[Push] Registration error:', error);
    throw error;
  }
}

/**
 * Set handler for push token updates.
 * Called when Expo issues a new token.
 */
export function setPushTokenUpdateHandler(
  handler: ((token: string) => Promise<void>) | null,
) {
  pushTokenUpdateHandler = handler;
}

/**
 * Set handler for incoming notifications.
 * Called when a notification arrives while app is running.
 */
export function setNotificationHandler(handler: ((notification: any) => void) | null) {
  notificationHandler = handler;
}

/**
 * Handle notification tapped.
 * Deep-link based on data.type.
 * Document: The app routes on data.type
 */
function handleNotificationTapped(notification: Notifications.Notification) {
  const data = notification.request.content.data as any;
  console.log('[Push] Handling tap, type:', data?.type);

  switch (data?.type) {
    case 'chat.message':
      console.log('[Push] Deep-link to chat:', data.conversationId);
      // TODO: Navigate to chat conversation
      // This would be handled by the app's navigation system
      break;

    case 'announcement':
      console.log('[Push] Deep-link to announcement:', data.announcementId);
      // TODO: Navigate to announcements screen
      break;

    case 'class.reminder':
      console.log('[Push] Deep-link to class:', data.classId);
      // TODO: Navigate to calendar
      break;

    case 'booking.reminder':
      console.log('[Push] Deep-link to booking:', data.bookingId);
      // TODO: Navigate to calendar
      break;

    case 'course.nudge':
      console.log('[Push] Deep-link to course:', data.courseId);
      // TODO: Navigate to course
      break;

    default:
      console.log('[Push] Unknown notification type');
  }
}

/**
 * Create Android notification channel (required for Android 8+).
 * Document: channelId: "chat"
 */
export async function createNotificationChannels() {
  if (Platform.OS !== 'android') return;

  try {
    await Notifications.setNotificationChannelAsync('chat', {
      name: 'Chat Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      bypassDnd: false,
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
