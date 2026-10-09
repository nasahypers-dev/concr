import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';
import { cn } from './cn';
import { Icon, type IconName } from './icon';
import { Text } from './text';
import { colors, darkColors, type ThemeColors, useThemeColors } from './theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  /** lg = 56 px (spec §13 driver buttons), md = 48 px, sm = 40 px. */
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  className?: string;
}

const containerByVariant: Record<ButtonVariant, string> = {
  primary: 'bg-primary dark:bg-accent active:opacity-90',
  secondary: 'bg-primary-soft dark:bg-surface-muted-dark active:opacity-80',
  outline: 'border border-border-strong bg-transparent dark:border-border-dark active:opacity-80',
  ghost: 'bg-transparent active:opacity-70',
  danger: 'bg-danger active:opacity-90',
};

const labelByVariant: Record<ButtonVariant, string> = {
  primary: 'text-primary-foreground dark:text-accent-foreground',
  secondary: 'text-ink dark:text-ink-dark',
  outline: 'text-ink dark:text-ink-dark',
  ghost: 'text-primary dark:text-accent',
  danger: 'text-white',
};

/** Icon/spinner colour must match the label classes above in both palettes. */
function iconColorFor(variant: ButtonVariant, theme: ThemeColors): string {
  const dark = theme === darkColors;
  switch (variant) {
    case 'primary':
      return theme.primaryForeground; // white on graphite, graphite on amber
    case 'secondary':
    case 'outline':
      return theme.ink;
    case 'ghost':
      return dark ? theme.accent : theme.primary;
    case 'danger':
      return colors.primaryForeground;
  }
}

const sizeClass: Record<ButtonSize, { box: string; text: 'body' | 'bodySm' }> = {
  sm: { box: 'min-h-10 px-3', text: 'bodySm' },
  md: { box: 'min-h-12 px-4', text: 'body' },
  lg: { box: 'min-h-14 px-5', text: 'body' },
};

/** One component for every CTA: big touch targets, loading and disabled states built in. */
export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  icon,
  loading = false,
  disabled = false,
  className,
  ...rest
}: ButtonProps) {
  const inactive = disabled || loading;
  const iconColor = iconColorFor(variant, useThemeColors());
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-xl',
        sizeClass[size].box,
        containerByVariant[variant],
        inactive && 'opacity-50',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? <Icon name={icon} size="md" color={iconColor} /> : null}
          <Text
            variant={sizeClass[size].text}
            weight="semibold"
            tone="none"
            className={labelByVariant[variant]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
