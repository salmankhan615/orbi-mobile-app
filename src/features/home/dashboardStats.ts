import {
  crmCourseProgress,
  flattenAllocatedCourseRows,
} from '@/features/courses/mapAllocatedCourses';

export interface DashboardStatCards {
  trainingHours: { total: string; booked: string; remaining: string };
  allocatedCourses: { theory: number; practical: number };
  specialClasses: { booked: number; cancelled: number };
  trainingShifts: { booked: number; cancelled: number };
}

export interface CategoryProgress {
  title: string;
  coursesCount: number;
  avgProgress: number;
}

export interface CoursesOverview {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  expired: number;
}

export interface StudentDashboardModel {
  stats: DashboardStatCards;
  categories: CategoryProgress[];
  overview: CoursesOverview;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' ? (value as UnknownRecord) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function idOf(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  const record = asRecord(value);
  if (!record) return null;
  if (record._id != null) return String(record._id);
  if (record.$oid != null) return String(record.$oid);
  return null;
}

function isAccessExpired(courseRow: UnknownRecord | null): boolean {
  if (!courseRow) return false;
  if (String(courseRow.accessType) === 'Free' && !courseRow.endDate) return false;
  let endDate = courseRow.endDate;
  for (const item of asArray(courseRow.overrides)) {
    const row = asRecord(item);
    if (!row?.extendedEndDate) continue;
    const extended = new Date(String(row.extendedEndDate));
    if (!endDate || extended > new Date(String(endDate))) {
      endDate = row.extendedEndDate;
    }
  }
  if (!endDate) return false;
  const end = new Date(String(endDate));
  end.setHours(23, 59, 59, 999);
  return new Date() > end;
}

function categoryTitle(course: UnknownRecord | null, settingsCategories: unknown[]): string[] {
  const setting = asArray(course?.courseSetting)[0];
  const settingRow = asRecord(setting);
  const cats = asArray(settingRow?.courseCategory ?? course?.courseCategory ?? course?.category);
  const titles: string[] = [];

  for (const cat of cats) {
    const id = idOf(cat);
    const match = settingsCategories.find((item) => idOf(item) === id);
    const matchRow = asRecord(match);
    if (matchRow?.title) {
      titles.push(String(matchRow.title));
      continue;
    }
    if (typeof cat === 'string' && cat.length < 40) titles.push(cat);
    const catRow = asRecord(cat);
    if (catRow?.title) titles.push(String(catRow.title));
  }

  return titles.length > 0 ? titles : ['General'];
}

function userBookingsFromCalendar(classCalendar: unknown[], userId?: string): UnknownRecord[] {
  const bookings: UnknownRecord[] = [];
  for (const day of classCalendar) {
    const row = asRecord(day);
    for (const booking of asArray(row?.bookings ?? (row ? [row] : []))) {
      const item = asRecord(booking);
      if (!item) continue;
      if (
        userId &&
        String(item.user) !== String(userId) &&
        String(item.userId) !== String(userId)
      ) {
        if (item.user != null || item.userId != null) continue;
      }
      bookings.push(item);
    }
  }
  return bookings;
}

/**
 * Mirrors CRM student home dashboard math:
 * getAllocationsByUser → Training Hours / Allocated Courses counts
 * get-allocate-course → category progress + total courses overview
 * class calendar → Special Classes
 * practical bookings → Training Shifts
 */
