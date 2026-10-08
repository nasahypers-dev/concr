import { ActivityIndicator, Pressable, type PressableProps, Text } from 'react-native';
import { cn } from './cn';
import { colors } from './theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
}

const containerByVariant: Record<ButtonVariant, string> = {
  primary: 'bg-primary active:opacity-90',
  secondary: 'bg-surface-muted active:opacity-80',
  ghost: 'bg-transparent active:opacity-70',
  danger: 'bg-danger active:opacity-90',
};

const labelByVariant: Record<ButtonVariant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-ink',
  ghost: 'text-primary',
  danger: 'text-white',
};

const spinnerByVariant: Record<ButtonVariant, string> = {
  primary: colors.primaryForeground,
  secondary: colors.ink,
  ghost: colors.primary,
  danger: colors.primaryForeground,
};

/** Large touch target (min 56 px) for gloves-on driver use; one component for every CTA. */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  className,
  ...rest
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      className={cn(
        'min-h-14 flex-row items-center justify-center rounded-xl px-5',
        containerByVariant[variant],
        inactive && 'opacity-50',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={spinnerByVariant[variant]} />
      ) : (
        <Text className={cn('text-base font-semibold', labelByVariant[variant])}>{label}</Text>
      )}
    </Pressable>
  );
}
