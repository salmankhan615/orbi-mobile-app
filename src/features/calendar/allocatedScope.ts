/**
 * Derive which calendar events a student may see from slim
 * `get-allocate-course` packs — matches ORBI web Network calendar filtering.
 */

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function idOf(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') {
    const id = String(value).trim();
    return id || null;
  }
  const record = asRecord(value);
  if (!record) return null;
  if (record._id != null) return String(record._id);
  if (record.$oid != null) return String(record.$oid);
  if (record.id != null) return String(record.id);
  return null;
}

function toDay(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  if (!raw) return '';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function addIds(target: Set<string>, values: unknown) {
  if (values == null || values === '') return;
  const list = Array.isArray(values) ? values : [values];
  for (const item of list) {
    const id = idOf(item);
    if (id) target.add(id);
  }
}

export type AllocatedCalendarScope = {
  categoryIds: Set<string>;
  classTypeIds: Set<string>;
};

/** Group- or class-scoped audience windows used by the web calendar filter. */
export type AllocatedCalendarRule =
  | {
      type: 'group';
      groupId: string;
      classTypeIds: string[];
      startDate?: string;
      endDate?: string;
    }
  | {
      type: 'class';
      classTypeId: string;
      startDate?: string;
      endDate?: string;
    };

/**
 * Categories from `courseSetting.courseCategory`; class types from
 * `courseSetting.courseClasses` + section `classes` (honouring accessControl).
 */
export function collectAllocatedCalendarScope(packs: unknown[]): AllocatedCalendarScope {
  const categoryIds = new Set<string>();
  const classTypeIds = new Set<string>();

  for (const pack of packs) {
    const allocation = asRecord(pack);
    for (const courseRowRaw of asArray(allocation?.courses)) {
      const courseRow = asRecord(courseRowRaw);
      if (!courseRow) continue;
      const course =
        asRecord(courseRow.courseId) ?? asRecord(courseRow.course) ?? asRecord(courseRow);
      if (!course || !idOf(course._id)) continue;
      if (course.coursePublished === false || course.deletedAt) continue;

      for (const settingRaw of asArray(course.courseSetting)) {
        const setting = asRecord(settingRaw);
        if (!setting) continue;
        addIds(categoryIds, setting.courseCategory);
        addIds(classTypeIds, setting.courseClasses);
      }

      for (const classTypeId of classIdsForCourseRow(courseRow, course)) {
        classTypeIds.add(classTypeId);
      }
    }
  }

  return { categoryIds, classTypeIds };
}

function classIdsForCourseRow(courseRow: UnknownRecord, course: UnknownRecord): string[] {
  const access = asRecord(courseRow.accessControl);
  const allowed = new Set<string>();
  addIds(allowed, access?.allowedSections);
  // Missing accessControl (or explicit fullAccess) → every section's classes.
  const fullAccess = !access || access.fullAccess === true || access.fullAccess === 'true';

  const out: string[] = [];
  for (const sectionRaw of asArray(course.courseSection)) {
    const section = asRecord(sectionRaw);
    if (!section) continue;
    const sectionId = idOf(section._id);
    if (!fullAccess && sectionId && allowed.size > 0 && !allowed.has(sectionId)) {
      continue;
    }
    if (!fullAccess && allowed.size === 0) continue;
    for (const classRaw of asArray(section.classes)) {
      const id = idOf(classRaw);
      if (id) out.push(id);
    }
  }
  return out;
}

function allocationWindow(courseRow: UnknownRecord): { startDate?: string; endDate?: string } {
  const startDate = toDay(courseRow.startDate) || undefined;
  let endDate = toDay(courseRow.endDate) || undefined;
  for (const overrideRaw of asArray(courseRow.overrides)) {
    const override = asRecord(overrideRaw);
    const extended = toDay(override?.extendedEndDate);
    if (extended && (!endDate || extended > endDate)) endDate = extended;
  }
  return { startDate, endDate };
}

/**
 * ORBI Network calendar rules: either a group + its class types, or bare class
 * types, each with the allocation date window.
 */
export function collectAllocatedCalendarRules(packs: unknown[]): AllocatedCalendarRule[] {
  const rules: AllocatedCalendarRule[] = [];

  for (const pack of packs) {
    const allocation = asRecord(pack);
    for (const courseRowRaw of asArray(allocation?.courses)) {
      const courseRow = asRecord(courseRowRaw);
      if (!courseRow) continue;
      const course =
        asRecord(courseRow.courseId) ?? asRecord(courseRow.course) ?? asRecord(courseRow);
      if (!course || !idOf(course._id)) continue;
      if (course.coursePublished === false || course.deletedAt) continue;

      const classTypeIds = classIdsForCourseRow(courseRow, course);
      if (classTypeIds.length === 0) continue;
      const { startDate, endDate } = allocationWindow(courseRow);
      const groupId = idOf(courseRow.groupId);

      if (groupId) {
        rules.push({ type: 'group', groupId, classTypeIds, startDate, endDate });
      } else {
        for (const classTypeId of classTypeIds) {
          rules.push({ type: 'class', classTypeId, startDate, endDate });
        }
      }
    }
  }

  return rules;
}

function dateInWindow(iso: string, startDate?: string, endDate?: string): boolean {
  if (startDate && iso < startDate) return false;
  if (endDate && iso > endDate) return false;
  return true;
}

/** Same predicate the web calendar applies after getClassCalendar + allocate-course. */
export function studentClassVisible(params: {
  rules: AllocatedCalendarRule[];
  statusLabel?: string;
  classTypeId?: string;
  groupId?: string;
  date: string;
}): boolean {
  const { rules, statusLabel, classTypeId, groupId, date } = params;
  if (!date) return false;
  const status = (statusLabel ?? '').trim().toLowerCase();
  if (status && status !== 'active') return false;
  if (rules.length === 0) return false;

  return rules.some((rule) => {
    if (rule.type === 'group') {
      if (!groupId || groupId !== rule.groupId) return false;
      if (!classTypeId || !rule.classTypeIds.includes(classTypeId)) return false;
      return dateInWindow(date, rule.startDate, rule.endDate);
    }
    if (!classTypeId || classTypeId !== rule.classTypeId) return false;
    return dateInWindow(date, rule.startDate, rule.endDate);
  });
}
