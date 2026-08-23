import type { Ionicons } from '@expo/vector-icons';
import type { CourseCategory, CourseStatus } from '@/api/courses';
import { tokens } from '@/theme';
import type { BadgeTone } from '@/components/ui/Badge';
import type { GradientToken } from '@/theme/gradients';

export const CATEGORY_COLOR: Record<CourseCategory, keyof typeof tokens.colors> = {
  navy: 'categoryNavy',
  teal: 'categoryTeal',
  purple: 'categoryPurple',
  amber: 'categoryAmber',
};

export const CATEGORY_TINT: Record<CourseCategory, keyof typeof tokens.colors> = {
  navy: 'primaryMuted',
  teal: 'categoryTealMuted',
  purple: 'categoryPurpleMuted',
  amber: 'warningMuted',
};

export const CATEGORY_GRADIENT: Record<CourseCategory, GradientToken> = {
  navy: 'categoryNavy',
  teal: 'categoryTeal',
  purple: 'categoryPurple',
  amber: 'categoryAmber',
};

export const CATEGORY_ICON: Record<CourseCategory, keyof typeof Ionicons.glyphMap> = {
  navy: 'trending-up',
  teal: 'headset-outline',
  purple: 'globe-outline',
  amber: 'laptop-outline',
};

export const STATUS_LABEL: Record<CourseStatus, string> = {
  in_progress: 'In Progress',
  not_started: 'Not Started',
  completed: 'Completed',
};

export const STATUS_TONE: Record<CourseStatus, BadgeTone> = {
  in_progress: 'success',
  not_started: 'neutral',
  completed: 'primary',
};
