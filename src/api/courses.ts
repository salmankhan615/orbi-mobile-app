export type CourseCategory = 'navy' | 'teal' | 'purple' | 'amber';
export type CourseStatus = 'in_progress' | 'not_started' | 'completed';
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

/** Public sample MP4 — swapped for real course media when a backend exists. */
const SAMPLE_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export interface Lesson {
  id: string;
  title: string;
  status: 'done' | 'current' | 'locked';
  durationLabel: string;
  description: string;
  videoUrl: string;
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  status: CourseStatus;
  progress: number;
  moduleCount: number;
  level: CourseLevel;
  modules: CourseModule[];
}

function lesson(
  id: string,
  title: string,
  status: Lesson['status'],
  durationLabel: string,
  description: string,
): Lesson {
  return {
    id,
    title,
    status,
    durationLabel,
    description,
    videoUrl: SAMPLE_VIDEO,
  };
}

const courses: Course[] = [
  {
    id: 'acca-skills-uk',
    title: 'ACCA Skills (UK)',
    description: 'Develop essential accounting skills and advance your career.',
    category: 'navy',
    status: 'in_progress',
    progress: 45,
    moduleCount: 12,
    level: 'Beginner',
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Financial Accounting Basics',
        lessons: [
          lesson(
            'm1l1',
            '1.1 Introduction to Accounting',
            'done',
            '8 min',
            'Learn what accounting is, why it matters, and how it supports every business decision.',
          ),
          lesson(
            'm1l2',
            '1.2 Basic Accounting Equation',
            'done',
            '12 min',
            'Assets = Liabilities + Equity — the foundation of every balance sheet.',
          ),
          lesson(
            'm1l3',
            '1.3 Journal Entries',
            'current',
            '15 min',
            'Record day-to-day transactions with debits and credits in the general journal.',
          ),
        ],
      },
      {
        id: 'm2',
        title: 'Module 2: Management Accounting',
        lessons: [
          lesson(
            'm2l1',
            '2.1 Cost Classification',
            'locked',
            '10 min',
            'Fixed, variable, direct, and indirect costs — and when each one matters.',
          ),
          lesson(
            'm2l2',
            '2.2 Budgeting Fundamentals',
            'locked',
            '14 min',
            'Build a simple operating budget and track variance against plan.',
          ),
        ],
      },
      {
        id: 'm3',
        title: 'Module 3: Financial Statements',
        lessons: [
          lesson(
            'm3l1',
            '3.1 Income Statement',
            'locked',
            '11 min',
            'Read and prepare a profit and loss statement from trial balance data.',
          ),
          lesson(
            'm3l2',
            '3.2 Balance Sheet',
            'locked',
            '13 min',
            'Structure assets, liabilities, and equity into a clear statement of position.',
          ),
        ],
      },
      {
        id: 'm4',
        title: 'Module 4: Advanced Topics',
        lessons: [
          lesson(
            'm4l1',
            '4.1 Consolidated Accounts',
            'locked',
            '18 min',
            'Combine parent and subsidiary results into a single set of statements.',
          ),
        ],
      },
    ],
  },
  {
    id: 'customer-care-pk',
    title: 'Customer Care (Pakistan)',
    description: 'Deliver excellent customer support across every channel.',
    category: 'teal',
    status: 'in_progress',
    progress: 72,
    moduleCount: 18,
    level: 'Intermediate',
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Communication Essentials',
        lessons: [
          lesson(
            'm1l1',
            '1.1 Active Listening',
            'done',
            '9 min',
            'Techniques to hear what customers mean, not only what they say.',
          ),
          lesson(
            'm1l2',
            '1.2 Handling Complaints',
            'done',
            '12 min',
            'Turn frustrated callers into loyal customers with a clear recovery path.',
          ),
        ],
      },
      {
        id: 'm2',
        title: 'Module 2: Service Recovery',
        lessons: [
          lesson(
            'm2l1',
            '2.1 De-escalation Techniques',
            'current',
            '14 min',
            'Calm heated conversations and regain control without conceding quality.',
          ),
        ],
      },
    ],
  },
  {
    id: 'global-accounting-airp-pk',
    title: 'Global Accounting AIRP - PAK',
    description: 'International accounting standards for reporting professionals.',
    category: 'purple',
    status: 'not_started',
    progress: 0,
    moduleCount: 15,
    level: 'Advanced',
    modules: [
      {
        id: 'm1',
        title: 'Module 1: IFRS Foundations',
        lessons: [
          lesson(
            'm1l1',
            '1.1 Overview of IFRS',
            'current',
            '16 min',
            'How IFRS is structured and why global reporting standards matter.',
          ),
        ],
      },
    ],
  },
  {
    id: 'digital-accounts-assistant-uk',
    title: 'Online – Digital Accounts Assistant (UK)',
    description: 'Hands-on training for cloud accounting software and workflows.',
    category: 'amber',
    status: 'in_progress',
    progress: 13,
    moduleCount: 10,
    level: 'Beginner',
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Getting Started',
        lessons: [
          lesson(
            'm1l1',
            '1.1 Setting Up Your Workspace',
            'done',
            '7 min',
            'Configure your cloud workspace, users, and first company file.',
          ),
          lesson(
            'm1l2',
            '1.2 Navigating the Dashboard',
            'current',
            '10 min',
            'Find reports, bank feeds, and daily tasks without getting lost.',
          ),
        ],
      },
    ],
  },
];

function mockDelay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const coursesApi = {
  list: (): Promise<Course[]> => mockDelay(courses),
  getById: (id: string): Promise<Course | undefined> => mockDelay(courses.find((c) => c.id === id)),
};
