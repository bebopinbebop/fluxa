import { Redirect } from 'expo-router';

export default function Index() {
  // Root route simply redirects to auth flow entry.
  return <Redirect href="/(auth)/sign-in" />;
}
