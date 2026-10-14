'use client';

import {
  type DeliveryDetail,
  type DeliveryStatus,
  type DispatchOrderDetail,
  isZeroMoney,
  type OrderEvent,
  OrderEventType,
  OrderStatus,
} from '@concr/shared';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { ReasonDialog } from '@/components/reason-dialog';
import { ErrorState, LoadingRows } from '@/components/state-view';
import { StatusBadge } from '@/components/status-badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useErrorMessage } from '@/features/common/use-error-message';
import { useCancelOrder, useOrder, useRejectOrder } from '@/features/dispatch/use-dispatch';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatPhoneAz,
  formatTime,
  formatVolume,
  formatWindow,
} from '@/lib/format';
import { ConfirmOrderDialog } from './confirm-order-dialog';
import { orderSummary } from './order-summary';
import { ScheduleDialog } from './schedule-dialog';

type DialogKind = 'confirm' | 'reject' | 'schedule' | 'cancel' | null;

/** Spec §14 item 2: the full order with the dispatcher's decisions. */
export function OrderDetailPage({ id }: { id: string }) {
  const t = useTranslations('panel.order');
  const order = useOrder(id);
  const reject = useRejectOrder(id);
  const cancel = useCancelOrder(id);
  const errorMessage = useErrorMessage();
  const [dialog, setDialog] = useState<DialogKind>(null);

  if (order.isPending) {
    return (
      <>
        <PageHeader title="…" backHref="/inbox" backLabel={t('backToInbox')} />
        <LoadingRows rows={6} />
      </>
    );
  }
  if (order.isError || !order.data) {
    return (
      <>
        <PageHeader title="…" backHref="/inbox" backLabel={t('backToInbox')} />
        <ErrorState error={order.error} onRetry={() => void order.refetch()} />
      </>
    );
  }
  const data = order.data;
  const subtitle = [
    t('createdAt', { time: formatDateTime(data.createdAt) }),
    data.confirmedAt ? t('confirmedAt', { time: formatDateTime(data.confirmedAt) }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <PageHeader
        backHref="/inbox"
        backLabel={t('backToInbox')}
        title={t('title', { number: data.number })}
        meta={<StatusBadge kind="order" status={data.status} />}
        subtitle={subtitle}
        actions={<OrderActions order={data} onOpen={setDialog} />}
      />
      <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CustomerCard order={data} />
            <SiteCard order={data} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ProductCard order={data} />
            <ScheduleCard order={data} />
          </div>
          <DeliveriesCard order={data} />
        </div>
        <div className="flex flex-col gap-4">
          <PriceCard order={data} />
          <NotesCard order={data} />
          <TimelineCard events={data.events} />
        </div>
      </div>

      {dialog === 'confirm' ? (
        <ConfirmOrderDialog order={data} onClose={() => setDialog(null)} />
      ) : null}
      {dialog === 'schedule' ? (
        <ScheduleDialog
          orderId={data.id}
          orderNumber={data.number}
          volumeM3={data.volumeM3}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog === 'reject' ? (
        <ReasonDialog
          title={t('rejectDialog.title')}
          description={t('rejectDialog.description')}
          label={t('rejectDialog.reason')}
          submitLabel={t('rejectDialog.submit')}
          destructive
          pending={reject.isPending}
          error={reject.isError ? errorMessage(reject.error) : null}
          onClose={() => setDialog(null)}
          onSubmit={(reason) =>
            reject.mutate(
              { reason },
              {
                onSuccess: () => {
                  toast.success(t('rejectDialog.success'));
                  setDialog(null);
                },
              },
            )
          }
        />
      ) : null}
      {dialog === 'cancel' ? (
        <ReasonDialog
          title={t('cancelDialog.title')}
          description={t('cancelDialog.description')}
          label={t('cancelDialog.reason')}
          submitLabel={t('cancelDialog.submit')}
          destructive
          pending={cancel.isPending}
          error={cancel.isError ? errorMessage(cancel.error) : null}
          onClose={() => setDialog(null)}
          onSubmit={(reason) =>
            cancel.mutate(
              { reason },
              {
                onSuccess: () => {
                  toast.success(t('cancelDialog.success'));
                  setDialog(null);
                },
              },
            )
          }
        />
      ) : null}
    </>
  );
}

function OrderActions({
  order,
  onOpen,
}: {
  order: DispatchOrderDetail;
  onOpen: (dialog: DialogKind) => void;
}) {
  const t = useTranslations('panel.order.actions');
  switch (order.status) {
    case OrderStatus.PENDING:
      return (
        <>
          <Button onClick={() => onOpen('confirm')}>{t('confirm')}</Button>
          <Button variant="destructive" onClick={() => onOpen('reject')}>
            {t('reject')}
          </Button>
        </>
      );
    case OrderStatus.CONFIRMED:
      return (
        <>
          <Button onClick={() => onOpen('schedule')}>{t('schedule')}</Button>
          <Button variant="destructive" onClick={() => onOpen('cancel')}>
            {t('cancel')}
          </Button>
        </>
      );
    case OrderStatus.SCHEDULED:
    case OrderStatus.IN_PROGRESS:
      return (
        <>
          <Link
            href={`/board?date=${order.requestedDate}`}
            className={buttonVariants({ variant: 'outline' })}
          >
            {t('openBoard')}
          </Link>
          <Button variant="destructive" onClick={() => onOpen('cancel')}>
            {t('cancel')}
          </Button>
        </>
      );
    default:
      return null;
  }
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

function CustomerCard({ order }: { order: DispatchOrderDetail }) {
  const t = useTranslations('panel.order');
  const { customer } = order;
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t('customer')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Row label={t('customer')}>{customer.fullName ?? '—'}</Row>
        <Row label={t('payment')}>
          {order.paymentMethod === 'CASH' ? t('paymentCash') : t('paymentCard')}
        </Row>
        <Row label={customer.profile.customerType === 'COMPANY' ? t('company') : t('individual')}>
          {customer.profile.companyName ?? formatPhoneAz(customer.phone)}
        </Row>
        {customer.profile.companyName ? (
          <Row label={t('contact')}>{formatPhoneAz(customer.phone)}</Row>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SiteCard({ order }: { order: DispatchOrderDetail }) {
  const t = useTranslations('panel.order');
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t('site')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Row label={t('site')}>
          {order.site.name}
          <br />
          <span className="text-muted-foreground">{order.site.addressLine}</span>
        </Row>
        <Row label={t('contact')}>
          {order.siteContactName ? `${order.siteContactName} · ` : ''}
          {formatPhoneAz(order.siteContactPhone)}
        </Row>
        {order.site.accessNotes ? (
          <Row label={t('accessNotes')}>{order.site.accessNotes}</Row>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ProductCard({ order }: { order: DispatchOrderDetail }) {
  const t = useTranslations('panel.order');
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t('product')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Row label={t('product')}>
          {orderSummary(order.product.grade, order.volumeM3, order.slump)}
        </Row>
        <Row label={t('slump')}>{order.slump ?? t('slumpByDispatcher')}</Row>
        <Row label={t('pump')}>
          {order.pumpRequired
            ? t('pumpBoom', { length: order.pumpOption?.boomLengthM ?? '' })
            : t('pumpNone')}
        </Row>
      </CardContent>
    </Card>
  );
}

function ScheduleCard({ order }: { order: DispatchOrderDetail }) {
  const t = useTranslations('panel.order');
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t('schedule')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Row label={t('schedule')}>
          {formatDate(order.requestedDate)},{' '}
          {formatWindow(order.timeWindowStart, order.timeWindowEnd)}
        </Row>
        <Row label={t('customerNote')}>{order.customerNote ?? t('noNote')}</Row>
      </CardContent>
    </Card>
  );
}

function PriceCard({ order }: { order: DispatchOrderDetail }) {
  const t = useTranslations('panel.order');
  const tp = useTranslations('price');
  const { pricing } = order;
  const pumpPending = order.pumpRequired && isZeroMoney(pricing.pumpFee);
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t('price')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {tp('base', {
              grade: order.product.grade,
              volume: formatVolume(pricing.volumeM3),
              price: formatMoney(pricing.basePerM3),
            })}
          </span>
          <span>{formatMoney(pricing.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {tp('vat', { rate: Math.round(pricing.vatRate * 100) })}
          </span>
          <span>{formatMoney(pricing.vat)}</span>
        </div>
        {order.pumpRequired ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{tp('pump')}</span>
            <span className={pumpPending ? 'text-amber-700' : undefined}>
              {pumpPending ? t('pumpPricePending') : formatMoney(pricing.pumpFee)}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between border-t pt-2 text-base font-semibold">
          <span>{tp('total')}</span>
          <span>{formatMoney(pricing.total)}</span>
        </div>
        {pricing.overrideReason ? (
          <p className="text-xs text-amber-700">
            {t('overridden', { reason: pricing.overrideReason })}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function NotesCard({ order }: { order: DispatchOrderDetail }) {
  const t = useTranslations('panel.order');
  const reason = order.cancelReason;
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t('internalNote')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <p>{order.internalNote ?? t('noNote')}</p>
        {reason ? <p className="text-destructive">{t('reason', { reason })}</p> : null}
      </CardContent>
    </Card>
  );
}

function DeliveriesCard({ order }: { order: DispatchOrderDetail }) {
  const t = useTranslations('panel.order');
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t('deliveries')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {order.deliveries.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noDeliveries')}</p>
        ) : (
          order.deliveries.map((delivery) => <DeliveryRow key={delivery.id} delivery={delivery} />)
        )}
      </CardContent>
    </Card>
  );
}

function DeliveryRow({ delivery }: { delivery: DeliveryDetail }) {
  const t = useTranslations('panel.order');
  return (
    <div className="grid gap-1 rounded-lg border p-3 text-sm sm:grid-cols-[6rem_1fr_1fr_1fr_auto] sm:items-center">
      <span className="font-medium">{t('trip', { sequence: delivery.sequence })}</span>
      <span>{formatVolume(delivery.volumeM3)}</span>
      <span>
        {delivery.truck?.plateNumber ?? t('unassigned')}
        {delivery.driver ? ` · ${delivery.driver.fullName}` : ''}
      </span>
      <span className="text-muted-foreground">
        {delivery.plannedDepartureAt
          ? `${t('departure')}: ${formatTime(delivery.plannedDepartureAt)}`
          : ''}
        {delivery.document ? ` · ${t('document', { number: delivery.document.number })}` : ''}
      </span>
      <StatusBadge kind="delivery" status={delivery.status} />
    </div>
  );
}

function TimelineCard({ events }: { events: OrderEvent[] }) {
  const t = useTranslations('panel.order');
  const tTimeline = useTranslations('timeline');
  const tStatus = useTranslations('status');

  const label = (event: OrderEvent): string => {
    switch (event.type) {
      case OrderEventType.CREATED:
        return tTimeline('CREATED');
      case OrderEventType.STATUS_CHANGED:
        return tTimeline('STATUS_CHANGED', {
          status: event.toStatus ? tStatus(`order.${event.toStatus}`) : '',
        });
      case OrderEventType.PRICE_OVERRIDDEN:
        return tTimeline('PRICE_OVERRIDDEN');
      case OrderEventType.SCHEDULE_CHANGED:
        return tTimeline('SCHEDULE_CHANGED');
      case OrderEventType.DELIVERY_STATUS_CHANGED: {
        const status = event.payload.status;
        return tTimeline('DELIVERY_STATUS_CHANGED', {
          sequence:
            typeof event.payload.sequence === 'number' ? String(event.payload.sequence) : '',
          status: typeof status === 'string' ? tStatus(`delivery.${status as DeliveryStatus}`) : '',
        });
      }
      case OrderEventType.NOTE_ADDED:
        return tTimeline('NOTE_ADDED');
      default:
        return event.type;
    }
  };

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t('timeline')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-3 text-sm">
          {[...events].reverse().map((event) => {
            const reason = event.payload.reason;
            return (
              <li key={event.id} className="grid grid-cols-[7rem_1fr] gap-2">
                <span className="text-muted-foreground">{formatDateTime(event.createdAt)}</span>
                <span>
                  {label(event)}
                  {typeof reason === 'string' ? (
                    <span className="block text-muted-foreground">
                      {tTimeline('reason', { reason })}
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
