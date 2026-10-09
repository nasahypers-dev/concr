import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { Button } from './button';
import { cn } from './cn';
import { Icon, type IconName } from './icon';
import { Text } from './text';
import { colors } from './theme';

export type ViewStatus = 'loading' | 'empty' | 'error';

export interface StateViewProps {
  status: ViewStatus;
  /** Overrides the default translated title for the status. */
  title?: string;
  /** Overrides the default translated description for the status. */
  description?: string;
  /** Icon for empty states (default: a folder). */
  icon?: IconName;
  /** Shown as a retry button for the error state (and optionally for empty). */
  onRetry?: () => void;
  retryLabel?: string;
  /** Compact variant for inline sections instead of whole screens. */
  compact?: boolean;
  className?: string;
}

/**
 * The loading / empty / error block every screen must have (CLAUDE.md rule 10).
 * Centred, translated defaults, optional retry.
 */
export function StateView({
  status,
  title,
  description,
  icon,
  onRetry,
  retryLabel,
  compact = false,
  className,
}: StateViewProps) {
  const { t } = useTranslation();
  const container = cn(
    'items-center justify-center gap-3',
    compact ? 'py-6' : 'flex-1 p-6',
    className,
  );

  if (status === 'loading') {
    return (
      <View accessibilityRole="progressbar" className={container}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text variant="bodySm" tone="muted">
          {title ?? t('states.loading')}
        </Text>
      </View>
    );
  }

  const isError = status === 'error';
  const heading = title ?? (isError ? t('states.errorTitle') : t('states.emptyTitle'));
  const body =
    description ?? (isError ? t('states.errorDescription') : t('states.emptyDescription'));
  const glyph: IconName = icon ?? (isError ? 'cloud-offline-outline' : 'folder-open-outline');

  return (
    <View className={container}>
      <View
        className={cn(
          'h-16 w-16 items-center justify-center rounded-full',
          isError ? 'bg-danger-soft' : 'bg-surface-muted dark:bg-surface-muted-dark',
        )}
      >
        <Icon name={glyph} size="xl" color={isError ? colors.danger : colors.inkMuted} />
      </View>
      <Text variant="subheading" className="text-center">
        {heading}
      </Text>
      {body ? (
        <Text variant="bodySm" tone="muted" className="max-w-[280px] text-center">
          {body}
        </Text>
      ) : null}
      {onRetry ? (
        <Button
          variant={isError ? 'primary' : 'secondary'}
          size="md"
          label={retryLabel ?? t('states.retry')}
          onPress={onRetry}
          className="mt-2 min-w-[160px]"
        />
      ) : null}
    </View>
  );
}
