'use client';

import { cn } from 'cn';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ComponentProps, useState } from 'react';
import { Input } from '@/components/ui/input';

export type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type'>;

/** Password field with an eye toggle (owner, 2026-10-15): what you type can be checked. */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const t = useTranslations('common');
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-9', className)} {...props} />
      <button
        type="button"
        aria-label={visible ? t('hidePassword') : t('showPassword')}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
