import { isApiClientError, NetworkError } from '@concr/shared';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Turns any thrown value into a translated, user-facing sentence:
 * API codes → `errors.<CODE>`, transport failures → offline notice, the rest → generic error.
 */
export function useErrorMessage(): (error: unknown) => string {
  const { t } = useTranslation();
  return useCallback(
    (error: unknown): string => {
      if (isApiClientError(error)) return t(`errors.${error.code}`);
      if (error instanceof NetworkError) return t('states.offline');
      return t('states.errorDescription');
    },
    [t],
  );
}
