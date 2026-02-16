import "react-native-get-random-values";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { configureAmplify, logAmplifyStatus } from "../src/lib/amplify";

configureAmplify();

export default function RootLayout() {
  useEffect(() => {
    void logAmplifyStatus();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
