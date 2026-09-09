export interface StaffGroup {
  id: string;
  name: string;
  courseTitle: string;
  studentCount: number;
  nextSession: string;
}

export interface GroupStudent {
  id: string;
  name: string;
  email: string;
  progress: number;
}

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'staff';
  status: 'active' | 'invited';
}

export interface CourseworkFile {
  url: string;
  filename: string;
  type: 'IMAGE' | 'VIDEO' | 'FILE' | string;
}

export interface CourseworkFeedback {
  id: string;
  text: string;
  authorRole?: string;
  createdAt?: string;
}

export interface CourseworkItem {
  id: string;
  title: string;
  courseTitle: string;
  dueDate: string;
  status: 'open' | 'submitted' | 'graded';
  /** CRM student coursework fields */
  kind?: 'assignment' | 'resource' | 'other';
  groupName?: string;
  score?: number;
  maxScore?: number;
  instructions?: string;
  /** Raw ISO due date for overdue checks */
  dueDateIso?: string;
  attachments?: CourseworkFile[];
  submission?: {
    id?: string;
    status?: string;
    score?: number;
    submittedAt?: string;
    gradedAt?: string;
    gradedByName?: string;
    isLate?: boolean;
    files?: CourseworkFile[];
    comments?: CourseworkFeedback[];
  };
}

export interface CourseworkSubmission {
  id: string;
  assignmentId: string;
  studentName: string;
  submittedAt: string;
  status: 'submitted' | 'late' | 'graded';
  grade?: string;
}

export interface Invoice {
  id: string;
  studentName: string;
  amountLabel: string;
  status: 'paid' | 'due' | 'overdue';
  issuedOn: string;
}

export interface Agreement {
  id: string;
  studentName: string;
  title: string;
  status: 'pending' | 'signed' | 'expired';
  submittedOn: string;
}

export interface BookingShift {
  id: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
}

let closedDays = new Set<string>(['2026-08-10']);

const groups: StaffGroup[] = [
  {
    id: 'g1',
    name: 'ACCA Skills — Morning',
    courseTitle: 'ACCA Skills (UK)',
    studentCount: 18,
    nextSession: '2026-08-04',
  },
  {
    id: 'g2',
    name: 'Customer Care — Cohort B',
    courseTitle: 'Customer Care (Pakistan)',
    studentCount: 12,
    nextSession: '2026-08-06',
  },
];

const groupStudents: Record<string, GroupStudent[]> = {
  g1: [
    { id: 'user-1', name: 'Sidra Khan', email: 'sidra@kbm.com', progress: 45 },
    { id: 'user-3', name: 'Hassan Ali', email: 'hassan@kbm.com', progress: 22 },
  ],
  g2: [{ id: 'user-4', name: 'Fatima Noor', email: 'fatima@kbm.com', progress: 72 }],
};

const directory: DirectoryUser[] = [
  { id: 'user-1', name: 'Sidra Khan', email: 'sidra@kbm.com', role: 'student', status: 'active' },
  { id: 'user-3', name: 'Hassan Ali', email: 'hassan@kbm.com', role: 'student', status: 'active' },
  { id: 'staff-1', name: 'Arslan Malik', email: 'staff@kbm.com', role: 'staff', status: 'active' },
  { id: 'staff-2', name: 'Amina Hassan', email: 'amina@kbm.com', role: 'staff', status: 'active' },
];

const coursework: CourseworkItem[] = [
  {
    id: 'cw1',
    title: 'Journal Entries worksheet',
    courseTitle: 'ACCA Skills (UK)',
    dueDate: '2026-08-08',
    status: 'open',
  },
  {
    id: 'cw2',
    title: 'Service recovery case study',
    courseTitle: 'Customer Care (Pakistan)',
    dueDate: '2026-08-12',
    status: 'submitted',
  },
];

const submissions: CourseworkSubmission[] = [
  {
    id: 'sub1',
    assignmentId: 'cw2',
    studentName: 'Sidra Khan',
    submittedAt: '2026-08-03',
    status: 'submitted',
  },
  {
    id: 'sub2',
    assignmentId: 'cw2',
    studentName: 'Fatima Noor',
    submittedAt: '2026-08-04',
    status: 'graded',
    grade: 'Merit',
  },
];

const invoices: Invoice[] = [
  {
    id: 'inv1',
    studentName: 'Sidra Khan',
    amountLabel: '£450.00',
    status: 'paid',
    issuedOn: '2026-07-01',
  },
  {
    id: 'inv2',
    studentName: 'Hassan Ali',
    amountLabel: '£280.00',
    status: 'due',
    issuedOn: '2026-08-01',
  },
];

const agreements: Agreement[] = [
  {
    id: 'ag1',
    studentName: 'Sidra Khan',
    title: 'Learner Agreement 2026',
    status: 'signed',
    submittedOn: '2026-07-12',
  },
  {
    id: 'ag2',
    studentName: 'Hassan Ali',
    title: 'Learner Agreement 2026',
    status: 'pending',
    submittedOn: '2026-08-02',
  },
  {
    id: 'ag3',
    studentName: 'Fatima Noor',
    title: 'Photo consent',
    status: 'expired',
    submittedOn: '2026-06-01',
  },
];

const shifts: BookingShift[] = [
  {
    id: 'sh1',
    staffName: 'Arslan Malik',
    date: '2026-08-04',
    startTime: '09:00',
    endTime: '13:00',
    location: 'Online studio',
  },
  {
    id: 'sh2',
    staffName: 'Amina Hassan',
    date: '2026-08-05',
    startTime: '12:00',
    endTime: '17:00',
    location: 'Manchester centre',
  },
];

function mockDelay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const staffApi = {
  groups: (): Promise<StaffGroup[]> => mockDelay(groups),
  groupStudents: (groupId: string): Promise<GroupStudent[]> =>
    mockDelay(groupStudents[groupId] ?? []),
  directory: (): Promise<DirectoryUser[]> => mockDelay(directory),
  coursework: (): Promise<CourseworkItem[]> => mockDelay(coursework),
  submissions: (assignmentId?: string): Promise<CourseworkSubmission[]> =>
    mockDelay(
      assignmentId ? submissions.filter((item) => item.assignmentId === assignmentId) : submissions,
    ),
  invoices: (): Promise<Invoice[]> => mockDelay(invoices),
  agreements: (): Promise<Agreement[]> => mockDelay(agreements),
  shifts: (): Promise<BookingShift[]> => mockDelay(shifts),
  closedDays: (): Promise<string[]> => mockDelay([...closedDays]),
  closeDay: (iso: string): Promise<string[]> => {
    closedDays.add(iso);
    return mockDelay([...closedDays]);
  },
  openDay: (iso: string): Promise<string[]> => {
    closedDays.delete(iso);
    return mockDelay([...closedDays]);
  },
};
