'use client';

import type { LiveSnapshot, LiveTruck, Unsubscribe } from '@concr/shared';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from 'cn';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useApi } from '@/api/api-provider';
import { queryKeys } from '@/api/query-keys';
import type { MapMarker } from '@/components/map/live-map';
import { PageHeader } from '@/components/page-header';
import { ErrorState, LoadingRows } from '@/components/state-view';
import { deliveryStatusColor, StatusBadge } from '@/components/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupplier } from '@/features/common/use-supplier';
import { useLive } from '@/features/dispatch/use-dispatch';
import { formatTime, minutesSince } from '@/lib/format';

const LiveMap = dynamic(() => import('@/components/map/live-map').then((m) => m.LiveMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

const IDLE_COLOR = '#9CA3AF';
const PLANT_COLOR = '#12161F';
const SITE_COLOR = '#F5A623';
/** Idle mixers sit at the plant; a small offset keeps their markers apart. */
const IDLE_OFFSET_DEG = 0.0007;

/** Spec §9.4 / §14 item 4: every mixer on the map plus the alert panel, refreshed live. */
export function LivePage() {
  const t = useTranslations('panel.live');
  const api = useApi();
  const queryClient = useQueryClient();
  const live = useLive();
  const supplier = useSupplier();

  useEffect(() => {
    const refresh = () => void queryClient.invalidateQueries({ queryKey: queryKeys.live });
    let unsubscribe: Unsubscribe | null = null;
    try {
      unsubscribe = api.dispatch.subscribeLive({
        onLocation: refresh,
        onDeliveryStatus: refresh,
        onOrderStatus: refresh,
      });
    } catch {
      // Not signed in yet: the polling fallback keeps the page honest.
    }
    return () => unsubscribe?.();
  }, [api, queryClient]);

  const plant = supplier.data?.plant.location;
  const markers: MapMarker[] = [];
  if (plant && live.data) {
    markers.push({
      id: 'plant',
      kind: 'plant',
      position: plant,
      label: supplier.data?.supplier.name ?? t('plant'),
      title: t('plant'),
      color: PLANT_COLOR,
      imageUrl: supplier.data?.supplier.logoUrl ?? null,
    });
    let idle = 0;
    for (const truck of live.data.trucks) {
      if (truck.delivery && truck.location) {
        markers.push({
          id: `truck:${truck.truck.id}`,
          kind: 'truck',
          position: truck.location,
          label: truck.truck.plateNumber,
          title: `${truck.truck.plateNumber} · ${truck.delivery.orderNumber}`,
          color: deliveryStatusColor[truck.delivery.status],
          heading: truck.heading,
          alert: truck.signalLost,
        });
        markers.push({
          id: `site:${truck.delivery.id}`,
          kind: 'site',
          position: truck.delivery.siteLocation,
          label: String(truck.delivery.sequence),
          title: `${truck.delivery.orderNumber} · ${truck.delivery.siteName}`,
          color: SITE_COLOR,
        });
      } else if (truck.onShift) {
        idle += 1;
        markers.push({
          id: `truck:${truck.truck.id}`,
          kind: 'truck',
          position: {
            lat: plant.lat + IDLE_OFFSET_DEG * idle,
            lng: plant.lng + IDLE_OFFSET_DEG * idle,
          },
          label: truck.truck.plateNumber,
          title: `${truck.truck.plateNumber} · ${t('idle')}`,
          color: IDLE_COLOR,
        });
      }
    }
  }

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={
          live.data
            ? `${t('subtitle')} · ${t('updated', { time: formatTime(live.data.at) })}`
            : t('subtitle')
        }
      />
      {live.isPending || supplier.isPending ? (
        <LoadingRows rows={4} />
      ) : live.isError || !live.data ? (
        <ErrorState error={live.error} onRetry={() => void live.refetch()} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <Card size="sm" className="h-[70vh] min-h-[420px] overflow-hidden p-0">
            {plant ? (
              <LiveMap center={plant} zoom={10} markers={markers} className="h-full" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t('mapUnavailable')}
              </div>
            )}
          </Card>
          <div className="flex flex-col gap-4">
            <MapLegend />
            <AlertsCard snapshot={live.data} />
            <TrucksCard trucks={live.data.trucks} />
          </div>
        </div>
      )}
    </>
  );
}

