import { apiClient } from '@/api/client';

/** CRM module registry (permissions / nav scope). */
export async function getModules() {
  return apiClient.get<unknown>('/api/modules/crm/getModules');
}

export async function getModuleById(moduleId: string) {
  return apiClient.get<unknown>(`/api/modules/crm/${moduleId}`);
}

/** Course booking settings: classes, locations, categories. */
export async function getCourseSettings() {
  return apiClient.get<{
    classes?: { _id: string; title: string; status?: string }[];
    locations?: { _id: string; title: string; status?: string }[];
    categories?: { _id: string; title: string; status?: string }[];
  }>('/api/course/crm/getSettings');
}

/**
 * Student allocated courses (CRM Courses page + home charts).
 * `GET /api/course/crm/get-allocate-course/user/:userId/company/:companyId`
 */
export async function getAllocatedCourses(
  userId: string,
  companyId: string,
  options?: { slim?: boolean },
) {
  const query = options?.slim ? '?slim=1' : '';
  return apiClient.get<{ success?: boolean; data?: unknown[] }>(
    `/api/course/crm/get-allocate-course/user/${encodeURIComponent(userId)}/company/${encodeURIComponent(companyId)}${query}`,
  );
}

/** Full course curriculum / media. */
export async function getCourseDetail(courseId: string) {
  return apiClient.get<unknown>(`/api/course/crm/course-detail/${encodeURIComponent(courseId)}`);
}

/** Mark a lesson complete (allocation progress). Returns updated `lessonProgress`. */
export async function markLessonComplete(payload: {
  userId: string;
  courseId: string;
  sectionId: string;
  lessonId: string;
}) {
  return apiClient.put<{
    success?: boolean;
    message?: string;
    data?: {
      sectionId?: string;
      lessonId?: string;
      isCompleted?: boolean;
      completedAt?: string;
      _id?: string;
    }[];
  }>('/api/allocation/crm/mark-lesson-complete', payload);
}

/**
 * Student coursework (CRM Student Coursework page).
 * `GET /api/course/crm/student/coursework?studentId=:userId`
 */
export async function getStudentCoursework(studentId: string) {
  return apiClient.get<{ success?: boolean; data?: unknown[] }>(
    `/api/course/crm/student/coursework?studentId=${encodeURIComponent(studentId)}`,
  );
}

/** Legacy attachments endpoint (not used by student coursework UI). */
export async function getStudentAttachments(userId: string, companyId: string) {
  return apiClient.get<{ data?: unknown[] }>(
    `/api/course/crm/studentAttachments/user/${encodeURIComponent(userId)}/company/${encodeURIComponent(companyId)}`,
  );
}

/** Announcements for the signed-in user (`my` in Network). */
export async function getMyAnnouncements() {
  return apiClient.get<{ data?: unknown[] } | unknown[]>('/api/announcements/my');
}

export async function getAnnouncementById(id: string) {
  return apiClient.get<unknown>(`/api/announcements/${encodeURIComponent(id)}`);
}

export async function acknowledgeAnnouncement(id: string) {
  return apiClient.post<unknown>(`/api/announcements/${encodeURIComponent(id)}/acknowledge`, {});
}

export async function createAnnouncement(payload: unknown) {
  return apiClient.post<unknown>('/api/announcements', payload);
}

export async function updateAnnouncement(id: string, payload: unknown) {
  return apiClient.put<unknown>(`/api/announcements/${encodeURIComponent(id)}`, payload);
}

/** Student / staff class calendar events. */
export async function getClassCalendar(userId?: string) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return apiClient.get<unknown[]>(`/api/calendar/crm/getClassCalendar${query}`);
}

export async function getClassCalendarById(id: string) {
  return apiClient.get<unknown>(`/api/calendar/crm/getClassCalendarById/${encodeURIComponent(id)}`);
}

/** Full class catalog used by CRM book-class flows. */
export async function getCalendarData() {
  return apiClient.get<unknown[]>('/api/calendar/crm/getCalendarData');
}

export async function getClassAvailability(classId: string, userId: string) {
  return apiClient.get<unknown>(
    `/api/calendar/crm/${encodeURIComponent(classId)}/availability?userId=${encodeURIComponent(userId)}`,
  );
}

export async function bookClass(classId: string, payload: { seat: number; user: string }) {
  return apiClient.post<unknown>(`/api/calendar/crm/${encodeURIComponent(classId)}/book`, payload);
}

export async function cancelClassBooking(classId: string, userId: string) {
  return apiClient.post<unknown>(`/api/calendar/crm/${encodeURIComponent(classId)}/cancel`, {
    user: userId,
  });
}

export async function getCalendarClosures(calendarId?: string) {
  const query = calendarId ? `?calendar_id=${encodeURIComponent(calendarId)}` : '';
  return apiClient.get<unknown>(`/api/calendar-closure/crm/getClosures${query}`);
}

/** Practical training. */
export async function getMyPracticalBookings(studentId?: string) {
  const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
  return apiClient.get<{ data?: unknown[] }>(
    `/api/practical-training/bookings/my-bookings${query}`,
  );
}

export async function getAvailableTrainingShifts(params: { date: string; location: string }) {
  const query = `?date=${encodeURIComponent(params.date)}&location=${encodeURIComponent(params.location)}`;
  return apiClient.get<{ data?: { shifts?: unknown[] } }>(
    `/api/practical-training/available-shifts${query}`,
  );
}

export async function bookPracticalTraining(payload: {
  location: string;
  shift: string;
  date: string;
  seat: number;
  studentId: string;
}) {
  return apiClient.post<unknown>('/api/practical-training/bookings', payload);
}

export async function cancelPracticalBooking(dayId: string, bookingId: string) {
  return apiClient.delete<unknown>(
    `/api/practical-training/bookings/${encodeURIComponent(dayId)}/${encodeURIComponent(bookingId)}`,
  );
}

/** Hours / theory-practical cards. */
export async function getAllocationsByUser(userId: string) {
  return apiClient.get<{ success?: boolean; data?: unknown[] }>(
    `/api/allocation/crm/getAllocationsByUser/${encodeURIComponent(userId)}`,
  );
}

/** Profile. */
export async function updateCrmUser(payload: Record<string, unknown>) {
  return apiClient.patch<unknown>('/api/users/crm/updateUser', payload);
}
