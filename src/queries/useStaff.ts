import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '@/api/staff';

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
  return useQuery({ queryKey: staffKeys.coursework, queryFn: staffApi.coursework });
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
  return useQuery({ queryKey: staffKeys.closedDays, queryFn: staffApi.closedDays });
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
