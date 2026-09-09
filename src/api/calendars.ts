import { tokens } from '@/theme';
import { getCourseSettings } from '@/api/crm';

export interface EventCalendar {
  id: string;
  name: string;
  accentColor: keyof typeof tokens.colors;
}

const ACCENTS: (keyof typeof tokens.colors)[] = [
  'secondary',
  'success',
  'warning',
  'tertiary',
  'info',
  'primary',
];

export const calendarsApi = {
  async list(): Promise<EventCalendar[]> {
    const settings = await getCourseSettings();
    const classes = Array.isArray(settings.classes) ? settings.classes : [];
    const mapped = classes
      .filter((item) => item?.status !== 'Inactive')
      .map((item, index) => ({
        id: String(item._id),
        name: item.title || 'Class',
        accentColor: ACCENTS[index % ACCENTS.length],
      }));

    return [{ id: 'all', name: 'All calendars', accentColor: 'primary' }, ...mapped];
  },

  async getById(id: string): Promise<EventCalendar | undefined> {
    const all = await calendarsApi.list();
    return all.find((calendar) => calendar.id === id);
  },
};
