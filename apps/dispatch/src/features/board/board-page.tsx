'use client';

import {
  type DispatchDelivery,
  type DispatchOrderSummary,
  type IsoDate,
  TruckType,
} from '@concr/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState, LoadingRows } from '@/components/state-view';
import { deliveryStatusColor, StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useDrivers, useTrucks } from '@/features/admin/use-admin';
import { useBoard, useOrders } from '@/features/dispatch/use-dispatch';
import { orderSummary } from '@/features/orders/order-summary';
import { ScheduleDialog } from '@/features/orders/schedule-dialog';
import { bakuMinutesOfDay, formatVolume, formatWindow, todayIsoDate } from '@/lib/format';
import { TripSheet } from './trip-sheet';

/** Width of a trip block on the board. TODO(nurlan): travel + unloading estimate per trip. */
export const TRIP_BLOCK_MIN = 90;
const MINUTES_PER_DAY = 24 * 60;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const isIsoDate = (value: string | undefined): value is IsoDate =>
  value !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(value);

/** Spec §14 item 3: mixer × hour board for one day, click-to-edit trips, planning of confirmed orders. */
export function BoardPage({ initialDate }: { initialDate?: string }) {
  const t = useTranslations('panel.board');
  const [date, setDate] = useState<IsoDate>(isIsoDate(initialDate) ? initialDate : todayIsoDate());
  const board = useBoard(date);
  const toPlan = useOrders({ status: ['CONFIRMED'], date, limit: 50 });
  const trucks = useTrucks();
  const drivers = useDrivers();
  const [selected, setSelected] = useState<DispatchDelivery | null>(null);
  const [planning, setPlanning] = useState<DispatchOrderSummary | null>(null);

  const mixers = (trucks.data ?? []).filter((t) => t.isActive && t.type === TruckType.MIXER);
  const activeDrivers = (drivers.data ?? []).filter((d) => d.isActive);
  const deliveries = board.data?.deliveries ?? [];
  const unassigned = deliveries.filter((d) => d.truckId === null);
  const isToday = date === todayIsoDate();
  const nowLeft = isToday
    ? (bakuMinutesOfDay(new Date().toISOString()) / MINUTES_PER_DAY) * 100
    : null;

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <>
            <Input
              aria-label={t('date')}
              type="date"
              value={date}
              onChange={(event) => {
                if (isIsoDate(event.target.value)) setDate(event.target.value);
              }}
              className="w-44"
            />
            <Button variant="outline" onClick={() => setDate(todayIsoDate())}>
              {t('today')}
            </Button>
          </>
        }
      />

      {toPlan.data && toPlan.data.items.length > 0 ? (
        <Card size="sm" className="mb-4">
          <CardHeader>
            <CardTitle>{t('toPlan')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {toPlan.data.items.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2 text-sm"
              >
                <span>
                  <span className="font-medium">{order.number}</span> ·{' '}
                  {orderSummary(order.productGrade, order.volumeM3, order.slump)} · {order.siteName}{' '}
                  · {formatWindow(order.timeWindowStart, order.timeWindowEnd)}
                </span>
                <Button size="sm" onClick={() => setPlanning(order)}>
                  {t('plan')}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {board.isPending ? (
        <LoadingRows rows={6} />
      ) : board.isError || !board.data ? (
        <ErrorState error={board.error} onRetry={() => void board.refetch()} />
      ) : (
        <Card size="sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[1100px]">
                <div className="grid grid-cols-[11rem_1fr] border-b text-xs text-muted-foreground">
                  <div className="px-3 py-2" />
                  <div
                    className="grid"
                    style={{ gridTemplateColumns: `repeat(${HOURS.length}, minmax(0, 1fr))` }}
                  >
                    {HOURS.map((hour) => (
                      <div key={hour} className="border-l px-1 py-2">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                    ))}
                  </div>
                </div>
                {board.data.trucks.map((truck) => (
                  <Lane
                    key={truck.id}
                    label={`${truck.plateNumber} · ${truck.capacityM3 ?? ''} m³`}
                    trips={deliveries.filter((d) => d.truckId === truck.id)}
                    nowLeft={nowLeft}
                    onSelect={setSelected}
                  />
                ))}
                {unassigned.length > 0 ? (
                  <Lane
                    label={t('unassigned')}
                    trips={unassigned}
                    nowLeft={nowLeft}
                    onSelect={setSelected}
                  />
                ) : null}
                {deliveries.length === 0 ? <EmptyState title={t('empty')} className="m-4" /> : null}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selected ? (
        <TripSheet
          trip={selected}
          mixers={mixers}
          drivers={activeDrivers}
          onClose={() => setSelected(null)}
        />
      ) : null}
      {planning ? (
        <ScheduleDialog
          orderId={planning.id}
          orderNumber={planning.number}
          volumeM3={planning.volumeM3}
          onClose={() => setPlanning(null)}
        />
      ) : null}
    </>
  );
}

function Lane({
  label,
  trips,
  nowLeft,
  onSelect,
}: {
  label: string;
  trips: DispatchDelivery[];
  nowLeft: number | null;
  onSelect: (trip: DispatchDelivery) => void;
}) {
  const t = useTranslations('panel.board');
  return (
    <div className="grid grid-cols-[11rem_1fr] border-b last:border-b-0">
      <div className="truncate px-3 py-4 text-sm font-medium">{label}</div>
      <div
        className="relative h-14"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, var(--border) 0 1px, transparent 1px calc(100% / 24))',
          backgroundSize: 'calc(100% / 24) 100%',
        }}
      >
        {nowLeft !== null ? (
          <div
            className="absolute inset-y-0 z-10 w-px bg-destructive"
            style={{ left: `${nowLeft}%` }}
            aria-hidden="true"
          />
        ) : null}
        {trips.map((trip) => {
          const start = trip.plannedDepartureAt ? bakuMinutesOfDay(trip.plannedDepartureAt) : 0;
          const left = (start / MINUTES_PER_DAY) * 100;
          const width = Math.min(100 - left, (TRIP_BLOCK_MIN / MINUTES_PER_DAY) * 100);
          return (
            <button
              key={trip.id}
              type="button"
              onClick={() => onSelect(trip)}
              className="absolute top-2 flex h-10 flex-col justify-center overflow-hidden rounded-md px-2 text-left text-xs text-white shadow-sm hover:brightness-110"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: deliveryStatusColor[trip.status],
              }}
              title={`${trip.orderNumber} · ${trip.siteName}`}
            >
              <span className="truncate font-semibold">
                {t('trip', { sequence: trip.sequence, number: trip.orderNumber })}
              </span>
              <span className="truncate opacity-90">
                {trip.siteName} · {formatVolume(trip.volumeM3)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BoardLegend() {
  const t = useTranslations('status.delivery');
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {(Object.keys(deliveryStatusColor) as (keyof typeof deliveryStatusColor)[]).map((status) => (
        <span key={status} className="inline-flex items-center gap-1">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ backgroundColor: deliveryStatusColor[status] }}
          />
          <StatusBadge kind="delivery" status={status} className="bg-transparent px-0" />
          <span className="sr-only">{t(status)}</span>
        </span>
      ))}
    </div>
  );
}
