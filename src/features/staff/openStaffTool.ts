import type { NavigationProp } from '@react-navigation/native';
import type { StaffTool } from '@/features/staff/staffTools';
import type { RootStackParamList, MainTabParamList } from '@/navigation/types';

type StaffNav = NavigationProp<RootStackParamList & MainTabParamList>;

/** Open a staff tool from Overview / Tools — typed per route. */
export function openStaffTool(navigation: StaffNav, tool: StaffTool) {
  if (tool.tab) {
    navigation.navigate(tool.tab);
    return;
  }
  switch (tool.route) {
    case 'AnnouncementEditor':
      navigation.navigate('AnnouncementEditor', {});
      return;
    case 'Announcements':
      navigation.navigate('Announcements');
      return;
    case 'UserDirectory':
      navigation.navigate('UserDirectory');
      return;
    case 'StaffCoursework':
      navigation.navigate('StaffCoursework');
      return;
    case 'Invoices':
      navigation.navigate('Invoices');
      return;
    case 'Agreements':
      navigation.navigate('Agreements');
      return;
    case 'CloseCalendar':
      navigation.navigate('CloseCalendar');
      return;
    case 'BookingShifts':
      navigation.navigate('BookingShifts');
      return;
    default:
      return;
  }
}