export function buildStudentDashboard(input: {
  allocations: unknown[];
  allocatedCourses?: unknown[];
  classCalendar: unknown[];
  practicalBookings: unknown[];
  settings?: { categories?: unknown[] } | null;
  userId?: string;
}): StudentDashboardModel {
  const {
    allocations,
    allocatedCourses = [],
    classCalendar,
    practicalBookings,
    settings,
    userId,
  } = input;

  let totalHours = 0;
  let usedMinutes = 0;
  let theory = 0;
  let practical = 0;

  const countFromPacks = (packs: unknown[]) => {
    for (const allocation of packs) {
      const pack = asRecord(allocation);
      usedMinutes += num(pack?.usedMinutes);
      for (const courseRow of asArray(pack?.courses)) {
        const row = asRecord(courseRow);
        if (!row) continue;
        const type = String(row.courseType ?? '');
        const overrideHours = asArray(row.overrides).reduce<number>((sum, item) => {
          const o = asRecord(item);
          return sum + num(o?.extraHours);
        }, 0);
        if (type === 'Training') {
          totalHours += num(row.actualHours) + overrideHours;
          practical += 1;
        } else if (type === 'Theory' || type === 'Course') {
          theory += 1;
        }
      }
    }
  };

  // Prefer getAllocationsByUser; fall back to get-allocate-course packs (same shape).
  countFromPacks(allocations);
  if (theory === 0 && practical === 0 && allocatedCourses.length > 0) {
    totalHours = 0;
    usedMinutes = 0;
    countFromPacks(allocatedCourses);
  }

  const bookedHours = usedMinutes / 60;
  const remaining = Math.max(0, totalHours - bookedHours);

  const classBookings = userBookingsFromCalendar(classCalendar, userId);
  const specialBooked = classBookings.filter((b) => String(b.status) === 'Active').length;
  const specialCancelled = classBookings.filter((b) => String(b.status) === 'Cancelled').length;

  const shifts = practicalBookings.map(asRecord).filter(Boolean) as UnknownRecord[];
  const shiftsBooked = shifts.filter((b) => String(b.status) === 'Active').length;
  const shiftsCancelled = shifts.filter((b) => String(b.status) === 'Cancelled').length;

  const chartSource =
    allocatedCourses.length > 0 ? flattenAllocatedCourseRows(allocatedCourses) : [];
  const settingsCategories = asArray(settings?.categories);

  const categoriesMap = new Map<
    string,
    { title: string; coursesCount: number; totalProgress: number }
  >();

  for (const { course, courseRow } of chartSource) {
    const progress = crmCourseProgress(course, courseRow);
    for (const title of categoryTitle(course, settingsCategories)) {
      const current = categoriesMap.get(title) ?? { title, coursesCount: 0, totalProgress: 0 };
      current.coursesCount += 1;
      current.totalProgress += progress;
      categoriesMap.set(title, current);
    }
  }

  const categories = [...categoriesMap.values()]
    .filter((item) => item.coursesCount > 0)
    .map((item) => ({
      title: item.title,
      coursesCount: item.coursesCount,
      avgProgress: item.coursesCount > 0 ? Math.round(item.totalProgress / item.coursesCount) : 0,
    }));

  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;
  let expired = 0;
  for (const { course, courseRow } of chartSource) {
    if (isAccessExpired(courseRow)) {
      expired += 1;
      continue;
    }
    const progress = crmCourseProgress(course, courseRow);
    if (progress >= 100) completed += 1;
    else if (progress > 0) inProgress += 1;
    else notStarted += 1;
  }

  return {
    stats: {
      trainingHours: {
        total: totalHours.toFixed(2),
        booked: bookedHours.toFixed(2),
        remaining: remaining.toFixed(2),
      },
      allocatedCourses: { theory, practical },
      specialClasses: { booked: specialBooked, cancelled: specialCancelled },
      trainingShifts: { booked: shiftsBooked, cancelled: shiftsCancelled },
    },
    categories,
    overview: {
      total: chartSource.length,
      completed,
      inProgress,
      notStarted,
      expired,
    },
  };
}

export const EMPTY_DASHBOARD: StudentDashboardModel = {
  stats: {
    trainingHours: { total: '0.00', booked: '0.00', remaining: '0.00' },
    allocatedCourses: { theory: 0, practical: 0 },
    specialClasses: { booked: 0, cancelled: 0 },
    trainingShifts: { booked: 0, cancelled: 0 },
  },
  categories: [],
  overview: { total: 0, completed: 0, inProgress: 0, notStarted: 0, expired: 0 },
};
