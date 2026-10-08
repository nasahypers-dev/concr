/**
 * Design tokens (spec §13). Single source for places that cannot use className
 * (navigators, StatusBar, ActivityIndicator). Keep in sync with tailwind.config.js.
 */
export const colors = {
  primary: '#12161F', // novxanibeton.az theme-color: deep graphite
  primaryForeground: '#FFFFFF',
  // TODO(nurlan): confirm accent colour (spec §22 Q11)
  accent: '#F5A623',
  accentForeground: '#12161F',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F4F6',
  surfaceDark: '#1C2230',
  ink: '#12161F',
  inkMuted: '#6B7280',
  inkInverse: '#F9FAFB',
  border: '#E5E7EB',
  danger: '#DC2626',
  success: '#16A34A',
} as const;

/** Minimum touch target for driver-facing controls (spec §13: 56 px). */
export const TOUCH_TARGET_MIN = 56;

export const tabBarOptions = {
  tabBarActiveTintColor: colors.accent,
  tabBarInactiveTintColor: colors.inkMuted,
  tabBarStyle: { backgroundColor: colors.primary, borderTopColor: colors.surfaceDark },
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.primaryForeground,
  headerTitleStyle: { fontWeight: '700' as const },
} as const;
