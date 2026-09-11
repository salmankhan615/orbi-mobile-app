import { tokens } from '@/theme';
import { getAllocatedCourses, getCourseSettings, isSettingsActive } from '@/api/crm';
import { collectAllocatedCalendarScope } from '@/features/calendar/allocatedScope';
import { requireStudentContext } from '@/api/sessionUser';

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
  /**
   * Calendars = settings.categories the student is allocated to
   * (via allocate-course courseSetting.courseCategory). Staff/missing
   * company sees all active categories.
   */
  async list(): Promise<EventCalendar[]> {
    const settings = await getCourseSettings();
    const categories = Array.isArray(settings.categories) ? settings.categories : [];

    let allowed: Set<string> | null = null;
    try {
      const { userId, companyId } = requireStudentContext();
      const allocated = await getAllocatedCourses(userId, companyId, { slim: true });
      const packs = Array.isArray(allocated)
        ? allocated
        : Array.isArray((allocated as { data?: unknown })?.data)
          ? ((allocated as { data: unknown[] }).data ?? [])
          : [];
      const scope = collectAllocatedCalendarScope(packs);
      if (scope.categoryIds.size > 0) allowed = scope.categoryIds;
    } catch {
      // Non-students: show all categories.
    }

    const mapped = categories
      .filter((item) => isSettingsActive(item?.status))
      .filter((item) => !allowed || allowed.has(String(item._id)))
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
