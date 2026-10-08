import { Redirect } from 'expo-router';

/** The (auth) group opens on the welcome screen. */
export default function AuthIndex() {
  return <Redirect href="/welcome" />;
}
