import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Badge or other inline element next to the title. */
  meta?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
}

export function PageHeader({
  title,
  subtitle,
  meta,
  actions,
  backHref,
  backLabel,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
          {meta}
        </div>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
