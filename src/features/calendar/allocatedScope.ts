/**
 * Derive which calendar categories / class types a student may see from
 * slim `get-allocate-course` packs.
 */

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' ? (value as UnknownRecord) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function idOf(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  const record = asRecord(value);
  if (!record) return null;
  if (record._id != null) return String(record._id);
  if (record.$oid != null) return String(record.$oid);
  return null;
}

export type AllocatedCalendarScope = {
  categoryIds: Set<string>;
  classTypeIds: Set<string>;
};

function addIds(target: Set<string>, values: unknown) {
  for (const item of asArray(values)) {
    const id = idOf(item) ?? (typeof item === 'string' ? item : null);
    if (id) target.add(id);
  }
}

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

      const access = asRecord(courseRow.accessControl);
      const fullAccess = access?.fullAccess !== false;
      const allowed = new Set<string>();
      addIds(allowed, access?.allowedSections);

      for (const sectionRaw of asArray(course.courseSection)) {
        const section = asRecord(sectionRaw);
        if (!section) continue;
        const sectionId = idOf(section._id);
        if (!fullAccess && sectionId && allowed.size > 0 && !allowed.has(sectionId)) {
          continue;
        }
        addIds(classTypeIds, section.classes);
      }
    }
  }

  return { categoryIds, classTypeIds };
}
