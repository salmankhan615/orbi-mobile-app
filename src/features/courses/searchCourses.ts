import type { Course } from '@/api/courses';

export function courseMatchesQuery(course: Course, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const fields = [
    course.title,
    course.description,
    course.level,
    course.accessEndLabel,
    ...course.modules.flatMap((module) => [
      module.title,
      ...module.lessons.map((lesson) => lesson.title),
    ]),
  ];

  return fields.some((value) => value?.toLowerCase().includes(needle));
}
