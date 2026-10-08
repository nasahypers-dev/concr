import { redirect } from 'next/navigation';

/** Phase 0: the panel has no home yet; staff land on the login page. */
export default function HomePage() {
  redirect('/login');
}
