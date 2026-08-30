import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/custom/Screen';

interface StackScreenProps {
  title: string;
  children: ReactNode;
  right?: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
}

export function StackScreen({ title, children, right, footer, scroll = true }: StackScreenProps) {
  const navigation = useNavigation();

  return (
    <Screen edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <IconButton name="arrow-back" onPress={() => navigation.goBack()} />
        <Text variant="title" style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {right ?? <View style={styles.headerSpacer} />}
      </View>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={styles.body}>{children}</View>
      )}
      {footer}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
    gap: tokens.spacing.sm,
  },
  title: {
    flex: 1,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxxl,
  },
  body: {
    flex: 1,
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.lg,
  },
});
