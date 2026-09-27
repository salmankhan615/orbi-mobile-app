import { API_BASE_URL, APP_VERSION } from '@/api/config';

export interface AnnouncementNotification {
  id: string;
  title: string;
  body: string;
  announcementId: string;
}

/**
 * Announcements push notifications.
 * Document: Area 4 - Announcements
 * Reuse existing targeting and fan-out infrastructure alongside email
 */
export const announcementPushApi = {
  /**
   * Fetch announcements that should be pushed.
   * These are announcements targeted to the user that haven't been notified yet.
   */
  async getUnnotifiedAnnouncements(
    accessToken: string,
  ): Promise<AnnouncementNotification[]> {
    try {
      console.log('[Announcements] Fetching unnotified announcements...');
      const response = await fetch(`${API_BASE_URL}/api/announcements/unnotified`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-App-Version': APP_VERSION,
        },
      });

      if (!response.ok) {
        console.warn('[Announcements] Failed to fetch:', response.status);
        return [];
      }

      const data = (await response.json()) as AnnouncementNotification[];
      console.log('[Announcements] Found', data.length, 'unnotified');
      return data;
    } catch (error) {
      console.error('[Announcements] Fetch error:', error);
      return [];
    }
  },

  /**
   * Mark announcement as notified.
   * Called after push is sent to prevent duplicate notifications.
   */
  async markNotified(announcementId: string, accessToken: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/announcements/${announcementId}/mark-notified`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-App-Version': APP_VERSION,
          },
        },
      );

      if (!response.ok) {
        console.warn('[Announcements] Failed to mark notified:', response.status);
      }
    } catch (error) {
      console.error('[Announcements] Mark notified error:', error);
    }
  },
};
