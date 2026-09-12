import type { StaffPermission, UserRole } from '@/features/auth/permissions';
import { ALL_STAFF_PERMISSIONS } from '@/features/auth/permissions';

/** Labels CRM uses for learners (ORBI web checks `role === "Student"`). */
const STUDENT_LABELS = new Set([
  'student',
  'trainee',
  'learner',
  'candidate',
  'applicant',
]);

/** Labels / substrings that mean staff-side CRM access. */
const STAFF_LABELS = new Set([
  'staff',
  'admin',
  'superadmin',
  'super_admin',
  'trainer',
  'instructor',
  'teacher',
  'employee',
  'manager',
  'company',
  'tutor',
  'assessor',
]);

function normalizeLabel(value?: string | null): string {
  return (value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function isStaffLabel(normalized: string): boolean {
  if (!normalized) return false;
  if (STAFF_LABELS.has(normalized)) return true;
  if (normalized.includes('admin')) return true;
  if (normalized.includes('staff')) return true;
  if (normalized.includes('trainer')) return true;
  if (normalized.includes('instructor')) return true;
  return false;
}

function isStudentLabel(normalized: string): boolean {
  if (!normalized) return false;
  return STUDENT_LABELS.has(normalized);
}

export type CrmRoleInput = {
  role?: string | null;
  type?: string | null;
  /** Populated CRM role document id when present. */
  roleId?: string | null;
  profileId?: string | null;
  emsProfileId?: string | null;
};

/**
 * Map CRM `role` / `type` (login + getUser) onto app `student` | `staff`.
 * Students are explicit; everything else that looks like CRM staff is staff.
 */
export function mapCrmRole(input: CrmRoleInput): UserRole {
  const role = normalizeLabel(input.role);
  const type = normalizeLabel(input.type);

  if (isStudentLabel(role) || isStudentLabel(type)) return 'student';
  if (isStaffLabel(role) || isStaffLabel(type)) return 'staff';

  // EMS / CRM profile attachment is staff tooling, not student LMS.
  if (input.emsProfileId || (input.profileId && !isStudentLabel(role))) {
    return 'staff';
  }

  // Unknown CRM labels default to student (self-register creates students).
  return 'student';
}

export function permissionsForRole(role: UserRole): StaffPermission[] {
  return role === 'staff' ? [...ALL_STAFF_PERMISSIONS] : [];
}

export function formatRoleLabel(rawRole?: string | null, role?: UserRole): string {
  const trimmed = (rawRole ?? '').trim();
  if (trimmed) {
    if (/^super_?admin$/i.test(trimmed)) return 'Super Admin';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  return role === 'staff' ? 'Staff' : 'Student';
}
