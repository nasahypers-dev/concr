'use client';

import {
  type AdminDriver,
  DEFAULT_TRIP_SPACING_MIN,
  type TripPlan,
  type Truck,
  TruckType,
} from '@concr/shared';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { NativeSelect } from '@/components/native-select';
import { ErrorState, LoadingRows } from '@/components/state-view';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useDrivers, useTrucks } from '@/features/admin/use-admin';
import { useErrorMessage } from '@/features/common/use-error-message';
import { useScheduleOrder, useSuggestPlan } from '@/features/dispatch/use-dispatch';
import { formatVolume, fromBakuLocalInput, toBakuLocalInput } from '@/lib/format';

export interface ScheduleDialogProps {
  orderId: string;
  orderNumber: string;
  volumeM3: number;
  onClose: () => void;
  onScheduled?: () => void;
}

interface TripRow {
  key: number;
  volume: string;
  truckId: string;
  driverId: string;
  departure: string;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * CONFIRMED → SCHEDULED (spec §8.1): starts from the server's proposal (largest mixer first) and
 * lets the dispatcher edit every trip before the deliveries are created. Mount only while open.
 */
export function ScheduleDialog({
  orderId,
  orderNumber,
  volumeM3,
  onClose,
  onScheduled,
}: ScheduleDialogProps) {
  const t = useTranslations('panel.order.scheduleDialog');
  const plan = useSuggestPlan(orderId);
  const trucks = useTrucks();
  const drivers = useDrivers();
  const pending = plan.isPending || trucks.isPending || drivers.isPending;
  const failed = plan.isError || trucks.isError || drivers.isError;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t('title')} · {orderNumber}
          </DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        {pending ? (
          <LoadingRows rows={2} />
        ) : failed || !plan.data || !trucks.data || !drivers.data ? (
          <ErrorState
            error={plan.error ?? trucks.error ?? drivers.error}
            onRetry={() => void Promise.all([plan.refetch(), trucks.refetch(), drivers.refetch()])}
          />
        ) : (
          <ScheduleForm
            orderId={orderId}
            volumeM3={volumeM3}
            initialTrips={plan.data}
            mixers={trucks.data.filter((truck) => truck.isActive && truck.type === TruckType.MIXER)}
            drivers={drivers.data.filter((driver) => driver.isActive)}
            onRegenerate={async () => (await plan.refetch()).data ?? null}
            onClose={onClose}
            onScheduled={onScheduled}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function rowsFromPlan(trips: TripPlan[]): TripRow[] {
  return trips.map((trip, index) => ({
    key: index + 1,
    volume: String(trip.volumeM3),
    truckId: trip.truckId,
    driverId: trip.driverId ?? '',
    departure: toBakuLocalInput(trip.plannedDepartureAt),
  }));
}

function ScheduleForm({
  orderId,
  volumeM3,
  initialTrips,
  mixers,
  drivers,
  onRegenerate,
  onClose,
  onScheduled,
}: {
  orderId: string;
  volumeM3: number;
  initialTrips: TripPlan[];
  mixers: Truck[];
  drivers: AdminDriver[];
  onRegenerate: () => Promise<TripPlan[] | null>;
  onClose: () => void;
  onScheduled?: () => void;
}) {
  const t = useTranslations('panel.order.scheduleDialog');
  const tc = useTranslations('common');
  const errorMessage = useErrorMessage();
  const schedule = useScheduleOrder(orderId);
  const [rows, setRows] = useState<TripRow[]>(() => rowsFromPlan(initialTrips));
  const [nextKey, setNextKey] = useState(initialTrips.length + 1);
  const [submitted, setSubmitted] = useState(false);

  const sum = round2(rows.reduce((total, row) => total + (Number(row.volume) || 0), 0));
  const mismatch = Math.abs(sum - volumeM3) > 0.01;
  const incomplete = rows.some(
    (row) =>
      !row.truckId || !(Number(row.volume) > 0) || fromBakuLocalInput(row.departure) === null,
  );

  const update = (key: number, patch: Partial<TripRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const pickTruck = (key: number, truckId: string) => {
    const truck = mixers.find((m) => m.id === truckId);
    const row = rows.find((r) => r.key === key);
    update(key, {
      truckId,
      driverId:
        row && row.driverId === '' && truck?.currentDriverId
          ? truck.currentDriverId
          : (row?.driverId ?? ''),
    });
  };

  const addRow = () => {
    const last = rows[rows.length - 1];
    const lastIso = last ? fromBakuLocalInput(last.departure) : null;
    const departure = lastIso
      ? toBakuLocalInput(
          new Date(Date.parse(lastIso) + DEFAULT_TRIP_SPACING_MIN * 60_000).toISOString(),
        )
      : (last?.departure ?? '');
    const remaining = round2(Math.max(0, volumeM3 - sum));
    setRows((current) => [
      ...current,
      {
        key: nextKey,
        volume: remaining > 0 ? String(remaining) : '',
        truckId: mixers[0]?.id ?? '',
        driverId: mixers[0]?.currentDriverId ?? '',
        departure,
      },
    ]);
    setNextKey((n) => n + 1);
  };

  const regenerate = async () => {
    const fresh = await onRegenerate();
    if (fresh) {
      setRows(rowsFromPlan(fresh));
      setNextKey(fresh.length + 1);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (mismatch || incomplete || rows.length === 0) return;
    const trips = rows.map((row, index) => ({
      sequence: index + 1,
      volumeM3: round2(Number(row.volume)),
      truckId: row.truckId,
      driverId: row.driverId === '' ? null : row.driverId,
      plannedDepartureAt: fromBakuLocalInput(row.departure) ?? '',
    }));
    schedule.mutate(
      { trips },
      {
        onSuccess: () => {
          toast.success(t('success'));
          onScheduled?.();
          onClose();
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <div className="hidden grid-cols-[2.5rem_6rem_1fr_1fr_11rem_2.5rem] gap-2 text-xs text-muted-foreground sm:grid">
          <span>{t('trip')}</span>
          <span>{t('volume')}</span>
          <span>{t('truck')}</span>
          <span>{t('driver')}</span>
          <span>{t('departure')}</span>
          <span />
        </div>
        {rows.map((row, index) => (
          <div
            key={row.key}
            className="grid grid-cols-2 gap-2 rounded-lg border p-2 sm:grid-cols-[2.5rem_6rem_1fr_1fr_11rem_2.5rem] sm:border-0 sm:p-0"
            data-testid="trip-row"
          >
            <span className="self-center text-sm font-medium">{index + 1}</span>
            <Input
              aria-label={`${t('volume')} ${index + 1}`}
              inputMode="decimal"
              value={row.volume}
              onChange={(event) => update(row.key, { volume: event.target.value })}
              aria-invalid={submitted && !(Number(row.volume) > 0) ? true : undefined}
            />
            <NativeSelect
              aria-label={`${t('truck')} ${index + 1}`}
              value={row.truckId}
              onChange={(event) => pickTruck(row.key, event.target.value)}
            >
              {mixers.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  {truck.plateNumber} · {truck.capacityM3 ?? ''} m³
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label={`${t('driver')} ${index + 1}`}
              value={row.driverId}
              onChange={(event) => update(row.key, { driverId: event.target.value })}
            >
              <option value="">{t('noDriver')}</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.fullName}
                </option>
              ))}
            </NativeSelect>
            <Input
              aria-label={`${t('departure')} ${index + 1}`}
              type="datetime-local"
              value={row.departure}
              onChange={(event) => update(row.key, { departure: event.target.value })}
              aria-invalid={
                submitted && fromBakuLocalInput(row.departure) === null ? true : undefined
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('removeTrip')}
              disabled={rows.length === 1}
              onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-4" />
            {t('addTrip')}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => void regenerate()}>
            {t('regenerate')}
          </Button>
        </div>
        <span className={mismatch ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
          {t('total', { volume: formatVolume(sum), expected: formatVolume(volumeM3) })}
        </span>
      </div>
      {submitted && mismatch ? (
        <Alert variant="destructive">
          <AlertDescription>{t('mismatch')}</AlertDescription>
        </Alert>
      ) : null}
      {schedule.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(schedule.error)}</AlertDescription>
        </Alert>
      ) : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {tc('back')}
        </Button>
        <Button type="submit" disabled={schedule.isPending}>
          {t('submit')}
        </Button>
      </DialogFooter>
    </form>
  );
}
