import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Screen } from '@/components/custom/Screen';
import { PageHeader } from '@/components/ui/PageHeader';
import { MenuRow } from '@/features/profile/components/MenuRow';
import { useAuthStore } from '@/store/useAuthStore';
import type { MainTabScreenProps } from '@/navigation/types';
import type { StaffPermission } from '@/features/auth/permissions';

type Props = MainTabScreenProps<'More'>;

const ITEMS: {
  label: string;
  icon:
    | 'people-outline'
    | 'document-text-outline'
    | 'receipt-outline'
    | 'document-attach-outline'
    | 'megaphone-outline'
    | 'close-circle-outline'
    | 'time-outline';
  permission: StaffPermission;
  route:
    | 'UserDirectory'
    | 'StaffCoursework'
    | 'Invoices'
    | 'Agreements'
    | 'Announcements'
    | 'CloseCalendar'
    | 'BookingShifts';
}[] = [
  {
    label: 'Users directory',
    icon: 'people-outline',
    permission: 'view_users',
    route: 'UserDirectory',
  },
  {
    label: 'Coursework',
    icon: 'document-text-outline',
    permission: 'view_coursework',
    route: 'StaffCoursework',
  },
  {
    label: 'Invoices',
    icon: 'receipt-outline',
    permission: 'view_invoices',
    route: 'Invoices',
  },
  {
    label: 'Agreements',
    icon: 'document-attach-outline',
    permission: 'view_agreements',
    route: 'Agreements',
  },
  {
    label: 'Announcements',
    icon: 'megaphone-outline',
    permission: 'view_announcements',
    route: 'Announcements',
  },
  {
    label: 'Close calendar day',
    icon: 'close-circle-outline',
    permission: 'close_calendar',
    route: 'CloseCalendar',
  },
  {
    label: 'Booking shifts',
    icon: 'time-outline',
    permission: 'view_shifts',
    route: 'BookingShifts',
  },
];

export function StaffMoreScreen({ navigation }: Props) {
  const permissions = useAuthStore((state) => state.user?.permissions ?? []);
  const visible = ITEMS.filter((item) => permissions.includes(item.permission));

  return (
    <Screen style={styles.screen}>
      <PageHeader title="More" subtitle="Tools available for your role." />
      <View style={styles.group}>
        {visible.map((item, index) => (
          <MenuRow
            key={item.route}
            icon={item.icon}
            label={item.label}
            isFirst={index === 0}
            isLast={index === visible.length - 1}
            onPress={() => navigation.navigate(item.route)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.sm,
  },
  group: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    ...tokens.shadows.sm,
  },
});
