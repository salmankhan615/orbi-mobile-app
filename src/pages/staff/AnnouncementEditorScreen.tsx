import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, TextInput, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { StackScreen } from '@/components/custom/StackScreen';
import { Spinner } from '@/components/ui/Spinner';
import { FilterSelectRow } from '@/features/bookings/components/BookingFilters';
import {
  useAnnouncement,
  useCreateAnnouncement,
  useUpdateAnnouncement,
} from '@/queries/useAnnouncements';
import { useCrmCourseOptions, useStaffGroups } from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useAuthStore, displayName } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import type {
  AnnouncementAudience,
  AnnouncementPriority,
  AnnouncementType,
  AnnouncementWritePayload,
} from '@/api/announcements';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'AnnouncementEditor'>;

const TYPE_OPTIONS = [
  { id: 'General', label: 'General Announcement' },
  { id: 'System', label: 'System' },
  { id: 'Course', label: 'Course' },
  { id: 'Urgent', label: 'Urgent' },
];

const PRIORITY_OPTIONS = [
  { id: 'Low', label: 'Low' },
  { id: 'Medium', label: 'Medium' },
  { id: 'High', label: 'High' },
];

const AUDIENCE_OPTIONS = [
  { id: 'all', label: 'All Users' },
  { id: 'students', label: 'Students' },
  { id: 'staff', label: 'Staff' },
];

