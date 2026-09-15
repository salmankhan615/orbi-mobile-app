import type { StaffGroup } from '@/api/staff';

export type GroupStatusTab = 'all' | 'active' | 'inactive' | 'cancelled' | 'complete';
export type GroupEndedFilter = '' | 'active' | 'ended';

export type GroupListFilters = {
  status: GroupStatusTab;
  courseId: string;
  staffId: string;
  ended: GroupEndedFilter;
  fromDate: string;
  toDate: string;
};

export const DEFAULT_GROUP_FILTERS: GroupListFilters = {
  status: 'all',
  courseId: '',
  staffId: '',
  ended: '',
  fromDate: '',
  toDate: '',
};

export const GROUP_STATUS_TABS: { key: GroupStatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'complete', label: 'Complete' },
];

export function filterStaffGroups(groups: StaffGroup[], filters: GroupListFilters): StaffGroup[] {
  let next = groups;
  const { status, courseId, staffId, ended, fromDate, toDate } = filters;

  if (status !== 'all') {
    next = next.filter((group) => group.status === status);
  }
  if (courseId) {
    next = next.filter((group) => group.courseId === courseId);
  }
  if (staffId) {
    next = next.filter((group) => group.staff.some((member) => member.id === staffId));
  }
  if (ended === 'ended') {
    next = next.filter((group) => group.ended);
  } else if (ended === 'active') {
    next = next.filter((group) => !group.ended);
  }
  if (fromDate) {
    const from = new Date(fromDate);
    next = next.filter((group) => !group.endDate || new Date(group.endDate) >= from);
  }
  if (toDate) {
    const to = new Date(toDate);
    next = next.filter((group) => !group.startDate || new Date(group.startDate) <= to);
  }
  return next;
}

export function statusBadgeTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'neutral';
    case 'cancelled':
      return 'danger';
    case 'complete':
      return 'warning';
    default:
      return 'neutral';
  }
}
