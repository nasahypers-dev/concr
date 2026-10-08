import { Text, TextInput, type TextInputProps, View } from 'react-native';
import { cn } from './cn';
import { colors } from './theme';

export interface TextFieldProps extends TextInputProps {
  label: string;
  /** Translated validation message; renders in red below the input. */
  error?: string;
  /** Translated helper text; hidden while an error is shown. */
  hint?: string;
  className?: string;
}

export function TextField({
  label,
  error,
  hint,
  className,
  editable = true,
  ...rest
}: TextFieldProps) {
  const invalid = Boolean(error);
  return (
    <View className={cn('gap-1.5', className)}>
      <Text className="text-sm font-medium text-ink">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityState={{ disabled: !editable }}
        editable={editable}
        placeholderTextColor={colors.inkMuted}
        className={cn(
          'min-h-14 rounded-xl border bg-surface px-4 text-base text-ink',
          invalid ? 'border-danger' : 'border-gray-200',
          !editable && 'opacity-60',
        )}
        {...rest}
      />
      {invalid ? (
        <Text accessibilityRole="alert" className="text-sm text-danger">
          {error}
        </Text>
      ) : hint ? (
        <Text className="text-sm text-ink-muted">{hint}</Text>
      ) : null}
    </View>
  );
}
