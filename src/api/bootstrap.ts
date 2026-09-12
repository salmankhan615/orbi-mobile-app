import { authApi } from '@/api/auth';
import {
  getAllocatedCourses,
  getAllocationsByUser,
  getClassCalendar,
  getCourseSettings,
  getModules,
  getMyAnnouncements,
  getMyPracticalBookings,
} from '@/api/crm';
import { unwrapList } from '@/api/unwrap';
import { useAuthStore, type AuthUser } from '@/store/useAuthStore';
import { getRollingDateRange } from '@/utils/date';

export interface StudentBootstrap {
  user: AuthUser;
  loginStatus: unknown;
  modules: unknown;
  announcements: unknown[];
  settings: Awaited<ReturnType<typeof getCourseSettings>> | null;
  /** Hours / theory-practical cards — getAllocationsByUser */
  allocations: unknown[];
  /** Courses list + category/overview charts — get-allocate-course */
  allocatedCourses: unknown[];
  classCalendar: unknown[];
  practicalBookings: unknown[];
  errors: Partial<Record<keyof Omit<StudentBootstrap, 'errors' | 'user'>, string>>;
}

async function settled<T>(
  promise: Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  try {
    return { ok: true, value: await promise };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return { ok: false, error: message };
  }
}

function resolveCompanyId(user: AuthUser | null | undefined): string {
  return user?.companyId?.trim() || '';
}

/**
 * Mirrors the CRM web app's post-login waterfall + student home fetches:
 * login → getUser → getModules → my → loginStatus → getSettings →
 * getAllocationsByUser → get-allocate-course → getClassCalendar → my-bookings
 */
export async function fetchStudentBootstrap(): Promise<StudentBootstrap> {
  const errors: StudentBootstrap['errors'] = {};
  const stored = useAuthStore.getState().user;

  const userRes = await settled(authApi.getUser());
  let user: AuthUser;
  if (userRes.ok) {
    user = userRes.value;
    useAuthStore.getState().updateUser(user);
  } else if (stored) {
    // Cookie/session hiccup — still load allocate-course with login companyId.
    user = stored;
  } else {
    throw new Error(userRes.error);
  }

  const userId = user.id;
  const companyId = resolveCompanyId(user) || resolveCompanyId(useAuthStore.getState().user) || '';

  const [loginStatusRes, modulesRes, announcementsRes, settingsRes] = await Promise.all([
    settled(authApi.getLoginStatus()),
    settled(getModules()),
    settled(getMyAnnouncements()),
    settled(getCourseSettings()),
  ]);

  const [allocationsRes, allocatedCoursesRes, calendarRes, bookingsRes] = await Promise.all([
    userId
      ? settled(getAllocationsByUser(userId))
      : Promise.resolve({ ok: true as const, value: { data: [] } }),
    userId && companyId
      ? settled(getAllocatedCourses(userId, companyId))
      : Promise.resolve(
          companyId
            ? ({ ok: true as const, value: { data: [] } } as const)
            : ({
                ok: false as const,
                error: 'Missing companyId — cannot load allocated courses',
              } as const),
        ),
    settled(
      getClassCalendar({
        viewAsStudentId: userId,
        ...getRollingDateRange(6, 12),
      }),
    ),
    settled(getMyPracticalBookings()),
  ]);

  if (!loginStatusRes.ok) errors.loginStatus = loginStatusRes.error;
  if (!modulesRes.ok) errors.modules = modulesRes.error;
  if (!announcementsRes.ok) errors.announcements = announcementsRes.error;
  if (!settingsRes.ok) errors.settings = settingsRes.error;
  if (!allocationsRes.ok) errors.allocations = allocationsRes.error;
  if (!allocatedCoursesRes.ok) errors.allocatedCourses = allocatedCoursesRes.error;
  if (!calendarRes.ok) errors.classCalendar = calendarRes.error;
  if (!bookingsRes.ok) errors.practicalBookings = bookingsRes.error;

  const announcementsRaw = announcementsRes.ok ? announcementsRes.value : [];

  return {
    user,
    loginStatus: loginStatusRes.ok ? loginStatusRes.value : null,
    modules: modulesRes.ok ? modulesRes.value : null,
    announcements: unwrapList(announcementsRaw),
    settings: settingsRes.ok ? settingsRes.value : null,
    allocations: allocationsRes.ok ? unwrapList(allocationsRes.value) : [],
    allocatedCourses: allocatedCoursesRes.ok ? unwrapList(allocatedCoursesRes.value) : [],
    classCalendar: calendarRes.ok ? unwrapList(calendarRes.value) : [],
    practicalBookings: bookingsRes.ok ? unwrapList(bookingsRes.value) : [],
    errors,
  };
}
