'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type StaffLoginInput, staffLoginSchema } from '@concr/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ApiError, apiFetch, NetworkError } from '@/api/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { STAFF_LOGIN_ENABLED } from './auth.config';

/** Shape of POST /auth/staff/login (Phase 1); the endpoint does not exist yet in Phase 0. */
interface StaffLoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginFormProps {
  /** When false the form is shown disabled with a notice (default: STAFF_LOGIN_ENABLED). */
  enabled?: boolean;
}

export function LoginForm({ enabled = STAFF_LOGIN_ENABLED }: LoginFormProps) {
  const t = useTranslations();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StaffLoginInput>({
    resolver: zodResolver(staffLoginSchema),
    defaultValues: { email: '', password: '' },
    disabled: !enabled,
  });

  const fieldError = (message: string | undefined): string | undefined => {
    switch (message) {
      case undefined:
        return undefined;
      case 'INVALID_EMAIL':
        return t('auth.invalidEmail');
      case 'PASSWORD_TOO_SHORT':
        return t('auth.passwordTooShort');
      default:
        return t('errors.VALIDATION_ERROR');
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!enabled) return;
    setServerError(null);
    try {
      await apiFetch<StaffLoginResponse>('/auth/staff/login', { method: 'POST', body: values });
      // Phase 1: persist the session and redirect to the order inbox.
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(t(`errors.${error.code}`));
      } else if (error instanceof NetworkError) {
        setServerError(t('states.offline'));
      } else {
        setServerError(t('auth.loginFailed'));
      }
    }
  });

  const emailError = fieldError(errors.email?.message);
  const passwordError = fieldError(errors.password?.message);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{t('auth.staffLoginTitle')}</CardTitle>
        <CardDescription>{t('auth.staffLoginSubtitle')}</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate aria-busy={isSubmitting}>
        <CardContent className="flex flex-col gap-4">
          {!enabled ? (
            <p role="status" className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              {t('auth.loginNotAvailable')}
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t('auth.emailPlaceholder')}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? 'email-error' : undefined}
              {...register('email')}
            />
            {emailError ? (
              <p id="email-error" role="alert" className="text-sm text-destructive">
                {emailError}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={passwordError ? 'password-error' : undefined}
              {...register('password')}
            />
            {passwordError ? (
              <p id="password-error" role="alert" className="text-sm text-destructive">
                {passwordError}
              </p>
            ) : null}
          </div>
          {serverError ? (
            <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="mt-4">
          <Button type="submit" className="w-full" disabled={!enabled || isSubmitting}>
            {isSubmitting ? t('auth.loggingIn') : t('auth.login')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
