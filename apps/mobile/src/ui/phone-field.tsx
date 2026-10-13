import { TextInput, type TextInputProps, View } from 'react-native';
import { AZ_PREFIX, formatAzLocal, isCompleteAzLocal, stripAzPrefix } from '@/lib/phone';
import { cn } from './cn';
import { Icon } from './icon';
import { Text } from './text';
import { useThemeColors } from './theme';

export interface PhoneFieldProps extends Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'keyboardType' | 'maxLength'
> {
  label: string;
  /** Local digits only ("503260343"); the "+994" prefix is fixed in the UI. */
  value: string;
  onChangeText: (digits: string) => void;
  error?: string;
  hint?: string;
  className?: string;
}

/**
 * Phone input with a fixed "+994" (owner, 2026-10-12). The customer types the 9 local digits,
 * shown grouped as "50 326 03 43"; pasted or autofilled full numbers are reduced to the local part.
 * `maxLength` is applied only once the number is complete: before that an autofill insert of a
 * full "+994 50 …" must get through (it is reduced in JS); afterwards the native input refuses
 * extra digits outright, so nothing appears and disappears a moment later.
 */
export function PhoneField({
  label,
  value,
  onChangeText,
  error,
  hint,
  className,
  editable = true,
  ...rest
}: PhoneFieldProps) {
  const theme = useThemeColors();
  const invalid = Boolean(error);
  const formatted = formatAzLocal(value);
  const maxLength = isCompleteAzLocal(value) ? formatted.length : undefined;
  return (
    <View className={cn('gap-1.5', className)}>
      <Text variant="bodySm" weight="medium">
        {label}
      </Text>
      <View
        className={cn(
          'min-h-14 flex-row items-center gap-2 rounded-xl border bg-surface px-4 dark:bg-surface-dark',
          invalid ? 'border-danger' : 'border-border dark:border-border-dark',
          !editable && 'opacity-60',
        )}
      >
        <Icon name="call-outline" size="md" tone="muted" />
        <Text weight="medium" tone="muted">
          {AZ_PREFIX}
        </Text>
        <TextInput
          accessibilityLabel={label}
          accessibilityState={{ disabled: !editable }}
          editable={editable}
          value={formatted}
          maxLength={maxLength}
          onChangeText={(text) => onChangeText(stripAzPrefix(text))}
          keyboardType="number-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          placeholderTextColor={theme.inkSubtle}
          className="h-14 flex-1 py-0 font-inter text-[16px] text-ink dark:text-ink-dark"
          {...rest}
        />
      </View>
      {invalid ? (
        <Text accessibilityRole="alert" variant="bodySm" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="bodySm" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
