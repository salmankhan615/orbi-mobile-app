import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Screen } from '@/components/custom/Screen';
import { EmptyState } from '@/components/custom/EmptyState';
import { BellButton } from '@/components/custom/BellButton';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { toolsForPermissions, type StaffTool } from '@/features/staff/staffTools';
import { openStaffTool } from '@/features/staff/openStaffTool';
import { useStaffBookings } from '@/queries/useBookings';
import { useAgreements } from '@/queries/useStaff';
import { useAuthStore } from '@/store/useAuthStore';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { smoothScrollProps } from '@/utils/scroll';
import type { MainTabScreenProps } from '@/navigation/types';

type Props = MainTabScreenProps<'Home'>;

export function StaffHomeScreen({ navigation }: Props) {
  const tabPadding = useTabBarPadding();
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const tools = useMemo(() => toolsForPermissions(permissions), [permissions]);

  const canBookings = useHasPermission('view_bookings');
  const canAgreements = useHasPermission('view_agreements');

  const { data: bookings, isLoading: bookingsLoading } = useStaffBookings();
  const { data: agreements } = useAgreements();

  const confirmedBookings = canBookings
    ? (bookings ?? []).filter((item) => item.status === 'confirmed').length
    : 0;
  const pendingAgreements = canAgreements
    ? (agreements ?? []).filter((item) => item.status === 'pending').length
    : 0;

  function openTool(tool: StaffTool) {
    openStaffTool(navigation, tool);
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabPadding }]}
        {...smoothScrollProps}
      >
        <View style={styles.greetingRow}>
          <View style={styles.greetingCopy}>
            <Text variant="overline" color="secondary">
              Staff console
            </Text>
            <Text variant="largeTitle">Hi, {user?.firstName ?? 'there'}</Text>
            <Text variant="bodySmall" color="textSecondary">
              {user?.roleLabel ?? 'Staff'} · tools match your permissions
            </Text>
          </View>
          <BellButton />
        </View>

        {(canBookings || canAgreements) && (
          <View style={styles.statsRow}>
            {canBookings ? (
              <View style={styles.stat}>
                <Text variant="title">{confirmedBookings}</Text>
                <Text variant="caption" color="textMuted">
                  Confirmed bookings
                </Text>
              </View>
            ) : null}
            {canBookings && canAgreements ? <View style={styles.statLine} /> : null}
            {canAgreements ? (
              <View style={styles.stat}>
                <Text variant="title">{pendingAgreements}</Text>
                <Text variant="caption" color="textMuted">
                  Pending agreements
                </Text>
              </View>
            ) : null}
          </View>
        )}

        <Text variant="title" style={styles.section}>
          Your tools
        </Text>
        {tools.length === 0 ? (
          <EmptyState
            icon="lock-closed-outline"
            title="No tools assigned"
            message="Your staff account has no module permissions yet."
          />
        ) : (
          <View style={styles.toolGrid}>
            {tools.map((tool) => (
              <ScalePressable
                key={tool.id}
                onPress={() => openTool(tool)}
                hapticStyle="select"
                style={styles.toolCard}
              >
                <View style={styles.toolIcon}>
                  <Ionicons name={tool.icon} size={20} color={tokens.colors.secondary} />
                </View>
                <Text variant="bodySmall" style={styles.toolLabel} numberOfLines={2}>
                  {tool.label}
                </Text>
                <Text variant="caption" color="textMuted" numberOfLines={2}>
                  {tool.description}
                </Text>
              </ScalePressable>
            ))}
          </View>
        )}

        {canBookings ? (
          <>
            <Text variant="title" style={styles.section}>
              Recent bookings
            </Text>
            {bookingsLoading ? (
              <EntityListSkeleton rows={3} />
            ) : (bookings ?? []).length === 0 ? (
              <EmptyState icon="clipboard-outline" message="No bookings to show." />
            ) : (
              (bookings ?? []).slice(0, 4).map((booking) => (
                <EntityRow
                  key={booking.id}
                  icon="calendar-outline"
                  title={booking.title}
                  subtitle={`${booking.studentName} · ${booking.date}`}
                  badge={{ label: booking.status, tone: 'success' }}
                  onPress={() =>
                    navigation.navigate('StaffBookingDetail', { bookingId: booking.id })
                  }
                />
              ))
            )}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: tokens.spacing.screen,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: tokens.spacing.md,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  greetingCopy: {
    flex: 1,
    gap: tokens.spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    paddingVertical: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
    ...tokens.shadows.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statLine: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: tokens.colors.border,
  },
  section: {
    marginBottom: tokens.spacing.md,
  },
  toolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.xl,
  },
  toolCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    gap: tokens.spacing.xs,
    ...tokens.shadows.sm,
  },
  toolIcon: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.xs,
  },
  toolLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
});
