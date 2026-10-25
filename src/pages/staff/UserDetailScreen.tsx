import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { StackScreen } from '@/components/custom/StackScreen';
import { Spinner } from '@/components/ui/Spinner';
import { EntityRow } from '@/components/custom/EntityRow';
import { EmptyState } from '@/components/custom/EmptyState';
import {
  getAllocationsByUser,
  getCrmModulePermissions,
  getCrmUserById,
  getEmsProfile,
} from '@/api/crm';
import { unwrapList } from '@/api/unwrap';
import {
  crmCourseProgress,
  effectiveAccessEndDate,
  flattenAllocatedCourseRows,
  formatAccessEndLabel,
  isAccessExpired,
} from '@/features/courses/mapAllocatedCourses';
import { formatPortalDate } from '@/utils/date';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'UserDetail'>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isObjectId(value: string): boolean {
  return /^[a-f0-9]{24}$/i.test(value);
}

function str(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    const nested = asRecord(value);
    if (nested) {
      const fromObj = str(nested.name, nested.title, nested.label, nested.email, nested.status);
      if (fromObj && !isObjectId(fromObj)) return fromObj;
    }
  }
  return '';
}

function titleCase(value: string): string {
  if (!value) return '';
  if (value.length <= 3 && value === value.toLowerCase()) return value.toUpperCase();
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function prettyDate(value: unknown): string {
  const raw = str(value);
  if (!raw || isObjectId(raw)) return '';
  const formatted = formatPortalDate(raw);
  return formatted === '—' ? raw : formatted;
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[_-]/g, '');
}

function getField(data: Record<string, unknown> | undefined, ...keys: string[]): unknown {
  if (!data) return undefined;
  const byNorm = new Map<string, unknown>();
  for (const [key, value] of Object.entries(data)) {
    byNorm.set(normalizeKey(key), value);
  }
  for (const key of keys) {
    const hit = byNorm.get(normalizeKey(key));
    if (hit != null && hit !== '') return hit;
  }
  return undefined;
}

function pick(data: Record<string, unknown> | undefined, ...keys: string[]): string {
  return str(getField(data, ...keys));
}

function objectIdOf(value: unknown): string {
  if (typeof value === 'string' && isObjectId(value.trim())) return value.trim();
  const row = asRecord(value);
  if (!row) return '';
  const id = str(row._id, row.id, row.$oid);
  return isObjectId(id) ? id : '';
}

function unwrapUser(raw: unknown): Record<string, unknown> {
  let current = asRecord(raw);
  for (const key of ['data', 'user', 'result']) {
    const inner = asRecord(current?.[key]);
    if (!inner) continue;
    if (inner.email || inner.name || inner.street || inner.zipCode || inner.zipcode || inner.profile) {
      current = inner;
    }
  }
  return current ?? {};
}

function isStudentUser(user: Record<string, unknown>, fallbackRole?: string): boolean {
  const label = normalizeKey(str(user.type, user.role, fallbackRole));
  return (
    label === 'student' ||
    label === 'trainee' ||
    label === 'learner' ||
    label === 'candidate' ||
    label === 'applicant'
  );
}

function courseTitle(course: Record<string, unknown>): string {
  const base = str(course.courseTitle, course.title, course.name) || 'Untitled course';
  const country = str(course.courseCountry, course.country);
  if (!country) return base;
  const label = country.toUpperCase() === 'UK' ? 'UK' : country.toUpperCase();
  if (base.toUpperCase().includes(`(${label})`)) return base;
  return `${base} (${label})`;
}

function overrideExtraHours(courseRow: Record<string, unknown>): number {
  let total = 0;
  const overrides = Array.isArray(courseRow.overrides) ? courseRow.overrides : [];
  for (const item of overrides) {
    const row = asRecord(item);
    const extra = Number(row?.extraHours);
    if (Number.isFinite(extra) && extra > 0) total += extra;
  }
  return total;
}

/** Build secondary lines from allocation fields that are actually present. */
function allocationDetailLines(
  course: Record<string, unknown>,
  courseRow: Record<string, unknown>,
): string[] {
  const lines: string[] = [];

  const typeLabel = str(courseRow.courseType);
  const accessType = str(courseRow.accessType);
  const head = [typeLabel, accessType].filter(Boolean).join(' · ');
  if (head) lines.push(head);

  const hours = Number(courseRow.actualHours);
  const extra = overrideExtraHours(courseRow);
  if (Number.isFinite(hours) && hours > 0) {
    lines.push(extra > 0 ? `${hours}h allocated (+${extra}h override)` : `${hours}h allocated`);
  } else if (extra > 0) {
    lines.push(`+${extra}h override`);
  }

  const start = prettyDate(getField(courseRow, 'startDate', 'accessStartDate', 'from'));
  const end = effectiveAccessEndDate(courseRow);
  if (start && end) {
    lines.push(`${start} → ${formatAccessEndLabel(end)}`);
  } else if (start) {
    lines.push(`From ${start}`);
  } else if (end) {
    lines.push(`Until ${formatAccessEndLabel(end)}`);
  }

  const progress = Math.round(crmCourseProgress(course, courseRow));
  if (progress > 0) lines.push(`${progress}% complete`);

  const category = str(course.categoryName, course.courseCategory, asRecord(course.categoryId)?.name);
  if (category && !isObjectId(category)) lines.push(category);

  return lines;
}

