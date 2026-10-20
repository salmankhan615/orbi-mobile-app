import type { NavigationProp } from '@react-navigation/native';
import { trackRoute } from '@/api/screenTracking';
import type { StaffTool } from '@/features/staff/staffTools';
import type { RootStackParamList, MainTabParamList } from '@/navigation/types';

type StaffNav = NavigationProp<RootStackParamList & MainTabParamList>;

/** Open a staff tool from Overview — track the exact destination route, then navigate. */
export function openStaffTool(navigation: StaffNav, tool: StaffTool) {
  if (tool.tab) {
    trackRoute(tool.tab);
    navigation.navigate(tool.tab);
    return;
  }
  switch (tool.route) {
    case 'AnnouncementEditor':
      trackRoute('AnnouncementEditor');
      navigation.navigate('AnnouncementEditor', {});
      return;
    case 'Announcements':
      trackRoute('Announcements');
      navigation.navigate('Announcements');
      return;
    case 'UserDirectory':
      trackRoute('UserDirectory');
      navigation.navigate('UserDirectory');
      return;
    case 'StaffCoursework':
      trackRoute('StaffCoursework');
      navigation.navigate('StaffCoursework');
      return;
    case 'Invoices':
      trackRoute('Invoices');
      navigation.navigate('Invoices');
      return;
    case 'Agreements':
      trackRoute('Agreements');
      navigation.navigate('Agreements');
      return;
    case 'CloseCalendar':
      trackRoute('CloseCalendar');
      navigation.navigate('CloseCalendar');
      return;
    case 'PracticalShifts':
      trackRoute('PracticalShifts');
      navigation.navigate('PracticalShifts');
      return;
    case 'BookingShifts':
      trackRoute('BookingShifts');
      navigation.navigate('BookingShifts');
      return;
    default:
      return;
  }
}
