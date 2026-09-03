import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle, icon }) => (
  <View style={styles.wrap}>
    <View style={styles.row}>
      {icon ? (
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={icon} size={24} color={colors.white} />
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
    </View>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

export const ScreenContainer: React.FC<{ children: React.ReactNode; scroll?: boolean }> = ({
  children,
  scroll = true,
}) => {
  if (scroll) {
    return (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
    );
  }
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.display, color: colors.white },
  subtitle: { ...typography.caption, color: colors.primaryLight, marginTop: spacing.xs },

  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  container: {
    flex: 1,
    padding: spacing.md,
  },
});