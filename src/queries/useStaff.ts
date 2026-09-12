import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchStudentCoursework } from '@/api/coursework';
import { staffApi } from '@/api/staff';
import { useAuthStore } from '@/store/useAuthStore';
import { useAfterInteractions } from '@/hooks/useAfterInteractions';

export const staffKeys = {
  groups: ['staff', 'groups'] as const,
  groupStudents: (id: string) => ['staff', 'groups', id, 'students'] as const,
  groupSessions: (id: string) => ['staff', 'groups', id, 'sessions'] as const,
  directory: ['staff', 'directory'] as const,
  coursework: ['staff', 'coursework'] as const,
  submissions: (id?: string) => ['staff', 'submissions', id ?? 'all'] as const,
  invoices: ['staff', 'invoices'] as const,
  agreements: ['staff', 'agreements'] as const,
  shifts: ['staff', 'shifts'] as const,
  closedDays: ['staff', 'closedDays'] as const,
};

const STAFF_QUERY = {
  staleTime: 60_000,
  retry: 1 as const,
};

export function useStaffGroups() {
  const ready = useAfterInteractions();
  return useQuery({
    queryKey: staffKeys.groups,
    queryFn: staffApi.groups,
    enabled: ready,
    ...STAFF_QUERY,
  });
}

export function useGroupStudents(groupId: string) {
  const ready = useAfterInteractions();
  return useQuery({
    queryKey: staffKeys.groupStudents(groupId),
    queryFn: () => staffApi.groupStudents(groupId),
    enabled: ready && Boolean(groupId),
    ...STAFF_QUERY,
  });
}

export function useGroupSessions(groupId: string) {
  const ready = useAfterInteractions();
  return useQuery({
    queryKey: staffKeys.groupSessions(groupId),
    queryFn: () => staffApi.groupSessions(groupId),
    enabled: ready && Boolean(groupId),
    ...STAFF_QUERY,
  });
}

export function useDirectory() {
  const ready = useAfterInteractions();
  return useQuery({
    queryKey: staffKeys.directory,
    queryFn: staffApi.directory,
    enabled: ready,
    ...STAFF_QUERY,
  });
}

export function useStaffCoursework() {
  const ready = useAfterInteractions();
  const role = useAuthStore((state) => state.user?.role ?? 'student');
  const userId = useAuthStore((state) => state.user?.id ?? '');
  return useQuery({
    queryKey: [...staffKeys.coursework, role, userId || 'none'],
    queryFn: () => (role === 'student' ? fetchStudentCoursework() : staffApi.coursework()),
    enabled: ready && (role !== 'student' || Boolean(userId)),
    ...STAFF_QUERY,
  });
}

export function useSubmissions(assignmentId?: string) {
  const ready = useAfterInteractions();
  return useQuery({
    queryKey: staffKeys.submissions(assignmentId),
    queryFn: () => staffApi.submissions(assignmentId),
    enabled: ready && Boolean(assignmentId),
    ...STAFF_QUERY,
  });
}

export function useInvoices() {
  const ready = useAfterInteractions();
  return useQuery({
    queryKey: staffKeys.invoices,
    queryFn: staffApi.invoices,
    enabled: ready,
    ...STAFF_QUERY,
  });
}

export function useAgreements() {
  const ready = useAfterInteractions();
  return useQuery({
    queryKey: staffKeys.agreements,
    queryFn: staffApi.agreements,
    enabled: ready,
    ...STAFF_QUERY,
  });
}

export function useShifts() {
  const ready = useAfterInteractions();
  return useQuery({
    queryKey: staffKeys.shifts,
    queryFn: staffApi.shifts,
    enabled: ready,
    ...STAFF_QUERY,
  });
}

export function useClosedDays() {
  const ready = useAfterInteractions();
  return useQuery({
    queryKey: staffKeys.closedDays,
    queryFn: staffApi.closedDays,
    enabled: ready,
    ...STAFF_QUERY,
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
