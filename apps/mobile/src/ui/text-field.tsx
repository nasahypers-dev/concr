import { TextInput, type TextInputProps, View } from 'react-native';
import { cn } from './cn';
import { Icon, type IconName } from './icon';
import { Text } from './text';
import { colors } from './theme';

export interface TextFieldProps extends TextInputProps {
  label: string;
  /** Translated validation message; renders in red below the input. */
  error?: string;
  /** Translated helper text; hidden while an error is shown. */
  hint?: string;
  icon?: IconName;
  className?: string;
}

/** Labelled input with error/hint line; 56 px tall so it matches the buttons. */
export function TextField({
  label,
  error,
  hint,
  icon,
  className,
  editable = true,
  multiline,
  ...rest
}: TextFieldProps) {
  const invalid = Boolean(error);
  return (
    <View className={cn('gap-1.5', className)}>
      <Text variant="bodySm" weight="medium">
        {label}
      </Text>
      <View
        className={cn(
          'flex-row items-center gap-2 rounded-xl border bg-surface px-4 dark:bg-surface-dark',
          multiline ? 'min-h-24 py-3' : 'min-h-14',
          invalid ? 'border-danger' : 'border-border dark:border-border-dark',
          !editable && 'opacity-60',
        )}
      >
        {icon ? <Icon name={icon} size="md" color={colors.inkMuted} /> : null}
        <TextInput
          accessibilityLabel={label}
          accessibilityState={{ disabled: !editable }}
          editable={editable}
          multiline={multiline}
          placeholderTextColor={colors.inkSubtle}
          textAlignVertical={multiline ? 'top' : 'center'}
          className="flex-1 font-inter text-body text-ink dark:text-ink-dark"
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
