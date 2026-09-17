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

function normalizeKey(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function compactKey(value?: string | null): string {
  return normalizeKey(value).replace(/_/g, '');
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

function permissionsRoot(emsProfile: unknown): UnknownRecord | null {
  const root = asRecord(emsProfile);
  const data = asRecord(root?.data) ?? root;
  return asRecord(data?.permissions) ?? asRecord(root?.permissions) ?? data;
}

function lookupAction(actions: UnknownRecord | null, action: string): unknown {
  if (!actions) return undefined;
  if (action in actions) return actions[action];
  const want = compactKey(action);
  for (const [key, value] of Object.entries(actions)) {
    if (compactKey(key) === want) return value;
  }
  return undefined;
}

type ModuleEntry = { key: string; row: UnknownRecord };

function moduleEntries(emsProfile: unknown): ModuleEntry[] {
  const permissions = permissionsRoot(emsProfile);
  const raw = permissions?.modules ?? asRecord(emsProfile)?.modules;
  const out: ModuleEntry[] = [];

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const row = asRecord(item);
      if (!row) continue;
      const key = normalizeKey(str(row.moduleKey, row.key, row.module, row.name, row.id));
      if (key) out.push({ key, row });
    }
    return out;
  }

  const rec = asRecord(raw);
  if (!rec) return out;
  for (const [key, value] of Object.entries(rec)) {
    const row = asRecord(value) ?? {};
    out.push({ key: normalizeKey(key), row });
  }
  return out;
}

function moduleKeyMatches(actual: string, want: string): boolean {
  if (!actual || !want) return false;
  if (actual === want || actual.endsWith(`_${want}`)) return true;
  const compactActual = compactKey(actual);
  const compactWant = compactKey(want);
  return compactActual === compactWant || compactActual.endsWith(compactWant);
}

function asActionsRecord(value: unknown): UnknownRecord | null {
  const rec = asRecord(value);
  if (rec) return rec;
  if (!Array.isArray(value)) return null;
  const out: UnknownRecord = {};
  for (const item of value) {
    if (typeof item === 'string' && item.trim()) {
      out[item.trim()] = true;
      continue;
    }
    const row = asRecord(item);
    if (!row) continue;
    const key = str(row.key, row.action, row.name, row.id);
    if (key) out[key] = row.enabled ?? true;
  }
  return Object.keys(out).length ? out : null;
}

function findModule(emsProfile: unknown, moduleKey: string): UnknownRecord | null {
  const want = normalizeKey(moduleKey);
  for (const entry of moduleEntries(emsProfile)) {
    if (moduleKeyMatches(entry.key, want)) return entry.row;
  }
  return null;
}

function actionBundles(emsProfile: unknown): { moduleKey: string; actions: UnknownRecord }[] {
  const permissions = permissionsRoot(emsProfile);
  const raw = permissions?.actions;
  const out: { moduleKey: string; actions: UnknownRecord }[] = [];

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const row = asRecord(item);
      if (!row) continue;
      const moduleKey = normalizeKey(str(row.moduleKey, row.key, row.module));
      const actions = asActionsRecord(row.actions) ?? asRecord(row);
      if (moduleKey && actions) out.push({ moduleKey, actions });
    }
    return out;
  }

  const rec = asRecord(raw);
  if (!rec) return out;

  const nested = asActionsRecord(rec.actions);
  const selfKey = normalizeKey(str(rec.moduleKey, rec.key, rec.module));
  if (selfKey && (nested || rec.view || rec.viewBookings)) {
    out.push({ moduleKey: selfKey, actions: nested ?? rec });
    return out;
  }

  for (const [key, value] of Object.entries(rec)) {
    const row = asRecord(value);
    if (!row) continue;
    out.push({
      moduleKey: normalizeKey(key),
      actions: asActionsRecord(row.actions) ?? row,
    });
  }
  return out;
}

/**
 * Resolve `permissions.actions[].find(a => a.moduleKey === m).actions[action]`.
 * Also accepts a flat `permissions.modules[module].actions[action]` shape,
 * arrays of modules, and case/snake/camel action names.
 */
