import { isApiClientError, NetworkError } from '@concr/shared';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

/**
 * Turns any thrown value into a translated, user-facing sentence:
 * API codes → `errors.<CODE>`, transport failures → offline notice, the rest → generic error.
 */
export function useErrorMessage(): (error: unknown) => string {
  const t = useTranslations();
  return useCallback(
    (error: unknown): string => {
      if (isApiClientError(error)) return t(`errors.${error.code}`);
      if (error instanceof NetworkError) return t('states.offline');
      return t('states.errorDescription');
    },
    [t],
  );
}
