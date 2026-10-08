import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/features/auth/login-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return { title: t('staffLoginTitle') };
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-concr-primary p-4">
      <LoginForm />
    </main>
  );
}
