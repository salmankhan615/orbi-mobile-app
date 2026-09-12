import type { StaffPermission } from '@/features/auth/permissions';
import type { RootStackParamList } from '@/navigation/types';

export type StaffToolRoute = keyof Pick<
  RootStackParamList,
  | 'UserDirectory'
  | 'StaffCoursework'
  | 'Invoices'
  | 'Agreements'
  | 'Announcements'
  | 'AnnouncementEditor'
  | 'CloseCalendar'
  | 'BookingShifts'
>;

export type StaffTool = {
  id: string;
  label: string;
  description: string;
  icon:
    | 'clipboard-outline'
    | 'people-outline'
    | 'people-circle-outline'
    | 'document-text-outline'
    | 'receipt-outline'
    | 'document-attach-outline'
    | 'megaphone-outline'
    | 'create-outline'
    | 'close-circle-outline'
    | 'time-outline';
  permission: StaffPermission;
  /** Stack route — omit for tab routes handled separately. */
  route?: StaffToolRoute;
  /** Tab name when the tool lives on the staff tab bar. */
  tab?: 'Bookings' | 'Groups';
  /** Extra permission for create/edit tools. */
  managePermission?: StaffPermission;
};

/** Full staff capability list — UI only shows tools the user has permission for. */
export const STAFF_TOOLS: StaffTool[] = [
  {
    id: 'bookings',
    label: 'Bookings',
    description: 'View class bookings, mark attendance, cancel seats',
    icon: 'clipboard-outline',
    permission: 'view_bookings',
    tab: 'Bookings',
  },
  {
    id: 'groups',
    label: 'Groups',
    description: 'View cohorts, sessions, and students',
    icon: 'people-outline',
    permission: 'view_groups',
    tab: 'Groups',
  },
  {
    id: 'directory',
    label: 'Users directory',
    description: 'Browse students and staff accounts',
    icon: 'people-circle-outline',
    permission: 'view_users',
    route: 'UserDirectory',
  },
  {
    id: 'coursework',
    label: 'Coursework',
    description: 'Assignments and resources for groups',
    icon: 'document-text-outline',
    permission: 'view_coursework',
    route: 'StaffCoursework',
  },
  {
    id: 'invoices',
    label: 'Invoices',
    description: 'Fee invoices by student and status',
    icon: 'receipt-outline',
    permission: 'view_invoices',
    route: 'Invoices',
  },
  {
    id: 'agreements',
    label: 'Agreements',
    description: 'Agreement submissions by status',
    icon: 'document-attach-outline',
    permission: 'view_agreements',
    route: 'Agreements',
  },
  {
    id: 'announcements',
    label: 'Announcements',
    description: 'Create, edit, and manage posts',
    icon: 'megaphone-outline',
    permission: 'view_announcements',
    route: 'Announcements',
  },
  {
    id: 'close-calendar',
    label: 'Close calendar day',
    description: 'Close or reopen a training/class date',
    icon: 'close-circle-outline',
    permission: 'close_calendar',
    route: 'CloseCalendar',
  },
  {
    id: 'shifts',
    label: 'Booking shifts',
    description: 'Practical training seats by day',
    icon: 'time-outline',
    permission: 'view_shifts',
    route: 'BookingShifts',
  },
];

export function toolsForPermissions(permissions: StaffPermission[]): StaffTool[] {
  return STAFF_TOOLS.filter((tool) => permissions.includes(tool.permission));
}
