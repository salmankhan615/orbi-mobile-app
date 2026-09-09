import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchStudentCoursework } from '@/api/coursework';
import { staffApi } from '@/api/staff';
import { useAuthStore } from '@/store/useAuthStore';
import { getCalendarClosures } from '@/api/crm';

export const staffKeys = {
  groups: ['staff', 'groups'] as const,
  groupStudents: (id: string) => ['staff', 'groups', id] as const,
  directory: ['staff', 'directory'] as const,
  coursework: ['staff', 'coursework'] as const,
  submissions: (id?: string) => ['staff', 'submissions', id ?? 'all'] as const,
  invoices: ['staff', 'invoices'] as const,
  agreements: ['staff', 'agreements'] as const,
  shifts: ['staff', 'shifts'] as const,
  closedDays: ['staff', 'closedDays'] as const,
};

export function useStaffGroups() {
  return useQuery({ queryKey: staffKeys.groups, queryFn: staffApi.groups });
}

export function useGroupStudents(groupId: string) {
  return useQuery({
    queryKey: staffKeys.groupStudents(groupId),
    queryFn: () => staffApi.groupStudents(groupId),
    enabled: Boolean(groupId),
  });
}

export function useDirectory() {
  return useQuery({ queryKey: staffKeys.directory, queryFn: staffApi.directory });
}

export function useStaffCoursework() {
  const role = useAuthStore((state) => state.user?.role ?? 'student');
  const userId = useAuthStore((state) => state.user?.id ?? '');
  return useQuery({
    queryKey: [...staffKeys.coursework, role, userId || 'none'],
    queryFn: () => (role === 'student' ? fetchStudentCoursework() : staffApi.coursework()),
    enabled: role !== 'student' || Boolean(userId),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useSubmissions(assignmentId?: string) {
  return useQuery({
    queryKey: staffKeys.submissions(assignmentId),
    queryFn: () => staffApi.submissions(assignmentId),
  });
}

export function useInvoices() {
  return useQuery({ queryKey: staffKeys.invoices, queryFn: staffApi.invoices });
}

export function useAgreements() {
  return useQuery({ queryKey: staffKeys.agreements, queryFn: staffApi.agreements });
}

export function useShifts() {
  return useQuery({ queryKey: staffKeys.shifts, queryFn: staffApi.shifts });
}

export function useClosedDays() {
  return useQuery({
    queryKey: staffKeys.closedDays,
    queryFn: async () => {
      try {
        const raw = await getCalendarClosures();
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray((raw as { data?: unknown[] })?.data)
            ? ((raw as { data: unknown[] }).data ?? [])
            : [];
        return list
          .map((item) => {
            if (typeof item === 'string') return item.slice(0, 10);
            if (item && typeof item === 'object') {
              const row = item as Record<string, unknown>;
              const value = row.date ?? row.closedDate ?? row.day;
              return typeof value === 'string' ? value.slice(0, 10) : '';
            }
            return '';
          })
          .filter(Boolean);
      } catch {
        return staffApi.closedDays();
      }
    },
  });
}

export function useCloseDay() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: staffApi.closeDay,
    onSuccess: () => client.invalidateQueries({ queryKey: staffKeys.closedDays }),
  });
}

export function useOpenDay() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: staffApi.openDay,
    onSuccess: () => client.invalidateQueries({ queryKey: staffKeys.closedDays }),
  });
}
