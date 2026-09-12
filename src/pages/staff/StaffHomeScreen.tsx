import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Screen } from '@/components/custom/Screen';
import { EmptyState } from '@/components/custom/EmptyState';
import { BellButton } from '@/components/custom/BellButton';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { toolsForPermissions, type StaffTool } from '@/features/staff/staffTools';
import { openStaffTool } from '@/features/staff/openStaffTool';
import { useAuthStore } from '@/store/useAuthStore';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { smoothScrollProps } from '@/utils/scroll';
import type { MainTabScreenProps } from '@/navigation/types';

type Props = MainTabScreenProps<'Home'>;

export function StaffHomeScreen({ navigation }: Props) {
  const tabPadding = useTabBarPadding();
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const tools = useMemo(() => toolsForPermissions(permissions), [permissions]);

  function openTool(tool: StaffTool) {
    openStaffTool(navigation, tool);
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabPadding }]}
        {...smoothScrollProps}
      >
        <View style={styles.greetingRow}>
          <View style={styles.greetingCopy}>
            <Text variant="overline" color="secondary">
              Staff console
            </Text>
            <Text variant="largeTitle">Hi, {user?.firstName ?? 'there'}</Text>
            <Text variant="bodySmall" color="textSecondary">
              {user?.roleLabel ?? 'Staff'} · tools match your permissions
            </Text>
          </View>
          <BellButton />
        </View>

        <Text variant="title" style={styles.section}>
          Your tools
        </Text>
        {tools.length === 0 ? (
          <EmptyState
            icon="lock-closed-outline"
            title="No tools assigned"
            message="Your staff account has no module permissions yet."
          />
        ) : (
          <View style={styles.toolGrid}>
            {tools.map((tool) => (
              <ScalePressable
                key={tool.id}
                onPress={() => openTool(tool)}
                hapticStyle="select"
                style={styles.toolCard}
              >
                <View style={styles.toolIcon}>
                  <Ionicons name={tool.icon} size={20} color={tokens.colors.secondary} />
                </View>
                <Text variant="bodySmall" style={styles.toolLabel} numberOfLines={2}>
                  {tool.label}
                </Text>
                <Text variant="caption" color="textMuted" numberOfLines={2}>
                  {tool.description}
                </Text>
              </ScalePressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
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
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.xl,
  },
  greetingCopy: {
    flex: 1,
    paddingRight: tokens.spacing.md,
  },
  section: {
    marginBottom: tokens.spacing.md,
  },
  toolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
  },
  toolCard: {
    width: '47%',
    flexGrow: 1,
    minWidth: 140,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    ...tokens.shadows.sm,
  },
  toolIcon: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm,
  },
  toolLabel: {
    marginBottom: tokens.spacing.xs,
  },
});
