import "react-native-get-random-values";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { configureAmplify } from "../src/lib/amplify";
import { AuthProvider } from "../src/auth/AuthProvider";

export default function RootLayout() {
  useEffect(() => {
    configureAmplify();
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
