import { useColorScheme } from 'react-native';

/**
 * Design tokens (spec §13). Single source for places that cannot use className
 * (navigators, StatusBar, ActivityIndicator, maps). Keep in sync with tailwind.config.js.
 */
export const colors = {
  primary: '#12161F', // novxanibeton.az theme-color: deep graphite
  primaryForeground: '#FFFFFF',
  primarySoft: '#E7E9EE',
  // TODO(nurlan): confirm accent colour (spec §22 Q11)
  accent: '#F5A623',
  accentForeground: '#12161F',
  accentSoft: '#FEF3DB',
  accentStrong: '#B86E00',
  background: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF0F3',
  ink: '#12161F',
  inkMuted: '#6B7280',
  inkSubtle: '#9CA3AF',
  inkInverse: '#F9FAFB',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  info: '#2563EB',
  infoSoft: '#DBEAFE',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  success: '#15803D',
  successSoft: '#DCFCE7',
} as const;

export type ThemeColors = { [K in keyof typeof colors]: string };

export const darkColors: ThemeColors = {
  ...colors,
  primary: '#F3F4F6',
  primaryForeground: '#12161F',
  primarySoft: '#1C2230',
  background: '#0B0E14',
  surface: '#151A23',
  surfaceMuted: '#1C2230',
  ink: '#F3F4F6',
  inkMuted: '#9CA3AF',
  inkSubtle: '#6B7280',
  inkInverse: '#12161F',
  border: '#2A3140',
  borderStrong: '#3B4454',
};

/** Palette for the current system colour scheme (for props that cannot take className). */
export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : colors;
}

/** Inter weights loaded in app/_layout.tsx; names must match the font files. */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Minimum touch target for driver-facing controls (spec §13: 56 px). */
export const TOUCH_TARGET_MIN = 56;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32 } as const;

export const tabBarOptions = {
  tabBarActiveTintColor: colors.accent,
  tabBarInactiveTintColor: colors.inkSubtle,
  tabBarStyle: { backgroundColor: colors.primary, borderTopColor: '#1C2230' },
  tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.primaryForeground,
  headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 18 },
  headerShadowVisible: false,
} as const;
