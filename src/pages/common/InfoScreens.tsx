import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { StackScreen } from '@/components/custom/StackScreen';
import { useIsStaff } from '@/hooks/useHasPermission';
import { ApiError } from '@/api/client';
import { deleteMobileAccount, getMobileFeatures } from '@/api/mobileAccount';
import { useLogout } from '@/queries/useAuth';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';

const DELETE_CONFIRM_MESSAGE =
  "Deleting your account closes it and signs you out on all your devices. This can't be undone from the app.";

export function PrivacySecurityScreen() {
  const [showDelete, setShowDelete] = useState(false);
  const [checking, setChecking] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const logout = useLogout();
  const showToast = useToastStore((state) => state.show);

  // Fetch every time this screen opens — never cache the company switch value.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setChecking(true);
      void (async () => {
        try {
          const features = await getMobileFeatures();
          if (!cancelled) setShowDelete(Boolean(features.showAppAccountDelete));
        } catch {
          if (!cancelled) setShowDelete(false);
        } finally {
          if (!cancelled) setChecking(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  async function clearSessionLocally() {
    try {
      await logout.mutateAsync();
    } catch {
      // Local cleanup still runs inside useLogout.
    }
  }

  async function performDelete() {
    setDeleting(true);
    try {
      const result = await deleteMobileAccount();
      haptics.success();
      showToast(result.message?.trim() || 'Your account has been deleted.', 'success');
      await clearSessionLocally();
    } catch (error) {
      haptics.warning();
      if (error instanceof ApiError) {
        const code = error.code ?? '';
        if (code === 'ACCOUNT_INACTIVE' || code === 'TOKEN_INVALID' || error.status === 401) {
          showToast(error.message || 'Your account is no longer active.', 'danger');
          await clearSessionLocally();
          return;
        }
        if (code === 'ACCOUNT_DELETE_NOT_ALLOWED' || code === 'ACCOUNT_DELETE_DISABLED') {
          showToast(error.message || 'Account deletion is not available.', 'danger');
          setShowDelete(false);
          return;
        }
        showToast(error.message || 'Could not delete account.', 'danger');
        return;
      }
      showToast('Could not delete account.', 'danger');
    } finally {
      setDeleting(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete account', DELETE_CONFIRM_MESSAGE, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete account',
        style: 'destructive',
        onPress: () => {
          void performDelete();
        },
      },
    ]);
  }

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
      <Text variant="body" color="textSecondary" style={styles.p}>
        Push types: announcements, upcoming class, upcoming training, and course progress reminders.
      </Text>

      {!checking && showDelete ? (
        <View style={styles.deleteSection}>
          <Text variant="title" style={styles.h}>
            Account
          </Text>
          <Text variant="body" color="textSecondary" style={styles.p}>
            Permanently close your student account. Staff can restore it from trash if needed.
          </Text>
          <Button
            label={deleting ? 'Deleting…' : 'Delete account'}
            variant="outline"
            icon="trash-outline"
            loading={deleting}
            disabled={deleting}
            onPress={confirmDelete}
            style={styles.deleteButton}
          />
        </View>
      ) : null}
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
    <StackScreen title="About Orbi">
      <Logo variant="mark" size="lg" />
      <Text variant="heading" style={styles.h}>
        Orbi
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
  deleteSection: {
    marginTop: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.border,
  },
  deleteButton: {
    borderColor: tokens.colors.danger,
    alignSelf: 'stretch',
  },
});
