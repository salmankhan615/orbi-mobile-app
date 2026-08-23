import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from './Text';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  large?: boolean;
}

export function PageHeader({ title, subtitle, right, large = true }: PageHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        <Text variant={large ? 'heading' : 'title'}>{title}</Text>
        {subtitle ? (
          <Text variant="bodySmall" color="textSecondary" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xl,
    gap: tokens.spacing.md,
  },
  copy: {
    flex: 1,
    gap: tokens.spacing.xs,
  },
  subtitle: {
    marginTop: tokens.spacing.xs,
  },
});
