'use client';

import { type Locale, locales, UserRole } from '@concr/shared';
import { cn } from 'cn';
import { ChevronDown, Languages, LogOut, Package } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type PropsWithChildren, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout } from '@/features/auth/use-auth';
import { useSupplier } from '@/features/common/use-supplier';
import { useInbox } from '@/features/dispatch/use-dispatch';
import { writeLocaleCookie } from '@/i18n/locale-cookie';
import { useSessionStore } from '@/store/session.store';
import { activeNav, NAV_ITEMS } from './nav';

/** Language names are shown in their own language on purpose (never translated). */
const localeLabels: Record<Locale, string> = { az: 'Azərbaycan', ru: 'Русский', en: 'English' };

/**
 * Client-side guard + chrome for every panel page: without a session the user is sent to the
 * login page; while the persisted session is still being read nothing flashes.
 */
export function PanelShell({ children }: PropsWithChildren) {
  const tStates = useTranslations('states');
  const router = useRouter();
  const hydrated = useSessionStore((s) => s.hydrated);
  const signedIn = useSessionStore((s) => s.accessToken !== null);

  useEffect(() => {
    if (hydrated && !signedIn) router.replace('/login');
  }, [hydrated, signedIn, router]);

  if (!hydrated || !signedIn) {
    return (
      <div
        role="status"
        className="flex flex-1 items-center justify-center p-10 text-sm text-muted-foreground"
      >
        {tStates('loading')}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 bg-muted/30 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

function Sidebar() {
  const t = useTranslations('panel.nav');
  const pathname = usePathname();
  const inbox = useInbox();
  const pending = inbox.data?.total ?? 0;
  const current = activeNav(pathname);

  return (
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col bg-concr-primary text-white lg:w-60">
      <div className="flex h-14 items-center gap-2 px-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-concr-accent text-concr-accent-foreground">
          <Package className="size-4" />
        </span>
        <span className="hidden font-heading text-lg font-semibold lg:block">CONCR</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2" aria-label="Main">
        {NAV_ITEMS.map((item) => {
          const active = current?.key === item.key;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              title={t(item.key)}
              className={cn(
                'flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors',
                active
                  ? 'bg-white/10 font-medium text-concr-accent'
                  : 'text-white/70 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden flex-1 lg:block">{t(item.key)}</span>
              {item.key === 'inbox' && pending > 0 ? (
                <span className="ml-auto hidden rounded-full bg-concr-accent px-2 text-xs font-semibold text-concr-accent-foreground lg:block">
                  {pending}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function roleLabel(t: ReturnType<typeof useTranslations<'panel.nav'>>, role: UserRole): string {
  switch (role) {
    case UserRole.DISPATCHER:
      return t('role.DISPATCHER');
    case UserRole.SUPPLIER_ADMIN:
      return t('role.SUPPLIER_ADMIN');
    case UserRole.PLATFORM_ADMIN:
      return t('role.PLATFORM_ADMIN');
    default:
      return role;
  }
}

function TopBar() {
  const t = useTranslations('panel.nav');
  const pathname = usePathname();
  const router = useRouter();
  const supplier = useSupplier();
  const user = useSessionStore((s) => s.user);
  const logout = useLogout();
  const current = activeNav(pathname);

  const switchLocale = (locale: Locale) => {
    writeLocaleCookie(locale);
    router.refresh();
  };

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <h2 className="truncate font-heading text-base font-medium">
          {current ? t(current.key) : ''}
        </h2>
        {supplier.data ? (
          <span className="hidden truncate text-base text-muted-foreground md:block">
            · {supplier.data.supplier.name}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="sm" aria-label={t('language')} />}
          >
            <Languages className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {locales.map((locale) => (
              <DropdownMenuItem key={locale} onClick={() => switchLocale(locale)}>
                {localeLabels[locale]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
            <span className="max-w-40 truncate">{user?.fullName ?? user?.email ?? ''}</span>
            <ChevronDown className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {user ? (
              <DropdownMenuGroup>
                <DropdownMenuLabel>{roleLabel(t, user.role)}</DropdownMenuLabel>
              </DropdownMenuGroup>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout.mutate()}>
              <LogOut className="size-4" />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
