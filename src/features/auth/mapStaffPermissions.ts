import type { StaffPermission } from '@/features/auth/permissions';
import { ALL_STAFF_PERMISSIONS } from '@/features/auth/permissions';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function normalizeRole(value?: string | null): string {
  return (value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

/** Truthy EMS action scope — presence means enabled (`'all'`, `'own'`, dual-scope object). */
function actionEnabled(value: unknown): boolean {
  if (value == null || value === false || value === 'false' || value === 0 || value === '0') {
    return false;
  }
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'object') return Object.keys(value as object).length > 0;
  return Boolean(value);
}

/**
 * Resolve `permissions.actions[].find(a => a.moduleKey === m).actions[action]`.
 * Also accepts a flat `permissions.modules[module].actions[action]` shape.
 */
export function readEmsAction(
  emsProfile: unknown,
  moduleKey: string,
  action: string,
): unknown {
  const root = asRecord(emsProfile);
  const data = asRecord(root?.data) ?? root;
  const permissions = asRecord(data?.permissions) ?? asRecord(root?.permissions);
  if (!permissions) return undefined;

  for (const entry of asArray(permissions.actions)) {
    const row = asRecord(entry);
    if (!row) continue;
    if (str(row.moduleKey, row.key, row.module) !== moduleKey) continue;
    const actions = asRecord(row.actions) ?? asRecord(row);
    return actions?.[action];
  }

  const modules = asRecord(permissions.modules);
  const module = asRecord(modules?.[moduleKey]);
  const actions = asRecord(module?.actions);
  if (actions) return actions[action];
  return module?.[action];
}

function hasEmsAction(emsProfile: unknown, moduleKey: string, action: string): boolean {
  return actionEnabled(readEmsAction(emsProfile, moduleKey, action));
}

function moduleEnabled(emsProfile: unknown, moduleKey: string): boolean {
  const root = asRecord(emsProfile);
  const data = asRecord(root?.data) ?? root;
  const permissions = asRecord(data?.permissions) ?? asRecord(root?.permissions);
  const modules = asRecord(permissions?.modules);
  const module = asRecord(modules?.[moduleKey]);
  if (!module) return true;
  if (module.enabled === false || module.enabled === 'false') return false;
  return true;
}

export type StaffPermissionInput = {
  role?: string | null;
  type?: string | null;
  /** Raw EMS profile response (or its `data`). Null/undefined = no profile. */
  emsProfile?: unknown | null;
  crmModulePermissions?: unknown | null;
  /** True when getUser had an emsProfileId and the profile fetch succeeded. */
  hasEmsProfile?: boolean;
};

/**
 * Map EMS + CRM permission payloads onto app `StaffPermission` flags.
 * Mirrors staff API §2: admin/superAdmin allow-all; missing EMS profile denies EMS-gated screens.
 */
export function mapStaffPermissions(input: StaffPermissionInput): StaffPermission[] {
  const role = normalizeRole(input.role);
  const type = normalizeRole(input.type);

  if (role === 'admin' || role === 'superadmin' || role === 'super_admin') {
    return [...ALL_STAFF_PERMISSIONS];
  }

  const granted = new Set<StaffPermission>();
  const isStaffType = type === 'staff' || type.includes('staff') || type.includes('teacher');

  // Announcements — session for read; create is role/type based (EMS module unused on write).
  granted.add('view_announcements');
  if (isStaffType || role.includes('admin')) {
    granted.add('manage_announcements');
  }

  const crm = asRecord(input.crmModulePermissions);
  const admin = asRecord(crm?.adminPermissions);
  const userMgmt = asRecord(admin?.userManagement);
  // userManagement is unenforced server-side; honour explicit `enabled: false` only.
  if (!crm || userMgmt == null || userMgmt.enabled !== false) {
    granted.add('view_users');
  }
  if (asRecord(admin?.agreements)?.enabled) {
    granted.add('view_agreements');
  }

  // adminOnly routes also pass for type === 'staff'.
  if (isStaffType) {
    granted.add('view_invoices');
    granted.add('close_calendar');
  }

  const hasEms = Boolean(input.hasEmsProfile && input.emsProfile);
  if (!hasEms) {
    // No EMS profile → EMS-gated endpoints 403. Keep only auth / CRM-admin screens above.
    return ALL_STAFF_PERMISSIONS.filter((permission) => granted.has(permission));
  }

  const ems = input.emsProfile;

  if (hasEmsAction(ems, 'calendar', 'viewBookings') || hasEmsAction(ems, 'calendar', 'view')) {
    granted.add('view_bookings');
  }
  if (hasEmsAction(ems, 'calendar', 'markAttendance')) granted.add('mark_attendance');
  if (hasEmsAction(ems, 'calendar', 'cancelBooking')) granted.add('cancel_booking');
  if (hasEmsAction(ems, 'calendar', 'closureManagement')) granted.add('close_calendar');
  if (hasEmsAction(ems, 'calendar', 'manageShifts')) granted.add('view_shifts');

  if (moduleEnabled(ems, 'groups') && hasEmsAction(ems, 'groups', 'view')) {
    granted.add('view_groups');
    granted.add('view_group_sessions');
  }
  if (hasEmsAction(ems, 'groups', 'manageCoursework')) {
    granted.add('view_coursework');
    granted.add('view_submissions');
  }
  if (hasEmsAction(ems, 'courses', 'invoiceManagement')) {
    granted.add('view_invoices');
  }

  return ALL_STAFF_PERMISSIONS.filter((permission) => granted.has(permission));
}
