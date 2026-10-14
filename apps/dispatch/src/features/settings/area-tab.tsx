'use client';

import type { AdminSettings, GeoPoint } from '@concr/shared';
import { Plus, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import type { MapMarker } from '@/components/map/live-map';
import { ErrorState, LoadingRows } from '@/components/state-view';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings, useUpdateServiceArea } from '@/features/admin/use-admin';
import { useErrorMessage } from '@/features/common/use-error-message';
import { useSupplier } from '@/features/common/use-supplier';

const LiveMap = dynamic(() => import('@/components/map/live-map').then((m) => m.LiveMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

const MIN_POINTS = 3;

export function AreaTab({ readOnly }: { readOnly: boolean }) {
  const settings = useSettings();
  if (settings.isPending) return <LoadingRows rows={3} />;
  if (settings.isError || !settings.data) {
    return <ErrorState error={settings.error} onRetry={() => void settings.refetch()} />;
  }
  return <AreaForm key={settings.dataUpdatedAt} settings={settings.data} readOnly={readOnly} />;
}

interface PointRow {
  key: number;
  lat: string;
  lng: string;
}

function AreaForm({ settings, readOnly }: { settings: AdminSettings; readOnly: boolean }) {
  const t = useTranslations('panel.settings.area');
  const tPanel = useTranslations('panel');
  const tc = useTranslations('common');
  const errorMessage = useErrorMessage();
  const supplier = useSupplier();
  const update = useUpdateServiceArea();
  const [rows, setRows] = useState<PointRow[]>(() =>
    settings.serviceArea.polygon.points.map((p, i) => ({
      key: i + 1,
      lat: String(p.lat),
      lng: String(p.lng),
    })),
  );
  const [nextKey, setNextKey] = useState(settings.serviceArea.polygon.points.length + 1);

  const parsed: GeoPoint[] = rows
    .map((row) => ({ lat: Number(row.lat), lng: Number(row.lng) }))
    .filter(
      (p) =>
        Number.isFinite(p.lat) &&
        Number.isFinite(p.lng) &&
        Math.abs(p.lat) <= 90 &&
        Math.abs(p.lng) <= 180,
    );
  const valid = parsed.length === rows.length && parsed.length >= MIN_POINTS;

  const update_ = (key: number, patch: Partial<PointRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    update.mutate({ points: parsed }, { onSuccess: () => toast.success(tPanel('saved')) });
  };

  const plant = supplier.data?.plant.location;
  const markers: MapMarker[] = plant
    ? [{ id: 'plant', kind: 'plant', position: plant, label: 'Z', color: '#12161F' }]
    : [];

  return (
    <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
      <Card size="sm">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
            <p className="text-sm text-muted-foreground">{t('hint')}</p>
            {rows.map((row, index) => (
              <div
                key={row.key}
                className="grid grid-cols-[4.5rem_1fr_1fr_2.5rem] items-center gap-2"
              >
                <span className="text-xs text-muted-foreground">
                  {t('point', { index: index + 1 })}
                </span>
                <Input
                  aria-label={`${t('lat')} ${index + 1}`}
                  inputMode="decimal"
                  value={row.lat}
                  disabled={readOnly}
                  onChange={(event) => update_(row.key, { lat: event.target.value })}
                />
                <Input
                  aria-label={`${t('lng')} ${index + 1}`}
                  inputMode="decimal"
                  value={row.lng}
                  disabled={readOnly}
                  onChange={(event) => update_(row.key, { lng: event.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('removePoint')}
                  disabled={readOnly || rows.length <= MIN_POINTS}
                  onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={readOnly}
                onClick={() => {
                  const last = rows[rows.length - 1];
                  setRows((current) => [
                    ...current,
                    { key: nextKey, lat: last?.lat ?? '', lng: last?.lng ?? '' },
                  ]);
                  setNextKey((n) => n + 1);
                }}
              >
                <Plus className="size-4" />
                {t('addPoint')}
              </Button>
              <Button type="submit" size="sm" disabled={readOnly || !valid || update.isPending}>
                {tc('save')}
              </Button>
            </div>
            {!valid ? <p className="text-xs text-destructive">{t('minPoints')}</p> : null}
            {update.isError ? (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage(update.error)}</AlertDescription>
              </Alert>
            ) : null}
          </form>
        </CardContent>
      </Card>
      <Card size="sm" className="h-[60vh] min-h-[360px] overflow-hidden p-0">
        {plant ? (
          <LiveMap
            center={plant}
            zoom={9}
            markers={markers}
            polygon={valid ? parsed : settings.serviceArea.polygon.points}
            className="h-full"
          />
        ) : (
          <Skeleton className="h-full w-full rounded-none" />
        )}
      </Card>
    </div>
  );
}
