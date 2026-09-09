import { useQuery } from '@tanstack/react-query';
import { fetchStudentCoursework } from '@/api/coursework';
import { staffApi } from '@/api/staff';
import { useAuthStore } from '@/store/useAuthStore';

export const courseworkKeys = {
  all: ['coursework'] as const,
  student: (userId: string) => ['coursework', 'student', userId] as const,
  staff: ['coursework', 'staff'] as const,
};

/**
 * Student: CRM `GET /api/course/crm/student/coursework?studentId=…`
 * Staff: mock list until staff CRM is wired.
 */
export function useCoursework() {
  const role = useAuthStore((state) => state.user?.role ?? 'student');
  const userId = useAuthStore((state) => state.user?.id ?? '');

  const studentQuery = useQuery({
    queryKey: courseworkKeys.student(userId || 'none'),
    queryFn: fetchStudentCoursework,
    enabled: role === 'student' && Boolean(userId),
    staleTime: 60_000,
    retry: 1,
  });

  const staffQuery = useQuery({
    queryKey: courseworkKeys.staff,
    queryFn: staffApi.coursework,
    enabled: role === 'staff',
  });

  if (role === 'student') {
    return {
      ...studentQuery,
      loadError: studentQuery.error instanceof Error ? studentQuery.error.message : undefined,
    };
  }

  return { ...staffQuery, loadError: undefined as string | undefined };
}
