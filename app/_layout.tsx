import "react-native-get-random-values";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { configureAmplify, logAmplifyStatus } from "../src/lib/amplify";
import { AuthProvider } from "../src/auth/AuthProvider";

configureAmplify();

export default function RootLayout() {
  useEffect(() => {
    void logAmplifyStatus();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
