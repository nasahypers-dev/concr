'use client';

import { useTranslations } from 'next-intl';
import { type FormEvent, useId, useState } from 'react';
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
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

export const MIN_REASON_LENGTH = 3;

export interface ReasonDialogProps {
  title: string;
  description?: string;
  label: string;
  submitLabel: string;
  destructive?: boolean;
  pending?: boolean;
  error?: string | null;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

/**
 * Reject / cancel: one mandatory reason (spec §8.1). Mount it only while open so the text resets.
 */
export function ReasonDialog({
  title,
  description,
  label,
  submitLabel,
  destructive = false,
  pending = false,
  error,
  onSubmit,
  onClose,
}: ReasonDialogProps) {
  const t = useTranslations('panel.order');
  const tc = useTranslations('common');
  const id = useId();
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const tooShort = reason.trim().length < MIN_REASON_LENGTH;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!tooShort) onSubmit(reason.trim());
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <Field>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Textarea
              id={id}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              aria-invalid={submitted && tooShort ? true : undefined}
            />
            {submitted && tooShort ? <FieldError>{t('reasonTooShort')}</FieldError> : null}
          </Field>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tc('back')}
            </Button>
            <Button
              type="submit"
              variant={destructive ? 'destructive' : 'default'}
              disabled={pending}
            >
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
