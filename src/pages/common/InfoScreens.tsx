import { StyleSheet } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { StackScreen } from '@/components/custom/StackScreen';
import { useIsStaff } from '@/hooks/useHasPermission';

export function PrivacySecurityScreen() {
  return (
    <StackScreen title="Privacy & Security">
      <Text variant="title" style={styles.h}>
        Session
      </Text>
      <Text variant="body" color="textSecondary" style={styles.p}>
        Signed-in sessions last 7 days, matching the KBM web app. You will be signed out
        automatically when the session expires.
      </Text>
      <Text variant="title" style={styles.h}>
        Data
      </Text>
      <Text variant="body" color="textSecondary" style={styles.p}>
        Course progress, bookings, and messages are stored against your KBM account. Staff access is
        limited by role permissions.
      </Text>
      <Text variant="title" style={styles.h}>
        Notifications
      </Text>
      <Text variant="body" color="textSecondary">
        Push types: announcements, upcoming class, upcoming training, and course progress reminders.
      </Text>
    </StackScreen>
  );
}

export function HelpSupportScreen() {
  const isStaff = useIsStaff();

  return (
    <StackScreen title="Help & Support">
      <Text variant="title" style={styles.h}>
        Contact
      </Text>
      <Text variant="body" color="textSecondary" style={styles.p}>
        Email support@kbmtraining.com
        {isStaff ? ' or your CRM administrator for module access.' : ' or use Chat for instructor questions.'}
      </Text>
      {isStaff ? (
        <>
          <Text variant="title" style={styles.h}>
            Staff tools
          </Text>
          <Text variant="body" color="textSecondary">
            Overview lists every tool your role allows — bookings, groups, directory, coursework,
            invoices, agreements, announcements, closing calendar days, and shifts. Missing a tool?
            Your account needs that permission in CRM.
          </Text>
        </>
      ) : (
        <>
          <Text variant="title" style={styles.h}>
            Booking a class
          </Text>
          <Text variant="body" color="textSecondary">
            Open Book Class from Home, pick a slot, and confirm. Cancel from My Bookings while the
            status is confirmed.
          </Text>
        </>
      )}
    </StackScreen>
  );
}

export function AboutKbmScreen() {
  return (
    <StackScreen title="About KBM">
      <Text variant="heading" style={styles.h}>
        KBM Training & Recruitment
      </Text>
      <Text variant="body" color="textSecondary" style={styles.p}>
        Professional training for accounting, customer care, and digital accounts. This app is for
        learners and staff.
      </Text>
      <Text variant="caption" color="textMuted">
        Version 1.0.0
      </Text>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  h: {
    marginBottom: tokens.spacing.sm,
    marginTop: tokens.spacing.md,
  },
  p: {
    marginBottom: tokens.spacing.md,
  },
});
