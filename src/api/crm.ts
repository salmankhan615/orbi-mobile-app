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

/** Staff management list — company-wide, all statuses (Draft included). */
export async function getAnnouncements(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const qs = new URLSearchParams();
  qs.set('limit', String(params?.limit ?? 50));
  if (params?.page) qs.set('page', String(params.page));
  if (params?.search) qs.set('search', params.search);
  if (params?.status) qs.set('status', params.status);
  return apiClient.get<{ success?: boolean; data?: unknown[]; pagination?: unknown }>(
    `/api/announcements?${qs.toString()}`,
  );
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

export async function deleteAnnouncement(id: string) {
  return apiClient.delete<unknown>(`/api/announcements/${encodeURIComponent(id)}`);
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

/** Search/list by type — capped server-side (~100). Prefer over getAllUsersActive. */
export async function getUsersByType(payload: { userType: string; filter?: string }) {
  return apiClient.post<unknown[]>('/api/users/crm/getUserType', {
    userType: payload.userType,
    filter: payload.filter ?? '',
  });
}

export async function getCalendarClosures(calendarId?: string) {
  const query = calendarId ? `?calendar_id=${encodeURIComponent(calendarId)}` : '';
  return apiClient.get<unknown>(`/api/calendar-closure/crm/getClosures${query}`);
}

/** Dated or permanent weekday closure. Writes are adminOnly (includes type=staff). */
export async function addCalendarClosure(payload: {
  scope: 'global' | 'calendar';
  calendar_id?: string;
  is_permanent: boolean;
  date?: string;
  day_of_week?: number;
  reason?: string;
}) {
  return apiClient.post<unknown>('/api/calendar-closure/crm/addClosure', payload);
}

export async function deleteCalendarClosure(id: string) {
  return apiClient.delete<unknown>(
    `/api/calendar-closure/crm/deleteClosure/${encodeURIComponent(id)}`,
  );
}

/** Staff groups for the company (`groups.view`). */
export async function getStaffGroups(companyId: string) {
  return apiClient.get<{ message?: string; data?: unknown[] }>(
    `/api/course/crm/getGroups/company/${encodeURIComponent(companyId)}`,
  );
}

export async function getGroupDetail(groupId: string) {
  return apiClient.get<{ success?: boolean; data?: unknown }>(
    `/api/course/crm/group/${encodeURIComponent(groupId)}/detail`,
  );
}

export async function getGroupStudents(
  groupId: string,
  params?: { search?: string; page?: number; limit?: number },
) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiClient.get<{
    success?: boolean;
    data?: unknown[];
    pagination?: { total?: number; page?: number; limit?: number; pages?: number };
  }>(`/api/course/crm/group/${encodeURIComponent(groupId)}/students${query}`);
}

export async function getGroupSessions(groupId: string) {
  return apiClient.get<{ success?: boolean; data?: unknown[] }>(
    `/api/course/crm/group/${encodeURIComponent(groupId)}/sessions`,
  );
}

/** Active company users (country-filtered when EMS dataFilters set). */
export async function getAllUsersActive() {
  return apiClient.get<unknown[]>('/api/users/crm/getAllUsersActive');
}

export async function getCrmUserById(userId: string) {
  return apiClient.get<unknown>(`/api/users/crm/${encodeURIComponent(userId)}`);
}

export async function getGroupSessionAttendance(groupId: string, classId: string) {
  return apiClient.get<{ success?: boolean; data?: unknown }>(
    `/api/course/crm/group/${encodeURIComponent(groupId)}/sessions/${encodeURIComponent(classId)}/attendance`,
  );
}

export async function gradeCourseworkSubmission(
  courseworkId: string,
  submissionId: string,
  payload: { score?: number | null; status?: string },
) {
  return apiClient.patch<{ success?: boolean; data?: unknown }>(
    `/api/course/crm/coursework/${encodeURIComponent(courseworkId)}/submissions/${encodeURIComponent(submissionId)}/grade`,
    payload,
  );
}

/** Staff coursework across manageable groups (`groups.manageCoursework`). */
export async function getStaffCoursework() {
  return apiClient.get<{ success?: boolean; data?: unknown[] }>('/api/course/crm/coursework');
}

export async function getCourseworkSubmissions(courseworkId: string) {
  return apiClient.get<{ success?: boolean; data?: { coursework?: unknown; rows?: unknown[] } }>(
    `/api/course/crm/coursework/${encodeURIComponent(courseworkId)}/submissions`,
  );
}

/** Payment plans — adminOnly (passes for any `type === 'staff'`). */
export async function getAllPaymentPlans() {
  return apiClient.get<{ success?: boolean; data?: unknown[] }>(
    '/api/paymentPlan/crm/getAllPaymentPlans',
  );
}

export async function getAgreementSubmissions(params?: {
  status?: string;
  bucket?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.bucket) qs.set('bucket', params.bucket);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.search) qs.set('search', params.search);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiClient.get<{
    success?: boolean;
    data?: unknown[];
    pagination?: unknown;
    statusCounts?: { _id?: string; count?: number }[];
  }>(`/api/agreements/submissions${query}`);
}

/**
 * Practical training admin roster. Always pass `date` or `location` —
 * unfiltered loads every training day the company has ever had.
 */
export async function getAdminPracticalBookings(params: {
  date?: string;
  location?: string;
  shift?: string;
  student?: string;
  status?: string;
}) {
  const qs = new URLSearchParams();
  if (params.date) qs.set('date', params.date);
  if (params.location) qs.set('location', params.location);
  if (params.shift) qs.set('shift', params.shift);
  if (params.student) qs.set('student', params.student);
  if (params.status) qs.set('status', params.status);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiClient.get<{ success?: boolean; count?: number; data?: unknown[] }>(
    `/api/practical-training/admin/bookings${query}`,
  );
}

export async function getPracticalTrainingAdminCalendar(params: {
  startDate: string;
  endDate: string;
}) {
  const qs = new URLSearchParams();
  qs.set('startDate', params.startDate);
  qs.set('endDate', params.endDate);
  return apiClient.get<unknown>(
    `/api/practical-training/bookings/calendar/admin?${qs.toString()}`,
  );
}

export async function markPracticalAttendance(
  dayId: string,
  bookingId: string,
  attendance: 'Present' | 'Absent',
) {
  return apiClient.patch<{ success?: boolean; message?: string }>(
    `/api/practical-training/bookings/${encodeURIComponent(dayId)}/${encodeURIComponent(bookingId)}`,
    { attendance },
  );
}

export async function getEmsProfile(emsProfileId: string) {
  return apiClient.get<{
    success?: boolean;
    data?: {
      name?: string;
      dataFilters?: { countries?: string[]; categories?: string[] };
      permissions?: { modules?: unknown; actions?: unknown[] };
      features?: unknown;
    };
  }>(`/api/ems/profiles/${encodeURIComponent(emsProfileId)}`);
}

export async function getCrmModulePermissions(profileId: string) {
  return apiClient.get<{
    modules?: unknown[];
    features?: unknown;
    adminPermissions?: {
      userManagement?: { enabled?: boolean; types?: string[] };
      agreements?: { enabled?: boolean; send?: boolean };
      complianceSettings?: { enabled?: boolean };
      modulesCustomisation?: { enabled?: boolean };
      rolesAndProfiles?: { enabled?: boolean; types?: string[] };
    };
  }>(`/api/module-permissions/crm/${encodeURIComponent(profileId)}`);
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
