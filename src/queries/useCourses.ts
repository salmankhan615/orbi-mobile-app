import { useQuery } from '@tanstack/react-query';
import { getAllocatedCourses, getCourseDetail } from '@/api/crm';
import { coursesApi, type Course } from '@/api/courses';
import { unwrapList } from '@/api/unwrap';
import {
  mapAllocatedCoursesToApp,
  mapCourseDetailToApp,
} from '@/features/courses/mapAllocatedCourses';
import { useAuthStore } from '@/store/useAuthStore';

export const coursesKeys = {
  all: ['courses'] as const,
  allocatedPacks: (userId: string, companyId: string) =>
    ['courses', 'allocated-packs', userId, companyId] as const,
  detail: (id: string) => ['courses', id] as const,
};

/** Raw CRM allocate-course packs — shared by My Courses + Dashboard. */
export function useAllocatedCoursePacks() {
  const role = useAuthStore((state) => state.user?.role ?? 'student');
  const userId = useAuthStore((state) => state.user?.id ?? '');
  const companyId = useAuthStore((state) => state.user?.companyId?.trim() ?? '');

  const query = useQuery({
    queryKey: coursesKeys.allocatedPacks(userId || 'none', companyId || 'none'),
    queryFn: async (): Promise<unknown[]> => {
      if (!userId || !companyId) {
        throw new Error('Missing companyId — sign out and sign in again.');
      }
      return unwrapList(await getAllocatedCourses(userId, companyId));
    },
    enabled: role === 'student' && Boolean(userId) && Boolean(companyId),
    staleTime: 60_000,
    retry: 1,
  });

  return {
    ...query,
    missingCompanyId: role === 'student' && Boolean(userId) && !companyId,
  };
}

/** Student courses from CRM `get-allocate-course`. Staff/demo still use mock list. */
export function useCourses() {
  const role = useAuthStore((state) => state.user?.role ?? 'student');
  const packsQuery = useAllocatedCoursePacks();

  const mockQuery = useQuery({
    queryKey: coursesKeys.all,
    queryFn: coursesApi.list,
    enabled: role !== 'student',
  });

  if (role === 'student') {
    const data = packsQuery.data ? mapAllocatedCoursesToApp(packsQuery.data) : undefined;
    return {
      data,
      isPending: packsQuery.isPending,
      isLoading: packsQuery.isLoading,
      isFetching: packsQuery.isFetching,
      isError: packsQuery.isError,
      error: packsQuery.error,
      refetch: packsQuery.refetch,
      status: packsQuery.status,
      missingCompanyId: packsQuery.missingCompanyId,
      allocateError:
        packsQuery.error instanceof Error
          ? packsQuery.error.message
          : packsQuery.missingCompanyId
            ? 'Missing companyId — sign out and sign in again.'
            : undefined,
    };
  }

  return { ...mockQuery, missingCompanyId: false, allocateError: undefined as string | undefined };
}

export function useCourse(id: string) {
  const role = useAuthStore((state) => state.user?.role ?? 'student');
  const { data: allocatedList } = useCourses();

  return useQuery({
    queryKey: coursesKeys.detail(id),
    queryFn: async (): Promise<Course | undefined> => {
      if (role === 'student') {
        try {
          const raw = await getCourseDetail(id);
          const mapped = mapCourseDetailToApp(raw, id);
          if (mapped?.modules.length) return mapped;
          if (mapped) {
            const fromAlloc = (allocatedList ?? []).find((course) => course.id === id);
            if (fromAlloc?.modules.length) {
              return { ...mapped, modules: fromAlloc.modules, moduleCount: fromAlloc.moduleCount };
            }
            return mapped;
          }
        } catch {
          // use allocated snapshot
        }
        return (allocatedList ?? []).find((course) => course.id === id);
      }
      return coursesApi.getById(id);
    },
    enabled: Boolean(id),
  });
}
