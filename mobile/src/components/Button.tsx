import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  fullWidth = true,
  style,
}) => {
  const isInactive = !!disabled || !!loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
      style={[
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        isInactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? colors.white : colors.primary} />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text
            style={[
              styles.label,
              variant === 'primary' || variant === 'danger'
                ? styles.labelOnPrimary
                : variant === 'secondary'
                  ? styles.labelOnSecondary
                  : styles.labelOnGhost,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  iconWrap: { marginRight: spacing.xxs },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.danger },
  disabled: { opacity: 0.55 },
  label: { ...typography.subtitle },
  labelOnPrimary: { color: colors.white },
  labelOnSecondary: { color: colors.primaryDark },
  labelOnGhost: { color: colors.primaryDark },
});