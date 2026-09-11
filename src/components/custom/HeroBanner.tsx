import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';

interface HeroBannerProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children?: ReactNode;
}

export function HeroBanner({ kicker, title, subtitle, icon, children }: HeroBannerProps) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={tokens.gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.top}>
          <View style={styles.copy}>
            {kicker ? (
              <Text variant="overline" color="onPrimary" style={styles.kicker}>
                {kicker}
              </Text>
            ) : null}
            <Text variant="title" color="onPrimary">
              {title}
            </Text>
            {subtitle ? (
              <Text variant="caption" color="onPrimary" style={styles.sub}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {icon ? (
            <View style={styles.iconChip}>
              <Ionicons name={icon} size={22} color={tokens.colors.onPrimary} />
            </View>
          ) : null}
        </View>
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: tokens.spacing.xl,
    borderRadius: tokens.radius.xl,
    overflow: 'hidden',
    ...tokens.shadows.md,
  },
  card: {
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    opacity: 0.8,
    letterSpacing: 0.8,
  },
  sub: {
    opacity: 0.9,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.glassTint,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
