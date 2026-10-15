'use client';

import {
  type AdminDriver,
  ErrorCode,
  isApiClientError,
  type Truck,
  TruckType,
} from '@concr/shared';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { NativeSelect } from '@/components/native-select';
import { ErrorState, LoadingRows } from '@/components/state-view';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useCreateDriver,
  useCreateTruck,
  useDrivers,
  useTrucks,
  useUpdateDriver,
  useUpdateTruck,
} from '@/features/admin/use-admin';
import { useErrorMessage } from '@/features/common/use-error-message';
import { formatPhoneAz } from '@/lib/format';

const PHONE_RE = /^\+[1-9]\d{7,14}$/;
const MIN_PASSWORD = 8;

/** Spec §14 item 6: mixers 8/10/12 and pumps. */
export function TrucksTab({ readOnly }: { readOnly: boolean }) {
  const t = useTranslations('panel.settings.trucks');
  const tc = useTranslations('common');
  const trucks = useTrucks();
  const drivers = useDrivers();
  const [sheet, setSheet] = useState<'new' | Truck | null>(null);

  if (trucks.isPending) return <LoadingRows rows={5} />;
  if (trucks.isError || !trucks.data) {
    return <ErrorState error={trucks.error} onRetry={() => void trucks.refetch()} />;
  }
  const driverName = (truck: Truck): string =>
    drivers.data?.find((d) => d.id === truck.currentDriverId)?.fullName ?? '—';

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button size="sm" disabled={readOnly} onClick={() => setSheet('new')}>
          <Plus className="size-4" />
          {t('add')}
        </Button>
      </div>
      <Card size="sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('plate')}</TableHead>
                <TableHead>{t('type')}</TableHead>
                <TableHead>{t('capacity')}</TableHead>
                <TableHead>{t('driver')}</TableHead>
                <TableHead>{t('active')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {trucks.data.map((truck) => (
                <TableRow key={truck.id}>
                  <TableCell className="font-medium">{truck.plateNumber}</TableCell>
                  <TableCell>{truck.type === TruckType.MIXER ? t('mixer') : t('pump')}</TableCell>
                  <TableCell>
                    {truck.type === TruckType.MIXER
                      ? `${truck.capacityM3 ?? ''} m³`
                      : `${truck.boomLengthM ?? ''} m`}
                  </TableCell>
                  <TableCell>{driverName(truck)}</TableCell>
                  <TableCell>{truck.isActive ? tc('yes') : tc('no')}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={readOnly}
                      onClick={() => setSheet(truck)}
                    >
                      {tc('edit')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {sheet ? (
        <TruckSheet truck={sheet === 'new' ? null : sheet} onClose={() => setSheet(null)} />
      ) : null}
    </>
  );
}

function TruckSheet({ truck, onClose }: { truck: Truck | null; onClose: () => void }) {
  const t = useTranslations('panel.settings.trucks');
  const tPanel = useTranslations('panel');
  const tc = useTranslations('common');
  const errorMessage = useErrorMessage();
  const create = useCreateTruck();
  const update = useUpdateTruck();
  const [plate, setPlate] = useState(truck?.plateNumber ?? '');
  const [type, setType] = useState<TruckType>(truck?.type ?? TruckType.MIXER);
  const [capacity, setCapacity] = useState(truck?.capacityM3 ? String(truck.capacityM3) : '10');
  const [boom, setBoom] = useState(truck?.boomLengthM ? String(truck.boomLengthM) : '24');
  const [active, setActive] = useState(truck?.isActive ?? true);
  const [submitted, setSubmitted] = useState(false);
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;
  const isMixer = type === TruckType.MIXER;
  const sizeValue = Number(isMixer ? capacity : boom);
  const invalid = plate.trim().length < 3 || !(sizeValue > 0);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (invalid) return;
    const input = {
      plateNumber: plate.trim(),
      type,
      capacityM3: isMixer ? sizeValue : null,
      boomLengthM: isMixer ? null : sizeValue,
      isActive: active,
    };
    const done = () => {
      toast.success(tPanel('saved'));
      onClose();
    };
    if (truck) update.mutate({ id: truck.id, input }, { onSuccess: done });
    else create.mutate(input, { onSuccess: done });
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
          <SheetTitle>{truck ? t('edit') : t('add')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={submit} className="flex flex-1 flex-col gap-4 px-4" noValidate>
          <Field>
            <FieldLabel htmlFor="truck-plate">{t('plate')}</FieldLabel>
            <Input
              id="truck-plate"
              value={plate}
              onChange={(event) => setPlate(event.target.value)}
              aria-invalid={submitted && plate.trim().length < 3 ? true : undefined}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="truck-type">{t('type')}</FieldLabel>
            <NativeSelect
              id="truck-type"
              value={type}
              onChange={(event) => setType(event.target.value as TruckType)}
            >
              <option value={TruckType.MIXER}>{t('mixer')}</option>
              <option value={TruckType.PUMP}>{t('pump')}</option>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="truck-size">{isMixer ? t('capacity') : t('boom')}</FieldLabel>
            <Input
              id="truck-size"
              type="number"
              step={isMixer ? '1' : '1'}
              value={isMixer ? capacity : boom}
              onChange={(event) =>
                isMixer ? setCapacity(event.target.value) : setBoom(event.target.value)
              }
              aria-invalid={submitted && !(sizeValue > 0) ? true : undefined}
            />
          </Field>
          <label className="flex items-center justify-between text-sm">
            {t('active')}
            <Switch checked={active} onCheckedChange={(checked) => setActive(checked)} />
          </label>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>
                {isConflict(error) ? t('plateTaken') : errorMessage(error)}
              </AlertDescription>
            </Alert>
          ) : null}
          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {tc('save')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {tc('back')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function isConflict(error: unknown): boolean {
  return isApiClientError(error) && error.code === ErrorCode.CONFLICT;
}

/** Spec §14 item 6 + D22: drivers exist only through this page. */
export function DriversTab({ readOnly }: { readOnly: boolean }) {
  const t = useTranslations('panel.settings.drivers');
  const tc = useTranslations('common');
  const tPanel = useTranslations('panel');
  const drivers = useDrivers();
  const update = useUpdateDriver();
  const errorMessage = useErrorMessage();
  const [sheet, setSheet] = useState<'new' | AdminDriver | null>(null);
  const [toggling, setToggling] = useState<AdminDriver | null>(null);

  if (drivers.isPending) return <LoadingRows rows={4} />;
  if (drivers.isError || !drivers.data) {
    return <ErrorState error={drivers.error} onRetry={() => void drivers.refetch()} />;
  }

  const toggleActive = (driver: AdminDriver) =>
    update.mutate(
      { id: driver.id, input: { isActive: !driver.isActive } },
      {
        onSuccess: () => {
          toast.success(tPanel('saved'));
          setToggling(null);
        },
      },
    );

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{t('hint')}</p>
        <Button size="sm" disabled={readOnly} onClick={() => setSheet('new')}>
          <Plus className="size-4" />
          {t('add')}
        </Button>
      </div>
      <Card size="sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('phone')}</TableHead>
                <TableHead>{t('truck')}</TableHead>
                <TableHead>{t('shift')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.data.map((driver) => (
                <TableRow key={driver.id} data-testid="driver-row">
                  <TableCell className="font-medium">{driver.fullName}</TableCell>
                  <TableCell>{formatPhoneAz(driver.phone)}</TableCell>
                  <TableCell>{driver.truck?.plateNumber ?? t('noTruck')}</TableCell>
                  <TableCell>{driver.isOnShift ? tc('yes') : tc('no')}</TableCell>
                  <TableCell>
                    <span className={driver.isActive ? 'text-green-700' : 'text-muted-foreground'}>
                      {driver.isActive ? t('active') : t('inactive')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={readOnly}
                        onClick={() => setSheet(driver)}
                      >
                        {tc('edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant={driver.isActive ? 'destructive' : 'secondary'}
                        disabled={readOnly}
                        onClick={() => setToggling(driver)}
                      >
                        {driver.isActive ? t('deactivate') : t('activate')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {sheet ? (
        <DriverSheet driver={sheet === 'new' ? null : sheet} onClose={() => setSheet(null)} />
      ) : null}
      {toggling ? (
        <ConfirmDialog
          title={toggling.isActive ? t('deactivate') : t('activate')}
          description={`${toggling.fullName} · ${formatPhoneAz(toggling.phone)}`}
          confirmLabel={toggling.isActive ? t('deactivate') : t('activate')}
          destructive={toggling.isActive}
          pending={update.isPending}
          error={update.isError ? errorMessage(update.error) : null}
          onConfirm={() => toggleActive(toggling)}
          onClose={() => setToggling(null)}
        />
      ) : null}
    </>
  );
}

function DriverSheet({ driver, onClose }: { driver: AdminDriver | null; onClose: () => void }) {
  const t = useTranslations('panel.settings.drivers');
  const tPanel = useTranslations('panel');
  const tc = useTranslations('common');
  const tAuth = useTranslations('auth');
  const errorMessage = useErrorMessage();
  const trucks = useTrucks();
  const create = useCreateDriver();
  const update = useUpdateDriver();
  const [name, setName] = useState(driver?.fullName ?? '');
  const [phone, setPhone] = useState(driver?.phone ?? '+994');
  const [truckId, setTruckId] = useState(driver?.currentTruckId ?? '');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;
  const nameInvalid = name.trim().length === 0;
  const phoneInvalid = !PHONE_RE.test(phone.trim());
  // Required for a new driver; optional on edit (empty = keep the current password).
  const passwordInvalid = (driver === null || password !== '') && password.length < MIN_PASSWORD;
  const mixers = (trucks.data ?? []).filter(
    (truck) => truck.isActive && truck.type === TruckType.MIXER,
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (nameInvalid || phoneInvalid || passwordInvalid) return;
    const base = { fullName: name.trim(), phone: phone.trim(), truckId: truckId || null };
    const done = () => {
      toast.success(tPanel('saved'));
      onClose();
    };
    if (driver) {
      update.mutate(
        { id: driver.id, input: password ? { ...base, password } : base },
        { onSuccess: done },
      );
    } else {
      create.mutate({ ...base, password }, { onSuccess: done });
    }
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
          <SheetTitle>{driver ? t('edit') : t('add')}</SheetTitle>
          <SheetDescription>{t('hint')}</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="flex flex-1 flex-col gap-4 px-4" noValidate>
          <Field>
            <FieldLabel htmlFor="driver-name">{t('name')}</FieldLabel>
            <Input
              id="driver-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={submitted && nameInvalid ? true : undefined}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="driver-phone">{t('phone')}</FieldLabel>
            <Input
              id="driver-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              aria-invalid={submitted && phoneInvalid ? true : undefined}
            />
            {submitted && phoneInvalid ? <FieldError>{tAuth('invalidPhone')}</FieldError> : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="driver-password">
              {driver ? t('newPassword') : t('password')}
            </FieldLabel>
            <Input
              id="driver-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={submitted && passwordInvalid ? true : undefined}
            />
            {submitted && passwordInvalid ? (
              <FieldError>{tAuth('passwordTooShort')}</FieldError>
            ) : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="driver-truck">{t('truck')}</FieldLabel>
            <NativeSelect
              id="driver-truck"
              value={truckId}
              onChange={(event) => setTruckId(event.target.value)}
            >
              <option value="">{t('noTruck')}</option>
              {mixers.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  {truck.plateNumber} · {truck.capacityM3 ?? ''} m³
                </option>
              ))}
            </NativeSelect>
          </Field>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>
                {isConflict(error) ? t('phoneTaken') : errorMessage(error)}
              </AlertDescription>
            </Alert>
          ) : null}
          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {tc('save')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {tc('back')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
