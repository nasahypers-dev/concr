import { View } from 'react-native';
import { cn } from './cn';
import { Icon } from './icon';
import { Text } from './text';
import { colors } from './theme';

export interface StepperProps {
  steps: string[];
  /** 0-based index of the active step. */
  current: number;
  className?: string;
}

/** Wizard progress: done steps get a check, the active one the accent colour. */
export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <View className={cn('flex-row items-start', className)} accessibilityRole="progressbar">
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <View key={label} className="flex-1 items-center">
            <View className="w-full flex-row items-center">
              <View
                className={cn(
                  'h-0.5 flex-1',
                  index === 0 ? 'bg-transparent' : done || active ? 'bg-primary' : 'bg-border',
                )}
              />
              <View
                className={cn(
                  'h-7 w-7 items-center justify-center rounded-full border-2',
                  done && 'border-primary bg-primary',
                  active && 'border-accent bg-accent',
                  !done &&
                    !active &&
                    'border-border bg-surface dark:border-border-dark dark:bg-surface-dark',
                )}
              >
                {done ? (
                  <Icon name="checkmark" size="sm" color={colors.primaryForeground} />
                ) : (
                  <Text
                    variant="caption"
                    weight="semibold"
                    tone="none"
                    className={active ? 'text-accent-foreground' : 'text-ink-subtle'}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <View
                className={cn(
                  'h-0.5 flex-1',
                  index === steps.length - 1 ? 'bg-transparent' : done ? 'bg-primary' : 'bg-border',
                )}
              />
            </View>
            <Text
              variant="caption"
              weight={active ? 'semibold' : 'regular'}
              tone={active ? 'default' : 'muted'}
              className="mt-1 text-center"
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
