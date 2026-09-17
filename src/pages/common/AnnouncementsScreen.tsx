import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { FilterSelectRow } from '@/features/bookings/components/BookingFilters';
import {
  useAnnouncements,
  useDeleteAnnouncement,
} from '@/queries/useAnnouncements';
import { useHasPermission, useIsStaff } from '@/hooks/useHasPermission';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';
import type { Announcement } from '@/api/announcements';
import type { BadgeTone } from '@/components/ui/Badge';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'Announcements'>;

const TYPE_OPTIONS = [
  { id: '', label: 'All Types' },
  { id: 'General', label: 'General' },
  { id: 'System', label: 'System' },
  { id: 'Course', label: 'Course' },
  { id: 'Urgent', label: 'Urgent' },
];

const STATUS_OPTIONS = [
  { id: '', label: 'All Statuses' },
  { id: 'Published', label: 'Published' },
  { id: 'Draft', label: 'Draft' },
  { id: 'Scheduled', label: 'Scheduled' },
  { id: 'Archived', label: 'Archived' },
];

const PRIORITY_OPTIONS = [
  { id: '', label: 'All Priorities' },
  { id: 'High', label: 'High' },
  { id: 'Medium', label: 'Medium' },
  { id: 'Low', label: 'Low' },
];

function statusTone(status?: string): BadgeTone {
  const value = (status ?? '').toLowerCase();
  if (value.includes('publish')) return 'success';
  if (value.includes('archiv')) return 'warning';
  if (value.includes('draft') || value.includes('schedul')) return 'neutral';
  return 'primary';
}

export function AnnouncementsScreen({ navigation }: Props) {
  const isStaff = useIsStaff();
  const canManage = useHasPermission('manage_announcements');
  const canView = useHasPermission('view_announcements');
  const { data, isLoading } = useAnnouncements(isStaff ? undefined : 'students');
  const remove = useDeleteAnnouncement();
  const showToast = useToastStore((state) => state.show);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const items = data ?? [];
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (typeFilter && (item.type ?? 'General') !== typeFilter) return false;
      if (statusFilter && (item.status ?? '') !== statusFilter) return false;
      if (priorityFilter && (item.priority ?? 'Medium') !== priorityFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q)
      );
    });
  }, [items, search, typeFilter, statusFilter, priorityFilter]);

  function confirmDelete(item: Announcement) {
    Alert.alert('Delete announcement', `Remove “${item.title}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          remove.mutate(item.id, {
            onSuccess: () => {
              haptics.warning();
              showToast('Announcement deleted', 'neutral');
            },
            onError: (error) =>
              showToast(
                error instanceof Error ? error.message : 'Could not delete announcement',
                'danger',
              ),
          }),
      },
    ]);
  }

  if (!isStaff) {
    return (
      <StackScreen title="Announcements">
        {isLoading ? (
          <EntityListSkeleton />
        ) : items.length === 0 ? (
          <Text variant="body" color="textMuted">
            No announcements yet.
          </Text>
        ) : (
          items.map((item) => (
            <EntityRow
              key={item.id}
              icon="megaphone-outline"
              title={item.title}
              subtitle={item.body}
              meta={item.author}
              badge={item.pinned ? { label: 'Pinned', tone: 'warning' } : undefined}
              onPress={() =>
                navigation.navigate('AnnouncementDetail', { announcementId: item.id })
              }
            />
          ))
        )}
      </StackScreen>
    );
  }

  if (!canView) {
    return (
      <StackScreen title="Announcements">
        <Text variant="body" color="textMuted">
          You cannot manage announcements with this role.
        </Text>
      </StackScreen>
    );
  }

  return (
    <StackScreen title="Announcements" scroll={false}>
      <Text variant="bodySmall" color="textSecondary" style={styles.subtitle}>
        Manage, schedule, and distribute system, course, and urgent announcements.
      </Text>

      {canManage ? (
        <Button
          label="Create Announcement"
          icon="add"
          onPress={() => navigation.navigate('AnnouncementEditor', {})}
          style={styles.create}
        />
      ) : null}

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search title, content, keywords..."
        placeholderTextColor={tokens.colors.textMuted}
        style={styles.search}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <FilterSelectRow label="Type" value={typeFilter} options={TYPE_OPTIONS} onChange={setTypeFilter} />
      <FilterSelectRow
        label="Status"
        value={statusFilter}
        options={STATUS_OPTIONS}
        onChange={setStatusFilter}
      />
      <FilterSelectRow
        label="Priority"
        value={priorityFilter}
        options={PRIORITY_OPTIONS}
        onChange={setPriorityFilter}
      />

      {isLoading ? (
        <EntityListSkeleton rows={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="megaphone-outline"
          title="No announcements"
          message={
            canManage
              ? 'Create the first announcement for learners or staff.'
              : 'Nothing published yet.'
          }
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          initialNumToRender={8}
          renderItem={({ item }) => (
            <AnnouncementCard
              item={item}
              canManage={canManage}
              onView={() =>
                navigation.navigate('AnnouncementDetail', { announcementId: item.id })
              }
              onEdit={() =>
                navigation.navigate('AnnouncementEditor', { announcementId: item.id })
              }
              onDelete={() => confirmDelete(item)}
            />
          )}
        />
      )}
    </StackScreen>
  );
}

function AnnouncementCard({
  item,
  canManage,
  onView,
  onEdit,
  onDelete,
}: {
  item: Announcement;
  canManage: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.card, item.pinned && styles.cardPinned]}>
      <View style={styles.cardTop}>
        <View style={styles.badges}>
          <Badge label={item.type ?? 'General'} tone="primary" />
          <Badge label={item.status ?? 'Published'} tone={statusTone(item.status)} />
        </View>
        {item.pinned ? (
          <Ionicons name="pin" size={16} color={tokens.colors.tertiary} />
        ) : null}
      </View>

      <Text variant="bodySmall" style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text variant="caption" color="textSecondary" numberOfLines={3}>
        {item.body}
      </Text>

      <View style={styles.metaBlock}>
        <Text variant="caption" color="textMuted">
          Publish: {item.publishLabel || '—'}
        </Text>
        <Text variant="caption" color="textMuted">
          Expiry: {item.expiryLabel || 'Never'}
        </Text>
      </View>

      <View style={styles.actions}>
        <ScalePressable hapticStyle="select" onPress={onView} style={styles.actionBtn}>
          <Ionicons name="eye-outline" size={18} color={tokens.colors.primary} />
        </ScalePressable>
        {canManage ? (
          <>
            <ScalePressable hapticStyle="select" onPress={onEdit} style={styles.actionBtn}>
              <Ionicons name="create-outline" size={18} color={tokens.colors.primary} />
            </ScalePressable>
            <ScalePressable hapticStyle="select" onPress={onDelete} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={18} color={tokens.colors.danger} />
            </ScalePressable>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginBottom: tokens.spacing.md,
  },
  create: {
    marginBottom: tokens.spacing.md,
  },
  search: {
    marginBottom: tokens.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface,
    color: tokens.colors.textPrimary,
    fontFamily: tokens.fontFamily.regular,
    fontSize: tokens.fontSize.sm,
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
    gap: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  cardPinned: {
    borderLeftWidth: 3,
    borderLeftColor: tokens.colors.tertiary,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
    flex: 1,
  },
  cardTitle: {
    fontFamily: tokens.fontFamily.semibold,
  },
  metaBlock: {
    gap: 2,
    marginTop: tokens.spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.xs,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surfaceAlt,
  },
});
