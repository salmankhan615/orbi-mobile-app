import { tokens } from '@/theme';
import { getCourseSettings, isSettingsActive } from '@/api/crm';

export interface EventCalendar {
  id: string;
  name: string;
  accentColor: keyof typeof tokens.colors;
}

const ACCENTS: (keyof typeof tokens.colors)[] = [
  'primary',
  'secondary',
  'tertiary',
  'success',
  'categoryTeal',
  'info',
];

export const calendarsApi = {
  /**
   * Calendars = every active `getSettings.categories` row (ACCA, AAT, ACDAP, CPD, IRP, …).
   * Session lists still honour allocate-course scope separately.
   */
  async list(): Promise<EventCalendar[]> {
    const settings = await getCourseSettings();
    const categories = Array.isArray(settings.categories) ? settings.categories : [];

    const mapped = categories
      .filter((item) => isSettingsActive(item?.status))
      .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
      .map((item, index) => ({
        id: String(item._id),
        name: item.title || 'Calendar',
        accentColor: ACCENTS[index % ACCENTS.length],
      }));

    return [{ id: 'all', name: 'All calendars', accentColor: 'primary' }, ...mapped];
  },

  async getById(id: string): Promise<EventCalendar | undefined> {
    const all = await calendarsApi.list();
    return all.find((calendar) => calendar.id === id);
  },
};
