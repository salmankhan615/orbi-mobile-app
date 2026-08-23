import type { Course, CourseModule, Lesson } from '@/api/courses';

export type LessonWithModule = Lesson & {
  moduleId: string;
  moduleTitle: string;
};

/** Flat ordered list of every lesson in a course. */
export function flattenLessons(course: Course): LessonWithModule[] {
  return course.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      ...lesson,
      moduleId: module.id,
      moduleTitle: module.title,
    })),
  );
}

/** Prefer the in-progress lesson; otherwise the first unlocked unfinished one. */
export function findContinueLesson(course: Course): LessonWithModule | undefined {
  const lessons = flattenLessons(course);
  return (
    lessons.find((lesson) => lesson.status === 'current') ??
    lessons.find((lesson) => lesson.status !== 'locked' && lesson.status !== 'done') ??
    lessons.find((lesson) => lesson.status === 'done') ??
    lessons[0]
  );
}

export function findLesson(
  course: Course,
  lessonId: string,
): { lesson: LessonWithModule; index: number; lessons: LessonWithModule[] } | undefined {
  const lessons = flattenLessons(course);
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return undefined;
  return { lesson: lessons[index], index, lessons };
}

export function findModule(course: Course, moduleId: string): CourseModule | undefined {
  return course.modules.find((module) => module.id === moduleId);
}