function AlertsCard({ snapshot }: { snapshot: LiveSnapshot }) {
  const t = useTranslations('panel.live');
  const byDelivery = new Map(
    snapshot.trucks.filter((x) => x.delivery).map((x) => [x.delivery!.id, x] as const),
  );
  const rows: { key: string; tone: string; title: string; hint: string; truck: LiveTruck }[] = [];
  const push = (ids: string[], tone: string, title: string, hint: (x: LiveTruck) => string) => {
    for (const id of ids) {
      const truck = byDelivery.get(id);
      if (truck) rows.push({ key: `${tone}:${id}`, tone, title, hint: hint(truck), truck });
    }
  };
  push(snapshot.alerts.late, 'bg-red-50 text-red-800', t('late'), () => t('lateHint'));
  push(snapshot.alerts.concreteRisk, 'bg-amber-50 text-amber-900', t('concreteRisk'), (x) =>
    t('concreteRiskHint', {
      minutes: x.delivery?.departedAt
        ? minutesSince(x.delivery.departedAt, new Date(snapshot.at))
        : 0,
    }),
  );
  push(snapshot.alerts.noSignal, 'bg-muted text-muted-foreground', t('noSignal'), (x) =>
    t('noSignalHint', { time: x.locationAt ? formatTime(x.locationAt) : '—' }),
  );

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t('alerts')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noAlerts')}</p>
        ) : (
          rows.map((row) => (
            <div key={row.key} className={cn('rounded-lg p-2 text-sm', row.tone)}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{row.title}</span>
                <span className="text-xs">{row.truck.truck.plateNumber}</span>
              </div>
              <div className="text-xs">
                {row.truck.delivery ? (
                  <Link href={`/orders/${row.truck.delivery.orderId}`} className="underline">
                    {row.truck.delivery.orderNumber}
                  </Link>
                ) : null}{' '}
                {row.hint}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function TrucksCard({ trucks }: { trucks: LiveTruck[] }) {
  const t = useTranslations('panel.live');
  const sorted = [...trucks].sort((a, b) => Number(b.onShift) - Number(a.onShift));
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t('trucks')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {sorted.map((truck) => (
          <div
            key={truck.truck.id}
            className="flex flex-col gap-1 py-2 text-sm"
            data-testid="live-truck"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">
                {truck.truck.plateNumber}
                {truck.driver ? ` · ${truck.driver.fullName}` : ''}
              </span>
              {truck.delivery ? (
                <StatusBadge kind="delivery" status={truck.delivery.status} />
              ) : (
                <span className="text-xs text-muted-foreground">
                  {truck.onShift ? t('idle') : t('offShift')}
                </span>
              )}
            </div>
            {truck.delivery ? (
              <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                <Link href={`/orders/${truck.delivery.orderId}`} className="underline">
                  {truck.delivery.orderNumber}
                </Link>
                <span>{truck.delivery.siteName}</span>
                {truck.etaMinutes !== null ? (
                  <span>{t('eta', { minutes: truck.etaMinutes })}</span>
                ) : null}
                {truck.locationAt ? (
                  <span className={truck.signalLost ? 'text-destructive' : undefined}>
                    {t('lastSeen', { time: formatTime(truck.locationAt) })}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MapLegend() {
  const t = useTranslations('panel.live');
  const tStatus = useTranslations('status.delivery');
  const rows: { color: string; label: string; shape?: 'pin' | 'ring' }[] = [
    { color: PLANT_COLOR, label: t('plant') },
    { color: SITE_COLOR, label: t('legendSite'), shape: 'pin' },
    { color: IDLE_COLOR, label: t('legendIdle') },
    { color: deliveryStatusColor.LOADING, label: `${t('legendMoving')} · ${tStatus('LOADING')}` },
    { color: deliveryStatusColor.EN_ROUTE, label: `${t('legendMoving')} · ${tStatus('EN_ROUTE')}` },
    { color: deliveryStatusColor.ARRIVED, label: `${t('legendMoving')} · ${tStatus('ARRIVED')}` },
    {
      color: deliveryStatusColor.UNLOADING,
      label: `${t('legendMoving')} · ${tStatus('UNLOADING')}`,
    },
    { color: '#DC2626', label: t('noSignal'), shape: 'ring' },
  ];
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t('legend')}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            <span
              className={cn(
                'inline-block size-3 shrink-0',
                row.shape === 'pin' ? 'rounded-b-full rounded-t-sm' : 'rounded-full',
                row.shape === 'ring' ? 'border-2 bg-transparent' : '',
              )}
              style={
                row.shape === 'ring' ? { borderColor: row.color } : { backgroundColor: row.color }
              }
            />
            <span className="truncate">{row.label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
