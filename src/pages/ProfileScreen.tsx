import { useCallback, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

const DETAIL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Email: 'mail-outline',
  Mobile: 'call-outline',
  Company: 'business-outline',
  Country: 'globe-outline',
  City: 'location-outline',
  Status: 'shield-checkmark-outline',
};

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

        <View style={styles.identityWrap}>
          <LinearGradient
            colors={tokens.gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.identityCard}
          >
            <View style={styles.avatarRing}>
              {user?.photoUrl ? (
                <Image source={{ uri: user.photoUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text variant="heading" color="primary">
                    {initial}
                  </Text>
                </View>
              )}
            </View>

            <Text variant="title" color="onPrimary" style={styles.name}>
              {name}
            </Text>
            <Text variant="bodySmall" color="onPrimary" style={styles.email}>
              {user?.email ?? '—'}
            </Text>

            <View style={styles.badges}>
              <Badge label={roleLabel} tone="neutral" style={styles.badge} />
              {statusLabel ? (
                <Badge
                  label={statusLabel}
                  tone={statusLabel.toLowerCase() === 'active' ? 'success' : 'neutral'}
                  style={styles.badge}
                />
              ) : null}
            </View>
          </LinearGradient>
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
                  <View style={styles.iconChip}>
                    <Ionicons
                      name={DETAIL_ICONS[row.label] ?? 'ellipse-outline'}
                      size={16}
                      color={tokens.colors.secondary}
                    />
                  </View>
                  <View style={styles.detailCopy}>
                    <Text variant="caption" color="textMuted">
                      {row.label}
                    </Text>
                    <Text variant="bodySmall" style={styles.detailValue} numberOfLines={2}>
                      {row.value}
                    </Text>
                  </View>
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
            <View style={styles.detailCopy}>
              <Text variant="bodySmall" style={styles.toggleLabel}>
                Push notifications
              </Text>
              <Text variant="caption" color="textMuted">
                Class, training, and course alerts
              </Text>
            </View>
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
            icon="key-outline"
            label="Change Password"
            onPress={() => navigation.navigate('ChangePassword')}
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
  identityWrap: {
    marginBottom: tokens.spacing.xl,
    borderRadius: tokens.radius.xl,
    overflow: 'hidden',
    ...tokens.shadows.md,
  },
  identityCard: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.xxl,
    paddingHorizontal: tokens.spacing.lg,
    gap: tokens.spacing.xs,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    backgroundColor: tokens.colors.glassTint,
    borderWidth: 2,
    borderColor: tokens.colors.glassBorder,
    marginBottom: tokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: tokens.colors.surfaceAlt,
  },
  avatarFallback: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: tokens.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    textAlign: 'center',
  },
  email: {
    textAlign: 'center',
    opacity: 0.85,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.sm,
  },
  badge: {
    alignSelf: 'center',
  },
  sectionLabel: {
    marginBottom: tokens.spacing.sm,
    marginLeft: tokens.spacing.xs,
  },
  group: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    marginBottom: tokens.spacing.xl,
    overflow: 'hidden',
    ...tokens.shadows.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
  },
  detailDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border,
  },
  detailCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
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
    width: 36,
    height: 36,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    fontFamily: tokens.fontFamily.medium,
  },
});
