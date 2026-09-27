import * as Notifications from 'expo-notifications';
import { announcementPushApi } from '@/api/announcementPush';

let handleNotificationsPollInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start polling for push notifications to send.
 * Document: Area 3 - Push notifications, Area 4 - Announcements
 * Handles: announcements, class reminders, booking reminders, course nudges
 */
export function startPushNotificationPolling(accessToken: string) {
  if (!accessToken) {
    console.warn('[Push] No access token for polling');
    return;
  }

  console.log('[Push] Starting notification polling every 30 seconds');

  // Poll every 30 seconds for new announcements
  handleNotificationsPollInterval = setInterval(async () => {
    try {
      console.log('[Push] Polling for announcements...');
      await pollAndSendAnnouncements(accessToken);
    } catch (error) {
      console.error('[Push] Polling error:', error);
    }
  }, 30000); // 30 seconds

  // Do initial check immediately
  console.log('[Push] Initial poll check');
  pollAndSendAnnouncements(accessToken).catch(console.error);
}

/**
 * Stop polling for notifications.
 */
export function stopPushNotificationPolling() {
  if (handleNotificationsPollInterval) {
    clearInterval(handleNotificationsPollInterval);
    handleNotificationsPollInterval = null;
    console.log('[Push] Stopped notification polling');
  }
}

/**
 * Poll for announcements and send as push notifications.
 * Document: Reuse existing targeting and fan-out infrastructure
 */
async function pollAndSendAnnouncements(accessToken: string) {
  try {
    console.log('[Push] Fetching unnotified announcements...');
    const announcements = await announcementPushApi.getUnnotifiedAnnouncements(accessToken);
    console.log('[Push] Found', announcements.length, 'announcements');

    for (const announcement of announcements) {
      try {
        console.log('[Push] Sending announcement:', announcement.title || 'N/A');

        // Send local notification (in production, this would come from Expo Push Service)
        await Notifications.scheduleNotificationAsync({
          content: {
            title: announcement.title,
            body: announcement.body,
            sound: 'default',
            badge: 1,
            data: {
              type: 'announcement',
              announcementId: announcement.announcementId,
            },
          },
          trigger: null, // Send immediately
        });

        // Mark as notified
        await announcementPushApi.markNotified(announcement.announcementId, accessToken);
        console.log('[Push] ✓ Announcement sent and marked as notified');
      } catch (error) {
        console.error('[Push] Failed to send announcement:', error);
      }
    }
  } catch (error) {
    console.error('[Push] Announcement polling error:', error);
  }
}

/**
 * Send a class reminder notification.
 * Document: Evening-before digest (15:00 UTC) quoting stored wall-clock digits
 */
export async function sendClassReminderNotification(
  title: string,
  body: string,
  classId: string,
) {
  try {
    console.log('[Push] Sending class reminder:', title);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        badge: 1,
        data: {
          type: 'class.reminder',
          classId,
        },
      },
      trigger: null,
    });

    console.log('[Push] ✓ Class reminder sent');
  } catch (error) {
    console.error('[Push] Class reminder error:', error);
  }
}

/**
 * Send a booking reminder notification.
 * Document: Fire confirmed/cancelled/rescheduled notifications at moment of action
 */
export async function sendBookingNotification(
  title: string,
  body: string,
  bookingId: string,
  status: 'confirmed' | 'cancelled' | 'rescheduled',
) {
  try {
    console.log('[Push] Sending booking notification:', title);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        badge: 1,
        data: {
          type: 'booking.reminder',
          bookingId,
          status,
        },
      },
      trigger: null,
    });

    console.log('[Push] ✓ Booking notification sent');
  } catch (error) {
    console.error('[Push] Booking notification error:', error);
  }
}

/**
 * Send a course progress nudge.
 * Document: One notification per student per week
 * Trigger: deadline within 7 days, 25+ points behind, 14+ days inactive
 */
export async function sendCourseNudgeNotification(
  title: string,
  body: string,
  courseId: string,
  reason: 'deadline' | 'behind' | 'inactive',
) {
  try {
    console.log('[Push] Sending course nudge:', title);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        badge: 1,
        data: {
          type: 'course.nudge',
          courseId,
          reason,
        },
      },
      trigger: null,
    });

    console.log('[Push] ✓ Course nudge sent');
  } catch (error) {
    console.error('[Push] Course nudge error:', error);
  }
}
