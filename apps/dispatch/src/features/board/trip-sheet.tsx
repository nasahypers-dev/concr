'use client';

import {
  type AdminDriver,
  DeliveryStatus,
  type DispatchDelivery,
  type ReassignDeliveryInput,
  type Truck,
} from '@concr/shared';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { NativeSelect } from '@/components/native-select';
import { StatusBadge } from '@/components/status-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useErrorMessage } from '@/features/common/use-error-message';
import { useReassignDelivery } from '@/features/dispatch/use-dispatch';
import { formatVolume, fromBakuLocalInput, toBakuLocalInput } from '@/lib/format';

export interface TripSheetProps {
  trip: DispatchDelivery;
  mixers: Truck[];
  drivers: AdminDriver[];
  onClose: () => void;
}

/** Board edit of one trip: mixer, driver, departure. Only trips still at the plant can change. */
export function TripSheet({ trip, mixers, drivers, onClose }: TripSheetProps) {
  const t = useTranslations('panel.board.edit');
  const tc = useTranslations('common');
  const errorMessage = useErrorMessage();
  const reassign = useReassignDelivery();
  const editable =
    trip.status === DeliveryStatus.PLANNED || trip.status === DeliveryStatus.ASSIGNED;
  const [truckId, setTruckId] = useState(trip.truckId ?? '');
  const [driverId, setDriverId] = useState(trip.driverId ?? '');
  const [departure, setDeparture] = useState(
    trip.plannedDepartureAt ? toBakuLocalInput(trip.plannedDepartureAt) : '',
  );

  const save = () => {
    const input: ReassignDeliveryInput = {};
    if (truckId && truckId !== trip.truckId) input.truckId = truckId;
    if ((driverId || null) !== trip.driverId) input.driverId = driverId || null;
    const iso = departure ? fromBakuLocalInput(departure) : null;
    if (iso && iso !== trip.plannedDepartureAt) input.plannedDepartureAt = iso;
    if (Object.keys(input).length === 0) {
      onClose();
      return;
    }
    reassign.mutate(
      { id: trip.id, input },
      {
        onSuccess: () => {
          toast.success(t('success'));
          onClose();
        },
      },
    );
  };

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {t('title', { sequence: trip.sequence, number: trip.orderNumber })}
          </SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            <span>
              {trip.siteName} · {formatVolume(trip.volumeM3)}
            </span>
            <StatusBadge kind="delivery" status={trip.status} />
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <Field>
            <FieldLabel htmlFor="trip-truck">{t('truck')}</FieldLabel>
            <NativeSelect
              id="trip-truck"
              value={truckId}
              disabled={!editable}
              onChange={(event) => setTruckId(event.target.value)}
            >
              {mixers.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  {truck.plateNumber} · {truck.capacityM3 ?? ''} m³
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="trip-driver">{t('driver')}</FieldLabel>
            <NativeSelect
              id="trip-driver"
              value={driverId}
              disabled={!editable}
              onChange={(event) => setDriverId(event.target.value)}
            >
              <option value="">{t('noDriver')}</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.fullName}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="trip-departure">{t('departure')}</FieldLabel>
            <Input
              id="trip-departure"
              type="datetime-local"
              value={departure}
              disabled={!editable}
              onChange={(event) => setDeparture(event.target.value)}
            />
          </Field>
          {!editable ? <p className="text-sm text-muted-foreground">{t('locked')}</p> : null}
          {reassign.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(reassign.error)}</AlertDescription>
            </Alert>
          ) : null}
          <Link href={`/orders/${trip.orderId}`} className="text-sm underline underline-offset-2">
            {trip.orderNumber}
          </Link>
        </div>
        <SheetFooter>
          <Button onClick={save} disabled={!editable || reassign.isPending}>
            {t('save')}
          </Button>
          <Button variant="outline" onClick={onClose}>
            {tc('back')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
