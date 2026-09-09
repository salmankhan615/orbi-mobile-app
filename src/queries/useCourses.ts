import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllocatedCourses, getCourseDetail, markLessonComplete } from '@/api/crm';
import { coursesApi, type Course } from '@/api/courses';
import { unwrapList } from '@/api/unwrap';
import {
  applyLessonProgressToPacks,
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
  const packsQuery = useAllocatedCoursePacks();
  const fromAlloc = packsQuery.data
    ? mapAllocatedCoursesToApp(packsQuery.data).find((course) => course.id === id)
    : undefined;

  const query = useQuery({
    queryKey: coursesKeys.detail(id),
    queryFn: async (): Promise<Course | undefined> => {
      if (role === 'student') {
        try {
          const raw = await getCourseDetail(id);
          return mapCourseDetailToApp(raw, id);
        } catch {
          return undefined;
        }
      }
      return coursesApi.getById(id);
    },
    // Allocate packs already contain curriculum — only hit detail when packs miss this course.
    enabled: Boolean(id) && (role !== 'student' || (packsQuery.isSuccess && !fromAlloc)),
  });

  if (role !== 'student') return query;

  const data = fromAlloc ?? query.data;
  return {
    ...query,
    data,
    isLoading: !data && (packsQuery.isLoading || query.isLoading),
    isPending: !data && (packsQuery.isPending || query.isPending),
    isError: !data && (packsQuery.isError || query.isError),
    error: packsQuery.error ?? query.error,
  };
}

export function useMarkLessonComplete(courseId: string) {
  const client = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? '');
  const companyId = useAuthStore((state) => state.user?.companyId?.trim() ?? '');
  const packsKey = coursesKeys.allocatedPacks(userId || 'none', companyId || 'none');

  return useMutation({
    mutationFn: async (payload: { sectionId: string; lessonId: string }) => {
      if (!userId) throw new Error('Not signed in');
      const raw = await markLessonComplete({
        userId,
        courseId,
        sectionId: payload.sectionId,
        lessonId: payload.lessonId,
      });
      const progress = Array.isArray(raw?.data) ? raw.data : unwrapList(raw);
      if (!Array.isArray(progress)) {
        throw new Error(
          (raw && typeof raw === 'object' && 'message' in raw && typeof raw.message === 'string'
            ? raw.message
            : null) || 'Lesson status was not updated',
        );
      }
      return progress as unknown[];
    },
    onSuccess: (lessonProgress) => {
      // Response `data` is the full updated lessonProgress — patch cache so UI flips to Completed now.
      client.setQueryData<unknown[]>(packsKey, (current) => {
        if (!current) return current;
        return applyLessonProgressToPacks(current, courseId, lessonProgress);
      });
      void client.invalidateQueries({ queryKey: packsKey });
    },
  });
}
