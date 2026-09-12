import { apiClient } from '@/api/client';

/** CRM module registry (permissions / nav scope). */
export async function getModules() {
  return apiClient.get<unknown>('/api/modules/crm/getModules');
}

export async function getModuleById(moduleId: string) {
  return apiClient.get<unknown>(`/api/modules/crm/${moduleId}`);
}

/**
 * Course booking settings.
 * `categories` are calendar types (ACCA, AAT, ACDAP, …).
 * `classes` are class titles within a category (`classCate` → category id).
 * `locations` are venues (Park Royal, Online, …).
 */
export async function getCourseSettings() {
  return apiClient.get<{
    classes?: {
      _id: string;
      title: string;
      status?: string;
      classCate?: string;
      order?: number;
    }[];
    locations?: { _id: string; title: string; status?: string; order?: number }[];
    categories?: { _id: string; title: string; status?: string; order?: number }[];
  }>('/api/course/crm/getSettings');
}

/** Settings entries use "active" / "Inactive" interchangeably. */
export function isSettingsActive(status?: string): boolean {
  return String(status ?? 'active').toLowerCase() !== 'inactive';
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

export type ClassCalendarParams = {
  /** Prefer `viewAsStudentId` — matches ORBI Network calendar. */
  viewAsStudentId?: string;
  /** Legacy query still used by some CRM paths. */
  userId?: string;
  startDate?: string;
  endDate?: string;
  slim?: boolean;
};

/**
 * Class calendar events.
 * Calendar screen: `startDate`/`endDate` + `viewAsStudentId` + `slim=1`.
 * My Bookings: `viewAsStudentId` without slim (needs full `myBookings` arrays).
 * Pass a string for legacy `viewAsStudentId` only.
 */
export async function getClassCalendar(params?: string | ClassCalendarParams) {
  const opts: ClassCalendarParams =
    typeof params === 'string' ? { viewAsStudentId: params } : (params ?? {});
  const qs = new URLSearchParams();
  if (opts.startDate) qs.set('startDate', opts.startDate);
  if (opts.endDate) qs.set('endDate', opts.endDate);
  if (opts.viewAsStudentId) qs.set('viewAsStudentId', opts.viewAsStudentId);
  else if (opts.userId) qs.set('userId', opts.userId);
  if (opts.slim) qs.set('slim', '1');
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiClient.get<unknown[]>(`/api/calendar/crm/getClassCalendar${query}`);
}

export async function getClassCalendarById(id: string) {
  return apiClient.get<unknown>(`/api/calendar/crm/getClassCalendarById/${encodeURIComponent(id)}`);
}

/** Full class catalog used by CRM book-class flows. */
export async function getCalendarData() {
  return apiClient.get<unknown[]>('/api/calendar/crm/getCalendarData');
}

export async function getClassAvailability(classId: string, userId?: string) {
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return apiClient.get<{
    classId?: string;
    bookingLimit?: number;
    activeBookingsCount?: number;
    bookedSeats?: number[];
    availableSeats?: number[] | number;
    myBooking?: { seat?: number; status?: string; attendance?: string } | null;
  }>(`/api/calendar/crm/${encodeURIComponent(classId)}/availability${qs}`);
}

export async function bookClass(classId: string, payload: { user: string; seat: number }) {
  return apiClient.post<{ message?: string; classSummary?: unknown }>(
    `/api/calendar/crm/${encodeURIComponent(classId)}/book`,
    { user: payload.user, seat: payload.seat },
  );
}

export async function cancelClassBooking(classId: string, userId: string) {
  return apiClient.post<{ success?: boolean; message?: string }>(
    `/api/calendar/crm/${encodeURIComponent(classId)}/cancel`,
    { user: userId },
  );
}

/** Self check-in for a booked class. */
export async function markClassAttendance(
  classId: string,
  payload: { user: string; attendance: 'Present' | 'Absent' | 'Late' },
) {
  return apiClient.patch<unknown>(
    `/api/calendar/crm/${encodeURIComponent(classId)}/attendance`,
    payload,
  );
}

/** Lightweight users for resolving instructor ids on calendar events. */
export async function getCalendarUsersLite() {
  return apiClient.get<unknown[]>('/api/calendar/crm/users-lite');
}

export async function getCalendarClosures(calendarId?: string) {
  const query = calendarId ? `?calendar_id=${encodeURIComponent(calendarId)}` : '';
  return apiClient.get<unknown>(`/api/calendar-closure/crm/getClosures${query}`);
}

export type PracticalBookingsPage = {
  success?: boolean;
  /** Total bookings for the student (not the page length). */
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
  totalPages?: number;
  data?: unknown[];
};

/**
 * Practical training bookings for the signed-in student — paginated.
 * `GET /api/practical-training/bookings/my-bookings?page=&limit=`
 * Rows: `{ _id, date, location: <id>, shift: { _id, name, startTime, endTime } | null,
 *         seat, status: 'Active' | 'Cancelled', attendance?, bookedAt }`.
 * Session cookie identifies the user; `studentId` is optional.
 */
export async function getMyPracticalBookings(params?: {
  studentId?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.studentId) qs.set('studentId', params.studentId);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiClient.get<PracticalBookingsPage>(
    `/api/practical-training/bookings/my-bookings${query}`,
  );
}

/** Practical training shifts on the student calendar (month range). */
export async function getPracticalTrainingCalendar(params: {
  startDate: string;
  endDate: string;
  viewAsStudentId?: string;
  studentId?: string;
}) {
  const qs = new URLSearchParams();
  qs.set('startDate', params.startDate);
  qs.set('endDate', params.endDate);
  if (params.viewAsStudentId) qs.set('viewAsStudentId', params.viewAsStudentId);
  if (params.studentId) qs.set('studentId', params.studentId);
  return apiClient.get<{ success?: boolean; count?: number; data?: unknown[] }>(
    `/api/practical-training/bookings/calendar?${qs.toString()}`,
  );
}

export async function getAvailableTrainingShifts(params: { date: string; location: string }) {
  const query = `?date=${encodeURIComponent(params.date)}&location=${encodeURIComponent(params.location)}`;
  return apiClient.get<{
    success?: boolean;
    data?: {
      location?: { _id?: string };
      date?: string;
      shifts?: TrainingShiftRaw[];
    };
  }>(`/api/practical-training/available-shifts${query}`);
}

export type TrainingShiftRaw = {
  _id?: string;
  name?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  color?: string;
  defaultLimit?: number;
  currentLimit?: number;
  /** Count of booked seats (naming trap vs class calendar). */
  bookedSeats?: number;
  bookedSeatNumbers?: number[];
  /** Count of free seats. */
  availableSeats?: number;
  isOverridden?: boolean;
  allowedAccessTypes?: string[];
};

/** Student app should omit `studentId` (server defaults to req.user). */
export async function bookPracticalTraining(payload: {
  location: string;
  shift: string;
  date: string;
  seat: number;
  studentId?: string;
}) {
  const body: Record<string, unknown> = {
    location: payload.location,
    shift: payload.shift,
    date: payload.date,
    seat: payload.seat,
  };
  if (payload.studentId) body.studentId = payload.studentId;
  return apiClient.post<{ success?: boolean; message?: string; data?: unknown }>(
    '/api/practical-training/bookings',
    body,
  );
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

/** Profile PATCH — JSON fields, or multipart when `file` is included. */
export async function updateCrmUser(payload: FormData | Record<string, unknown>) {
  return apiClient.patch<unknown>('/api/users/crm/updateUser', payload);
}
