import { Ionicons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';
import { type ThemeColors, useThemeColors } from './theme';

export type IconName = keyof typeof Ionicons.glyphMap;
export type IconSize = 'sm' | 'md' | 'lg' | 'xl';
/** Semantic colour resolved against the active palette (light/dark). */
export type IconTone =
  | 'ink'
  | 'muted'
  | 'subtle'
  | 'accent'
  | 'accentStrong'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info'
  | 'onPrimary';

const toneKey: Record<IconTone, keyof ThemeColors> = {
  ink: 'ink',
  muted: 'inkMuted',
  subtle: 'inkSubtle',
  accent: 'accent',
  accentStrong: 'accentStrong',
  danger: 'danger',
  success: 'success',
  warning: 'warning',
  info: 'info',
  onPrimary: 'primaryForeground',
};

const sizePx: Record<IconSize, number> = { sm: 16, md: 20, lg: 24, xl: 32 };

export interface IconProps {
  name: IconName;
  size?: IconSize | number;
  tone?: IconTone;
  /** Explicit override (brand-fixed cases such as map markers); wins over `tone`. */
  color?: ColorValue;
  className?: string;
}

/** Ionicons wrapper with size tokens; colours follow the active palette through `tone`. */
export function Icon({ name, size = 'md', tone = 'ink', color, className }: IconProps) {
  const theme = useThemeColors();
  return (
    <Ionicons
      name={name}
      size={typeof size === 'number' ? size : sizePx[size]}
      color={color ?? theme[toneKey[tone]]}
      className={className}
    />
  );
}
