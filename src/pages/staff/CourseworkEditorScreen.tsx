import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { StackScreen } from '@/components/custom/StackScreen';
import { Spinner } from '@/components/ui/Spinner';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { FilterSelectRow } from '@/features/bookings/components/BookingFilters';
import { DueDatePicker } from '@/features/coursework/components/DueDatePicker';
import {
  courseworkTabForKind,
  type CourseworkLocalFile,
  type CourseworkTab,
} from '@/api/coursework';
import type { CourseworkFile } from '@/api/staff';
import {
  useCreateCoursework,
  useStaffCoursework,
  useStaffGroups,
  useUpdateCoursework,
} from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'CourseworkEditor'>;

const TYPE_OPTIONS: { id: CourseworkTab; label: string }[] = [
  { id: 'assignment', label: 'Assignment (graded, students submit)' },
  { id: 'resource', label: 'Resource (files only)' },
];

const PICKER_TYPES = [
  'image/*',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

export function CourseworkEditorScreen({ route, navigation }: Props) {
  const courseworkId = route.params.courseworkId;
  const isEdit = Boolean(courseworkId);
  const allowed = useHasPermission('view_coursework');
  const { data: items, isLoading } = useStaffCoursework();
  const { data: groups } = useStaffGroups();
  const create = useCreateCoursework();
  const update = useUpdateCoursework();
  const showToast = useToastStore((state) => state.show);

  const existing = useMemo(
    () => (courseworkId ? (items ?? []).find((item) => item.id === courseworkId) : undefined),
    [courseworkId, items],
  );

  const [groupId, setGroupId] = useState(route.params.groupId ?? '');
  const [kind, setKind] = useState<CourseworkTab>(route.params.kind ?? 'assignment');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [graded, setGraded] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [keepFiles, setKeepFiles] = useState<CourseworkFile[]>([]);
  const [newFiles, setNewFiles] = useState<CourseworkLocalFile[]>([]);
  const [seeded, setSeeded] = useState(!isEdit);

  useEffect(() => {
    if (!existing || seeded) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeds edit form once the item loads
    setGroupId(existing.groupId || route.params.groupId || '');
    setKind(courseworkTabForKind(existing.kind));
    setTitle(existing.title);
    setInstructions(existing.instructions ?? '');
    setGraded(Boolean(existing.graded));
    setDueDate(existing.dueDateIso?.slice(0, 10) ?? '');
    setKeepFiles(existing.attachments ?? []);
    setSeeded(true);
  }, [existing, seeded, route.params.groupId]);

  const groupOptions = useMemo(() => {
    const options = [
      { id: '', label: 'Select a group' },
      ...(groups ?? []).map((group) => ({
        id: group.id,
        label: group.name || group.courseTitle || 'Group',
      })),
    ];
    if (groupId && !options.some((option) => option.id === groupId)) {
      options.splice(1, 0, {
        id: groupId,
        label: existing?.groupName || existing?.courseTitle || 'Current group',
      });
    }
    return options;
  }, [groups, groupId, existing]);

  const isAssignment = kind === 'assignment';
  const busy = create.isPending || update.isPending;

  async function pickFiles() {
    const result = await DocumentPicker.getDocumentAsync({
      type: PICKER_TYPES,
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;
    setNewFiles((prev) => [
      ...prev,
      ...result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
        blob: asset.file,
      })),
    ]);
  }

  function openFile(file: CourseworkFile) {
    navigation.navigate('CourseworkFile', {
      url: file.url,
      filename: file.filename,
      type: file.type,
    });
  }

  function save() {
    const trimmedTitle = title.trim();
    if (!groupId) {
      showToast('Select a group', 'danger');
      return;
    }
    if (!trimmedTitle) {
      showToast('Title is required', 'danger');
      return;
    }
    if (isAssignment && !dueDate) {
      showToast('Due date is required', 'danger');
      return;
    }

    const payload = {
      groupId,
      kind,
      title: trimmedTitle,
      instructions: instructions.trim(),
      graded: isAssignment ? graded : false,
      dueDate: isAssignment ? dueDate : undefined,
      keepFiles,
      newFiles,
    };

    if (isEdit && courseworkId) {
      update.mutate(
        { courseworkId, payload },
        {
          onSuccess: () => {
            haptics.success();
            showToast('Coursework updated', 'success');
            navigation.goBack();
          },
          onError: (error) => {
            haptics.warning();
            showToast(
              error instanceof Error ? error.message : 'Could not update coursework',
              'danger',
            );
          },
        },
      );
      return;
    }

    create.mutate(payload, {
      onSuccess: () => {
        haptics.success();
        showToast('Coursework created', 'success');
        navigation.goBack();
      },
      onError: (error) => {
        haptics.warning();
        showToast(error instanceof Error ? error.message : 'Could not create coursework', 'danger');
      },
    });
  }

  if (!allowed) {
    return (
      <StackScreen title="Coursework">
        <Text variant="body" color="textMuted">
          You do not have permission to manage coursework.
        </Text>
      </StackScreen>
    );
  }

  if (isEdit && isLoading && !existing) {
    return (
      <StackScreen title="Edit coursework">
        <Spinner fill label="Loading coursework…" />
      </StackScreen>
    );
  }

  if (isEdit && !isLoading && !existing) {
    return (
      <StackScreen title="Edit coursework">
        <Text variant="body" color="textMuted">
          This coursework item could not be found.
        </Text>
      </StackScreen>
    );
  }

  return (
    <StackScreen title={isEdit ? 'Edit coursework' : 'Add coursework'} keyboardAvoiding>
      <View style={styles.fieldBlock}>
        <FilterSelectRow
          label="Group"
          value={groupId}
          options={groupOptions}
          onChange={setGroupId}
        />
      </View>

      <View style={styles.fieldBlock}>
        <FilterSelectRow
          label="Type"
          value={kind}
          options={TYPE_OPTIONS}
          onChange={(value) => setKind(value as CourseworkTab)}
        />
      </View>

      <TextField
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="Assignment title"
      />

      <Text variant="caption" color="textSecondary" style={styles.contentLabel}>
        Instructions
      </Text>
      <TextInput
        value={instructions}
        onChangeText={setInstructions}
        placeholder="Optional instructions for students"
        placeholderTextColor={tokens.colors.textMuted}
        multiline
        textAlignVertical="top"
        style={styles.bodyInput}
      />

      {isAssignment ? (
        <>
          <View style={styles.switchRow}>
            <Text variant="bodySmall" style={styles.switchLabel}>
              Graded (students receive a score)
            </Text>
            <Switch
              value={graded}
              onValueChange={setGraded}
              trackColor={{ false: tokens.colors.border, true: tokens.colors.primaryMuted }}
              thumbColor={graded ? tokens.colors.primary : tokens.colors.surface}
            />
          </View>

          <View style={styles.fieldBlock}>
            <DueDatePicker value={dueDate} onChange={setDueDate} />
          </View>
        </>
      ) : null}

      {keepFiles.length > 0 ? (
        <View style={styles.section}>
          <Text variant="caption" color="textMuted" style={styles.sectionTitle}>
            Current file(s)
          </Text>
          {keepFiles.map((file) => (
            <View key={`${file.url}-${file.filename}`} style={styles.fileChip}>
              <Ionicons name="document-outline" size={16} color={tokens.colors.textSecondary} />
              <ScalePressable style={styles.fileName} onPress={() => openFile(file)}>
                <Text variant="caption" color="textSecondary" numberOfLines={1}>
                  {file.filename}
                </Text>
              </ScalePressable>
              <ScalePressable
                onPress={() =>
                  Alert.alert('Remove file', `Remove “${file.filename}” from this coursework?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: () =>
                        setKeepFiles((prev) => prev.filter((item) => item.url !== file.url)),
                    },
                  ])
                }
                hapticStyle="select"
              >
                <Ionicons name="close-circle" size={18} color={tokens.colors.danger} />
              </ScalePressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text variant="caption" color="textMuted" style={styles.sectionTitle}>
          Add file(s)
        </Text>
        <Button
          label="Choose files"
          variant="outline"
          icon="attach-outline"
          onPress={() => void pickFiles()}
        />
        {newFiles.length === 0 ? (
          <Text variant="caption" color="textMuted">
            No file chosen
          </Text>
        ) : (
          newFiles.map((file, index) => (
            <View key={`${file.uri}-${index}`} style={styles.fileChip}>
              <Ionicons name="document-outline" size={16} color={tokens.colors.textSecondary} />
              <Text
                variant="caption"
                color="textSecondary"
                style={styles.fileName}
                numberOfLines={1}
              >
                {file.name}
              </Text>
              <ScalePressable
                hapticStyle="select"
                onPress={() =>
                  setNewFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                <Ionicons name="close-circle" size={18} color={tokens.colors.danger} />
              </ScalePressable>
            </View>
          ))
        )}
        <Text variant="caption" color="textMuted">
          Images, PDF, and Office docs (docx/xls/ppt), csv, txt
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          label="Cancel"
          variant="outline"
          onPress={() => navigation.goBack()}
          disabled={busy}
          style={styles.footerBtn}
        />
        <Button
          label="Save"
          onPress={save}
          loading={busy}
          disabled={!title.trim() || !groupId || busy}
          style={styles.footerBtn}
        />
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  fieldBlock: {
    marginBottom: tokens.spacing.lg,
  },
  contentLabel: {
    marginBottom: tokens.spacing.sm,
    marginLeft: tokens.spacing.xs,
  },
  bodyInput: {
    minHeight: 110,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  switchLabel: {
    flex: 1,
  },
  section: {
    marginBottom: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  sectionTitle: {
    fontFamily: tokens.fontFamily.semibold,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    backgroundColor: tokens.colors.surfaceAlt,
    borderRadius: tokens.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
  },
  fileName: {
    flex: 1,
    fontFamily: tokens.fontFamily.medium,
  },
  footer: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  footerBtn: {
    flex: 1,
  },
});
