import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { cn } from './cn';
import { Icon } from './icon';
import { Text } from './text';

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Increment per tap, e.g. 0.5 m³. */
  step?: number;
  unit?: string;
  className?: string;
  accessibilityLabel?: string;
}

function roundTo(value: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/** Big −/+ buttons with an editable number in between (volume in m³). */
export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  step = 0.5,
  unit,
  className,
  accessibilityLabel,
}: QuantityStepperProps) {
  const [text, setText] = useState(String(value));
  // Derived state: when the controlled value changes from outside, resync the editable text
  // during render (the React-recommended alternative to an effect).
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    setText(String(value));
  }

  const clamp = (next: number): number => roundTo(Math.min(max, Math.max(min, next)));

  const commitText = () => {
    const parsed = Number(text.replace(',', '.'));
    if (Number.isFinite(parsed)) onChange(clamp(parsed));
    else setText(String(value));
  };

  const canDecrement = value - step >= min - 1e-9;
  const canIncrement = value + step <= max + 1e-9;

  return (
    <View
      className={cn('flex-row items-center gap-3', className)}
      accessibilityLabel={accessibilityLabel}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="−"
        accessibilityState={{ disabled: !canDecrement }}
        disabled={!canDecrement}
        onPress={() => onChange(clamp(value - step))}
        className={cn(
          'h-14 w-14 items-center justify-center rounded-xl bg-primary-soft dark:bg-surface-muted-dark active:opacity-80',
          !canDecrement && 'opacity-40',
        )}
      >
        <Icon name="remove" size="lg" />
      </Pressable>
      <View className="min-h-14 flex-1 flex-row items-center justify-center gap-1 rounded-xl border border-border bg-surface px-3 dark:border-border-dark dark:bg-surface-dark">
        <TextInput
          value={text}
          onChangeText={setText}
          onBlur={commitText}
          onSubmitEditing={commitText}
          keyboardType="decimal-pad"
          selectTextOnFocus
          accessibilityLabel={accessibilityLabel}
          className="min-w-[64px] text-center font-inter-bold text-heading text-ink dark:text-ink-dark"
        />
        {unit ? (
          <Text variant="subheading" tone="muted">
            {unit}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="+"
        accessibilityState={{ disabled: !canIncrement }}
        disabled={!canIncrement}
        onPress={() => onChange(clamp(value + step))}
        className={cn(
          'h-14 w-14 items-center justify-center rounded-xl bg-primary dark:bg-accent active:opacity-90',
          !canIncrement && 'opacity-40',
        )}
      >
        <Icon name="add" size="lg" tone="onPrimary" />
      </Pressable>
    </View>
  );
}
