'use client';

import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useErrorMessage } from '@/features/common/use-error-message';

/** The loading / empty / error blocks every page must have (CLAUDE.md rule 10). */

export function LoadingRows({ rows = 4, className }: { rows?: number; className?: string }) {
  const t = useTranslations('states');
  return (
    <div role="status" aria-label={t('loading')} className={cn('flex flex-col gap-3', className)}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-background p-10 text-center',
        className,
      )}
    >
      <p className="font-medium">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const t = useTranslations('states');
  const message = useErrorMessage();
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
    >
      <p className="font-medium text-destructive">{t('errorTitle')}</p>
      <p className="text-sm text-muted-foreground">{message(error)}</p>
      {onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry}>
          {t('retry')}
        </Button>
      ) : null}
    </div>
  );
}
