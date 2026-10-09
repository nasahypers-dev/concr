import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
import { cn } from './cn';
import { Text } from './text';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** When given, pressing the selected option clears it (optional choices). */
  onDeselect?: () => void;
  className?: string;
  accessibilityLabel?: string;
}

/** Pill group for small enumerations (slump P2/P3/P4, payment method, filters). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  onDeselect,
  className,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      className={cn(
        'flex-row rounded-xl bg-surface-muted p-1 dark:bg-surface-muted-dark',
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled: option.disabled }}
            disabled={option.disabled}
            onPress={() => {
              if (selected && !onDeselect) return;
              void Haptics.selectionAsync().catch(() => undefined);
              if (selected) onDeselect?.();
              else onChange(option.value);
            }}
            className={cn(
              'min-h-11 flex-1 items-center justify-center rounded-lg px-3',
              selected && 'bg-surface dark:bg-surface-dark',
              option.disabled && 'opacity-40',
            )}
            style={selected ? selectedShadow : undefined}
          >
            <Text
              variant="bodySm"
              weight={selected ? 'semibold' : 'medium'}
              tone={selected ? 'default' : 'muted'}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const selectedShadow = {
  shadowColor: '#12161F',
  shadowOpacity: 0.08,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
} as const;
