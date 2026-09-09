import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { CourseworkFileChip } from '@/features/coursework/components/CourseworkFileChip';
import { courseworkTabForKind, type CourseworkTab } from '@/api/coursework';
import { useCoursework } from '@/queries/useCoursework';
import type { BadgeTone } from '@/components/ui/Badge';
import type { CourseworkFile, CourseworkItem } from '@/api/staff';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'Coursework'>;

const TABS: { key: CourseworkTab; label: string }[] = [
  { key: 'assignment', label: 'Assignments' },
  { key: 'resource', label: 'Resources' },
];

const STATUS_TONE: Record<CourseworkItem['status'], BadgeTone> = {
  open: 'warning',
  submitted: 'success',
  graded: 'primary',
};

export function StudentCourseworkScreen({ navigation, route }: Props) {
  const { data: items, isError, error, isPending, loadError } = useCoursework();
  const [tab, setTab] = useState<CourseworkTab>(route.params?.tab ?? 'assignment');

  useEffect(() => {
    const next = route.params?.tab;
    if (next === 'assignment' || next === 'resource') {
      setTab(next);
    }
  }, [route.params?.tab]);

  const list = items ?? [];
  const assignments = useMemo(
    () => list.filter((item) => courseworkTabForKind(item.kind) === 'assignment'),
    [list],
  );
  const resources = useMemo(
    () => list.filter((item) => courseworkTabForKind(item.kind) === 'resource'),
    [list],
  );
  const visible = tab === 'assignment' ? assignments : resources;
  const errorMessage =
    loadError ?? (error instanceof Error ? error.message : 'Could not load coursework.');

  function openFile(file: CourseworkFile) {
    navigation.navigate('CourseworkFile', {
      url: file.url,
      filename: file.filename,
      type: file.type,
    });
  }

  return (
    <StackScreen title="Coursework">
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
                  color={active ? 'primary' : 'textSecondary'}
                  style={styles.tabLabel}
                >
                  {item.label} ({count})
                </Text>
              </View>
            </ScalePressable>
          );
        })}
      </View>

      {isPending ? (
        <EmptyState icon="hourglass-outline" message="Loading coursework…" />
      ) : isError ? (
        <EmptyState icon="alert-circle-outline" message={errorMessage} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          message={
            tab === 'assignment' ? 'No assignments assigned yet.' : 'No resources assigned yet.'
          }
        />
      ) : (
        visible.map((item, index) => (
          <ScalePressable
            key={item.id}
            onPress={() => navigation.navigate('CourseworkDetail', { courseworkId: item.id })}
            style={styles.card}
          >
            <View style={styles.cardTop}>
              <Text variant="caption" color="textMuted" style={styles.index}>
                #{index + 1}
              </Text>
              {tab === 'assignment' ? (
                <Badge label={item.status} tone={STATUS_TONE[item.status]} />
              ) : null}
            </View>

            <Text variant="bodySmall" style={styles.title}>
              {item.title}
            </Text>
            <Text variant="caption" color="textSecondary">
              Group · {item.groupName ?? item.courseTitle}
            </Text>

            {tab === 'assignment' ? (
              <View style={styles.metaRow}>
                <Text variant="caption" color={item.dueDate !== '—' ? 'danger' : 'textMuted'}>
                  Due {item.dueDate}
                </Text>
                {item.score != null && item.maxScore != null ? (
                  <Text variant="caption" color="textSecondary" style={styles.score}>
                    Score {item.score}/{item.maxScore}
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.fileList}>
                {(item.attachments ?? []).map((file) => (
                  <CourseworkFileChip
                    key={`${file.url}-${file.filename}`}
                    file={file}
                    onPress={() => openFile(file)}
                  />
                ))}
              </View>
            )}
          </ScalePressable>
        ))
      )}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
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
    backgroundColor: tokens.colors.surfaceAlt,
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
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
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
  score: {
    fontFamily: tokens.fontFamily.medium,
  },
  fileList: {
    marginTop: tokens.spacing.xs,
    gap: tokens.spacing.sm,
  },
});
