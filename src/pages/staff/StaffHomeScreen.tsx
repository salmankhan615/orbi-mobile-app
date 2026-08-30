import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Screen } from '@/components/custom/Screen';
import { EmptyState } from '@/components/custom/EmptyState';
import { BellButton } from '@/components/custom/BellButton';
import { EntityRow } from '@/components/custom/EntityRow';
import { AnnouncementBanner } from '@/features/announcements/components/AnnouncementBanner';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { useAnnouncements } from '@/queries/useAnnouncements';
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
  const { data: announcements } = useAnnouncements('staff');
  const { data: bookings } = useStaffBookings();
  const { data: agreements } = useAgreements();
  const canBookings = useHasPermission('view_bookings');
  const canAnnouncements = useHasPermission('view_announcements');
  const canManageAnnouncements = useHasPermission('manage_announcements');
  const canUsers = useHasPermission('view_users');
  const canShifts = useHasPermission('view_shifts');
  const canClose = useHasPermission('close_calendar');
  const canCoursework = useHasPermission('view_coursework');

  const pinned = announcements?.find((item) => item.pinned) ?? announcements?.[0];
  const todayBookings = (bookings ?? []).filter((item) => item.status === 'confirmed').length;
  const pendingAgreements = (agreements ?? []).filter((item) => item.status === 'pending').length;

  return (
    <Screen style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabPadding }]}
        {...smoothScrollProps}
      >
        <View style={styles.greetingRow}>
          <View style={styles.greetingCopy}>
            <Text variant="largeTitle">Hi, {user?.firstName ?? 'there'} 👋</Text>
            <Text variant="bodySmall" color="textSecondary">
              Staff overview
            </Text>
          </View>
          <BellButton />
        </View>

        {canAnnouncements && pinned ? (
          <AnnouncementBanner
            announcement={pinned}
            onPress={() => navigation.navigate('AnnouncementDetail', { announcementId: pinned.id })}
          />
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text variant="title">{todayBookings}</Text>
            <Text variant="caption" color="textMuted">
              Confirmed bookings
            </Text>
          </View>
          <View style={styles.statLine} />
          <View style={styles.stat}>
            <Text variant="title">{pendingAgreements}</Text>
            <Text variant="caption" color="textMuted">
              Pending agreements
            </Text>
          </View>
        </View>

        <Text variant="title" style={styles.section}>
          Shortcuts
        </Text>
        <View style={styles.shortcuts}>
          {canBookings ? (
            <Shortcut
              icon="clipboard-outline"
              label="Bookings"
              onPress={() => navigation.navigate('Bookings')}
            />
          ) : null}
          {canUsers ? (
            <Shortcut
              icon="people-outline"
              label="Directory"
              onPress={() => navigation.navigate('UserDirectory')}
            />
          ) : null}
          {canCoursework ? (
            <Shortcut
              icon="document-text-outline"
              label="Coursework"
              onPress={() => navigation.navigate('StaffCoursework')}
            />
          ) : null}
          {canShifts ? (
            <Shortcut
              icon="time-outline"
              label="Shifts"
              onPress={() => navigation.navigate('BookingShifts')}
            />
          ) : null}
          {canClose ? (
            <Shortcut
              icon="close-circle-outline"
              label="Close day"
              onPress={() => navigation.navigate('CloseCalendar')}
            />
          ) : null}
          {canManageAnnouncements ? (
            <Shortcut
              icon="create-outline"
              label="New post"
              onPress={() => navigation.navigate('AnnouncementEditor', {})}
            />
          ) : null}
        </View>

        {canBookings ? (
          <>
            <Text variant="title" style={styles.section}>
              Recent bookings
            </Text>
            {(bookings ?? []).slice(0, 4).map((booking) => (
              <EntityRow
                key={booking.id}
                icon="calendar-outline"
                title={booking.title}
                subtitle={`${booking.studentName} · ${booking.date}`}
                badge={{ label: booking.status, tone: 'success' }}
                onPress={() => navigation.navigate('StaffBookingDetail', { bookingId: booking.id })}
              />
            ))}
            {(bookings ?? []).length === 0 ? (
              <EmptyState icon="clipboard-outline" message="No bookings to show." />
            ) : null}
          </>
        ) : (
          <Text variant="bodySmall" color="textMuted">
            Your role does not include booking management.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}

function Shortcut({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <ScalePressable onPress={onPress} hapticStyle="select" style={styles.shortcut}>
      <Ionicons name={icon} size={18} color={tokens.colors.secondary} />
      <Text variant="caption" style={styles.shortcutLabel}>
        {label}
      </Text>
    </ScalePressable>
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
  shortcuts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.xl,
  },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.secondaryMuted,
  },
  shortcutLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
});
