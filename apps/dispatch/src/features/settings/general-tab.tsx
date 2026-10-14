'use client';

import type { Supplier } from '@concr/shared';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { ErrorState, LoadingRows } from '@/components/state-view';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useSettings, useUpdateSettings } from '@/features/admin/use-admin';
import { useErrorMessage } from '@/features/common/use-error-message';

export function GeneralTab({ readOnly }: { readOnly: boolean }) {
  const settings = useSettings();
  if (settings.isPending) return <LoadingRows rows={4} />;
  if (settings.isError || !settings.data) {
    return <ErrorState error={settings.error} onRetry={() => void settings.refetch()} />;
  }
  return (
    <GeneralForm
      key={settings.dataUpdatedAt}
      supplier={settings.data.supplier}
      readOnly={readOnly}
    />
  );
}

type FormState = {
  dispatchPhone: string;
  minOrderM3: string;
  vatRate: string;
  leadTimeHours: string;
  cancelCutoffHours: string;
  concreteLifetimeMin: string;
  workingHours: string;
  locationUpdateIntervalSec: string;
  arrivalGeofenceM: string;
};

function GeneralForm({ supplier, readOnly }: { supplier: Supplier; readOnly: boolean }) {
  const t = useTranslations('panel.settings.general');
  const tPanel = useTranslations('panel');
  const tc = useTranslations('common');
  const update = useUpdateSettings();
  const errorMessage = useErrorMessage();
  const s = supplier.settings;
  const [form, setForm] = useState<FormState>({
    dispatchPhone: supplier.dispatchPhone,
    minOrderM3: String(s.minOrderM3),
    vatRate: String(Math.round(s.vatRate * 100)),
    leadTimeHours: String(s.leadTimeHours),
    cancelCutoffHours: String(s.cancelCutoffHours),
    concreteLifetimeMin: String(s.concreteLifetimeMin),
    workingHours: s.workingHours,
    locationUpdateIntervalSec: String(s.locationUpdateIntervalSec),
    arrivalGeofenceM: String(s.arrivalGeofenceM),
  });

  const set = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    update.mutate(
      {
        dispatchPhone: form.dispatchPhone.trim(),
        minOrderM3: Number(form.minOrderM3),
        vatRate: Number(form.vatRate) / 100,
        leadTimeHours: Number(form.leadTimeHours),
        cancelCutoffHours: Number(form.cancelCutoffHours),
        concreteLifetimeMin: Number(form.concreteLifetimeMin),
        workingHours: form.workingHours.trim(),
        locationUpdateIntervalSec: Number(form.locationUpdateIntervalSec),
        arrivalGeofenceM: Number(form.arrivalGeofenceM),
      },
      { onSuccess: () => toast.success(tPanel('saved')) },
    );
  };

  const fields: { key: keyof FormState; type?: string; step?: string }[] = [
    { key: 'dispatchPhone', type: 'tel' },
    { key: 'minOrderM3', type: 'number', step: '0.5' },
    { key: 'vatRate', type: 'number', step: '1' },
    { key: 'leadTimeHours', type: 'number', step: '0.5' },
    { key: 'cancelCutoffHours', type: 'number', step: '1' },
    { key: 'concreteLifetimeMin', type: 'number', step: '5' },
    { key: 'workingHours', type: 'text' },
    { key: 'locationUpdateIntervalSec', type: 'number', step: '5' },
    { key: 'arrivalGeofenceM', type: 'number', step: '50' },
  ];

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {fields.map((field) => (
              <Field key={field.key}>
                <FieldLabel htmlFor={`general-${field.key}`}>{t(field.key)}</FieldLabel>
                <Input
                  id={`general-${field.key}`}
                  type={field.type}
                  step={field.step}
                  value={form[field.key]}
                  onChange={set(field.key)}
                  disabled={readOnly}
                />
              </Field>
            ))}
          </div>
          {update.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(update.error)}</AlertDescription>
            </Alert>
          ) : null}
          <div>
            <Button type="submit" disabled={readOnly || update.isPending}>
              {tc('save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