export function AnnouncementEditorScreen({ route, navigation }: Props) {
  const id = route.params.announcementId;
  const canManage = useHasPermission('manage_announcements');
  const { data: existing, isLoading: existingLoading } = useAnnouncement(id ?? '');
  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement();
  const { data: courses } = useCrmCourseOptions(canManage);
  const { data: groups } = useStaffGroups();
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.show);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<AnnouncementType>('General');
  const [priority, setPriority] = useState<AnnouncementPriority>('Medium');
  const [audience, setAudience] = useState<AnnouncementAudience>('all');
  const [pinned, setPinned] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [publishAt, setPublishAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [courseId, setCourseId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    if (!existing) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeds edit form once the existing announcement loads
    setTitle(existing.title);
    setBody(existing.body);
    setType(existing.type ?? 'General');
    setPriority(existing.priority ?? 'Medium');
    setAudience(existing.audience);
    setPinned(existing.pinned);
    setSendEmail(Boolean(existing.sendEmail));
    setPublishAt(existing.publishAt ?? '');
    setExpiresAt(existing.expiresAt ?? '');
    setCourseId(existing.courseIds?.[0] ?? '');
    setGroupId(existing.groupIds?.[0] ?? '');
    const first = existing.attachments?.[0];
    setFileName(first?.name ?? '');
    setFileUrl(first?.url ?? '');
  }, [existing]);

  const courseOptions = useMemo(
    () => [
      { id: '', label: 'All Courses' },
      ...(courses ?? []).map((course) => ({ id: course.id, label: course.title })),
    ],
    [courses],
  );

  const groupOptions = useMemo(
    () => [
      { id: '', label: 'All Batches' },
      ...(groups ?? []).map((group) => ({
        id: group.id,
        label: group.name || group.courseTitle || 'Group',
      })),
    ],
    [groups],
  );

  if (!canManage) {
    return (
      <StackScreen title="Announcements">
        <Text variant="body" color="textMuted">
          You do not have permission to manage announcements.
        </Text>
      </StackScreen>
    );
  }

  if (id && existingLoading && !existing) {
    return (
      <StackScreen title="Edit announcement">
        <Spinner fill label="Loading announcement…" />
      </StackScreen>
    );
  }

  function buildPayload(status: 'Draft' | 'Published'): AnnouncementWritePayload {
    return {
      title: title.trim(),
      body: body.trim(),
      audience,
      pinned,
      type,
      priority,
      status,
      sendEmail,
      publishAt: publishAt.trim() || undefined,
      expiresAt: expiresAt.trim() || undefined,
      courseIds: courseId ? [courseId] : [],
      groupIds: groupId ? [groupId] : [],
      attachments: fileUrl.trim()
        ? [{ name: fileName.trim() || 'Attachment', url: fileUrl.trim() }]
        : [],
      author: displayName(user),
    };
  }

  function save(status: 'Draft' | 'Published') {
    if (!title.trim() || !body.trim()) {
      showToast('Title and content are required', 'danger');
      return;
    }
    const payload = buildPayload(status);
    if (id) {
      update.mutate(
        { id, patch: payload },
        {
          onSuccess: () => {
            showToast(
              status === 'Draft' ? 'Draft saved' : 'Announcement updated',
              'success',
            );
            navigation.goBack();
          },
          onError: (error) =>
            showToast(
              error instanceof Error ? error.message : 'Could not save announcement',
              'danger',
            ),
        },
      );
      return;
    }
    create.mutate(payload, {
      onSuccess: () => {
        showToast(
          status === 'Draft' ? 'Draft saved' : 'Announcement published',
          'success',
        );
        navigation.goBack();
      },
      onError: (error) =>
        showToast(
          error instanceof Error ? error.message : 'Could not create announcement',
          'danger',
        ),
    });
  }

  const busy = create.isPending || update.isPending;

  return (
    <StackScreen title={id ? 'Edit announcement' : 'Create New Announcement'} keyboardAvoiding>
      <TextField
        label="Title *"
        value={title}
        onChangeText={setTitle}
        placeholder="Enter announcement title..."
      />

      <FilterSelectRow
        label="Type"
        value={type}
        options={TYPE_OPTIONS}
        onChange={(value) => setType(value as AnnouncementType)}
      />
      <FilterSelectRow
        label="Priority"
        value={priority}
        options={PRIORITY_OPTIONS}
        onChange={(value) => setPriority(value as AnnouncementPriority)}
      />

      <View style={styles.switchRow}>
        <Text variant="bodySmall">Pin to top of list</Text>
        <Switch
          value={pinned}
          onValueChange={setPinned}
          trackColor={{ false: tokens.colors.border, true: tokens.colors.primaryMuted }}
          thumbColor={pinned ? tokens.colors.primary : tokens.colors.surface}
        />
      </View>

      <Text variant="caption" color="textSecondary" style={styles.contentLabel}>
        Announcement Content *
      </Text>
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="Write the announcement…"
        placeholderTextColor={tokens.colors.textMuted}
        multiline
        textAlignVertical="top"
        style={styles.bodyInput}
      />

      <Text variant="caption" color="textMuted" style={styles.section}>
        Audience
      </Text>
      <FilterSelectRow
        label="Target Roles / Users"
        value={audience}
        options={AUDIENCE_OPTIONS}
        onChange={(value) => setAudience(value as AnnouncementAudience)}
      />
      <FilterSelectRow
        label="Target Courses"
        value={courseId}
        options={courseOptions}
        onChange={setCourseId}
      />
      <FilterSelectRow
        label="Target Batches / Groups"
        value={groupId}
        options={groupOptions}
        onChange={setGroupId}
      />

      <Text variant="caption" color="textMuted" style={styles.section}>
        Scheduling
      </Text>
      <TextField
        label="Publish Date & Time"
        value={publishAt}
        onChangeText={setPublishAt}
        placeholder="YYYY-MM-DDTHH:mm (optional)"
        autoCapitalize="none"
      />
      <TextField
        label="Expiry / Archive Date & Time"
        value={expiresAt}
        onChangeText={setExpiresAt}
        placeholder="YYYY-MM-DDTHH:mm (optional)"
        autoCapitalize="none"
      />

      <View style={styles.switchRow}>
        <Text variant="bodySmall" style={styles.switchLabel}>
          Send email notification to target recipients on publish
        </Text>
        <Switch
          value={sendEmail}
          onValueChange={setSendEmail}
          trackColor={{ false: tokens.colors.border, true: tokens.colors.primaryMuted }}
          thumbColor={sendEmail ? tokens.colors.primary : tokens.colors.surface}
        />
      </View>

      <Text variant="caption" color="textMuted" style={styles.section}>
        Attachments
      </Text>
      <TextField
        label="File name"
        value={fileName}
        onChangeText={setFileName}
        placeholder="Optional display name"
      />
      <TextField
        label="File URL"
        value={fileUrl}
        onChangeText={setFileUrl}
        placeholder="https://…"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.footer}>
        <Button
          label="Cancel"
          variant="outline"
          onPress={() => navigation.goBack()}
          disabled={busy}
        />
        <Button
          label="Save Draft"
          variant="secondary"
          icon="save-outline"
          onPress={() => save('Draft')}
          loading={busy}
          disabled={!title.trim() || !body.trim() || busy}
        />
        <Button
          label="Publish Now"
          icon="send-outline"
          onPress={() => save('Published')}
          loading={busy}
          disabled={!title.trim() || !body.trim() || busy}
        />
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  switchLabel: {
    flex: 1,
  },
  contentLabel: {
    marginBottom: tokens.spacing.sm,
    marginLeft: tokens.spacing.xs,
  },
  bodyInput: {
    minHeight: 140,
    marginBottom: tokens.spacing.lg,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface,
    color: tokens.colors.textPrimary,
    fontFamily: tokens.fontFamily.regular,
    fontSize: tokens.fontSize.md,
  },
  section: {
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.sm,
    fontFamily: tokens.fontFamily.semibold,
  },
  footer: {
    marginTop: tokens.spacing.xl,
    gap: tokens.spacing.sm,
    paddingBottom: tokens.spacing.xl,
  },
});
