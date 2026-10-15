import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, type TextInputProps, View } from 'react-native';
import { cn } from './cn';
import { Icon, type IconName } from './icon';
import { Text } from './text';
import { useThemeColors } from './theme';

export interface TextFieldProps extends TextInputProps {
  label: string;
  /** Translated validation message; renders in red below the input. */
  error?: string;
  /** Translated helper text; hidden while an error is shown. */
  hint?: string;
  icon?: IconName;
  className?: string;
}

/**
 * Labelled input with error/hint line; 56 px tall so it matches the buttons. A secure field gets
 * an eye button that shows what was typed (owner, 2026-10-15).
 */
export function TextField({
  label,
  error,
  hint,
  icon,
  className,
  editable = true,
  multiline,
  secureTextEntry = false,
  ...rest
}: TextFieldProps) {
  const { t } = useTranslation();
  const invalid = Boolean(error);
  const theme = useThemeColors();
  const [hidden, setHidden] = useState(true);
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
        {icon ? <Icon name={icon} size="md" tone="muted" /> : null}
        <TextInput
          accessibilityLabel={label}
          accessibilityState={{ disabled: !editable }}
          editable={editable}
          multiline={multiline}
          placeholderTextColor={theme.inkSubtle}
          textAlignVertical={multiline ? 'top' : 'center'}
          secureTextEntry={secureTextEntry && hidden}
          // No line-height on a single-line input: iOS would top-align the glyphs next to the icon.
          className={cn(
            'flex-1 font-inter text-[16px] text-ink dark:text-ink-dark',
            multiline ? 'leading-6' : 'h-14 py-0',
          )}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? t('common.showPassword') : t('common.hidePassword')}
            onPress={() => setHidden((current) => !current)}
            hitSlop={8}
            className="p-1"
          >
            <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} size="md" tone="muted" />
          </Pressable>
        ) : null}
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
