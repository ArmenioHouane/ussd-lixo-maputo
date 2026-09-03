export const colors = {
  primary: '#1B7A43',
  primaryDark: '#0F5230',
  primaryLight: '#E5F4EC',
  background: '#F4F7F4',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F2',
  border: '#D6E1D8',
  textPrimary: '#0F1F14',
  textSecondary: '#4D5B51',
  textMuted: '#7A857C',
  danger: '#B3261E',
  warning: '#A35A00',
  info: '#1F3A8A',
  success: '#0B6B30',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(15, 31, 20, 0.45)',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const typography = {
  display: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  title: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
  subtitle: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.4 },
};