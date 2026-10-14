'use client';

import type { DispatchOrderSummary } from '@concr/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState, LoadingRows } from '@/components/state-view';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useDuration } from '@/features/common/use-duration';
import { useInbox } from '@/features/dispatch/use-dispatch';
import { orderSummary } from '@/features/orders/order-summary';
import { formatDate, formatMoney, formatPhoneAz, formatWindow, minutesSince } from '@/lib/format';

/** Spec §14 item 2: PENDING orders, newest first, one card each. */
/** `now` is injectable so tests can pin the "waiting since" clock to the fixtures' day. */
export function InboxPage({ now = () => new Date() }: { now?: () => Date }) {
  const t = useTranslations('panel.inbox');
  const inbox = useInbox();
  const items = inbox.data?.items ?? [];

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      {inbox.isPending ? (
        <LoadingRows rows={3} />
      ) : inbox.isError ? (
        <ErrorState error={inbox.error} onRetry={() => void inbox.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title={t('empty')} description={t('emptyHint')} />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((order) => (
            <InboxCard key={order.id} order={order} now={now} />
          ))}
        </div>
      )}
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function InboxCard({ order, now }: { order: DispatchOrderSummary; now: () => Date }) {
  const t = useTranslations('panel.inbox');
  const tOrder = useTranslations('panel.order');
  const router = useRouter();
  const duration = useDuration();
  const href = `/orders/${order.id}`;
  const pump = order.pumpRequired
    ? ` · ${tOrder('pumpBoom', { length: order.pumpBoomLengthM ?? '' })}`
    : '';

  return (
    <Card size="sm" data-testid="inbox-card">
      <CardContent className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={href} className="font-semibold hover:underline">
              {order.number}
            </Link>
            <StatusBadge kind="order" status={order.status} />
            <span className="text-xs text-muted-foreground">
              {t('waiting', { duration: duration(minutesSince(order.createdAt, now())) })}
            </span>
          </div>
          <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <Fact
              label={tOrder('customer')}
              value={`${order.customerName ?? '—'} · ${formatPhoneAz(order.customerPhone)}`}
            />
            <Fact label={tOrder('site')} value={`${order.siteName} · ${order.siteAddressLine}`} />
            <Fact
              label={tOrder('product')}
              value={`${orderSummary(order.productGrade, order.volumeM3, order.slump)}${pump}`}
            />
            <Fact
              label={tOrder('schedule')}
              value={`${formatDate(order.requestedDate)}, ${formatWindow(order.timeWindowStart, order.timeWindowEnd)}`}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:justify-start">
          <div className="flex flex-col md:items-end">
            <span className="text-lg font-semibold">{formatMoney(order.totalAmount)}</span>
            {!order.pumpPriceKnown ? (
              <span className="text-xs text-amber-700">{tOrder('pumpPricePending')}</span>
            ) : null}
          </div>
          <Button size="sm" onClick={() => router.push(href)}>
            {t('open')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