export function readEmsAction(emsProfile: unknown, moduleKey: string, action: string): unknown {
  const want = normalizeKey(moduleKey);
  for (const bundle of actionBundles(emsProfile)) {
    if (!moduleKeyMatches(bundle.moduleKey, want)) continue;
    const value = lookupAction(bundle.actions, action);
    if (value !== undefined) return value;
  }

  const module = findModule(emsProfile, moduleKey);
  if (!module) return undefined;
  const fromActions = lookupAction(asActionsRecord(module.actions), action);
  if (fromActions !== undefined) return fromActions;
  return lookupAction(module, action);
}

function hasEmsAction(emsProfile: unknown, moduleKey: string, action: string): boolean {
  return actionEnabled(readEmsAction(emsProfile, moduleKey, action));
}

function crmRoot(crm: unknown): UnknownRecord | null {
  const root = asRecord(crm);
  if (!root) return null;
  return asRecord(root.data) ?? root;
}

function crmFlagEnabled(value: unknown): boolean {
  const row = asRecord(value);
  if (!row) return value === true || value === 'true';
  return row.enabled === true || row.enabled === 'true';
}

function crmModuleEnabled(crm: unknown, needle: string): boolean {
  const root = crmRoot(crm);
  if (!root) return false;
  const want = compactKey(needle);
  if (!want) return false;
  for (const item of asArray(root.modules)) {
    const row = asRecord(item);
    const key = compactKey(
      str(
        row?.key,
        row?.moduleKey,
        row?.module,
        row?.name,
        row?.id,
        typeof item === 'string' ? item : '',
      ),
    );
    if (!key) continue;
    if (key === want || key.includes(want)) {
      if (!row) return true;
      return row.enabled !== false && row.enabled !== 'false';
    }
  }
  return false;
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
 * Deny-by-default: only admin/superAdmin get every tool. Everyone else must
 * have the matching EMS action or CRM admin flag.
 */
export function mapStaffPermissions(input: StaffPermissionInput): StaffPermission[] {
  const role = normalizeKey(input.role);

  if (role === 'admin' || role === 'superadmin' || role === 'super_admin') {
    return [...ALL_STAFF_PERMISSIONS];
  }

  const granted = new Set<StaffPermission>();

  // Announcements list is visible to signed-in staff; create/edit is gated below.
  granted.add('view_announcements');

  const crm = crmRoot(input.crmModulePermissions);
  const admin = asRecord(crm?.adminPermissions);
  if (crmFlagEnabled(admin?.userManagement)) {
    granted.add('view_users');
  }
  if (
    crmFlagEnabled(admin?.agreements) ||
    crmModuleEnabled(input.crmModulePermissions, 'agreement')
  ) {
    granted.add('view_agreements');
  }
  if (
    crmModuleEnabled(input.crmModulePermissions, 'invoice') ||
    crmModuleEnabled(input.crmModulePermissions, 'payment')
  ) {
    granted.add('view_invoices');
  }

  const hasEms = Boolean(input.hasEmsProfile && input.emsProfile);
  if (!hasEms) {
    return ALL_STAFF_PERMISSIONS.filter((permission) => granted.has(permission));
  }

  const ems = input.emsProfile;

  if (hasEmsAction(ems, 'calendar', 'viewBookings') || hasEmsAction(ems, 'calendar', 'view')) {
    granted.add('view_bookings');
    granted.add('view_calendar');
  }
  if (hasEmsAction(ems, 'calendar', 'markAttendance')) granted.add('mark_attendance');
  if (hasEmsAction(ems, 'calendar', 'cancelBooking')) granted.add('cancel_booking');
  if (hasEmsAction(ems, 'calendar', 'edit')) {
    granted.add('edit_calendar');
    granted.add('view_calendar');
  }
  if (hasEmsAction(ems, 'calendar', 'closureManagement')) {
    granted.add('close_calendar');
    granted.add('view_calendar');
  }
  if (hasEmsAction(ems, 'calendar', 'manageShifts')) {
    granted.add('view_shifts');
    granted.add('view_calendar');
  }

  if (hasEmsAction(ems, 'groups', 'view')) {
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

  if (
    hasEmsAction(ems, 'announcements', 'create') ||
    hasEmsAction(ems, 'announcements', 'edit') ||
    hasEmsAction(ems, 'announcements', 'manage') ||
    hasEmsAction(ems, 'announcements', 'write')
  ) {
    granted.add('manage_announcements');
  }

  if (hasEmsAction(ems, 'users', 'view') || hasEmsAction(ems, 'users', 'manage')) {
    granted.add('view_users');
  }

  return ALL_STAFF_PERMISSIONS.filter((permission) => granted.has(permission));
}
