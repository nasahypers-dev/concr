import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from './button';
import { colors } from './theme';

export type ViewStatus = 'loading' | 'empty' | 'error';

export interface StateViewProps {
  status: ViewStatus;
  /** Overrides the default translated title for the status. */
  title?: string;
  /** Overrides the default translated description for the status. */
  description?: string;
  /** Shown as a retry button for the error state (and optionally for empty). */
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * The loading / empty / error block every screen must have (CLAUDE.md rule 10).
 * Centred, translated defaults, optional retry.
 */
export function StateView({ status, title, description, onRetry, retryLabel }: StateViewProps) {
  const { t } = useTranslation();

  if (status === 'loading') {
    return (
      <View
        accessibilityRole="progressbar"
        className="flex-1 items-center justify-center gap-3 p-6"
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-base text-ink-muted">{title ?? t('states.loading')}</Text>
      </View>
    );
  }

  const isError = status === 'error';
  const heading = title ?? (isError ? t('states.errorTitle') : t('states.emptyTitle'));
  const body =
    description ?? (isError ? t('states.errorDescription') : t('states.emptyDescription'));

  return (
    <View className="flex-1 items-center justify-center gap-3 p-6">
      <Text className="text-center text-xl font-semibold text-ink">{heading}</Text>
      <Text className="text-center text-base text-ink-muted">{body}</Text>
      {onRetry ? (
        <Button
          variant={isError ? 'primary' : 'secondary'}
          label={retryLabel ?? t('states.retry')}
          onPress={onRetry}
          className="mt-2 self-stretch"
        />
      ) : null}
    </View>
  );
}
