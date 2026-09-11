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
  LessonMedia,
  LessonMediaType,
} from '@/api/courses';
import { crmCourseMediaUrl } from '@/api/crmMedia';
import { stripHtml } from '@/utils/stripHtml';

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

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function mediaTypeOf(raw: unknown): LessonMediaType {
  const value = str(raw).toUpperCase();
  if (value === 'VIDEO') return 'VIDEO';
  if (value === 'PDF') return 'PDF';
  if (value === 'IMAGE') return 'IMAGE';
  return 'FILE';
}

function mapPanelMedia(panel: UnknownRecord): LessonMedia[] {
  const items: LessonMedia[] = [];
  for (const raw of asArray(panel.media)) {
    const row = asRecord(raw);
    if (!row) continue;
    const type = mediaTypeOf(row.type);
    const key = str(row.url, row.key, row.path, row.filename);
    const url = crmCourseMediaUrl(key, type);
    if (!url) continue;
    items.push({
      id: idOf(row._id) ?? key,
      type,
      url,
      filename: str(row.filename, row.name, key) || key,
    });
  }
  // Legacy single-field video URLs (mocks / older payloads).
  if (items.length === 0) {
    const legacy = str(panel.videoUrl, panel.video, panel.mediaUrl);
    if (legacy) {
      const url = crmCourseMediaUrl(legacy, 'VIDEO');
      items.push({
        id: `${idOf(panel._id) ?? 'legacy'}-video`,
        type: 'VIDEO',
        url,
        filename: legacy.split('/').pop() || 'video.mp4',
      });
    }
  }
  return items;
}

function isPlaceholderContent(value: string): boolean {
  const t = value.trim();
  if (!t) return true;
  return /^panel\s*\d+$/i.test(t);
}

/** Quiz-only panels are out of scope for the mobile app. */
function isQuizOnlyPanel(panel: UnknownRecord, media: LessonMedia[]): boolean {
  const quizzes = asArray(panel.quizzes);
  if (quizzes.length === 0) return false;
  if (media.length > 0) return false;
  const content = stripHtml(str(panel.content, panel.description, panel.panelDescription));
  return isPlaceholderContent(content);
}

function sectionIsAccessible(section: UnknownRecord, courseRow: UnknownRecord | null): boolean {
  if (!section.isPublished) return false;
  const access = asRecord(courseRow?.accessControl);
  if (!access || access.fullAccess) return true;
  const allowed = asArray(access.allowedSections);
  const sectionId = idOf(section._id);
  return allowed.some((item) => idOf(item) === sectionId);
}

function completedLessonIds(courseRow: UnknownRecord | null): Set<string> {
  const done = new Set<string>();
  for (const item of asArray(courseRow?.lessonProgress)) {
    const row = asRecord(item);
    if (!row) continue;
    const completed = row.isCompleted === true || row.isCompleted === 'true' || row.isCompleted === 1;
    if (!completed) continue;
    const lessonId = idOf(row.lessonId) ?? (row.lessonId != null ? String(row.lessonId) : null);
    if (lessonId) done.add(lessonId);
  }
  return done;
}

function panelIdentityIds(panel: UnknownRecord): string[] {
  const ids: string[] = [];
  const mongo = idOf(panel._id);
  if (mongo) ids.push(mongo);
  if (panel.id != null && String(panel.id) !== mongo) ids.push(String(panel.id));
  return ids;
}

function panelIsCompleted(panel: UnknownRecord, completed: Set<string>): boolean {
  return panelIdentityIds(panel).some((id) => completed.has(id));
}

