import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ReportStatus } from '../types';
import { STATUS_INFO } from '../data/catalog';
import { typography } from '../theme';

interface StatusBadgeProps {
  status: ReportStatus;
  small?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, small }) => {
  const info = STATUS_INFO[status] ?? STATUS_INFO.Recebida;
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: info.bg },
        small && styles.badgeSmall,
      ]}
    >
      <Text style={[styles.text, { color: info.color }, small && styles.textSmall]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: { ...typography.label },
  textSmall: { fontSize: 11 },
});