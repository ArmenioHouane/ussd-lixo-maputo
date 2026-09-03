import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface RowProps {
  label: string;
  value: string;
  style?: StyleProp<ViewStyle>;
}

export const InfoRow: React.FC<RowProps> = ({ label, value, style }) => (
  <View style={[styles.row, style]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value} numberOfLines={2}>
      {value || '—'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: { ...typography.caption, color: colors.textMuted, marginBottom: 2 },
  value: { ...typography.body, color: colors.textPrimary, fontWeight: '500' },
});