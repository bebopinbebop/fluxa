import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '../../src/theme/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ModalNavigationLockProvider, useModalNavigationLock } from '../../src/navigation/ModalNavigationLock';

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <Text style={{ color, fontSize: 21 }}>{icon}</Text>;
}

function TabsNavigator() {
  const { isTabNavigationLocked } = useModalNavigationLock();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff"}} edges={["top"]}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.blue,
        tabBarInactiveTintColor: '#777',
        
      }}
      screenListeners={{
        tabPress: (event) => {
          if (isTabNavigationLocked) {
            event.preventDefault();
          }
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon icon="⌂" color={color} /> }} />
      <Tabs.Screen name="assets" options={{ href: null }} />
      <Tabs.Screen name="liabilities" options={{ href: null }} />
      <Tabs.Screen name="expenses" options={{ title: 'Data', tabBarIcon: ({ color }) => <TabIcon icon="▥" color={color} /> }} />
      <Tabs.Screen name="flow" options={{ title: 'Savings', tabBarIcon: ({ color }) => <TabIcon icon="▣" color={color} /> }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat', tabBarIcon: ({ color }) => <TabIcon icon="💬" color={color} /> }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="transactions" options={{ href: null }} />
      <Tabs.Screen name="accounts" options={{ href: null }} />
    </Tabs>
    </SafeAreaView>
  );
}

export default function TabsLayout() {
  return (
    <ModalNavigationLockProvider>
      <TabsNavigator />
    </ModalNavigationLockProvider>
  );
}
