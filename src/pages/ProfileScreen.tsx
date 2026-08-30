import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Screen } from '@/components/custom/Screen';
import { MenuRow } from '@/features/profile/components/MenuRow';
import { useAuthStore, displayName } from '@/store/useAuthStore';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { smoothScrollProps } from '@/utils/scroll';
import { haptics } from '@/utils/haptics';
import { useState } from 'react';
import type { MainTabScreenProps } from '@/navigation/types';

type Props = MainTabScreenProps<'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const tabPadding = useTabBarPadding();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const name = displayName(user);

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

        <LinearGradient
          colors={tokens.gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.avatar}>
            <Text variant="heading" color="primary">
              {(user?.firstName ?? 'G').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text variant="title" color="onPrimary">
            {name}
          </Text>
          <Text variant="bodySmall" color="onPrimary" style={styles.email}>
            {user?.email ?? 'guest@kbm.com'}
          </Text>
          <Badge label={user?.role === 'staff' ? 'Staff' : 'Student'} tone="warning" />
        </LinearGradient>

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
  heroCard: {
    alignItems: 'center',
    borderRadius: tokens.radius.xl,
    paddingVertical: tokens.spacing.xxl,
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
    gap: tokens.spacing.xs,
    ...tokens.shadows.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: tokens.colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm,
  },
  email: {
    opacity: 0.85,
  },
  sectionLabel: {
    marginBottom: tokens.spacing.sm,
    marginLeft: tokens.spacing.xs,
  },
  group: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    marginBottom: tokens.spacing.xl,
    overflow: 'hidden',
    ...tokens.shadows.sm,
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
