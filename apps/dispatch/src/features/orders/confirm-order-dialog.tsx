'use client';

import { type ConfirmOrderInput, type DispatchOrderDetail, isZeroMoney } from '@concr/shared';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useErrorMessage } from '@/features/common/use-error-message';
import { useConfirmOrder } from '@/features/dispatch/use-dispatch';
import { toMoneyString } from '@/lib/format';

const MIN_REASON = 3;

export interface ConfirmOrderDialogProps {
  order: DispatchOrderDetail;
  onClose: () => void;
}

/**
 * PENDING → CONFIRMED (spec §8.1): optional pump fee when the catalogue has none, optional price
 * override and window change, each with a reason the customer sees. Mount only while open.
 */
export function ConfirmOrderDialog({ order, onClose }: ConfirmOrderDialogProps) {
  const t = useTranslations('panel.order.confirmDialog');
  const tOrder = useTranslations('panel.order');
  const tErrors = useTranslations('errors');
  const tc = useTranslations('common');
  const errorMessage = useErrorMessage();
  const confirm = useConfirmOrder(order.id);

  const pumpPending = order.pumpRequired && isZeroMoney(order.pricing.pumpFee);
  const [pumpFee, setPumpFee] = useState('');
  const [overridePrice, setOverridePrice] = useState(false);
  const [newTotal, setNewTotal] = useState(order.pricing.total);
  const [priceReason, setPriceReason] = useState('');
  const [changeWindow, setChangeWindow] = useState(false);
  const [date, setDate] = useState(order.requestedDate);
  const [from, setFrom] = useState(order.timeWindowStart);
  const [to, setTo] = useState(order.timeWindowEnd);
  const [windowReason, setWindowReason] = useState('');
  const [internalNote, setInternalNote] = useState(order.internalNote ?? '');
  const [submitted, setSubmitted] = useState(false);

  const pumpFeeMoney = toMoneyString(pumpFee);
  const totalMoney = toMoneyString(newTotal);
  const errors = {
    pumpFee: pumpPending && pumpFee.trim() !== '' && pumpFeeMoney === null,
    price: overridePrice && (totalMoney === null || priceReason.trim().length < MIN_REASON),
    window:
      changeWindow &&
      (windowReason.trim().length < MIN_REASON ||
        !date ||
        !from ||
        !to ||
        (to <= from && to !== '00:00')),
  };
  const valid = !errors.pumpFee && !errors.price && !errors.window;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!valid) return;
    const input: ConfirmOrderInput = {};
    if (pumpPending && pumpFeeMoney) input.pumpFee = pumpFeeMoney;
    if (overridePrice && totalMoney) {
      input.priceOverride = { total: totalMoney, reason: priceReason.trim() };
    }
    if (changeWindow) {
      input.schedule = {
        requestedDate: date,
        timeWindowStart: from,
        timeWindowEnd: to,
        reason: windowReason.trim(),
      };
    }
    if (internalNote.trim() !== (order.internalNote ?? '')) {
      input.internalNote = internalNote.trim() === '' ? null : internalNote.trim();
    }
    confirm.mutate(input, {
      onSuccess: () => {
        toast.success(t('success'));
        onClose();
      },
    });
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          {pumpPending ? (
            <Field>
              <FieldLabel htmlFor="pumpFee">{t('pumpFee')}</FieldLabel>
              <Input
                id="pumpFee"
                inputMode="decimal"
                value={pumpFee}
                onChange={(event) => setPumpFee(event.target.value)}
                aria-invalid={submitted && errors.pumpFee ? true : undefined}
              />
              {submitted && errors.pumpFee ? (
                <FieldError>{tErrors('VALIDATION_ERROR')}</FieldError>
              ) : null}
            </Field>
          ) : null}

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={overridePrice}
              onCheckedChange={(checked) => setOverridePrice(checked === true)}
            />
            {t('overridePrice')}
          </label>
          {overridePrice ? (
            <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="newTotal">{t('newTotal')}</FieldLabel>
                <Input
                  id="newTotal"
                  inputMode="decimal"
                  value={newTotal}
                  onChange={(event) => setNewTotal(event.target.value)}
                  aria-invalid={submitted && totalMoney === null ? true : undefined}
                />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="priceReason">{t('reason')}</FieldLabel>
                <Input
                  id="priceReason"
                  placeholder={t('reasonPlaceholder')}
                  value={priceReason}
                  onChange={(event) => setPriceReason(event.target.value)}
                />
                {submitted && errors.price ? (
                  <FieldError>{tOrder('reasonTooShort')}</FieldError>
                ) : null}
              </Field>
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={changeWindow}
              onCheckedChange={(checked) => setChangeWindow(checked === true)}
            />
            {t('changeWindow')}
          </label>
          {changeWindow ? (
            <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="windowDate">{t('date')}</FieldLabel>
                <Input
                  id="windowDate"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="windowFrom">{t('from')}</FieldLabel>
                <Input
                  id="windowFrom"
                  type="time"
                  step={900}
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="windowTo">{t('to')}</FieldLabel>
                <Input
                  id="windowTo"
                  type="time"
                  step={900}
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
              </Field>
              <Field className="sm:col-span-3">
                <FieldLabel htmlFor="windowReason">{t('reason')}</FieldLabel>
                <Input
                  id="windowReason"
                  placeholder={t('reasonPlaceholder')}
                  value={windowReason}
                  onChange={(event) => setWindowReason(event.target.value)}
                />
                {submitted && errors.window ? (
                  <FieldError>{tOrder('reasonTooShort')}</FieldError>
                ) : null}
              </Field>
            </div>
          ) : null}

          <Field>
            <FieldLabel htmlFor="internalNote">{t('internalNote')}</FieldLabel>
            <Textarea
              id="internalNote"
              rows={2}
              value={internalNote}
              onChange={(event) => setInternalNote(event.target.value)}
            />
          </Field>

          {confirm.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(confirm.error)}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tc('back')}
            </Button>
            <Button type="submit" disabled={confirm.isPending}>
              {t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
