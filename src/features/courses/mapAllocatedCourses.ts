/**
 * Map CRM `get-allocate-course` payloads into the app `Course` model.
 * Field names and progress math mirror the ORBI student Courses page.
 */

import type {
  Course,
  CourseCategory,
  CourseLevel,
  CourseModule,
  CourseStatus,
  Lesson,
} from '@/api/courses';

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

function str(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

const CATEGORY_CYCLE: CourseCategory[] = ['navy', 'teal', 'purple', 'amber'];

function hashCategory(seed: string): CourseCategory {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return CATEGORY_CYCLE[hash % CATEGORY_CYCLE.length];
}

/** CRM progress: completed panels in accessible published sections / total panels. */
export function crmCourseProgress(course: UnknownRecord | null, courseRow: UnknownRecord | null): number {
  if (!course) return 0;
  const access = asRecord(courseRow?.accessControl);
  const lessonProgress = asArray(courseRow?.lessonProgress);
  const sections = asArray(course.courseSection).filter((section) => {
    const row = asRecord(section);
    if (!row?.isPublished) return false;
    if (!access || access.fullAccess) return true;
    const allowed = asArray(access.allowedSections);
    const sectionId = idOf(row._id);
    return allowed.some((item) => idOf(item) === sectionId);
  });

  let total = 0;
  let done = 0;
  for (const section of sections) {
    for (const panel of asArray(asRecord(section)?.panels)) {
      total += 1;
      const panelId = idOf(asRecord(panel)?._id);
      const completed = lessonProgress.some((item) => {
        const row = asRecord(item);
        return idOf(row?.lessonId) === panelId && row?.isCompleted === true;
      });
      if (completed) done += 1;
    }
  }

  if (total > 0) return Math.round((done / total) * 100);

  for (const key of ['progress', 'completion', 'percentComplete', 'completedPercent']) {
    if (course[key] != null) {
      const n = Number(course[key]);
      if (Number.isFinite(n)) return Math.min(100, Math.max(0, Math.round(n)));
    }
  }
  return 0;
}

function isAccessExpired(courseRow: UnknownRecord | null): boolean {
  if (!courseRow) return false;
  if (String(courseRow.accessType) === 'Free' && !courseRow.endDate) return false;
  let endDate = courseRow.endDate;
  for (const item of asArray(courseRow.overrides)) {
    const row = asRecord(item);
    if (!row?.extendedEndDate) continue;
    const extended = new Date(String(row.extendedEndDate));
    if (!endDate || extended > new Date(String(endDate))) endDate = row.extendedEndDate;
  }
  if (!endDate) return false;
  const end = new Date(String(endDate));
  end.setHours(23, 59, 59, 999);
  return new Date() > end;
}

function statusFromProgress(progress: number, expired: boolean): CourseStatus {
  if (expired) return 'not_started';
  if (progress >= 100) return 'completed';
  if (progress > 0) return 'in_progress';
  return 'not_started';
}

function mapModules(course: UnknownRecord): CourseModule[] {
  const sections = asArray(course.courseSection);
  if (sections.length === 0) return [];

  return sections.map((section, sectionIndex) => {
    const row = asRecord(section) ?? {};
    const panels = asArray(row.panels);
    const lessons: Lesson[] = panels.map((panel, panelIndex) => {
      const item = asRecord(panel) ?? {};
      const title = str(item.panelTitle, item.title, item.name, `Lesson ${panelIndex + 1}`);
      const video =
        str(item.videoUrl, item.video, item.mediaUrl) ||
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      return {
        id: idOf(item._id) ?? `${sectionIndex}-${panelIndex}`,
        title,
        status: item.isCompleted === true ? 'done' : panelIndex === 0 ? 'current' : 'locked',
        durationLabel: str(item.durationLabel, item.duration) || '—',
        description: str(item.description, item.content, item.panelDescription) || title,
        videoUrl: video,
      };
    });

    return {
      id: idOf(row._id) ?? `section-${sectionIndex}`,
      title: str(row.sectionTitle, row.title, row.name, `Module ${sectionIndex + 1}`),
      lessons,
    };
  });
}

function mapLevel(course: UnknownRecord): CourseLevel {
  const raw = str(course.level, course.courseLevel).toLowerCase();
  if (raw.includes('adv')) return 'Advanced';
  if (raw.includes('inter')) return 'Intermediate';
  return 'Beginner';
}

export interface AllocatedCourseRow {
  allocationId: string;
  courseRowId: string;
  course: UnknownRecord;
  courseRow: UnknownRecord;
}

/** Flatten CRM allocate-course packs the same way the web Courses page does. */
export function flattenAllocatedCourseRows(packs: unknown[]): AllocatedCourseRow[] {
  const rows: AllocatedCourseRow[] = [];
  packs.forEach((pack, packIndex) => {
    const allocation = asRecord(pack);
    asArray(allocation?.courses).forEach((courseRowRaw, rowIndex) => {
      const courseRow = asRecord(courseRowRaw);
      if (!courseRow) return;
      const course =
        asRecord(courseRow.courseId) ?? asRecord(courseRow.course) ?? asRecord(courseRow);
      if (!course || !idOf(course._id)) return;
      if (course.coursePublished === false || course.deletedAt) return;
      rows.push({
        allocationId: idOf(allocation?._id) ?? `allocation-${packIndex}`,
        courseRowId: idOf(courseRow._id) ?? `${packIndex}-${rowIndex}`,
        course,
        courseRow,
      });
    });
  });
  return rows;
}

export function mapAllocatedCoursesToApp(packs: unknown[]): Course[] {
  return flattenAllocatedCourseRows(packs).map(({ course, courseRow }) => {
    const id = idOf(course._id)!;
    const progress = crmCourseProgress(course, courseRow);
    const expired = isAccessExpired(courseRow);
    const modules = mapModules(course);
    const title = str(course.courseTitle, course.title, course.name) || 'Untitled course';

    return {
      id,
      title,
      description: str(course.courseDescription, course.description, course.overview) || title,
      category: hashCategory(id),
      status: statusFromProgress(progress, expired),
      progress,
      moduleCount: modules.length || Number(course.moduleCount) || 0,
      level: mapLevel(course),
      modules,
    };
  });
}

export function mapCourseDetailToApp(raw: unknown, fallbackId: string): Course | undefined {
  const root = asRecord(raw);
  const course = asRecord(root?.data) ?? asRecord(root?.course) ?? root;
  if (!course) return undefined;
  const id = idOf(course._id) ?? fallbackId;
  const modules = mapModules(course);
  const title = str(course.courseTitle, course.title, course.name) || 'Untitled course';
  const progress = crmCourseProgress(course, asRecord(root?.courseRow) ?? course);

  return {
    id,
    title,
    description: str(course.courseDescription, course.description, course.overview) || title,
    category: hashCategory(id),
    status: statusFromProgress(progress, false),
    progress,
    moduleCount: modules.length || Number(course.moduleCount) || 0,
    level: mapLevel(course),
    modules,
  };
}
