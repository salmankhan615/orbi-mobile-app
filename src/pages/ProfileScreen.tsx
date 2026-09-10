import { useCallback, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Screen } from '@/components/custom/Screen';
import { MenuRow } from '@/features/profile/components/MenuRow';
import { useCrmUser } from '@/queries/useAuth';
import { useAuthStore, displayName, displayPhone } from '@/store/useAuthStore';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { smoothScrollProps } from '@/utils/scroll';
import { haptics } from '@/utils/haptics';
import type { MainTabScreenProps } from '@/navigation/types';

type Props = MainTabScreenProps<'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const tabPadding = useTabBarPadding();
  const storeUser = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { data: crmUser, refetch } = useCrmUser();
  const [notificationsOn, setNotificationsOn] = useState(true);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const user = crmUser ?? storeUser;
  const name = displayName(user);
  const phone = displayPhone(user);
  const initial = (user?.firstName ?? 'G').charAt(0).toUpperCase();
  const roleLabel = user?.roleLabel || (user?.role === 'staff' ? 'Staff' : 'Student');
  const statusLabel = user?.status
    ? user.status.charAt(0).toUpperCase() + user.status.slice(1).toLowerCase()
    : undefined;

  const details = useMemo(() => {
    const rows: { label: string; value: string }[] = [];
    if (user?.email) rows.push({ label: 'Email', value: user.email });
    if (phone) rows.push({ label: 'Mobile', value: phone });
    if (user?.companyName) rows.push({ label: 'Company', value: user.companyName });
    if (user?.country) rows.push({ label: 'Country', value: user.country });
    if (user?.city) rows.push({ label: 'City', value: user.city });
    if (statusLabel) rows.push({ label: 'Status', value: statusLabel });
    return rows;
  }, [user, phone, statusLabel]);

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          haptics.warning();
          signOut();
        },
      },
    ]);
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabPadding }]}
        {...smoothScrollProps}
      >
        <Text variant="heading" style={styles.pageTitle}>
          Profile
        </Text>

        <View style={styles.identityCard}>
          <View style={styles.avatarWrap}>
            {user?.photoUrl ? (
              <Image source={{ uri: user.photoUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text variant="heading" color="onPrimary">
                  {initial}
                </Text>
              </View>
            )}
          </View>

          <Text variant="title" style={styles.name}>
            {name}
          </Text>
          <Text variant="bodySmall" color="textSecondary" style={styles.email}>
            {user?.email ?? '—'}
          </Text>

          <View style={styles.badges}>
            <Badge label={roleLabel} tone="primary" />
            {statusLabel ? (
              <Badge
                label={statusLabel}
                tone={statusLabel.toLowerCase() === 'active' ? 'success' : 'neutral'}
              />
            ) : null}
          </View>
        </View>

        {details.length > 0 ? (
          <>
            <Text variant="overline" color="textMuted" style={styles.sectionLabel}>
              Details
            </Text>
            <View style={styles.group}>
              {details.map((row, index) => (
                <View
                  key={row.label}
                  style={[styles.detailRow, index < details.length - 1 && styles.detailDivider]}
                >
                  <Text variant="caption" color="textMuted">
                    {row.label}
                  </Text>
                  <Text variant="bodySmall" style={styles.detailValue} numberOfLines={2}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Text variant="overline" color="textMuted" style={styles.sectionLabel}>
          Preferences
        </Text>
        <View style={styles.group}>
          <View style={styles.toggleRow}>
            <View style={styles.iconChip}>
              <Ionicons name="notifications" size={16} color={tokens.colors.secondary} />
            </View>
            <Text variant="bodySmall" style={styles.toggleLabel}>
              Push notifications
            </Text>
            <Switch
              value={notificationsOn}
              onValueChange={(value) => {
                haptics.select();
                setNotificationsOn(value);
              }}
              trackColor={{ true: tokens.colors.secondary, false: tokens.colors.border }}
              thumbColor={tokens.colors.onPrimary}
            />
          </View>
        </View>

        <Text variant="overline" color="textMuted" style={styles.sectionLabel}>
          Account
        </Text>
        <View style={styles.group}>
          <MenuRow
            icon="person-outline"
            label="Edit Profile"
            isFirst
            onPress={() => navigation.navigate('EditProfile')}
          />
          <MenuRow
            icon="lock-closed-outline"
            label="Privacy & Security"
            onPress={() => navigation.navigate('PrivacySecurity')}
          />
          <MenuRow
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => navigation.navigate('HelpSupport')}
          />
          <MenuRow
            icon="information-circle-outline"
            label="About KBM"
            trailingLabel="v1.0.0"
            isLast
            onPress={() => navigation.navigate('AboutKbm')}
          />
        </View>

        <View style={styles.group}>
          <MenuRow
            icon="log-out-outline"
            label="Sign Out"
            tone="danger"
            isFirst
            isLast
            onPress={handleSignOut}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  content: {},
  pageTitle: {
    marginBottom: tokens.spacing.xl,
  },
  identityCard: {
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    paddingVertical: tokens.spacing.xxl,
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
    gap: tokens.spacing.xs,
    ...tokens.shadows.sm,
  },
  avatarWrap: {
    marginBottom: tokens.spacing.sm,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: tokens.colors.surfaceAlt,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    textAlign: 'center',
  },
  email: {
    textAlign: 'center',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.sm,
  },
  sectionLabel: {
    marginBottom: tokens.spacing.sm,
    marginLeft: tokens.spacing.xs,
  },
  group: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    marginBottom: tokens.spacing.xl,
    overflow: 'hidden',
    ...tokens.shadows.sm,
  },
  detailRow: {
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    gap: 2,
  },
  detailDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border,
  },
  detailValue: {
    fontFamily: tokens.fontFamily.medium,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    flex: 1,
    fontFamily: tokens.fontFamily.medium,
  },
});
