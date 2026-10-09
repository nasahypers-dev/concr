import { Ionicons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';
import { colors } from './theme';

export type IconName = keyof typeof Ionicons.glyphMap;
export type IconSize = 'sm' | 'md' | 'lg' | 'xl';

const sizePx: Record<IconSize, number> = { sm: 16, md: 20, lg: 24, xl: 32 };

export interface IconProps {
  name: IconName;
  size?: IconSize | number;
  color?: ColorValue;
  className?: string;
}

/** Ionicons wrapper with size tokens; colours default to the ink colour. */
export function Icon({ name, size = 'md', color = colors.ink, className }: IconProps) {
  return (
    <Ionicons
      name={name}
      size={typeof size === 'number' ? size : sizePx[size]}
      color={color}
      className={className}
    />
  );
}
