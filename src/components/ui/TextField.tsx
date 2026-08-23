import { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from './Text';

export interface TextFieldProps extends TextInputProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  secure?: boolean;
}

export function TextField({ label, icon, error, secure, ...rest }: TextFieldProps) {
  const [isSecure, setIsSecure] = useState(secure);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text variant="caption" color="textSecondary" style={styles.label}>
        {label}
      </Text>
      <View
        style={[
          styles.field,
          isFocused && styles.fieldFocused,
          Boolean(error) && styles.fieldError,
        ]}
      >
        {icon && <Ionicons name={icon} size={18} color={tokens.colors.textMuted} />}
        <TextInput
          style={styles.input}
          placeholderTextColor={tokens.colors.textMuted}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
        {secure && (
          <Ionicons
            name={isSecure ? 'eye-outline' : 'eye-off-outline'}
            size={18}
            color={tokens.colors.textMuted}
            onPress={() => setIsSecure((prev) => !prev)}
            suppressHighlighting
          />
        )}
      </View>
      {Boolean(error) && (
        <Text variant="caption" color="danger" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.lg,
  },
  label: {
    marginBottom: tokens.spacing.sm,
    marginLeft: tokens.spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surfaceAlt,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    height: 50,
    gap: tokens.spacing.sm,
    borderWidth: 1.5,
    borderColor: tokens.colors.transparent,
  },
  fieldFocused: {
    backgroundColor: tokens.colors.surface,
    borderColor: tokens.colors.primary,
  },
  fieldError: {
    borderColor: tokens.colors.danger,
    backgroundColor: tokens.colors.dangerMuted,
  },
  input: {
    flex: 1,
    fontSize: tokens.fontSize.lg,
    fontFamily: tokens.fontFamily.regular,
    color: tokens.colors.textPrimary,
    padding: 0,
  },
  error: {
    marginTop: tokens.spacing.xs,
    marginLeft: tokens.spacing.xs,
  },
});
