import type { PropsWithChildren } from 'react';
import { Pressable, type PressableProps, View, type ViewProps } from 'react-native';
import { cn } from './cn';

export interface CardProps extends PropsWithChildren<ViewProps> {
  className?: string;
  /** Tighter padding for list cards. */
  compact?: boolean;
  /** Make the whole card tappable. */
  onPress?: PressableProps['onPress'];
  accessibilityLabel?: string;
}

const base =
  'rounded-2xl border border-border bg-surface dark:border-border-dark dark:bg-surface-dark';

/** Elevated container for list items and sections; shadows are subtle to keep the graphite look. */
export function Card({
  children,
  className,
  compact,
  onPress,
  accessibilityLabel,
  ...rest
}: CardProps) {
  const padding = compact ? 'p-3' : 'p-4';
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        className={cn(base, padding, 'active:opacity-90', className)}
        style={shadow}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View className={cn(base, padding, className)} style={shadow} {...rest}>
      {children}
    </View>
  );
}

const shadow = {
  shadowColor: '#12161F',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
} as const;