function durationLabelFor(media: LessonMedia[]): string {
  const videos = media.filter((item) => item.type === 'VIDEO').length;
  const pdfs = media.filter((item) => item.type === 'PDF').length;
  const images = media.filter((item) => item.type === 'IMAGE').length;
  const parts: string[] = [];
  if (videos) parts.push(videos === 1 ? '1 video' : `${videos} videos`);
  if (pdfs) parts.push(pdfs === 1 ? '1 PDF' : `${pdfs} PDFs`);
  if (images) parts.push(images === 1 ? '1 image' : `${images} images`);
  return parts.join(' · ') || '—';
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
  const completed = completedLessonIds(courseRow);
  const sections = asArray(course.courseSection).filter((section) => {
    const row = asRecord(section);
    return row ? sectionIsAccessible(row, courseRow) : false;
  });

  let total = 0;
  let done = 0;
  for (const section of sections) {
    const sectionRow = asRecord(section) ?? {};
    for (const panel of asArray(sectionRow.panels)) {
      const item = asRecord(panel);
      if (!item) continue;
      const media = mapPanelMedia(item);
      if (isQuizOnlyPanel(item, media)) continue;
      total += 1;
      if (panelIsCompleted(item, completed)) done += 1;
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

/** Effective allocation end (base `endDate` or latest `overrides.extendedEndDate`). */
export function effectiveAccessEndDate(courseRow: UnknownRecord | null): Date | null {
  if (!courseRow) return null;
  if (String(courseRow.accessType) === 'Free' && !courseRow.endDate) return null;
  let endDate = courseRow.endDate;
  for (const item of asArray(courseRow.overrides)) {
    const row = asRecord(item);
    if (!row?.extendedEndDate) continue;
    const extended = new Date(String(row.extendedEndDate));
    if (!endDate || extended > new Date(String(endDate))) endDate = row.extendedEndDate;
  }
  if (!endDate) return null;
  const end = new Date(String(endDate));
  if (Number.isNaN(end.getTime())) return null;
  end.setHours(23, 59, 59, 999);
  return end;
}

/** Same end-date / override rules as the ORBI My Courses Active vs Access Expired badge. */
export function isAccessExpired(courseRow: UnknownRecord | null): boolean {
  const end = effectiveAccessEndDate(courseRow);
  return end != null && new Date() > end;
}

/** Portal-style label: "06 Sep 2026". */
export function formatAccessEndLabel(end: Date): string {
  const day = String(end.getDate()).padStart(2, '0');
  const month = end.toLocaleDateString('en-GB', { month: 'short' });
  return `${day} ${month} ${end.getFullYear()}`;
}

/** Web titles append country, e.g. "ACCA Skills (UK)". */
function titleWithCountry(course: UnknownRecord): string {
  const base = str(course.courseTitle, course.title, course.name) || 'Untitled course';
  const country = str(course.courseCountry, course.country);
  if (!country) return base;
  const label = country.toUpperCase() === 'UK' ? 'UK' : country.toUpperCase();
  if (base.toUpperCase().includes(`(${label})`)) return base;
  return `${base} (${label})`;
}

function statusFromProgress(progress: number, expired: boolean): CourseStatus {
  if (expired) return 'not_started';
  if (progress >= 100) return 'completed';
  if (progress > 0) return 'in_progress';
  return 'not_started';
}

function mapModules(course: UnknownRecord, courseRow: UnknownRecord | null = null): CourseModule[] {
  const completed = completedLessonIds(courseRow);
  const sections = asArray(course.courseSection)
    .map((section) => asRecord(section))
    .filter((row): row is UnknownRecord => Boolean(row))
    .filter((row) => sectionIsAccessible(row, courseRow))
    .sort((a, b) => num(a.order) - num(b.order));

  if (sections.length === 0) return [];

  type Draft = {
    sectionId: string;
    sectionTitle: string;
    lesson: Omit<Lesson, 'status'>;
    isDone: boolean;
  };
  const drafts: Draft[] = [];

  sections.forEach((section, sectionIndex) => {
    const sectionId = idOf(section._id) ?? `section-${sectionIndex}`;
    const sectionTitle =
      str(section.sectionTitle, section.title, section.name) || `Module ${sectionIndex + 1}`;
    const panels = asArray(section.panels)
      .map((panel) => asRecord(panel))
      .filter((row): row is UnknownRecord => Boolean(row))
      .sort((a, b) => num(a.order) - num(b.order));

    panels.forEach((item, panelIndex) => {
      const media = mapPanelMedia(item);
      if (isQuizOnlyPanel(item, media)) return;

      const title = str(item.panelTitle, item.title, item.name) || `Lesson ${panelIndex + 1}`;
      const rawContent = stripHtml(str(item.description, item.content, item.panelDescription));
      const description = isPlaceholderContent(rawContent) ? title : rawContent;
      const videoUrl = media.find((m) => m.type === 'VIDEO')?.url ?? '';
      const hasQuiz = asArray(item.quizzes).length > 0;

      drafts.push({
        sectionId,
        sectionTitle,
        isDone: panelIsCompleted(item, completed),
        lesson: {
          id: idOf(item._id) ?? `${sectionId}-${panelIndex}`,
          sectionId,
          title,
          durationLabel: durationLabelFor(media),
          description,
          videoUrl,
          media,
          hasQuiz: hasQuiz || undefined,
        },
      });
    });
  });

  // Within allowed sections every lesson is open; mark done from lessonProgress.
  const withStatus: { sectionId: string; sectionTitle: string; lesson: Lesson }[] = drafts.map(
    (draft) => ({
      sectionId: draft.sectionId,
      sectionTitle: draft.sectionTitle,
      lesson: { ...draft.lesson, status: draft.isDone ? 'done' : 'current' },
    }),
  );

  const modules: CourseModule[] = [];
  for (const row of withStatus) {
    const existing = modules.find((module) => module.id === row.sectionId);
    if (existing) {
      existing.lessons.push(row.lesson);
    } else {
      modules.push({
        id: row.sectionId,
        title: row.sectionTitle,
        lessons: [row.lesson],
      });
    }
  }
  return modules;
}

function mapLevel(course: UnknownRecord): CourseLevel {
  const setting = asRecord(asArray(course.courseSetting)[0]);
  const raw = str(course.level, course.courseLevel, setting?.courseLevel).toLowerCase();
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

/**
 * Patch allocate-course packs with the `lessonProgress` array returned by
 * `PUT /api/allocation/crm/mark-lesson-complete`.
 */
export function applyLessonProgressToPacks(
  packs: unknown[],
  courseId: string,
  lessonProgress: unknown[],
): unknown[] {
  return packs.map((pack) => {
    const allocation = asRecord(pack);
    if (!allocation) return pack;
    const courses = asArray(allocation.courses).map((courseRowRaw) => {
      const courseRow = asRecord(courseRowRaw);
      if (!courseRow) return courseRowRaw;
      const course =
        asRecord(courseRow.courseId) ?? asRecord(courseRow.course) ?? courseRow;
      if (idOf(course._id) !== courseId) return courseRowRaw;
      return { ...courseRow, lessonProgress };
    });
    return { ...allocation, courses };
  });
}

export function mapAllocatedCoursesToApp(packs: unknown[]): Course[] {
  return flattenAllocatedCourseRows(packs).map(({ course, courseRow }) => {
    const id = idOf(course._id)!;
    const progress = crmCourseProgress(course, courseRow);
    const expired = isAccessExpired(courseRow);
    const end = effectiveAccessEndDate(courseRow);
    const modules = mapModules(course, courseRow);
    const title = titleWithCountry(course);

    return {
      id,
      title,
      description:
        stripHtml(
          str(course.courseDescription, course.courseOverview, course.description, course.overview),
        ) || title,
      category: hashCategory(id),
      status: statusFromProgress(progress, expired),
      progress,
      moduleCount: modules.length || Number(course.moduleCount) || 0,
      level: mapLevel(course),
      modules,
      accessExpired: expired,
      accessEndLabel: end ? formatAccessEndLabel(end) : undefined,
    };
  });
}

export function mapCourseDetailToApp(
  raw: unknown,
  fallbackId: string,
  courseRow: UnknownRecord | null = null,
): Course | undefined {
  const root = asRecord(raw);
  const course = asRecord(root?.data) ?? asRecord(root?.course) ?? root;
  if (!course) return undefined;
  const id = idOf(course._id) ?? fallbackId;
  const row = courseRow ?? asRecord(root?.courseRow);
  const modules = mapModules(course, row);
  const title = titleWithCountry(course);
  const progress = crmCourseProgress(course, row);

  return {
    id,
    title,
    description:
      stripHtml(
        str(course.courseDescription, course.courseOverview, course.description, course.overview),
      ) || title,
    category: hashCategory(id),
    status: statusFromProgress(progress, false),
    progress,
    moduleCount: modules.length || Number(course.moduleCount) || 0,
    level: mapLevel(course),
    modules,
  };
}
