import { Tabs } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabsLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff"}} edges={["top"]}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.blue,
        tabBarInactiveTintColor: '#777',
        
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="assets" options={{ href: null }} />
      <Tabs.Screen name="liabilities" options={{ href: null }} />
      <Tabs.Screen name="expenses" options={{ title: 'Chart' }} />
      <Tabs.Screen name="flow" options={{ title: '$' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
    </SafeAreaView>
  );
}
