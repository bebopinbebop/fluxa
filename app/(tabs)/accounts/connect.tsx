import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors } from '../../../src/theme/colors';
import { useRouter } from 'expo-router';

export default function ConnectAccount() {
  const router = useRouter();
  return (
    <View style={styles.screen}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={{ fontSize: 22 }}>←</Text>
      </Pressable>

      <Text style={styles.title}>Connect your Account</Text>
      <Text style={styles.subtitle}>Connect your accounts securely with Plaid</Text>

      <View style={styles.logoBox}>
        <Text style={{ fontSize: 44, fontWeight: '900', color: Colors.blue }}>ZF</Text>
        <Text style={{ marginTop: 10, fontSize: 24, fontWeight: '800' }}>⌁</Text>
      </View>

      <Pressable style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>Add Your Account</Text>
      </Pressable>

      <Text style={styles.note}>
        This is a UI placeholder. Later you can integrate Plaid Link or your bank connect flow.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg, padding: 16, paddingTop: 18, alignItems: 'center' },
  back: { alignSelf: 'flex-start' },
  title: { marginTop: 12, fontSize: 22, fontWeight: '800' },
  subtitle: { marginTop: 6, color: Colors.muted },
  logoBox: { marginTop: 50, alignItems: 'center', justifyContent: 'center', height: 220 },
  primaryBtn: { backgroundColor: '#111', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  note: { marginTop: 16, color: Colors.muted, textAlign: 'center' }
});
