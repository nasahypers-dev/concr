'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ErrorCode,
  isApiClientError,
  NetworkError,
  STAFF,
  type StaffLoginInput,
  staffLoginSchema,
} from '@concr/shared';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useApi } from '@/api/api-provider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PasswordInput } from '@/components/password-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSessionStore } from '@/store/session.store';

/** Seeded staff accounts, offered as one-click fills outside production (spec §18). */
const DEV_ACCOUNTS = process.env.NODE_ENV === 'production' ? [] : [STAFF.dispatcher, STAFF.admin];

export function LoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const api = useApi();
  const setSession = useSessionStore((s) => s.setSession);
  const hydrated = useSessionStore((s) => s.hydrated);
  const signedIn = useSessionStore((s) => s.accessToken !== null);
  const [serverError, setServerError] = useState<string | null>(null);

  // A staff member who is already signed in lands on the inbox, not on the form.
  useEffect(() => {
    if (hydrated && signedIn) router.replace('/inbox');
  }, [hydrated, signedIn, router]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StaffLoginInput>({
    resolver: zodResolver(staffLoginSchema),
    defaultValues: { email: '', password: '' },
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
    setServerError(null);
    try {
      const session = await api.auth.staffLogin(values);
      setSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: {
          id: session.user.id,
          email: session.user.email,
          fullName: session.user.fullName,
          role: session.user.role,
        },
      });
      router.replace('/inbox');
    } catch (error) {
      if (isApiClientError(error)) {
        setServerError(
          error.code === ErrorCode.UNAUTHORIZED ? t('auth.loginFailed') : t(`errors.${error.code}`),
        );
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
            <PasswordInput
              id="password"
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
          {DEV_ACCOUNTS.length > 0 ? (
            <div className="flex flex-col gap-1 rounded-md bg-muted p-3 text-xs text-muted-foreground">
              {DEV_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  className="text-left underline-offset-2 hover:underline"
                  onClick={() => {
                    setValue('email', account.email, { shouldValidate: true });
                    setValue('password', account.password, { shouldValidate: true });
                  }}
                >
                  {t('auth.devAccount', { email: account.email, password: account.password })}
                </button>
              ))}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="mt-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('auth.loggingIn') : t('auth.login')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
