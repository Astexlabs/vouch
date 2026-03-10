// Settings is now accessed via the drawer. Redirect to drawer.
import { Redirect } from 'expo-router';

export default function SettingsRedirect() {
  return <Redirect href="/(drawer)" />;
}
