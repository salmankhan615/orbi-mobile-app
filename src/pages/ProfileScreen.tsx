import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Screen } from '@/components/custom/Screen';
import { MenuRow } from '@/features/profile/components/MenuRow';
import { useAuthStore } from '@/store/useAuthStore';
import { useCourses } from '@/queries/useCourses';
import { haptics } from '@/utils/haptics';

export function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { data: courses } = useCourses();
  const [notificationsOn, setNotificationsOn] = useState(true);

  const enrolled = courses?.length ?? 0;
  const completed = courses?.filter((c) => c.status === 'completed').length ?? 0;
  const inProgress = courses?.filter((c) => c.status === 'in_progress').length ?? 0;

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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
              {(user?.name ?? 'G').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text variant="title" color="onPrimary">
            {user?.name ?? 'Guest'}
          </Text>
          <Text variant="bodySmall" color="onPrimary" style={styles.email}>
            {user?.email ?? 'guest@kbm.com'}
          </Text>
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text variant="title">{enrolled}</Text>
            <Text variant="caption" color="textMuted">
              Enrolled
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text variant="title" color="success">
              {inProgress}
            </Text>
            <Text variant="caption" color="textMuted">
              In Progress
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text variant="title" color="primary">
              {completed}
            </Text>
            <Text variant="caption" color="textMuted">
              Completed
            </Text>
          </View>
        </View>

        <Text variant="overline" color="textMuted" style={styles.sectionLabel}>
          Preferences
        </Text>
        <View style={styles.group}>
          <View style={styles.toggleRow}>
            <View style={styles.iconChip}>
              <Ionicons name="notifications" size={16} color={tokens.colors.success} />
            </View>
            <Text variant="bodySmall" style={styles.toggleLabel}>
              Notifications
            </Text>
            <Switch
              value={notificationsOn}
              onValueChange={(value) => {
                haptics.select();
                setNotificationsOn(value);
              }}
              trackColor={{ true: tokens.colors.success, false: tokens.colors.border }}
              thumbColor={tokens.colors.onPrimary}
            />
          </View>
        </View>

        <Text variant="overline" color="textMuted" style={styles.sectionLabel}>
          Account
        </Text>
        <View style={styles.group}>
          <MenuRow icon="person-outline" label="Edit Profile" isFirst onPress={() => {}} />
          <MenuRow icon="lock-closed-outline" label="Privacy & Security" onPress={() => {}} />
          <MenuRow icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
          <MenuRow
            icon="information-circle-outline"
            label="About KBM"
            trailingLabel="v1.0.0"
            isLast
            onPress={() => {}}
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
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.sm,
  },
  content: {
    paddingBottom: tokens.spacing.xxxl,
  },
  pageTitle: {
    marginBottom: tokens.spacing.xl,
  },
  heroCard: {
    alignItems: 'center',
    borderRadius: tokens.radius.xl,
    paddingVertical: tokens.spacing.xxl,
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
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
  statsRow: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
    ...tokens.shadows.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: tokens.colors.border,
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
    backgroundColor: tokens.colors.successMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    flex: 1,
    fontFamily: tokens.fontFamily.medium,
  },
});
