import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@/api/courses';

export const coursesKeys = {
  all: ['courses'] as const,
  detail: (id: string) => ['courses', id] as const,
};

export function useCourses() {
  return useQuery({
    queryKey: coursesKeys.all,
    queryFn: coursesApi.list,
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: coursesKeys.detail(id),
    queryFn: () => coursesApi.getById(id),
    enabled: Boolean(id),
  });
}
