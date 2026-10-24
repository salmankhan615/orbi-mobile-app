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

const DISABLED_ACTION_STRINGS = new Set([
  '',
  'false',
  '0',
  'none',
  'null',
  'undefined',
  'off',
  'no',
  'disabled',
  'deny',
  'denied',
]);

/**
 * EMS action values from `/api/ems/profiles/:id`:
 * - `"all"` / `"own"`
 * - `{ typeScope, accessScope }` (e.g. markAttendance)
 * - `{ enabled: true|false }`
 */
function actionEnabled(value: unknown): boolean {
  if (value == null || value === false || value === 0) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized.length > 0 && !DISABLED_ACTION_STRINGS.has(normalized);
  }
  const row = asRecord(value);
  if (!row) return Boolean(value);

  if ('enabled' in row) return actionEnabled(row.enabled);

  const scopeKeys = [
    'all',
    'own',
    'scope',
    'value',
    'access',
    'typeScope',
    'accessScope',
  ] as const;
  let sawScope = false;
  for (const key of scopeKeys) {
    if (!(key in row)) continue;
    sawScope = true;
    if (actionEnabled(row[key])) return true;
  }
  if (sawScope) return false;

  for (const nested of Object.values(row)) {
    if (nested === true || nested === 'true' || nested === 'all' || nested === 'own') return true;
  }
  return false;
}

/** `GET /api/ems/profiles/:id` → `data.permissions`. */
function extractEmsPermissions(emsProfile: unknown): UnknownRecord | null {
  const root = asRecord(emsProfile);
  if (!root) return null;
  const data = asRecord(root.data) ?? root;
  return asRecord(data?.permissions) ?? asRecord(root.permissions);
}

function permissionsRoot(emsProfile: unknown): UnknownRecord | null {
  return (
    extractEmsPermissions(emsProfile) ?? asRecord(asRecord(emsProfile)?.data) ?? asRecord(emsProfile)
  );
}

/**
 * True when EMS profile includes `permissions.actions` and/or `permissions.modules`.
 */
export function hasUsableEmsPermissions(emsProfile: unknown): boolean {
  const permissions = extractEmsPermissions(emsProfile);
  if (!permissions) return false;

  const actions = permissions.actions;
  if (Array.isArray(actions) && actions.length > 0) return true;
  const actionsRec = asRecord(actions);
  if (actionsRec && Object.keys(actionsRec).length > 0) return true;

  const modules = permissions.modules;
  if (Array.isArray(modules) && modules.length > 0) return true;
  const modulesRec = asRecord(modules);
  if (modulesRec && Object.keys(modulesRec).length > 0) return true;

  return false;
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

/** Honour `permissions.modules.calendar.enabled === false`. */
function isEmsModuleEnabled(emsProfile: unknown, moduleKey: string): boolean {
  const module = findModule(emsProfile, moduleKey);
  if (!module) return true;
  if (module.enabled === false || module.enabled === 'false' || module.enabled === 0) return false;
  return true;
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
      const actions = asActionsRecord(row.actions);
      // Prefer nested `actions` only — never treat the whole row (moduleKey, …) as actions.
      if (moduleKey && actions) out.push({ moduleKey, actions });
    }
    return out;
  }

  const rec = asRecord(raw);
  if (!rec) return out;

  const nested = asActionsRecord(rec.actions);
  const selfKey = normalizeKey(str(rec.moduleKey, rec.key, rec.module));
  if (selfKey && nested) {
    out.push({ moduleKey: selfKey, actions: nested });
    return out;
  }

  for (const [key, value] of Object.entries(rec)) {
    const row = asRecord(value);
    if (!row) continue;
    const actions = asActionsRecord(row.actions) ?? row;
    out.push({ moduleKey: normalizeKey(key), actions });
  }
  return out;
}

/**
 * Resolve `permissions.actions[].find(a => a.moduleKey === m).actions[action]`.
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
  return lookupAction(asActionsRecord(module.actions), action);
}

function hasEmsAction(emsProfile: unknown, moduleKey: string, action: string): boolean {
  if (!isEmsModuleEnabled(emsProfile, moduleKey)) return false;
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

/**
 * CRM `/api/module-permissions/crm/:id` modules are id-keyed (`moduleId` + `access`).
 * Named keys are rare; prefer `adminPermissions` for CRM-only tools.
 */
function crmModuleAccess(crm: unknown, needle: string): boolean {
  const root = crmRoot(crm);
  if (!root) return false;
  const want = compactKey(needle);
  if (!want) return false;
  for (const item of asArray(root.modules)) {
    const row = asRecord(item);
    if (!row) continue;
    const key = compactKey(
      str(row.key, row.moduleKey, row.module, row.name, row.id, typeof item === 'string' ? item : ''),
    );
    if (!key || (key !== want && !key.includes(want))) continue;
    if (row.access === false || row.access === 'false') return false;
    const perms = asRecord(row.permissions);
    if (perms && 'view' in perms) return actionEnabled(perms.view);
    return row.enabled !== false && row.enabled !== 'false';
  }
  return false;
}

