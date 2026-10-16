import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import './globals.css';

/** The Latin subsets cover the Azerbaijani UI; other subsets load on demand via unicode-range. */
const PRELOADED_FONTS = ['/fonts/inter-latin.woff2', '/fonts/space-grotesk-latin.woff2'];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: { default: t('common.appName'), template: `%s · ${t('common.appName')}` },
    description: t('auth.staffLoginSubtitle'),
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className="h-full antialiased">
      <head>
        {PRELOADED_FONTS.map((href) => (
          <link
            key={href}
            rel="preload"
            href={href}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {/* next-intl v4: locale and messages are inherited from src/i18n/request.ts */}
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
