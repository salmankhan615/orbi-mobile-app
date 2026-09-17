import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FilterSelectRow } from '@/features/bookings/components/BookingFilters';
import { courseworkTabForKind, type CourseworkTab } from '@/api/coursework';
import { useDeleteCoursework, useStaffCoursework } from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';
import type { CourseworkItem } from '@/api/staff';
import type { RootStackScreenProps } from '@/navigation/types';
import { tokens } from '@/theme';

type Props = RootStackScreenProps<'StaffCoursework'>;

const TABS: { key: CourseworkTab; label: string }[] = [
  { key: 'assignment', label: 'Assignments' },
  { key: 'resource', label: 'Resources' },
];

export function StaffCourseworkScreen({ navigation }: Props) {
  const allowed = useHasPermission('view_coursework');
  const canSubs = useHasPermission('view_submissions');
  const { data, isLoading } = useStaffCoursework();
  const remove = useDeleteCoursework();
  const showToast = useToastStore((state) => state.show);
  const [tab, setTab] = useState<CourseworkTab>('assignment');
  const [groupId, setGroupId] = useState('');

  function confirmDelete(item: CourseworkItem) {
    Alert.alert('Delete coursework', `Delete “${item.title}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove.mutate(item.id, {
            onSuccess: () => {
              haptics.success();
              showToast('Coursework deleted', 'success');
            },
            onError: (error) => {
              haptics.warning();
              showToast(
                error instanceof Error ? error.message : 'Could not delete coursework',
                'danger',
              );
            },
          });
        },
      },
    ]);
  }

  const items = data ?? [];
  const assignments = useMemo(
    () => items.filter((item) => courseworkTabForKind(item.kind) === 'assignment'),
    [items],
  );
  const resources = useMemo(
    () => items.filter((item) => courseworkTabForKind(item.kind) === 'resource'),
    [items],
  );
  const tabItems = tab === 'assignment' ? assignments : resources;

  const groupOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of items) {
      const id = item.groupId || item.groupName || item.courseTitle;
      const label = item.groupName || item.courseTitle;
      if (id && label && !seen.has(id)) seen.set(id, label);
    }
    return [
      { id: '', label: 'All groups' },
      ...Array.from(seen.entries())
        .map(([id, label]) => ({ id, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [items]);

  const visible = useMemo(() => {
    if (!groupId) return tabItems;
    return tabItems.filter(
      (item) =>
        item.groupId === groupId || item.groupName === groupId || item.courseTitle === groupId,
    );
  }, [tabItems, groupId]);

  if (!allowed) {
    return (
      <StackScreen title="Coursework">
        <Text variant="body" color="textMuted">
          You do not have permission to view coursework.
        </Text>
      </StackScreen>
    );
  }

  return (
    <StackScreen
      title="Coursework"
      scroll={false}
      right={
        <ScalePressable
          onPress={() =>
            navigation.navigate('CourseworkEditor', {
              groupId: groupId || undefined,
              kind: tab,
            })
          }
          style={styles.headerAction}
        >
          <Ionicons name="add" size={22} color={tokens.colors.primary} />
        </ScalePressable>
      }
    >
      <View style={styles.tabs}>
        {TABS.map((item) => {
          const count = item.key === 'assignment' ? assignments.length : resources.length;
          const active = tab === item.key;
          return (
            <ScalePressable
              key={item.key}
              onPress={() => setTab(item.key)}
              hapticStyle="select"
              style={styles.tabPress}
            >
              <View style={[styles.tab, active && styles.tabActive]}>
                <Text
                  variant="caption"
                  color={active ? 'secondary' : 'textSecondary'}
                  style={styles.tabLabel}
                >
                  {item.label} ({isLoading ? '…' : count})
                </Text>
              </View>
            </ScalePressable>
          );
        })}
      </View>

      <FilterSelectRow label="Group" value={groupId} options={groupOptions} onChange={setGroupId} />

      {isLoading ? (
        <EntityListSkeleton rows={5} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          message={
            tab === 'assignment'
              ? 'No assignments yet. Tap + to add one.'
              : 'No resources yet. Tap + to add one.'
          }
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          initialNumToRender={12}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <CourseworkRow
              item={item}
              index={index}
              showGrading={tab === 'assignment'}
              canOpenSubmissions={canSubs && tab === 'assignment'}
              onSubmissions={() =>
                navigation.navigate('CourseworkSubmissions', { assignmentId: item.id })
              }
              onEdit={() => navigation.navigate('CourseworkEditor', { courseworkId: item.id })}
              onDelete={() => confirmDelete(item)}
            />
          )}
        />
      )}
    </StackScreen>
  );
}

function CourseworkRow({
  item,
  index,
  showGrading,
  canOpenSubmissions,
  onSubmissions,
  onEdit,
  onDelete,
}: {
  item: CourseworkItem;
  index: number;
  showGrading: boolean;
  canOpenSubmissions: boolean;
  onSubmissions: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const graded = item.gradedCount ?? 0;
  const submitted = item.submissionCount ?? 0;
  const grading = item.gradingLabel ?? 'ungraded';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text variant="caption" color="textMuted" style={styles.index}>
          #{item.number ?? index + 1}
        </Text>
        {showGrading ? (
          <Badge label={grading} tone={grading === 'graded' ? 'success' : 'neutral'} />
        ) : null}
      </View>

      <Text variant="bodySmall" style={styles.title}>
        {item.title}
      </Text>
      <Text variant="caption" color="textSecondary" numberOfLines={1}>
        {item.groupName || item.courseTitle}
      </Text>

      <View style={styles.metaRow}>
        <Text variant="caption" color={item.dueDate !== '—' ? 'textPrimary' : 'textMuted'}>
          Due {item.dueDate}
        </Text>
        {showGrading ? (
          <Text variant="caption" color="textSecondary" style={styles.ratio}>
            {graded}/{submitted}
          </Text>
        ) : null}
      </View>

      {item.lastUpdatedLabel ? (
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          Updated {item.lastUpdatedLabel}
        </Text>
      ) : null}

      <View style={styles.actions}>
        {canOpenSubmissions ? (
          <Button
            label="Submissions"
            variant="primary"
            onPress={onSubmissions}
            style={styles.submissionsBtn}
          />
        ) : (
          <View style={styles.submissionsBtn} />
        )}
        <ScalePressable onPress={onEdit} style={styles.iconAction}>
          <Ionicons name="create-outline" size={18} color={tokens.colors.primary} />
        </ScalePressable>
        <ScalePressable onPress={onDelete} style={styles.iconAction}>
          <Ionicons name="trash-outline" size={18} color={tokens.colors.danger} />
        </ScalePressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  tabPress: {
    flex: 1,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
  },
  tabActive: {
    backgroundColor: tokens.colors.secondaryMuted,
    borderColor: tokens.colors.secondary,
  },
  tabLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  list: {
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.xl,
    gap: tokens.spacing.md,
  },
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.xs,
    ...tokens.shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xs,
  },
  index: {
    fontFamily: tokens.fontFamily.medium,
  },
  title: {
    fontFamily: tokens.fontFamily.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: tokens.spacing.xs,
    gap: tokens.spacing.sm,
  },
  ratio: {
    fontFamily: tokens.fontFamily.medium,
  },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.sm,
  },
  submissionsBtn: {
    flex: 1,
    minHeight: 40,
  },
  iconAction: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
  },
});
