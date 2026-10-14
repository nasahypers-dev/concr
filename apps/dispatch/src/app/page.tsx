import { redirect } from 'next/navigation';

/** The inbox is the panel's home; the panel layout sends signed-out staff to the login page. */
export default function HomePage() {
  redirect('/inbox');
}