async function resolveProfileName(user: Record<string, unknown>): Promise<string> {
  const labelled = pick(user, 'profileName', 'roleProfile', 'profileLabel');
  if (labelled) return labelled;
  const populated = str(user.profile, user.emsProfile);
  if (populated) return populated;

  const profileId = objectIdOf(user.profileId) || objectIdOf(user.profile);
  const emsId = objectIdOf(user.emsProfileId) || objectIdOf(user.emsProfile);
  if (emsId) {
    const ems = await getEmsProfile(emsId).catch(() => null);
    const name = str(asRecord(ems)?.data, asRecord(ems)?.name, ems);
    if (name) return name;
  }
  if (profileId) {
    const crm = await getCrmModulePermissions(profileId).catch(() => null);
    const name = str(asRecord(crm)?.name, asRecord(crm)?.title, asRecord(crm)?.profile);
    if (name) return name;
  }
  return '';
}

/** Keys must be normalizeKey()'d (lowercase, no `_`/`-`) — e.g. `__v` → `v`. */
const SKIP_EXTRA = new Set([
  'id',
  'password',
  'token',
  'photo',
  'permissions',
  'v',
  'roleid',
  'companyid',
  'profileid',
  'emsprofileid',
  'file',
  'modules',
  'features',
  'datafilters',
  'userid',
]);

type DetailField = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
};