export type StaffPermissionInput = {
  role?: string | null;
  type?: string | null;
  /** Raw `GET /api/ems/profiles/:id` response (high priority). */
  emsProfile?: unknown | null;
  /** Raw `GET /api/module-permissions/crm/:id` response (fallback / CRM-only flags). */
  crmModulePermissions?: unknown | null;
  hasEmsProfile?: boolean;
};

/** When EMS profile is missing — CRM admin flags + staff-type heuristics only. */
function mapCrmOnlyStaffPermissions(input: StaffPermissionInput): StaffPermission[] {
  const role = normalizeKey(input.role);
  const type = normalizeKey(input.type);
  const granted = new Set<StaffPermission>();
  const isStaffType =
    type === 'staff' ||
    type.includes('staff') ||
    type.includes('teacher') ||
    type.includes('trainer');

  granted.add('view_announcements');
  if (isStaffType || role.includes('admin')) {
    granted.add('manage_announcements');
  }

  const crm = crmRoot(input.crmModulePermissions);
  const admin = asRecord(crm?.adminPermissions);
  if (crmFlagEnabled(admin?.userManagement)) {
    granted.add('view_users');
  }
  if (crmFlagEnabled(admin?.agreements) || crmModuleAccess(input.crmModulePermissions, 'agreement')) {
    granted.add('view_agreements');
  }
  if (
    isStaffType ||
    crmModuleAccess(input.crmModulePermissions, 'invoice') ||
    crmModuleAccess(input.crmModulePermissions, 'payment')
  ) {
    granted.add('view_invoices');
  }
  if (isStaffType) {
    granted.add('close_calendar');
  }

  return ALL_STAFF_PERMISSIONS.filter((permission) => granted.has(permission));
}

/**
 * Apply EMS action grants (deny-by-default). Does not invent bookings from
 * markAttendance / cancelBooking / calendar.view.
 */
function applyEmsActionGrants(ems: unknown, granted: Set<StaffPermission>) {
  if (hasEmsAction(ems, 'calendar', 'view')) {
    granted.add('view_calendar');
  }
  // Bookings tab/tool — ONLY this action.
  if (hasEmsAction(ems, 'calendar', 'viewBookings')) {
    granted.add('view_bookings');
  }
  if (hasEmsAction(ems, 'calendar', 'markAttendance')) {
    granted.add('mark_attendance');
  }
  if (hasEmsAction(ems, 'calendar', 'cancelBooking')) {
    granted.add('cancel_booking');
  }
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
}

/**
 * CRM admin flags for tools EMS does not define (user directory, agreements).
 * Never used to grant calendar / bookings / groups / coursework when EMS is present.
 */
function applyCrmAdminGrants(crmModulePermissions: unknown, granted: Set<StaffPermission>) {
  const crm = crmRoot(crmModulePermissions);
  const admin = asRecord(crm?.adminPermissions);
  if (crmFlagEnabled(admin?.userManagement)) {
    granted.add('view_users');
  }
  if (crmFlagEnabled(admin?.agreements) || crmModuleAccess(crmModulePermissions, 'agreement')) {
    granted.add('view_agreements');
  }
  if (
    crmModuleAccess(crmModulePermissions, 'invoice') ||
    crmModuleAccess(crmModulePermissions, 'payment')
  ) {
    granted.add('view_invoices');
  }
}

/**
 * Map staff tool flags from both permission APIs:
 * 1. **EMS** `GET /api/ems/profiles/:id` — high priority for calendar, bookings,
 *    groups, coursework, shifts, announcements.
 * 2. **CRM** `GET /api/module-permissions/crm/:id` — `adminPermissions` for users /
 *    agreements (and legacy fallback when EMS is missing).
 */
export function mapStaffPermissions(input: StaffPermissionInput): StaffPermission[] {
  const role = normalizeKey(input.role);

  if (role === 'admin' || role === 'superadmin' || role === 'super_admin') {
    return [...ALL_STAFF_PERMISSIONS];
  }

  const ems = input.emsProfile;
  const hasEms =
    Boolean(input.hasEmsProfile && ems) || (ems != null && hasUsableEmsPermissions(ems));

  if (!hasEms) {
    return mapCrmOnlyStaffPermissions(input);
  }

  const granted = new Set<StaffPermission>();
  // Read inbox stays available; create/edit needs EMS announcements actions.
  granted.add('view_announcements');

  applyEmsActionGrants(ems, granted);
  applyCrmAdminGrants(input.crmModulePermissions, granted);

  return ALL_STAFF_PERMISSIONS.filter((permission) => granted.has(permission));
}