export function UserDetailScreen({ route }: Props) {
  const { userId, name: fallbackName, email: fallbackEmail, role, status } = route.params;

  const { data, isLoading } = useQuery({
    queryKey: ['staff', 'user', userId, 'detail'],
    queryFn: async () => {
      const raw = await getCrmUserById(userId);
      const user = unwrapUser(raw);
      const profileName = await resolveProfileName(user);
      const student = isStudentUser(user, role);
      const allocations = student
        ? unwrapList(await getAllocationsByUser(userId).catch(() => []))
        : [];
      return { user, profileName, student, allocations };
    },
    staleTime: 60_000,
  });

  if (isLoading && !data) {
    return (
      <StackScreen title="User">
        <Spinner fill label="Loading user…" />
      </StackScreen>
    );
  }

  const user = data?.user ?? {};
  const first = pick(user, 'name', 'firstName') || fallbackName || '';
  const last = pick(user, 'lname', 'lastName');
  const fullName = `${first} ${last}`.trim() || fallbackName || 'User';
  const type = titleCase(pick(user, 'type', 'role') || role || '');
  const userStatus = titleCase(pick(user, 'status') || status || '');
  const phone = pick(user, 'phone');
  const mobile = pick(user, 'mobile');
  const companyRaw = pick(user, 'companyName') || str(user.company, user.companyId);
  const company = isObjectId(companyRaw) ? '' : companyRaw;
  const showAllocations = Boolean(data?.student);
  const allocationRows = showAllocations
    ? flattenAllocatedCourseRows(data?.allocations ?? [])
    : [];

  const shown = new Set<string>();
  const fields: DetailField[] = [];

  function add(
    icon: DetailField['icon'],
    title: string,
    value: string,
    aliases: string[] = [],
  ) {
    const trimmed = value.trim();
    if (!trimmed || isObjectId(trimmed)) return;
    fields.push({ icon, title, value: trimmed });
    shown.add(normalizeKey(title));
    for (const alias of aliases) shown.add(normalizeKey(alias));
  }

  add('person-outline', 'First name', first, ['name', 'firstName']);
  add('person-outline', 'Last name', last, ['lname', 'lastName']);
  add('mail-outline', 'Email', pick(user, 'email') || fallbackEmail || '', ['email']);
  add('call-outline', 'Phone', phone, ['phone']);
  add('phone-portrait-outline', 'Mobile', mobile && mobile !== phone ? mobile : '', ['mobile']);
  add('business-outline', 'Company', company, ['company', 'companyName', 'companyId']);
  add('briefcase-outline', 'Role', type, ['type', 'role']);
  add('flag-outline', 'Status', userStatus, ['status']);
  add('shield-checkmark-outline', 'Profile', data?.profileName ?? '', [
    'profile',
    'profileName',
    'emsProfile',
    'profileId',
    'emsProfileId',
  ]);
  add('globe-outline', 'Country', titleCase(pick(user, 'country')), ['country']);
  add('flag-outline', 'Nationality', titleCase(pick(user, 'nationality')), ['nationality']);
  add('location-outline', 'City', titleCase(pick(user, 'city')), ['city']);
  add('map-outline', 'County / state', titleCase(pick(user, 'state', 'county')), ['state', 'county']);
  add('home-outline', 'Street', pick(user, 'street'), ['street']);
  add('navigate-outline', 'Address', pick(user, 'address', 'address1', 'addressLine1'), [
    'address',
    'address1',
    'addressLine1',
  ]);
  add('pin-outline', 'Zip code', pick(user, 'zipCode', 'zipcode', 'zip', 'postcode', 'postalCode'), [
    'zipCode',
    'zipcode',
    'zip',
    'postcode',
    'postalCode',
  ]);
  add('calendar-outline', 'Date of birth', prettyDate(getField(user, 'dateOfBirth', 'dob')), [
    'dateOfBirth',
    'dob',
  ]);
  add('male-female-outline', 'Gender', titleCase(pick(user, 'gender')), ['gender']);
  add('card-outline', 'NI number', pick(user, 'niNumber', 'nationalInsurance', 'nino'), [
    'niNumber',
    'nationalInsurance',
    'nino',
  ]);
  add('people-outline', 'Group', str(user.group, user.groupName), ['group', 'groupName', 'groupId']);
  add('school-outline', 'Course', str(user.course, user.courseName, user.className), [
    'course',
    'courseName',
    'className',
    'courseId',
  ]);
  add('link-outline', 'Website', pick(user, 'website'), ['website']);
  add(
    'checkmark-circle-outline',
    'Verified',
    user.isVerified == null ? '' : user.isVerified ? 'Yes' : 'No',
    ['isVerified'],
  );
  add('time-outline', 'Joined', prettyDate(getField(user, 'createdAt', 'created_at', 'joinedAt')), [
    'createdAt',
    'created_at',
    'joinedAt',
  ]);
  add(
    'log-in-outline',
    'Last login',
    prettyDate(getField(user, 'lastLogin', 'lastLoginAt', 'updatedAt')),
    ['lastLogin', 'lastLoginAt', 'updatedAt'],
  );

  for (const [key, raw] of Object.entries(user)) {
    const norm = normalizeKey(key);
    if (SKIP_EXTRA.has(norm) || shown.has(norm)) continue;
    const value = str(raw);
    if (!value || isObjectId(value) || Array.isArray(raw)) continue;
    add('ellipse-outline', titleCase(key.replace(/([A-Z])/g, ' $1')), value, [key]);
  }

  return (
    <StackScreen title="User">
      <Text variant="heading">{fullName}</Text>
      <View style={styles.badges}>
        {type ? <Badge label={type} tone="primary" /> : null}
        {userStatus ? (
          <Badge label={userStatus} tone={/active/i.test(userStatus) ? 'success' : 'warning'} />
        ) : null}
      </View>
      {fields.map((field) => (
        <EntityRow key={field.title} icon={field.icon} title={field.title} subtitle={field.value} />
      ))}

      {showAllocations ? (
        <View style={styles.allocations}>
          <Text variant="title" style={styles.sectionTitle}>
            Allocated courses
          </Text>
          {allocationRows.length === 0 ? (
            <EmptyState icon="school-outline" message="No course allocations for this student." />
          ) : (
            allocationRows.map((row) => {
              const expired = isAccessExpired(row.courseRow);
              const details = allocationDetailLines(row.course, row.courseRow);
              return (
                <View
                  key={`${row.allocationId}-${row.courseRowId}`}
                  style={styles.allocationCard}
                >
                  <View style={styles.allocationHeader}>
                    <View style={styles.allocationIcon}>
                      <Ionicons
                        name="school-outline"
                        size={18}
                        color={tokens.colors.secondary}
                      />
                    </View>
                    <View style={styles.allocationBody}>
                      <Text variant="bodySmall" style={styles.allocationTitle}>
                        {courseTitle(row.course)}
                      </Text>
                      {details.map((line) => (
                        <Text key={line} variant="caption" color="textMuted">
                          {line}
                        </Text>
                      ))}
                    </View>
                    <Badge
                      label={expired ? 'Expired' : 'Active'}
                      tone={expired ? 'danger' : 'success'}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>
      ) : null}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  allocations: {
    marginTop: tokens.spacing.xl,
    gap: tokens.spacing.sm,
  },
  sectionTitle: {
    marginBottom: tokens.spacing.sm,
  },
  allocationCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  allocationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.md,
  },
  allocationIcon: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocationBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  allocationTitle: {
    fontFamily: tokens.fontFamily.semibold,
    marginBottom: 2,
  },
});
